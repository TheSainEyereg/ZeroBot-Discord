import Command from "../../Command";
import {
	type Message,
	type ChatInputCommandInteraction,
	SlashCommandBuilder,
	type BaseGuildTextChannel,
	type GuildMember,
	PermissionFlagsBits,
	Attachment,
	escapeMarkdown,
} from "discord.js";
import { Access, MusicServices } from "../../enums";
import { critical, regular, success, warning } from "../../utils/messages";
import { Song, YMApiTrack } from "../../interfaces/music";
import type { SpotifyTrack, SpotifyPlaylist, SpotifyAlbum, SoundCloudTrack, SoundCloudPlaylist } from "play-dl";
import { regex as vkRegex } from "../../services/vk";
import MusicQueue from "../../utils/MusicQueue";

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

		await interaction.deferReply();
		interaction.editReply({ embeds: [await this.play(interaction.channel as BaseGuildTextChannel, interaction.member as GuildMember, { query, file })] });
	};

	executePrefix = async (message: Message, args: string[]) => {
		const query = args.join(" ") || null;
		const file = message.attachments.first() || null;

		await message.react("⏱️").catch(() => null);
		message.reply({ embeds: [await this.play(message.channel as BaseGuildTextChannel, message.member!, { query, file })] });
		await message.reactions.cache.get("⏱️")?.remove().catch(() => null);
	};

	private async play(textChannel: BaseGuildTextChannel, member: GuildMember, source: {query: string | null; file: Attachment | null}) {
		const { client: { db }, client, guild, voice } = member;
		const { query, file } = source;

		const voiceChannel = voice.channel;
		if (!voiceChannel) return warning("You must be in a voice channel to play music!");

		const minePermissions = voiceChannel.permissionsFor(client.user);
		if (!minePermissions || !minePermissions.has(PermissionFlagsBits.Connect) || !minePermissions.has(PermissionFlagsBits.Speak)) return warning("I don't have permissions to join your voice channel!");

		const queueCounstruct = new MusicQueue(textChannel, voiceChannel);
		queueCounstruct.volume = (await db.getServer(guild.id)).musicVolume;

		if (!client.musicQueue.has(guild.id)) client.musicQueue.set(guild.id, queueCounstruct);
		const queue = client.musicQueue.get(guild.id)!;

		const { play, ymApi, vkApi } = await queue.initMusic();
		
		const type = query?.length ? await play.validate(query) : null;

		const queueLength = queue.list.length;
	
		if (!query?.length) {
			if (!file) return warning("Nothing to play");

			try {
				if (!file.contentType?.startsWith("audio/")) throw new Error("Media is not an audio file");
				const song = {
					service: MusicServices.Raw as const,
					title: file.name,
					thumbnailUrl: "https://olejka.ru/s/875449ff66.png",
					duration: file.duration! * 1000,
					link: file.url,
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
					service: MusicServices.YouTube as const,
					title: info.video_details.title!,
					thumbnailUrl: info.video_details.thumbnails[0].url,
					duration: info.video_details.durationInSec,
					link: info.video_details.url,
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
					service: MusicServices.YouTube as const,
					title: info.title!,
					thumbnailUrl: info.thumbnails[0].url,
					duration: info.durationInSec,
					link: info.url,
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
				service: MusicServices.SoundCloud as const,
				title: info.name,
				thumbnailUrl: info.thumbnail,
				duration: info.durationInSec,
				link: info.permalink,
				url: info.url,
				requestedBy: member
			};

			queue.list.push(song);

			if (queueLength) return success(`Added \`${song.title}\` to queue`);
		} else if (type === "so_playlist") {
			const playlist = await play.soundcloud(query) as SoundCloudPlaylist;
			const list = await playlist.all_tracks();

			queue.list.push(...list.slice(0, MAX_ITEMS).map(info => ({
				service: MusicServices.SoundCloud as const,	
				title: info.name,
				thumbnailUrl: info.thumbnail,
				duration: info.durationInSec,
				link: info.permalink,
				url: info.url,
				requestedBy: member
			})));

			if (queueLength) return success(`Added ${list.length > MAX_ITEMS ? MAX_ITEMS : list.length} tracks to queue`);
		} else if (type === "sp_track") {
			try {
				const info = await play.spotify(query) as SpotifyTrack;
				const song: Song = {
					service: MusicServices.Spotify as const,
					title: `${info.artists.map(artist => artist.name).join(", ")} - ${info.name}`,
					thumbnailUrl: info.thumbnail?.url || "",
					duration: info.durationInSec,
					link: info.url,
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
					service: MusicServices.Spotify as const,
					title: `${info.artists.map(artist => artist.name).join(", ")} - ${info.name}`,
					thumbnailUrl: info.thumbnail?.url || "",
					duration: info.durationInSec,
					link: info.url,
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
					service: MusicServices.Spotify as const,
					title: `${info.artists.map(artist => artist.name).join(", ")} - ${info.name}`,
					thumbnailUrl: info.thumbnail?.url || "",
					duration: info.durationInSec,
					link: info.url,
					requestedBy: member
				})));
				
				if (queueLength) return success(`Added ${list.length > MAX_ITEMS ? MAX_ITEMS : list.length} tracks to queue`);
			} catch (e) {
				console.error(e);
				return critical("Can't fetch playlist from Spotify", `\`\`\`\n${e}\n\`\`\``);
			}
		} else if (type === "search") {
			const result = await play.search(query, { limit: 1 });
			if (result.length === 0) return warning("Can't find anything");

			const song: Song = {
				service: MusicServices.YouTube as const,
				title: result[0].title!,
				thumbnailUrl: result[0].thumbnails[0].url,
				duration: result[0].durationInSec,
				link: result[0].url,
				requestedBy: member
			};
			queue.list.push(song);

			if (queueLength) return success(`Added \`${song.title}\` to queue`);
		} else if (query.match(/(https:\/\/)?(www.)?music\.yandex(\.(ru|ua|by|kz|com(\.(ru|tr))?|net))?\/album\/([0-9]+)\/track\/[0-9]+/gi)) { // YM track
			try {
				const id = parseInt(query.match(/track\/([0-9]+)/gi)![0].replace("track/", ""));
				const info = (await ymApi.getTrack(id))[0] as YMApiTrack;
	
				if (!info.available) return warning("Track is not available");
	
				const song: Song = {
					service: MusicServices.Yandex as const,
					title: `${info.artists.map(artist => artist.name).join(", ")} - ${info.title} ${info.version ? ` (${info.version})` : ""}`,
					thumbnailUrl: `https://${info.coverUri.replace("%%", "460x460")}`,
					duration: Math.floor(info.durationMs / 1000),
					link: `https://music.yandex/album/${info.albums[0].id}/track/${info.id}`,
					id: info.id,
					requestedBy: member
				};
				queue.list.push(song);

				if (queueLength) return success(`Added \`${song.title}\` to queue`);
			} catch (e) {
				console.error(e);
				return critical("Can't fetch track from Yandex", `\`\`\`\n${e}\n\`\`\``);
			}
		} else if (query.match(/(https:\/\/)?(www\.)?music\.yandex((\.(ru|ua|by|kz|com(\.(ru|tr))?|net))?)?\/users\/([A-Za-z0-9-_]+)(\/playlists\/[0-9]+)?/gi)) { // YM playlist
			try {
				const username = query.match(/users\/([A-Za-z0-9-_]+)/gi)![0].replace("users/", "");
				const playlist = query.match(/playlists\/([0-9]+)/gi) ? parseInt(query.match(/playlists\/([0-9]+)/gi)![0].replace("playlists/", "")) : 3;
	
				const list = (await ymApi.getPlaylist(playlist, username)).tracks?.map(track => track.track).filter(track => track.available) as YMApiTrack[];
				if (!list) throw new Error("Can't get info");

				queue.list.push(...list.slice(0, MAX_ITEMS).map(info => ({
					service: MusicServices.Yandex as const,
					title: `${info.artists.map(artist => artist.name).join(", ")} - ${info.title} ${info.version ? ` (${info.version})` : ""}`,
					thumbnailUrl: `https://${info.coverUri.replace("%%", "460x460")}`,
					duration: Math.floor(info.durationMs / 1000),
					link: `https://music.yandex/album/${info.albums[0].id}/track/${info.id}`,
					id: info.id,
					requestedBy: member
				})));
	
				if (queueLength) return success(`Added ${list.length > MAX_ITEMS ? MAX_ITEMS : list.length} tracks to queue`);
			} catch(e) {
				console.error(e);
				return critical("Can't fetch playlist from Yandex", `\`\`\`\n${e}\n\`\`\``);
			}
		} else if (query.match(/(https:\/\/)?(www.)?music\.yandex((\.(ru|ua|by|kz|com(\.(ru|tr))?|net))?)?\/album\/[0-9]+/gi)) { // YM album
			try {
				const album = parseInt(query.match(/album\/([0-9]+)/gi)![0].replace("album/", ""));
	
				const list = (await ymApi.getAlbumWithTracks(album))?.volumes[0]?.filter(track => track.available) as YMApiTrack[];

				queue.list.push(...list.slice(0, MAX_ITEMS).map(info => ({
					service: MusicServices.Yandex as const,
					title: `${info.artists.map(artist => artist.name).join(", ")} - ${info.title} ${info.version ? ` (${info.version})` : ""}`,
					thumbnailUrl: `https://${info.coverUri.replace("%%", "460x460")}`,
					duration: Math.floor(info.durationMs / 1000),
					link: `https://music.yandex/album/${info.albums[0].id}/track/${info.id}`,
					id: info.id,
					requestedBy: member
				})));

				if (queueLength) return success(`Added ${list.length > MAX_ITEMS ? MAX_ITEMS : list.length} tracks to queue`);
			} catch (e) {
				console.error(e);
				return critical("Can't fetch album from Yandex", `\`\`\`\n${e}\n\`\`\``);
			}
		} else if (query.match(vkRegex.track)) {
			try {
				const { id } = vkRegex.track.exec(query)!.groups!;

				const res = await vkApi.getTrack(id);
				const song = {
					service: MusicServices.VK as const,
					title: res.title,
					thumbnailUrl: res.thumb.photo_270,
					duration: res.duration,
					url: res.url,
					link: `https://vk.com/audio${res.owner_id}_${res.id}`,
					requestedBy: member
				};
				queue.list.push(song);
				if (queueLength) return success(`Added \`${song.title}\` to queue`);
			} catch (e) {
				console.error(e);
				return critical("Can't fetch track from VK", `\`\`\`\n${e}\n\`\`\``);
			}
		} else if (query.match(vkRegex.playlist)) {
			try {
				const { id } = vkRegex.playlist.exec(query)!.groups!;

				const res = await vkApi.getPlaylist(id);
				const list = res.map(track => ({
					service: MusicServices.VK as const,
					title: track.title,
					thumbnailUrl: track.thumb.photo_270,
					duration: track.duration,
					url: track.url,
					link: track.url,
					requestedBy: member
				}));
				queue.list.push(...list.slice(0, MAX_ITEMS));
				if (queueLength) return success(`Added ${list.length > MAX_ITEMS ? MAX_ITEMS : list.length} tracks to queue`);
			} catch (e) {
				console.error(e);
				return critical("Can't fetch playlist from VK", `\`\`\`\n${e}\n\`\`\``);
			}
		} else if (query.match(/^https?:\/\/(cdn\.discordapp\.com|media.discordapp.net)\/(ephemeral-)?attachments\/[0-9]+\/[0-9]+\/.*/gi)) { // Discord link
			try {
				const res = await fetch(query);
				if (!res.headers.get("content-type")?.startsWith("audio/")) throw new Error("Media is not an audio file");

				const name = /filename=(.*);?/gi.exec(res.headers.get("content-disposition") ?? "")?.[1] ?? `[URL] ${query}`.replace(/https?:\/\//gi, "");

				const song = {
					service: MusicServices.Raw as const,
					title: name.length > 60 ? `${name.slice(0, 60)}...` : name,
					thumbnailUrl: "https://olejka.ru/r/03d291545d.png",
					duration: 0, // Idk how to calculate this
					link: query,
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
			queue.startMusicPlayback();
			const requestedBy = queue.list[0].requestedBy;
			return regular(`${queueLength ? `Added ${queue.list.length} songs and s` : "S"}tarted playback`, escapeMarkdown(queue.list[0].title), {
				footer: `Requested by ${requestedBy.displayName}`,
				footerIcon: requestedBy.displayAvatarURL({ size: 256 })
			});
		}

		throw new Error("Something went wrong");
	}
}