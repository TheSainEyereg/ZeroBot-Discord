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
import { type VoiceChannel, BaseGuildVoiceChannel, Guild, GuildTextBasedChannel, Message, escapeMarkdown } from "discord.js";

import fetch from "node-fetch";
import play from "play-dl";
import ytdl, { Filter } from "ytdl-core";
import { YMApi } from "ym-api";

import { LoopMode, MusicServices } from "../enums";
import { Song } from "../interfaces/music";
import { critical } from "./messages";
import config from "../config";

const { music: { youtube, spotify, yandex, volumeDefault } } = config;
const wait = promisify(setTimeout);
const ymApi = new YMApi();

const ytdlOptions = {
	filter: "audioonly" as Filter,
	highWaterMark: 1 << 62,
	liveBuffer: 1 << 62,
	dlChunkSize: 0,
	quality: "highestaudio",
	requestOptions: {
		...youtube.cookie && { headers: youtube }
	}
};

export default class MusicQueue {
	guild: Guild;
	textChannel: GuildTextBasedChannel;
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

	playing = false;
	paused = false;
	stopped = false;
	left = false;
	deleted = false;

	constructor(textChannel: GuildTextBasedChannel, voiceChannel: BaseGuildVoiceChannel) {
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
		if (this.left) return;

		if (this.connection?.state.status === VoiceConnectionStatus.Ready) this.connection.disconnect();
		this.left = true;

		if (deleteQueue) this.clear();
	}

	async initMusic() {
		const client_id = await play.getFreeClientID().catch(() => null);
	
		play.setToken({
			useragent: ["Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/102.0.0.0 Safari/537.36"],
			... youtube.cookie && { youtube },
			... client_id && { soundcloud: { client_id } }
		});
	
		if (spotify.client_id && spotify.client_secret && spotify.refresh_token && spotify.market) await play.setToken({ spotify }).catch(() => null);
	
		if (yandex.uid && yandex.access_token) await ymApi.init(yandex).catch(() => null);
	
		return { play, ymApi };
	}

	async joinChannel() {
		const { voiceChannel } = this;
	
		if (this.connection?.state.status === VoiceConnectionStatus.Ready) return this.connection;
	
		const connection = joinVoiceChannel({
			channelId: voiceChannel.id,
			guildId: voiceChannel.guild.id,
			adapterCreator: voiceChannel.guild.voiceAdapterCreator,
		});
	
		try {
			await entersState(connection, VoiceConnectionStatus.Ready, 30_000);
			connection.on("stateChange", async (_, newState) => {
				if (newState.status === VoiceConnectionStatus.Disconnected) {
					if (newState.reason === VoiceConnectionDisconnectReason.WebSocketClose && newState.closeCode === 4014) {
						try {
							await entersState(connection, VoiceConnectionStatus.Connecting, 5_000);
						} catch {
							this.leaveChannel(!this.paused);
						}
					} else if (connection.rejoinAttempts < 5) {
						await wait((connection.rejoinAttempts + 1) * 5_000);
						connection.rejoin();
					} else {
						this.leaveChannel(!this.paused);
					}
	
					const newChannelId = newState.subscription?.connection?.joinConfig?.channelId;
					if (newChannelId && (newChannelId !== this.voiceChannel.id)) this.voiceChannel = voiceChannel.guild.channels.cache.get(newChannelId) as VoiceChannel;
				}
			});
			this.left = false;
			return connection;
		} catch (error) {
			this.leaveChannel();
			throw error;
		}
	}

	async getMusicPlayer(song: Song): Promise<AudioPlayer | undefined> {
		if (!song) return;
	
		const player = createAudioPlayer({
			behaviors: {
				noSubscriber: NoSubscriberBehavior.Play
			}
		});
		let stream: Readable | null = null;
		let streamType: StreamType | null = null;
	
		try {
			if (song.service === MusicServices.YouTube) {
				if (song.duration > 61 * 60)
					throw new Error("Sorry. Due to some technical limitations, I can't play tracks longer than 60 minutes");

				stream = ytdl(song.url, ytdlOptions);
			}
			if (song.service === MusicServices.SoundCloud) {
				const pdl = await play.stream(song.url);
				stream = pdl.stream;
				streamType = pdl.type;
			}
			if (song.service === MusicServices.Spotify) {
				const res = (await play.search(song.title, { limit: 5 }))
					.filter(({ durationInSec }) =>  (durationInSec - song.duration > -3) && (durationInSec - song.duration < 10));
				
				if (res.length === 0) throw new Error("Can't find this song");

				if (res[0].durationInSec > 61 * 60)
					throw new Error("Sorry. Due to some technical limitations, I can't play tracks longer than 60 minutes");

				stream = ytdl(res[0].url, ytdlOptions);
			}
			if (song.service === MusicServices.Yandex) {
				const downloadInfo = await ymApi.getTrackDownloadInfo(song.id!);
				const directUrl = await ymApi.getTrackDirectLink(downloadInfo.find(i => i.bitrateInKbps === 192)!.downloadInfoUrl);
	
				const res = await fetch(directUrl);
				stream = Readable.from(await res.buffer());
			}
			if (song.service === MusicServices.Raw) {
				const res = await fetch(song.url);
				stream = Readable.from(await res.buffer());
			}
	
			if (!stream) throw new Error("Not supported service");
	
			stream.on("error", e => {
				if (!this.playing) return;
				this.textChannel.send({ embeds: [critical("Stream error", `${e}`)] }).catch(() => null);
				console.error(e);
				this.list.shift();
				if (this.list.length > 0) this.getMusicPlayer(this.list[0]);
			});
			
			this.resource = createAudioResource(stream, {
				inputType: streamType || StreamType.Arbitrary,
				inlineVolume: true
			});
			this.resource.volume?.setVolumeLogarithmic(this.volume * 0.5);
			
			this.startTime = Date.now();
			this.trackTime = 0;
			
			player.play(this.resource);
		} catch (e) {
			console.error(e);
			this.textChannel.send({ embeds: [critical(`Attempt to play \`${escapeMarkdown(song.title)}\` failed`, `${e}`)] }).catch(() => null);
			this.list.shift();
			return this.getMusicPlayer(this.list[0]);
		}
	
		// Messages.advanced(queue.textChannel, l.started, song.title, {custom: `${l.requested} ${song.requested.tag}`, icon: song.requested.displayAvatarURL({ format: "png", size: 256 })})
		return entersState(player, AudioPlayerStatus.Playing, 5_000);
	}

	async startMusicPlayback() {
		this.connection = await this.joinChannel();
		this.player = await this.getMusicPlayer(this.list[0]);
		if (!this.player) return;
	
		this.connection.subscribe(this.player);
		this.playing = true;
	
		this.player.on(AudioPlayerStatus.Idle, () => {
			this.playing = false;
			if (this.loopMode === LoopMode.Queue) this.list.push(this.list[0]);
			if (this.loopMode !== LoopMode.Track) this.list.shift();
	
			if (!this.left && this.voiceChannel.members.filter(m => !m.user.bot).size === 0) {
				this.textChannel.send({ embeds: [critical("All left", "All members left from voice channel, playback is stopped")] }).catch(() => null);
				this.leaveChannel();
				return;
			}
			if (this.list.length === 0) return setTimeout(() => (!this.playing && this.list.length === 0) && this.leaveChannel(), 120_000);
	
			this.startMusicPlayback();
		});
	}
}