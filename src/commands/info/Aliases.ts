import Command from "../../Command";
import {
	type Message
} from "discord.js";
import { Access } from "../../enums";
import { hasAccess } from "../../utils/checkManager";
import { critical, regular, warning } from "../../utils/messages";

export default class Aliases extends Command {
	name = "aliases";
	description = "Displays given command's aliases";
	aliases = [];
	args = ["[command]"];
	access = Access.User;

	data = null;

	// eslint-disable-next-line @typescript-eslint/no-empty-function
	executeSlash = async () => {};

	executePrefix = async (message: Message, args: string[]) => {
		message.reply({ embeds: [await this.displayAliases(message, args[0])] });
	};

	private async displayAliases(message: Message ,commandString: string) {
		const { client, member } = message;

		const command =
			client.commands.get(commandString) ||
			client.commands.find((cmd, key) => (key.split(":")[1] === commandString) ||
			(cmd.aliases && cmd.aliases.includes(commandString)));

		if (!command)
			return critical("Command was not found!");

		if (!await hasAccess(member!, command.access))
			return warning("No access!", "This command requires higher level permissions");

		if (command.aliases.length === 0)
			return warning("No aliases", "This command has no aliases");

		return regular(`Aliases for \`${command.name}\`:`, `**\`${command.aliases.join("`**\n**`")}\`**`, {
			footer: "Note: Aliases only works when executing commands with prefix!"
		});
	}
}
