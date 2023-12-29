import type { Guild, GuildTextBasedChannel, BaseGuildVoiceChannel, GuildMember, Message } from "discord.js";
import type { AudioPlayer, AudioResource, VoiceConnection } from "@discordjs/voice";
import type { LoopMode, MusicServices } from "../enums";
import { Track } from "ym-api/dist/types";


export interface Song {
	service: MusicServices,
	title: string,
	thumbnailUrl: string,
	duration: number,
	url: string,
	id?: number,
	requestedBy: GuildMember
}

export interface MusicQueue {
	guild: Guild,
	textChannel: GuildTextBasedChannel,
	voiceChannel: BaseGuildVoiceChannel,
	connection?: VoiceConnection,
	player?: AudioPlayer,
	resource?: AudioResource,
	message?: Message,
	volume: number,
	loopMode: LoopMode,
	list: Song[],

	playing: boolean,
	paused: boolean,
	stopped: boolean,
	left: boolean,
	deleted: boolean,

	clear: (deleteQueue?: boolean) => void,
	leaveChannel: (deleteQueue?: boolean) => void,
}


// Fix for broken ym-api types
export type YMApiTrack = Track & { version?: string };