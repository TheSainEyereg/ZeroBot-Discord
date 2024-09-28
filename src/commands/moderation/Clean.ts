import Command from "../../Command";
import {
	type Message,
	type ChatInputCommandInteraction,
	type TextChannel,
	type GuildMember,
	SlashCommandBuilder,
} from "discord.js";
import { Access } from "../../enums";
import { success, warning } from "../../utils/messages";

export default class Clean extends Command {
	name = "clean";
	description = "Deletes given amount of messages";
	aliases = ["cls"]; // Windows Command Prompt reference
	args = ["[amount]", "(@mention)"];
	access = Access.Moderator;

	data = new SlashCommandBuilder()
		.setName(this.name)
		.setDescription(this.description)
		.addIntegerOption(option =>
			option
				.setName("amount")
				.setDescription("Amount of messages to delete")
				.setMinValue(2)
				.setMaxValue(100)
				.setRequired(true)
		).addUserOption(option =>
			option
				.setName("target")
				.setDescription("User to delete messages from")
				.setRequired(false)
		);

	executeSlash = async (interaction: ChatInputCommandInteraction) => {
		const amount = interaction.options.getInteger("amount");
		const member = interaction.options.getMember("target");

		interaction.reply({ embeds: [await this.clear(interaction.channel! as TextChannel, amount!, member as GuildMember)] })
			.then(m => setTimeout(() => m.delete(), 3000)).catch(console.error);
	};

	executePrefix = async (message: Message, args: string[]) => {
		const amount = parseInt(args[0]);
		const member = message.mentions.members!.first();

		message.channel.send({ embeds: [await this.clear(message.channel as TextChannel, amount, member as GuildMember)] })
			.then(m => setTimeout(() => m.delete(), 3000)).catch(console.error);
	};

	private async clear(channel: TextChannel, amount: number, member?: GuildMember) {
		if (isNaN(amount)) return warning("Amount must be a number");
		if (amount > 100 || amount < 2) return warning("Amount must be between 2 and 100");

		const messages = await channel.messages.fetch({ limit: amount });
		const deleted = await channel.bulkDelete(messages.filter(m => !member ||  m.author.id === member.user.id), true);

		return success(`Deleted ${deleted.size} messages!`);
	}
}
