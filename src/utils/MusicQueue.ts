import { Readable } from "node:stream";
import { promisify } from "node:util";
import {
	AudioPlayerStatus,
	createAudioPlayer,
	createAudioResource,
	entersState,
	joinVoiceChannel,
	NoSubscriberBehavior,
	StreamType,
	VoiceConnectionDisconnectReason,
	AudioPlayer,
	AudioResource,
	VoiceConnection,
	VoiceConnectionStatus
} from "@discordjs/voice";
import { type VoiceChannel, BaseGuildTextChannel, BaseGuildVoiceChannel, Guild, Message, escapeMarkdown } from "discord.js";

import config from "../config";
import { LoopMode, MusicServices } from "../enums";
import { Song } from "../interfaces/music";
import { critical } from "./messages";

import fetch from "node-fetch";
import play from "play-dl";
import { YMApi } from "ym-api";
import { stream as cobaltStream } from "../services/cobalt";
import { VKService, stream as vkStream } from "../services/vk";

const { music: { spotify, yandex, volumeDefault, vk } } = config;
const wait = promisify(setTimeout);
const ymApi = new YMApi();
const vkApi = new VKService();

export default class MusicQueue {
	guild: Guild;
	textChannel: BaseGuildTextChannel;
	voiceChannel: BaseGuildVoiceChannel;
	volume: number = volumeDefault;
	loopMode: LoopMode = LoopMode.Disabled;
	list: Song[] = [];
	
	connection?: VoiceConnection;
	player?: AudioPlayer;
	resource?: AudioResource;
	message?: Message;

	startTime = 0;
	trackTime = 0;

	initialized = false;
	playing = false;
	paused = false;
	stopped = false;
	left = false;
	deleted = false;

	constructor(textChannel: BaseGuildTextChannel, voiceChannel: BaseGuildVoiceChannel) {
		const { guild } = textChannel;

		this.guild = guild;
		this.textChannel = textChannel;
		this.voiceChannel = voiceChannel;
	}
	

	clear(deleteQueue = true) {
		if (this.deleted) return;

		const wasPlaying = this.playing;
		this.list = [];
		this.playing = false;
		this.paused = false;

		try {
			if (wasPlaying && this.player) this.player.stop();
			// eslint-disable-next-line no-empty
		} catch (e) {}

		if (deleteQueue) {
			this.guild.client.musicQueue.delete(this.guild.id);
			this.deleted = true;
		}
	}

	leaveChannel(deleteQueue = true) {
		if (this.left)
			return;

		if (this.connection?.state.status === VoiceConnectionStatus.Ready)
			this.connection.disconnect();
		
		this.left = true;

		if (deleteQueue)
			this.clear();
	}

	async initMusic() {
		if (!this.initialized) {
			const client_id = await play.getFreeClientID().catch(() => null);
	
			play.setToken({
				useragent: ["Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/102.0.0.0 Safari/537.36"],
				... client_id && { soundcloud: { client_id } }
			});
		
			if (spotify.client_id && spotify.client_secret && spotify.refresh_token && spotify.market) await play.setToken({ spotify }).catch(() => null);
		
			if (yandex.uid && yandex.access_token) await ymApi.init(yandex).catch(() => null);

			if (vk.token) await vkApi.init(vk.token).catch(() => null);
		
			this.initialized = true;
		}
	
		return { play, ymApi, vkApi };
	}

	async joinChannel() {
		const { voiceChannel } = this;

		if (this.connection?.state.status === VoiceConnectionStatus.Ready)
			return this.connection;
	
		const connection = joinVoiceChannel({
			channelId: voiceChannel.id,
			guildId: voiceChannel.guild.id,
			adapterCreator: voiceChannel.guild.voiceAdapterCreator,
		});
	
		try {
			await entersState(connection, VoiceConnectionStatus.Ready, 30e3);
			connection.on("stateChange", async (_, newState) => {
				if (newState.status === VoiceConnectionStatus.Disconnected) {
					if (newState.reason === VoiceConnectionDisconnectReason.WebSocketClose && newState.closeCode === 4014) {
						try {
							await entersState(connection, VoiceConnectionStatus.Connecting, 5e3);
						} catch {
							this.leaveChannel(!this.paused);
						}
					} else if (connection.rejoinAttempts < 5) {
						await wait((connection.rejoinAttempts + 1) * 5e3);
						connection.rejoin();
					} else {
						this.leaveChannel(!this.paused);
					}
	
					const newChannelId = newState.subscription?.connection?.joinConfig?.channelId;
					if (newChannelId && (newChannelId !== this.voiceChannel.id))
						this.voiceChannel = voiceChannel.guild.channels.cache.get(newChannelId) as VoiceChannel;
				}
			});
			this.left = false;
			return connection;
		} catch (error) {
			this.leaveChannel();
			throw error;
		}
	}

	async getMusicPlayer(song: Song): Promise<AudioPlayer> {
		if (!song)
			throw new Error("No song to play");
	
		const player = createAudioPlayer({
			behaviors: {
				noSubscriber: NoSubscriberBehavior.Pause
			}
		});

		let stream: Readable | null = null;
		let streamType: StreamType | null = null;
	
		try {
			if (song.service === MusicServices.YouTube) {
				stream = await cobaltStream(song.link);
			}
			if (song.service === MusicServices.SoundCloud) {
				const pdl = await play.stream(song.url);
				stream = pdl.stream;
				streamType = pdl.type;
			}
			if (song.service === MusicServices.Spotify) {
				const res = (await play.search(song.title, { limit: 5 }))
					.filter(({ durationInSec }) =>  (durationInSec - song.duration > -3) && (durationInSec - song.duration < 10));

				if (res.length === 0)
					throw new Error("Can't find this song");

				stream = await cobaltStream(res[0].url);
			}
			if (song.service === MusicServices.Yandex) {
				const downloadInfo = await ymApi.getTrackDownloadInfo(song.id);
				const directUrl = await ymApi.getTrackDirectLink(downloadInfo.find(i => i.bitrateInKbps === 192)!.downloadInfoUrl);
	
				stream = await fetch(directUrl)
					.then(res => Readable.from(res.body));
			}
			if (song.service === MusicServices.VK) {
				stream = await vkStream(song.url);
			}
			if (song.service === MusicServices.Raw) {
				stream = await fetch(song.link)
					.then(res => Readable.from(res.body));
			}
	
			if (!stream)
				throw new Error("Not supported service");
			
			this.resource = createAudioResource(stream, {
				inputType: streamType || StreamType.Arbitrary,
				inlineVolume: true
			});
			this.resource.volume?.setVolumeLogarithmic(this.volume * 0.5);
			
			this.startTime = Date.now();
			this.trackTime = 0;
			
			player.play(this.resource);
		} catch (e) {
			console.error("Play attempt failed", e);
			this.textChannel.send({ embeds: [critical(`Attempt to play \`${escapeMarkdown(song.title)}\` failed`, `\`${e}\``)] }).catch(() => null);

			this.tryToPlayNext();
		}

		Promise.race([
			new Promise(res => stream && stream.on("error", res)),
			new Promise(res => player.on("error", res))
		]).then((e) => {
			if (e instanceof Error) {
				if (e.message === "Premature close")
					return this.tryToPlayNext();

				console.error(`Playback error N"${e.name}" M"${e.message}"\r\n`, e);
			} else
				console.error("Playback error\r\n", e);

			this.textChannel.send({ embeds: [critical(`Error during playback of \`${escapeMarkdown(song.title)}\``, `\`${e}\``)] }).catch(() => null);
			this.tryToPlayNext();
		});
	
		// Messages.advanced(queue.textChannel, l.started, song.title, {custom: `${l.requested} ${song.requested.tag}`, icon: song.requested.displayAvatarURL({ format: "png", size: 256 })})
		return entersState(player, AudioPlayerStatus.Playing, 5e3);
	}

	tryToPlayNext() {
		this.list.shift();
		this.startMusicPlayback(); // Check for emty list is placed inside startMusicPlayback
	}

	async startMusicPlayback() {
		if (this.list.length === 0) // ^^^^
			return;

		this.connection = await this.joinChannel();
		this.player = await this.getMusicPlayer(this.list[0]);
	
		this.player.on(AudioPlayerStatus.Idle, () => {
			this.playing = false;
			if (this.loopMode === LoopMode.Queue) this.list.push(this.list[0]);
			if (this.loopMode !== LoopMode.Track) this.list.shift();
	
			if (!this.left && this.voiceChannel.members.filter(m => !m.user.bot).size === 0) {
				this.textChannel.send({ embeds: [critical("All left", "All members left the voice channel, playback is stopped")] }).catch(() => null);
				return this.leaveChannel();
			}
			
			if (this.list.length > 0)
				this.startMusicPlayback();
			else
				setTimeout(() => !this.playing && this.list.length === 0 && this.leaveChannel(), 120e3);
		});
	
		this.connection.subscribe(this.player);
		this.playing = true;
	}
}