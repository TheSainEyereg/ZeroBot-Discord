import Command from "../../Command";
import {
	type Message,
	type ChatInputCommandInteraction,
	SlashCommandBuilder,
} from "discord.js";
import { Access } from "../../enums";
import { url } from "../../utils/messages";
import config from "../../config";

export default class Invite extends Command {
	name = "invite";
	description = "Sends a link to invite ZeroBot to your server";
	aliases = [];
	args = [];
	access = Access.User;

	data = new SlashCommandBuilder()
		.setName(this.name)
		.setDescription(this.description);

	executeSlash = async (interaction: ChatInputCommandInteraction) => {
		interaction.reply({ embeds: [this.sendLink()] });
	};

	executePrefix = async (message: Message) => {
		message.reply({ embeds: [this.sendLink()] });
	};

	private sendLink() {
		return url("Invite ZeroBot to server", config.invite, "Thanks you for joining ZeroBot community :)");
	}
}
