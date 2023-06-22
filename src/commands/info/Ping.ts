import Command from "../../Command";
import {
	type Message,
	type CommandInteraction,
	SlashCommandBuilder,
} from "discord.js";
import { Access } from "../../components/enums";
import { regular } from "../../components/messages";

export default class Ping extends Command {
	name = "ping";
	description = "Displays bot's latency";
	aliases = [];
	args = [];
	access = Access.User;

	data = new SlashCommandBuilder()
		.setName(this.name)
		.setDescription(this.description);

	executeSlash = async (interaction: CommandInteraction) => {
		interaction.reply({ embeds: [this.displayPing(interaction)] });
	};

	executePrefix = async (message: Message) => {
		message.reply({ embeds: [this.displayPing(message)] });
	};

	private displayPing(base: CommandInteraction | Message) {
		return regular("Pong!", `${Date.now() - base.createdTimestamp}ms.`);
	}
}
