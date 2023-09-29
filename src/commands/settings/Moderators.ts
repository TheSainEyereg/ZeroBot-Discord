import Command from "../../Command";
import {
	type Message,
	type ChatInputCommandInteraction,
	type Guild,
	type GuildMember,
	SlashCommandBuilder,
} from "discord.js";
import { Access } from "../../components/enums";
import { regular, success, warning } from "../../components/messages";

export default class Moderators extends Command {
	name = "moderators";
	description = "Adds or removes moderators";
	aliases = [];
	args = ["(add|remove)", "[@mention]"];
	access = Access.Administrator;

	data = new SlashCommandBuilder()
		.setName(this.name)
		.setDescription(this.description)
		.addSubcommand(subcommand => subcommand.setName("list").setDescription("List all moderators"))
		.addSubcommand(subcommand =>
			subcommand
				.setName("add")
				.setDescription("Add moderator")
				.addUserOption(option => option.setName("target").setDescription("User to add").setRequired(true))
		)
		.addSubcommand(subcommand =>
			subcommand
				.setName("remove")
				.setDescription("Remove moderator")
				.addUserOption(option => option.setName("target").setDescription("User to remove").setRequired(true))
		);

	executeSlash = async (interaction: ChatInputCommandInteraction) => {
		const member = interaction.options.getMember("target");
		const mode = interaction.options.getSubcommand();

		interaction.reply({ embeds: [ await this.getOutput(interaction.guild!, mode, member as GuildMember) ] });
	};

	executePrefix = async (message: Message, args: string[]) => {
		const member = message.mentions.members!.first();

		message.reply({ embeds: [ await this.getOutput(message.guild!, args[0] || "list", member) ] });
	};

	private async getOutput(guild: Guild, mode: string, member?: GuildMember) {
		if (!["add", "remove", "list"].includes(mode)) return warning("Invalid subcommand", "Must be 'add' or 'remove'");
		
		const moderators = await guild.client.db.getModerators(guild.id);

		if (mode === "list") {
			if (!moderators.length) return warning("No moderators", "There are no moderators in this server");
			const output = moderators.map(m => `<@${m}>`);
			return regular("Moderators", (moderators.length > 25 ? [...output.slice(0, 25), ...[`\nAnd ${moderators.length - 25} more...`]] : output).join("\n") );
		}

		if (!member) return warning("Invalid target", `Please specify a user to ${mode === "add" ? "add" : "remove"}`);

		if (mode === "add") {
			if (moderators.includes(member.id)) return warning("Already a moderator", "This user is already a moderator");
			await guild.client.db.addModerator(guild.id, member.id);
		}

		if (mode === "remove") {
			if (!moderators.includes(member.id)) return warning("Not a moderator", "This user is not a moderator");
			await guild.client.db.removeModerator(guild.id, member.id);
		}

		return success("Updated moderators", `Successfully ${mode === "add" ? "added" : "removed"} ${member}`);
	}
}
