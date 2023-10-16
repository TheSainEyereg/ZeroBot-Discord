import type { User } from "discord.js";
import type { Access } from "../enums";

export interface EmbedOptions {
	url?: string;
	circle?: boolean;
	color?: number;
	footer?: string;
	footerIcon?: string;
	footerUser?: User;
}

export interface ParsedArgument {
	text: string;
	optional: boolean;
}

export interface ArgumentCheckAnswer {
	missing: boolean;
	all: ParsedArgument[];

	text?: string;
	pos?: number;
}

export interface CategoryMeta {
	name: string;
	description: string;
	access?: Access;
	hidden?: boolean;
	ignored?: boolean;
}