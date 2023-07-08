// Import base Command class
import Command from "../../Command";
// Import necessary types and components
import {
	type Message,
	type ChatInputCommandInteraction,
	type User,
	SlashCommandBuilder,
} from "discord.js";
// Import Access enums for access property
import { Access } from "../../components/enums";
// Import messages component with prepared embeds
import { regular } from "../../components/messages";

// Create class that extends base Command class
export default class Template extends Command {
	// Command name
	name = "template";
	// Command description
	description = "Example command";
	// Command aliases for so this command can be called as "example". WORKS ONLY WITH PREFIX
	aliases = ["example"];
	// Command arguments used for checking when running with prefix. [] - necessary argument, () - optional argument
	args = ["[is capitalized true|false]", "(custom word)"];
	// Access level used for checking when running both with prefix and as slash command
	access = Access.User;

	// https://old.discordjs.dev/#/docs/builders/main/class/SlashCommandBuilder
	data = new SlashCommandBuilder()
		.setName(this.name)
		.setDescription(this.description)
		.addBooleanOption(option =>
			option
				.setName("capitalized")
				.setDescription("is capitalized")
				.setRequired(true)
		)
		.addStringOption(option =>
			option
				.setName("custom_word")
				.setDescription("custom word")
				.setRequired(false)
		);

	// Method used when running as slash command
	executeSlash = async (interaction: ChatInputCommandInteraction) => {
		const user = interaction.user;
		const capitalized = interaction.options.getBoolean("capitalized");
		const word = interaction.options.getString("custom_word");

		interaction.reply({ embeds: [this.sayHello(user, word!, capitalized!)] });
	};

	// Method used when running command with prefix
	executePrefix = async (message: Message, args: string[]) => {
		const user = message.author;
		const capitalized = ["true", "yes"].includes(args[0]);
		const word = args[1];

		message.reply({ embeds: [this.sayHello(user, word, capitalized)] });
	};

	// Separate method with main command logic. Best practice IMO
	private sayHello(user: User, word: string, capitalized: boolean) {
		const text = word || "Hello!";

		return regular(`${capitalized ? text.toUpperCase() : text}`, user.toString(), { footerUser: user });
	}
}
