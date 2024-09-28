import Command from "../../Command";
import {
	type Message,
	type ChatInputCommandInteraction,
	SlashCommandBuilder,
} from "discord.js";
import { Access } from "../../enums";
import { regular } from "../../utils/messages";

export default class Ping extends Command {
	name = "ping";
	description = "Displays bot's latency";
	aliases = [];
	args = [];
	access = Access.User;

	data = new SlashCommandBuilder()
		.setName(this.name)
		.setDescription(this.description);

	executeSlash = async (interaction: ChatInputCommandInteraction) => {
		interaction.reply({ embeds: [this.displayPing(interaction)] });
	};

	executePrefix = async (message: Message) => {
		message.reply({ embeds: [this.displayPing(message)] });
	};

	private displayPing(base: ChatInputCommandInteraction | Message) {
		return regular("Pong!", `Latency: \`${Date.now() - base.createdTimestamp}ms\`\nAPI Latency: \`${base.client.ws.ping}ms\``);
	}
}
