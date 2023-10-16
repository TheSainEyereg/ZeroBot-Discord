import Command from "../../Command";
import {
	type Message,
	type ChatInputCommandInteraction,
	SlashCommandBuilder,
} from "discord.js";
import { Access } from "../../enums";
import { regular } from "../../components/messages";

export default class Time extends Command {
	name = "time";
	description = "Sends current date and time";
	aliases = ["date"];
	args = [];
	access = Access.User;

	data = new SlashCommandBuilder()
		.setName(this.name)
		.setDescription(this.description);

	executeSlash = async (interaction: ChatInputCommandInteraction) => {
		interaction.reply({ embeds: [await this.sendTime()] });
	};

	executePrefix = async (message: Message) => {
		message.reply({ embeds: [await this.sendTime()] });
	};

	private async sendTime() {
		return regular(`<t:${ Math.floor(Date.now() / 1000) }>`);
	}
}
