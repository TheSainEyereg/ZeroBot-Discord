import {
	AudioPlayerStatus,
	createAudioPlayer,
	createAudioResource,
	entersState,
	joinVoiceChannel,
	NoSubscriberBehavior,
	StreamType,
	VoiceConnectionDisconnectReason,
	VoiceConnectionStatus,
} from "@discordjs/voice";
import { escapeMarkdown, type VoiceChannel } from "discord.js";
import play from "play-dl";
import fetch from "node-fetch";
import { YMApi } from "ym-api";
import { Readable } from "node:stream";
import { promisify } from "node:util";
import { MusicQueue, Song } from "../interfaces/music";
import { LoopMode, MusicServices } from "../enums";
import { critical } from "./messages";

import config from "../config";
const { music: { youtube, spotify, yandex } } = config;
const wait = promisify(setTimeout);
const ymApi = new YMApi();

export async function initMusic() {
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

export async function joinChannel(queue: MusicQueue) {
	const { voiceChannel } = queue;

	if (queue.connection?.state.status === VoiceConnectionStatus.Ready) return queue.connection;

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
						queue.leaveChannel(!queue.paused);
					}
				} else if (connection.rejoinAttempts < 5) {
					await wait((connection.rejoinAttempts + 1) * 5_000);
					connection.rejoin();
				} else {
					queue.leaveChannel(!queue.paused);
				}

				const newChannelId = newState.subscription?.connection?.joinConfig?.channelId;
				if (queue && newChannelId && (newChannelId !== queue.voiceChannel.id)) queue.voiceChannel = voiceChannel.guild.channels.cache.get(newChannelId) as VoiceChannel;
			}
		});
		queue.left = false;
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
		if (song.service === MusicServices.YouTube || song.service === MusicServices.SoundCloud) {
			const pdl = await play.stream(song.url);
			stream = pdl.stream;
			streamType = pdl.type;
		}
		if (song.service === MusicServices.Spotify) {
			const res = (await play.search(song.title, { limit: 5 }))
				.filter(({ durationInSec }) =>  (durationInSec - song.duration > -3) && (durationInSec - song.duration < 10));
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
		queue.textChannel.send({ embeds: [critical(`Attempt to play \`${escapeMarkdown(song.title)}\` failed`, `${e}`)] }).catch(() => null);
		queue.list.shift();
		return getMusicPlayer(queue, queue.list[0]);
	}

	// Messages.advanced(queue.textChannel, l.started, song.title, {custom: `${l.requested} ${song.requested.tag}`, icon: song.requested.displayAvatarURL({ format: "png", size: 256 })})
	return entersState(player, AudioPlayerStatus.Playing, 5_000);
}

export async function startMusicPlayback(queue: MusicQueue) {
	queue.connection = await joinChannel(queue);
	queue.player = await getMusicPlayer(queue, queue.list[0]);
	if (!queue.player) return;

	queue.connection.subscribe(queue.player);
	queue.playing = true;

	queue.player.on(AudioPlayerStatus.Idle, () => {
		queue.playing = false;
		if (queue.loopMode == LoopMode.Queue) queue.list.push(queue.list[0]);
		if (queue.loopMode != LoopMode.Track) queue.list.shift();

		if (!queue.left && queue.voiceChannel.members.filter(m => !m.user.bot).size === 0) {
			// eslint-disable-next-line @typescript-eslint/no-empty-function
			queue.textChannel.send({ embeds: [critical("All left", "All members left from voice channel, playback is stopped")] }).catch(() => {});
			queue.leaveChannel();
			return;
		}
		if (queue.list.length === 0) return setTimeout(() => (!queue.playing && queue.list.length === 0) && queue.leaveChannel(), 120_000);

		startMusicPlayback(queue);
	});
}