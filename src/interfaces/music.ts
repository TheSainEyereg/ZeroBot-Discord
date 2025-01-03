import type { GuildMember } from "discord.js";
import type { MusicServices } from "../enums";
import { Track } from "ym-api/dist/types";


export interface SongBase {
	service: MusicServices;
	title: string;
	thumbnailUrl: string;
	duration: number;
	link: string;
	requestedBy: GuildMember;
}

export type Song = SongBase & ({
	service: MusicServices.Spotify | MusicServices.Raw;
} |{
	service: MusicServices.Yandex;
	id: number;
} | {
	service: MusicServices.SoundCloud | MusicServices.VK;
	url: string;
})

// Fix for broken ym-api types
export type YMApiTrack = Track & { version?: string };