import Command from "../../Command";
import {
	type Message,
	type ChatInputCommandInteraction,
	SlashCommandBuilder,
} from "discord.js";
import { Access } from "../../enums";
import { url } from "../../components/messages";

export default class GitHub extends Command {
	name = "github";
	description = "Sends link to my GitHub";
	aliases = ["git", "repo"];
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
		return url("Link to my GitHub Repo", "https://github.com/TheSainEyereg/ZeroBot-Discord/", "Thanks you all for contributing ;)");
	}
}
