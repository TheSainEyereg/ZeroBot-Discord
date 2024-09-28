import Command from "../../Command";
import {
	type Message
} from "discord.js";
import { Access } from "../../enums";
import { critical, regular, warning } from "../../utils/messages";

export default class Aliases extends Command {
	name = "cmeta";
	description = "Outputs category meta data for command";
	aliases = [];
	args = ["[command]"];
	access = Access.SuperUser;

	data = null;

	// eslint-disable-next-line @typescript-eslint/no-empty-function
	executeSlash = async () => {};

	executePrefix = async (message: Message, args: string[]) => {
		message.reply({ embeds: [await this.displayMeta(message, args[0])] });
	};

	private async displayMeta(message: Message ,commandString: string) {
		const { client } = message;

		const command = client.commands.get(commandString) || client.commands.find((cmd, key) => (key.split(":")[1] === commandString) || (cmd.aliases && cmd.aliases.includes(commandString)));

		if (!command) return critical("Command was not found!");
		if (!command.categoryMeta) return warning("No meta!", "This command has no meta for it's category!");

		return regular(`Category meta for \`${command.name}\`:`, `\`\`\`json\n${JSON.stringify(command.categoryMeta, null, "\t")}\`\`\``, {
			
		});
	}
}
