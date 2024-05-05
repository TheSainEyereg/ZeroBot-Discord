import type { GuildMember } from "discord.js";
import type { MusicServices } from "../enums";
import { Track } from "ym-api/dist/types";


export interface Song {
	service: MusicServices;
	title: string;
	thumbnailUrl: string;
	duration: number;
	url: string;
	id?: number;
	requestedBy: GuildMember;
}

// Fix for broken ym-api types
export type YMApiTrack = Track & { version?: string };