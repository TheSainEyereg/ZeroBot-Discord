import Command from "../../Command";
import type {
	Message
} from "discord.js";
import { Access } from "../../enums";
import { critical, success } from "../../components/messages";

export default class Eval extends Command {
	name = "eval";
	description = "Executes a code snippet";
	aliases = ["exec"];
	args = [];
	access = Access.SuperUser;

	data = null;

	// eslint-disable-next-line @typescript-eslint/no-empty-function
	executeSlash = async () => {};

	executePrefix = async (message: Message, args: string[]) => {
		const code = args.join(" ").replace(/```([a-z0-9]+\n)?(.*?)```/gs, "$2");
		try {
			const result = await eval(code);
			if (code.includes("message.edit(") || code.includes("message.delete(")) return;
			message.reply({ embeds: [success("Result", `${result}`.length ? `\`\`\`${result}\`\`\`` : "Empty response")] });
		} catch (e) {
			console.error(e);
			message.reply({ embeds: [critical("Error in eval", `\`\`\`${e}\`\`\``)] });
		}

	};
}
