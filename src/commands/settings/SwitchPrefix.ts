import Command from "../../Command";
import {
	type Message,
	type ChatInputCommandInteraction,
	type Guild,
	SlashCommandBuilder,
} from "discord.js";
import { Access } from "../../enums";
import { regular, success } from "../../components/messages";

export default class SwitchPrefix extends Command {
	name = "switch-prefix";
	description = "Disables or enables the prefix commands for this server";
	aliases = [];
	args = [];
	access = Access.Administrator;

	data = new SlashCommandBuilder()
		.setName(this.categoryMeta!.name)
		.setDescription(this.categoryMeta!.description)
		.addSubcommand(subcommand =>
			subcommand
				.setName(this.name)
				.setDescription(this.description)
				.addBooleanOption(option =>
					option
						.setName("state")
						.setDescription("the new state")
				)
		);

	executeSlash = async (interaction: ChatInputCommandInteraction) => {
		const newState = interaction.options.getBoolean("state");
		interaction.reply({ embeds: [await this.setPrefixState(interaction.guild!, newState)] });
	};

	executePrefix = async (message: Message, args: string[]) => {
		const newState = ["on", "enable", "true"].includes(args[0]) ? true : ["off", "disable", "false"].includes(args[0]) ? false : null;
		message.reply({ embeds: [await this.setPrefixState(message.guild!, newState)] });
	};

	private async setPrefixState( guild: Guild, newState: boolean | null) {
		const { prefixEnabled } = await guild.client.db.getServer(guild.id);
		if (newState === null) return regular(`Prefix commands is currently ${prefixEnabled ? "enabled" : "disabled"}`);

		guild.client.db.updateServer(guild.id, "prefixEnabled", newState);

		return success(`Prefix commands ${newState ? "enabled" : "disabled"}`);
	}
}
