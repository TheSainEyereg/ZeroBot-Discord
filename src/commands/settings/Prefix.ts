import Command from "../../Command";
import {
	type Message,
	type ChatInputCommandInteraction,
	type Guild,
	SlashCommandBuilder,
} from "discord.js";
import { Access } from "../../components/enums";
import { regular, success, warning } from "../../components/messages";

export default class Prefix extends Command {
	name = "prefix";
	description = "Changes the bot prefix";
	aliases = [];
	args = ["(new prefix)"];
	access = Access.Administrator;

	data = new SlashCommandBuilder()
		.setName(this.categoryMeta!.name)
		.setDescription(this.categoryMeta!.description)
		.addSubcommand(subcommand =>
			subcommand
				.setName(this.name)
				.setDescription(this.description)
				.addStringOption(option =>
					option
						.setName("prefix")
						.setDescription("the new prefix")
				)
		);

	executeSlash = async (interaction: ChatInputCommandInteraction) => {
		const newPrefix = interaction.options.getString("prefix");
		interaction.reply({ embeds: [await this.changePrefix(interaction.guild!, newPrefix)] });
	};

	executePrefix = async (message: Message, args: string[]) => {
		message.reply({ embeds: [await this.changePrefix(message.guild!, args.join(" "))] });
	};

	private async changePrefix( guild: Guild, newPrefix: string | null) {
		const { prefix } = await guild.client.db.getServer(guild.id);
		if (!newPrefix) return regular(`The current prefix is \`${prefix}\``);

		if (newPrefix.length > 5) return warning("Maximum length is 5 characters!");
		
		guild.client.db.updateServer(guild.id, "prefix", newPrefix);
		return success("Prefix changed!", `The new prefix is \`${newPrefix}\``);
	}
}
