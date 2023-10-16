import type { Message, ChatInputCommandInteraction, SlashCommandBuilder, SlashCommandSubcommandsOnlyBuilder } from "discord.js";
import type { Access } from "./enums";
import type { CategoryMeta } from "./interfaces/bot";


export default abstract class Command {
	abstract name: string;
	abstract description: string;
	abstract args: string[];
	abstract aliases: string[];
	abstract access: Access;
	categoryMeta: CategoryMeta | null;
	
	abstract data: Omit<SlashCommandBuilder, "addSubcommand" | "addSubcommandGroup"> | SlashCommandSubcommandsOnlyBuilder | null; // Slash command

	abstract executeSlash(interaction: ChatInputCommandInteraction): Promise<void>;
	abstract executePrefix(message: Message, args: string[]): Promise<void>;

	constructor(categoryMeta: CategoryMeta | null) { this.categoryMeta = categoryMeta; }
}