import Command from "../../Command";
import {
	type Message,
	type ChatInputCommandInteraction,
	type Guild,
	SlashCommandBuilder,
} from "discord.js";
import { Access } from "../../enums";
import { regular, success, warning } from "../../components/messages";

export default class Prefix extends Command {
	name = "default-volume";
	description = "Changes the default volume for server";
	aliases = [];
	args = ["(new volume)"];
	access = Access.Administrator;

	data = new SlashCommandBuilder()
		.setName(this.categoryMeta!.name)
		.setDescription(this.categoryMeta!.description)
		.addSubcommand(subcommand =>
			subcommand
				.setName(this.name)
				.setDescription(this.description)
				.addIntegerOption(option =>
					option
						.setName("volume")
						.setDescription("volume")
						.setMinValue(1)
						.setMaxValue(100)
				)
		);

	executeSlash = async (interaction: ChatInputCommandInteraction) => {
		const volume = interaction.options.getInteger("volume");

		interaction.reply({ embeds: [await this.changeDefaultVolume(interaction.guild!, volume)] });
	};

	executePrefix = async (message: Message, args: string[]) => {
		const volume = parseInt(args[0]) || null;

		message.reply({ embeds: [await this.changeDefaultVolume(message.guild!, volume)] });
	};

	private async changeDefaultVolume(guild: Guild, volume: number | null) {
		const { musicVolume } = await guild.client.db.getServer(guild.id);
		if (!volume) return regular(`The current default volume is ${musicVolume * 100}%`);

		if (volume < 1 || volume > 100) return warning("Volume must be a number between 1 and 100");

		guild.client.db.updateServer(guild.id, "musicVolume", volume * 0.01);
		return success("Default volume changed!", `The default music volume is set to ${volume}%`);
	}
}
