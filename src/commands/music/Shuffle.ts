import Command from "../../Command";
import {
	type Message,
	type ChatInputCommandInteraction,
	SlashCommandBuilder,
	GuildMember,
} from "discord.js";
import { Access } from "../../enums";
import { success, warning } from "../../utils/messages";

export default class Shuffle extends Command {
	name = "shuffle";
	description = "Shuffles playback";
	aliases = ["shuff"];
	args = [];
	access = Access.User;

	data = new SlashCommandBuilder()
		.setName(this.name)
		.setDescription(this.description);

	executeSlash = async (interaction: ChatInputCommandInteraction) => {
		interaction.reply({ embeds: [this.shuffle(interaction.member as GuildMember)] });
	};

	executePrefix = async (message: Message) => {
		message.reply({ embeds: [this.shuffle(message.member as GuildMember)] });
	};

	private shuffle(member: GuildMember) {
		const { client: { musicQueue }, guild, voice: { channel } } = member;

		const queue = musicQueue.get(guild.id);

		if (!queue) return warning("There is no queue");
		if (!channel) return warning("You must be in a voice channel to Shuffle");
		if (channel != queue.voiceChannel) return warning("You must be in the same voice channel to skip");
		if (!queue.list.length) return warning("There is nothing to shuffle");

		queue.list = [...queue.list.slice(0, 1), ...queue.list.slice(1).sort(() => Math.random() - 0.5)];
		
		return success("Shuffled queue", "The tracks were arranged in random order");
	}
}
