import type { Message, ChatInputCommandInteraction, SlashCommandBuilder, SlashCommandSubcommandsOnlyBuilder } from "discord.js";
import type { Access } from "./components/enums";


export default abstract class Command {
	abstract name: string;
	abstract description: string;
	abstract args: string[];
	abstract aliases: string[];
	abstract access: Access;
	
	abstract data: Omit<SlashCommandBuilder, "addSubcommand" | "addSubcommandGroup"> | SlashCommandSubcommandsOnlyBuilder | null; // Slash command

	abstract executeSlash(interaction: ChatInputCommandInteraction): Promise<void>;
	abstract executePrefix(message: Message, args: string[]): Promise<void>;
}