import Command from "../../Command";
import {
	type Message,
	type ChatInputCommandInteraction,
	type User,
	SlashCommandBuilder,
} from "discord.js";
import { Access } from "../../components/enums";
import { regular } from "../../components/messages";

export default class Say extends Command {
	name = "say";
	description = "Repeats given text";
	aliases = ["echo"];
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
		interaction.reply({ embeds: [this.say(interaction.user, text!)] });
	};

	executePrefix = async (message: Message, args: string[]) => {
		message.reply({ embeds: [this.say(message.author, args.join(" "))] });
	};

	private say(footerUser: User, text: string) {
		return regular(text, undefined, { footerUser });
	}
}
