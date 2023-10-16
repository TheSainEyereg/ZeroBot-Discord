import Command from "../../Command";
import {
	type Message,
	type ChatInputCommandInteraction,
	SlashCommandBuilder,
} from "discord.js";
import { Access } from "../../enums";
import fetch from "node-fetch";

export default class Ascii extends Command {
	name = "ascii";
	description = "Sends text as ascii art";
	aliases = [];
	args = ["[text]"];
	access = Access.User;

	data = new SlashCommandBuilder()
		.setName(this.name)
		.setDescription(this.description)
		.addStringOption((option) =>
			option
				.setName("text")
				.setDescription("Text to send")
				.setRequired(true)
		);

	executeSlash = async (interaction: ChatInputCommandInteraction) => {
		const text = interaction.options.getString("text");
		interaction.reply(await this.ascii(text!));
	};

	executePrefix = async (message: Message, args: string[]) => {
		message.reply(await this.ascii(args.join(" ")));
	};

	private async ascii(text: string) {
		const response = await fetch(`https://api.olejka.ru/v2/figlet?text=${text}`);
		const json = await response.json();

		return `\`\`\`\n${json.text}\`\`\``;
	}
}
