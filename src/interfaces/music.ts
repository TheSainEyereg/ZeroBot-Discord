import type { Guild, TextChannel, VoiceChannel, User } from "discord.js";
import type { AudioPlayer, AudioResource } from "@discordjs/voice";
import { MusicServices } from "../components/enums";


export interface Song {
	service: MusicServices,
	title: string,
	thumbnail: string,
	duration: number,
	url: string,
	requestedBy: User
}


export interface MusicQueue {
	guild: Guild,
	textChannel: TextChannel,
	voiceChannel: VoiceChannel,
	player: AudioPlayer,
	resource: AudioResource,
	volume: number,
	loop: boolean,
	playing: boolean,
	stopped: boolean,
	paused: boolean,
	list: Song[]
}