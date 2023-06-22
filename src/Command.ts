import type { Message, CommandInteraction, SlashCommandBuilder } from "discord.js";
import type { Client } from "./Client";
import type { Access } from "./components/enums";


export default abstract class Command {
	protected client: Client;

	abstract name: string;
	abstract description: string;
	abstract args: string[];
	abstract aliases: string[];
	abstract access: Access;
	
	abstract data: Omit<SlashCommandBuilder, "addSubcommand" | "addSubcommandGroup"> | null; // Slash command

	abstract executeSlash(interaction: CommandInteraction): Promise<void>;
	abstract executePrefix(message: Message, args: string[]): Promise<void>;

	constructor(client: Client) {
		this.client = client;
	}
}