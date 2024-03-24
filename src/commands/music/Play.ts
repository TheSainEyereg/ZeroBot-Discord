import Command from "../../Command";
import {
	type Message,
	type ChatInputCommandInteraction,
	SlashCommandBuilder,
	type GuildTextBasedChannel,
	type GuildMember,
	PermissionFlagsBits,
	Attachment,
	escapeMarkdown,
} from "discord.js";
import { Access, LoopMode, MusicServices } from "../../enums";
import { critical, regular, success, warning } from "../../components/messages";
import { startMusicPlayback, initMusic } from "../../components/music";
import { MusicQueue, Song, YMApiTrack } from "../../interfaces/music";
import { VoiceConnectionStatus } from "@discordjs/voice";
import type { SpotifyTrack, SpotifyPlaylist, SpotifyAlbum, SoundCloudTrack, SoundCloudPlaylist } from "play-dl";

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
		.addSubcommand(subcommand =>
			subcommand
				.setName("query")
				.setDescription("Plays track from url or search query")
				.addStringOption(option =>
					option
						.setName("query")
						.setDescription("Track url or search query")
						.setRequired(true)
				)
		)
		.addSubcommand(subcommand =>
			subcommand
				.setName("file")
				.setDescription("Plays track from file")
				.addAttachmentOption(option =>
					option
						.setName("file")
						.setDescription("Track file")
						.setRequired(true)
				)
		);

	executeSlash = async (interaction: ChatInputCommandInteraction) => {
		const query = interaction.options.getString("query");
		const file = interaction.options.getAttachment("file");
		interaction.reply({ embeds: [await this.play(interaction.channel as GuildTextBasedChannel, interaction.member as GuildMember, { query, file })] });
	};

	executePrefix = async (message: Message, args: string[]) => {
		const query = args.join(" ") || null;
		const file = message.attachments.first() || null;
		message.reply({ embeds: [await this.play(message.channel as GuildTextBasedChannel, message.member!, { query, file })] });
	};

	private async play(textChannel: GuildTextBasedChannel, member: GuildMember, source: {query: string | null; file: Attachment | null}) {
		const { client: { db }, client, guild, voice } = member;
		const { query, file } = source;

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
			message: undefined,
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
	
				if (this.connection?.state.status === VoiceConnectionStatus.Ready) this.connection.disconnect();
				this.left = true;

				if (deleteQueue) this.clear();
			}

		};

		if (!client.musicQueue.has(guild.id)) client.musicQueue.set(guild.id, queueCounstruct);
		const queue = client.musicQueue.get(guild.id)!;

		const { play, ymApi } = await initMusic();
		
		const type = query?.length ? await play.validate(query) : null;

		const queueLength = queue.list.length;
	
		if (!query?.length) {
			if (!file) return warning("Nothing to play");

			try {
				if (!file.contentType?.startsWith("audio/")) throw new Error("Media is not an audio file");
				const song = {
					service: MusicServices.Raw,
					title: file.name,
					thumbnailUrl: "https://olejka.ru/s/875449ff66.png",
					duration: file.duration! * 1000,
					url: file.url,
					requestedBy: member
				};
				queue.list.push(song);
				if (queueLength) return success(`Added \`${song.title}\` to queue`);
			} catch (e) {
				console.error(e);
				return critical("Can't fetch track from URL", `\`\`\`\n${e}\n\`\`\``);
			}
		} else if (type === "yt_video") {
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
			const info = await play.soundcloud(query) as SoundCloudTrack;

			const song: Song = {
				service: MusicServices.SoundCloud,
				title: info.name,
				thumbnailUrl: info.thumbnail,
				duration: info.durationInSec,
				url: info.url,
				requestedBy: member
			};

			queue.list.push(song);
		} else if (type === "so_playlist") {
			const playlist = await play.soundcloud(query) as SoundCloudPlaylist;
			const list = await playlist.all_tracks();

			queue.list.push(...list.slice(0, MAX_ITEMS).map(info => ({
				service: MusicServices.SoundCloud,
				title: info.name,
				thumbnailUrl: info.thumbnail,
				duration: info.durationInSec,
				url: info.url,
				requestedBy: member
			})));

			if (queueLength) return success(`Added ${list.length > MAX_ITEMS ? MAX_ITEMS : list.length} tracks to queue`);
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
		} else if (query.match(/^https?:\/\/(cdn\.discordapp\.com|media.discordapp.net)\/(ephemeral-)?attachments\/[0-9]+\/[0-9]+\/.*/gi)) { // Discord link
			try {
				const res = await fetch(query);
				if (!res.headers.get("content-type")?.startsWith("audio/")) throw new Error("Media is not an audio file");

				const name = /filename=(.*);?/gi.exec(res.headers.get("content-disposition") ?? "")?.[1] ?? `[URL] ${query}`.replace(/https?:\/\//gi, "");

				const song = {
					service: MusicServices.Raw,
					title: name.length > 60 ? `${name.slice(0, 60)}...` : name,
					thumbnailUrl: "https://olejka.ru/r/03d291545d.png",
					duration: 0, // Idk how to calculate this
					url: query,
					requestedBy: member
				};
				queue.list.push(song);
				if (queueLength) return success(`Added \`${song.title}\` to queue`);
			} catch (e) {
				console.error(e);
				return critical("Can't fetch track from URL", `\`\`\`\n${e}\n\`\`\``);
			}
		} else return warning("Passed URL is not supported");

		if (!queue.playing && queue.list[0]) {
			startMusicPlayback(queue);
			const requestedBy = queue.list[0].requestedBy;
			return regular(`${queueLength ? `Added ${queue.list.length} songs and s` : "S"}tarted playback`, escapeMarkdown(queue.list[0].title), {
				footer: `Requested by ${requestedBy.displayName}`,
				footerIcon: requestedBy.displayAvatarURL({ size: 256 })
			});
		}

		throw new Error("Something went wrong");
	}
}