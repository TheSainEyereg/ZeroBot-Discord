import {
	AudioPlayerStatus,
	createAudioPlayer,
	createAudioResource,
	entersState,
	getVoiceConnection,
	joinVoiceChannel,
	NoSubscriberBehavior,
	StreamType,
	VoiceConnectionDisconnectReason,
	VoiceConnectionStatus,
} from "@discordjs/voice";
import type { GuildChannel, VoiceChannel } from "discord.js";
import play from "play-dl";
import fetch from "node-fetch";
import { YMApi } from "ym-api";
import { Readable } from "node:stream";
import { promisify } from "node:util";
import { MusicQueue, Song } from "../interfaces/music";
import { LoopMode, MusicServices } from "./enums";
import { critical } from "./messages";

import config from "../config";
const { music: { youtube, spotify, yandex } } = config;
const wait = promisify(setTimeout);
const ymApi = new YMApi();

export async function initMusic() {
	play.setToken({
		useragent: ["Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/102.0.0.0 Safari/537.36"],
		... youtube.cookie && { youtube },
	});

	// TODO: try/catch setToken for SoundCloud due to possible fetch errors when getting free token

	// eslint-disable-next-line @typescript-eslint/no-empty-function
	if (spotify.client_id && spotify.client_secret && spotify.refresh_token && spotify.market) await play.setToken({ spotify }).catch(() => {});

	// eslint-disable-next-line @typescript-eslint/no-empty-function
	if (yandex.uid && yandex.access_token) await ymApi.init(yandex).catch(() => {});

	return { play, ymApi };
}

export async function joinChannel(channel: GuildChannel) {
	if (getVoiceConnection(channel.guild.id)?.state.status === VoiceConnectionStatus.Ready) return getVoiceConnection(channel.guild.id);
	const queue = channel.client.musicQueue.get(channel.guild.id);
	if (!queue) throw new Error("Queue not found");

	const connection = joinVoiceChannel({
		channelId: channel.id,
		guildId: channel.guild.id,
		adapterCreator: channel.guild.voiceAdapterCreator,
	});

	try {
		await entersState(connection, VoiceConnectionStatus.Ready, 30_000);
		connection.on("stateChange", async (_, newState) => {
			if (newState.status === VoiceConnectionStatus.Disconnected) {
				if (newState.reason === VoiceConnectionDisconnectReason.WebSocketClose && newState.closeCode === 4014) {
					try {
						await entersState(connection, VoiceConnectionStatus.Connecting, 5_000);
					} catch {
						queue.leaveChannel();
					}
				} else if (connection.rejoinAttempts < 5) {
					await wait((connection.rejoinAttempts + 1) * 5_000);
					connection.rejoin();
				} else {
					queue.leaveChannel(!queue.paused);
				}

				const newChannelId = newState.subscription?.connection?.joinConfig?.channelId;
				if (queue && newChannelId && (newChannelId !== queue.voiceChannel.id)) queue.voiceChannel = channel.guild.channels.cache.get(newChannelId) as VoiceChannel;
			}
		});
		return connection;
	} catch (error) {
		queue.leaveChannel();
		throw error;
	}
}

export async function getMusicPlayer(queue: MusicQueue, song: Song) {
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
			const pdl = await play.stream(song.url);
			stream = pdl.stream;
			streamType = pdl.type;
		}
		if (song.service === MusicServices.Spotify) {
			const res = await play.search(song.title, { limit: 1 });
			if (res.length === 0) throw new Error("Can't find this song");
			const pdl = await play.stream(res[0].url);
			stream = pdl.stream;
			streamType = pdl.type;
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
			if (!queue?.playing) return;
			// eslint-disable-next-line @typescript-eslint/no-empty-function
			queue.textChannel.send({ embeds: [critical("Stream error", `${e}`)] }).catch(() => {});
			console.error(e);
			queue.list.shift();
			if (queue.list.length > 0) getMusicPlayer(queue, queue.list[0]);
		});
		
		queue.resource = createAudioResource(stream, {
			inputType: streamType || StreamType.Arbitrary,
			inlineVolume: true
		});
		queue.resource.volume?.setVolumeLogarithmic(queue.volume * 0.5);
		player.play(queue.resource);
	} catch (e) {
		console.error(e);
		// eslint-disable-next-line @typescript-eslint/no-empty-function
		queue.textChannel.send({ embeds: [critical("Attempt to play failed", `${e}`)] }).catch(() => {});
		queue.list.shift();
		return getMusicPlayer(queue, queue.list[0]);
	}

	// Messages.advanced(queue.textChannel, l.started, song.title, {custom: `${l.requested} ${song.requested.tag}`, icon: song.requested.displayAvatarURL({ format: "png", size: 256 })})
	return entersState(player, AudioPlayerStatus.Playing, 5_000);
}

export async function startMusicPlayback(queue: MusicQueue) {
	const connection = await joinChannel(queue.voiceChannel);
	if (!connection) return;

	queue.player = await getMusicPlayer(queue, queue.list[0]);
	if (!queue.player) return;

	connection.subscribe(queue.player);
	queue.playing = true;

	queue.player.on(AudioPlayerStatus.Idle, () => {
		queue.playing = false;
		if (queue.loopMode == LoopMode.Queue) queue.list.push(queue.list[0]);
		if (queue.loopMode != LoopMode.Track) queue.list.shift();

		if (queue.voiceChannel.members.size <= 1) {
			// eslint-disable-next-line @typescript-eslint/no-empty-function
			queue.textChannel.send({ embeds: [critical("All left", "All members left from voice channel, playback is stopped")] }).catch(() => {});
			queue.leaveChannel();
			return;
		}
		if (queue.list.length === 0) return setTimeout(() => (!queue.playing && queue.list.length === 0) && queue.leaveChannel(), 120 * 1000);

		startMusicPlayback(queue);
	});
}