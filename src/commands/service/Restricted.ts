import Command from "../../Command";
import {
	type Message,
	type Client,
	type User,
} from "discord.js";
import { Access } from "../../enums";
import { critical, success, warning } from "../../components/messages";

export default class Restricted extends Command {
	name = "restricted";
	description = "Prevents specified users from using this bot";
	aliases = ["restriction"];
	args = ["(add|remove)", "[@mention]"];
	access = Access.Administrator;

	data = null;

	// eslint-disable-next-line @typescript-eslint/no-empty-function
	executeSlash = async () => {};

	executePrefix = async (message: Message, args: string[]) => {
		const member = message.mentions.users!.first();

		message.reply({ embeds: [ await this.getOutput(message.client, args[0] || "list", member) ] });
	};

	private async getOutput(client: Client, mode: string, user?: User) {
		if (!["add", "remove", "list"].includes(mode)) return warning("Invalid subcommand", "Must be 'add' or 'remove'");

		const banned = await client.db.getRestricted();

		if (mode === "list") {
			if (!banned.length) return warning("Empty list", "There are no restricted users");
			const output = banned.map(m => `<@${m}>`);
			return critical("Restricted", (banned.length > 25 ? [...output.slice(0, 25), ...[`\nAnd ${banned.length - 25} more...`]] : output).join("\n"), { circle: true });
		}

		if (!user) return warning("Invalid target", `Please specify a user to ${mode === "add" ? "add" : "remove"}`);

		if (mode === "add") {
			if (banned.includes(user.id)) return warning("Already in list", "This user is already has no access to this bot");
			await client.db.addRestrictedUser(user.id);
		}

		if (mode === "remove") {
			if (!banned.includes(user.id)) return warning("Not in list", "This user is not restricted");
			await client.db.removeRestrictedUser(user.id);
		}

		return success("Updated restricted users", `Successfully ${mode === "add" ? "added" : "removed"} ${user}`);
	}
}
