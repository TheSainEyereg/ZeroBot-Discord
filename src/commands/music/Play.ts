import Command from "../../Command";
import {
	type Message,
	type ChatInputCommandInteraction,
	SlashCommandBuilder,
	type GuildTextBasedChannel,
	type GuildMember,
	PermissionFlagsBits,
} from "discord.js";
import { Access, LoopMode, MusicServices } from "../../components/enums";
import { critical, regular, success, warning } from "../../components/messages";
import { startMusicPlayback, initMusic } from "../../components/music";
import { MusicQueue, Song, YMApiTrack } from "../../interfaces/music";
import { VoiceConnectionStatus, getVoiceConnection } from "@discordjs/voice";
import type { SpotifyTrack, SpotifyPlaylist, SpotifyAlbum } from "play-dl";

const MAX_ITEMS = 200;

export default class Play extends Command {
	name = "play";
	description = "Plays track or searches for it";
	aliases = ["p"];
	args = ["(url/search)"];
	access = Access.User;

	data = new SlashCommandBuilder()
		.setName(this.name)
		.setDescription(this.description)
		.addStringOption(option =>
			option
				.setName("query")
				.setDescription("Track url or search query")
				.setRequired(true)
		);

	executeSlash = async (interaction: ChatInputCommandInteraction) => {
		const query = interaction.options.getString("query");
		interaction.reply({ embeds: [await this.play(interaction.channel as GuildTextBasedChannel, interaction.member as GuildMember, query)] });
	};

	executePrefix = async (message: Message, args: string[]) => {
		const query = args.join(" ") || null;
		message.reply({ embeds: [await this.play(message.channel as GuildTextBasedChannel, message.member!, query)] });
	};

	private async play(textChannel: GuildTextBasedChannel, member: GuildMember, query: string | null) {
		const { client: { db }, client, guild, voice } = member;

		const voiceChannel = voice.channel;
		if (!voiceChannel) return warning("You must be in a voice channel to play music!");

		const minePermissions = voiceChannel.permissionsFor(client.user);
		if (!minePermissions || !minePermissions.has(PermissionFlagsBits.Connect) || !minePermissions.has(PermissionFlagsBits.Speak)) return warning("I don't have permissions to join your voice channel!");

		const queueCounstruct: MusicQueue = {
			guild: guild,
			textChannel: textChannel,
			voiceChannel: voiceChannel,
			player: undefined,
			resource: undefined,
			volume: (await db.getServer(guild.id)).musicVolume,
			loopMode: LoopMode.Disabled,
			list: [],

			playing: false,
			paused: false,
			stopped: false,
			left: false,
			deleted: false,

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
					guild.client.musicQueue.delete(this.guild.id);
					this.deleted = true;
				}
			},
	
			leaveChannel(deleteQueue = true) {
				if (this.left) return;
	
				const connection = getVoiceConnection(this.guild.id);
				if (connection?.state.status === VoiceConnectionStatus.Ready) connection.disconnect();
				this.left = true;

				if (deleteQueue) this.clear();
			}

		};

		if (!client.musicQueue.has(guild.id)) client.musicQueue.set(guild.id, queueCounstruct);
		const queue = client.musicQueue.get(guild.id)!;

		if (!query?.length) return warning("Nothing to play");

		const { play, ymApi } = await initMusic();
		
		const type = await play.validate(query);

		const queueLength = queue.list.length;
	
		if (type === "yt_video") {
			try {
				const info = await play.video_info(query);

				const song: Song = {
					service: MusicServices.YouTube,
					title: info.video_details.title!,
					thumbnailUrl: info.video_details.thumbnails[0].url,
					duration: info.video_details.durationInSec,
					url: info.video_details.url,
					requestedBy: member
				};
				queue.list.push(song);

				if (queueLength) return success(`Added \`${song.title}\` to queue`);
			} catch (e) {
				console.error(e);
				return critical("Can't fetch video from YouTube", `\`\`\`\n${e}\n\`\`\``);
			}
		} else if (type === "yt_playlist") {
			try {
				const playlist = await play.playlist_info(query);
				const list = await playlist.all_videos();

				queue.list.push(...list.slice(0, MAX_ITEMS).map(info => ({
					service: MusicServices.YouTube,
					title: info.title!,
					thumbnailUrl: info.thumbnails[0].url,
					duration: info.durationInSec,
					url: info.url,
					requestedBy: member
				})));

				if (queueLength) return success(`Added ${list.length > MAX_ITEMS ? MAX_ITEMS : list.length} tracks to queue`);
			} catch (e) {
				console.error(e);
				return critical("Can't fetch playlist from YouTube", `\`\`\`\n${e}\n\`\`\``);
			}
		} else if (type === "so_track") {
			return warning(" Soundcloud is not supported yet");
		} else if (type === "so_playlist") {
			return warning(" Soundcloud is not supported yet");
		} else if (type === "sp_track") {
			try {
				const info = await play.spotify(query) as SpotifyTrack;

				const song: Song = {
					service: MusicServices.Spotify,
					title: `${info.artists.map(artist => artist.name).join(", ")} - ${info.name}`,
					thumbnailUrl: info.thumbnail?.url || "",
					duration: info.durationInSec,
					url: info.url,
					requestedBy: member
				};
				queue.list.push(song);

				if (queueLength) return success(`Added \`${song.title}\` to queue`);
			} catch (e) {
				console.error(e);
				return critical("Can't fetch track from Spotify", `\`\`\`\n${e}\n\`\`\``);
			}
		} else if (type === "sp_playlist") {
			try {
				const playlist = await play.spotify(query) as SpotifyPlaylist;
				const list = await playlist.all_tracks();

				queue.list.push(...list.slice(0, MAX_ITEMS).map(info => ({
					service: MusicServices.Spotify,
					title: `${info.artists.map(artist => artist.name).join(", ")} - ${info.name}`,
					thumbnailUrl: info.thumbnail?.url || "",
					duration: info.durationInSec,
					url: info.url,
					requestedBy: member
				})));

				if (queueLength) return success(`Added ${list.length > MAX_ITEMS ? MAX_ITEMS : list.length} tracks to queue`);
			} catch (e) {
				console.error(e);
				return critical("Can't fetch playlist from Spotify", `\`\`\`\n${e}\n\`\`\``);
			}
		} else if (type === "sp_album") {
			try {
				const playlist = await play.spotify(query) as SpotifyAlbum;
				const list = await playlist.all_tracks();

				queue.list.push(...list.slice(0, MAX_ITEMS).map(info => ({
					service: MusicServices.Spotify,
					title: `${info.artists.map(artist => artist.name).join(", ")} - ${info.name}`,
					thumbnailUrl: info.thumbnail?.url || "",
					duration: info.durationInSec,
					url: info.url,
					requestedBy: member
				})));
				
				if (queueLength) return success(`Added ${list.length > MAX_ITEMS ? MAX_ITEMS : list.length} tracks to queue`);
			} catch (e) {
				console.error(e);
				return critical("Can't fetch playlist from Spotify", `\`\`\`\n${e}\n\`\`\``);
			}
		} else if (type === "search") {
			const result = await play.search(query, {limit: 1});
			if (result.length === 0) return warning("Can't find anything");

			const song: Song = {
				service: MusicServices.YouTube,
				title: result[0].title!,
				thumbnailUrl: result[0].thumbnails[0].url,
				duration: result[0].durationInSec,
				url: result[0].url,
				requestedBy: member
			};
			queue.list.push(song);

			if (queueLength) return success(`Added \`${song.title}\` to queue`);
	
		} else if (query.match(/(https:\/\/)?(www.)?music\.yandex\.ru\/album\/([0-9]+)\/track\/[0-9]+/gi)) { // YM track
			try {
				const id = parseInt(query.match(/track\/([0-9]+)/gi)![0].replace("track/", ""));
				const info = (await ymApi.getTrack(id))[0] as YMApiTrack;
	
				if (!info.available) return warning("Track is not available");
	
				const song: Song = {
					service: MusicServices.Yandex,
					title: `${info.artists.map(artist => artist.name).join(", ")} - ${info.title} ${info.version ? ` (${info.version})` : ""}`,
					thumbnailUrl: `https://${info.coverUri.replace("%%", "460x460")}`,
					duration: Math.floor(info.durationMs / 1000),
					url: `https://music.yandex.ru/album/${info.albums[0].id}/track/${info.id}`,
					id: info.id,
					requestedBy: member
				};
				queue.list.push(song);

				if (queueLength) return success(`Added \`${song.title}\` to queue`);
			} catch (e) {
				console.error(e);
				return critical("Can't fetch track from Yandex", `\`\`\`\n${e}\n\`\`\``);
			}
		} else if (query.match(/(https:\/\/)?(www\.)?music\.yandex\.ru\/users\/([A-Za-z0-9-_]+)(\/playlists\/[0-9]+)?/gi)) { // YM playlist
			try {
				const username = query.match(/users\/([A-Za-z0-9-_]+)/gi)![0].replace("users/", "");
				const playlist = query.match(/playlists\/([0-9]+)/gi) ? parseInt(query.match(/playlists\/([0-9]+)/gi)![0].replace("playlists/", "")) : 3;
	
				const list = (await ymApi.getPlaylist(playlist, username)).tracks?.map(track => track.track).filter(track => track.available) as YMApiTrack[];
				if (!list) throw new Error("Can't get info");

				queue.list.push(...list.slice(0, MAX_ITEMS).map(info => ({
					service: MusicServices.Yandex,
					title: `${info.artists.map(artist => artist.name).join(", ")} - ${info.title} ${info.version ? ` (${info.version})` : ""}`,
					thumbnailUrl: `https://${info.coverUri.replace("%%", "460x460")}`,
					duration: Math.floor(info.durationMs / 1000),
					url: `https://music.yandex.ru/album/${info.albums[0].id}/track/${info.id}`,
					id: info.id,
					requestedBy: member
				})));
	
				if (queueLength) return success(`Added ${list.length > MAX_ITEMS ? MAX_ITEMS : list.length} tracks to queue`);
			} catch(e) {
				console.error(e);
				return critical("Can't fetch playlist from Yandex", `\`\`\`\n${e}\n\`\`\``);
			}
		} else if (query.match(/(https:\/\/)?(www.)?music\.yandex\.ru\/album\/[0-9]+/gi)) { // YM album
			try {
				const album = parseInt(query.match(/album\/([0-9]+)/gi)![0].replace("album/", ""));
	
				const list = (await ymApi.getAlbumWithTracks(album))?.volumes[0]?.filter(track => track.available) as YMApiTrack[];

				queue.list.push(...list.slice(0, MAX_ITEMS).map(info => ({
					service: MusicServices.Yandex,
					title: `${info.artists.map(artist => artist.name).join(", ")} - ${info.title} ${info.version ? ` (${info.version})` : ""}`,
					thumbnailUrl: `https://${info.coverUri.replace("%%", "460x460")}`,
					duration: Math.floor(info.durationMs / 1000),
					url: `https://music.yandex.ru/album/${info.albums[0].id}/track/${info.id}`,
					id: info.id,
					requestedBy: member
				})));

				if (queueLength) return success(`Added ${list.length > MAX_ITEMS ? MAX_ITEMS : list.length} tracks to queue`);
			} catch (e) {
				console.error(e);
				return critical("Can't fetch album from Yandex", `\`\`\`\n${e}\n\`\`\``);
			}
		} else {
			return warning("Raw URLs are not supported yet");
			// 	try {
			// 		const res = await axios.get(url);
			// 		if (!res.headers["content-type"]?.match(/^(audio|video)\/.+$/gi)) return Messages.warning(message, l.not_media);
			// 		const song = {
			// 			service: "URL",
			// 			title: "[URL] "+ (url.length > 50 ? url.substr(0, 50)+"..." : url),
			// 			thumbnail: "https://olejka.ru/r/03d291545d.png",
			// 			duration: 0, // Idk how to calculate this
			// 			url: url,
			// 			requested: message.author 
			// 		}
			// 		queue.list.push(song);
			// 		if (queueLength) Messages.success(message, `${l.added[0]} \`${song.title}\` ${l.added[1]}`);
			// 	} catch (e) {
			// 		Messages.critical(message, `${l.cant_url}\n\`${e}\``)
			// 	}
			// }
		}

		// TODO: resume
		// if (queue.paused)

		if (!queue.playing && queue.list[0]) {
			startMusicPlayback(queue);
			const requestedBy = queue.list[0].requestedBy;
			return regular(`${queueLength ? `Added ${queue.list.length} songs and s` : "S"}tarted playback`, queue.list[0].title, {
				footer: `Requested by ${requestedBy.displayName}`,
				footerIcon: requestedBy.displayAvatarURL({ size: 256 })
			});
		}

		throw new Error("Something went wrong");
	}
}