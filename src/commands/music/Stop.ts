import Command from "../../Command";
import {
	type Message,
	type ChatInputCommandInteraction,
	SlashCommandBuilder,
	GuildMember,
} from "discord.js";
import { Access } from "../../enums";
import { success, warning } from "../../utils/messages";

export default class Stop extends Command {
	name = "stop";
	description = "Stops playback";
	aliases = [];
	args = [];
	access = Access.User;

	data = new SlashCommandBuilder()
		.setName(this.name)
		.setDescription(this.description);

	executeSlash = async (interaction: ChatInputCommandInteraction) => {
		interaction.reply({ embeds: [this.stop(interaction.member as GuildMember)] });
	};

	executePrefix = async (message: Message) => {
		message.reply({ embeds: [this.stop(message.member as GuildMember)] });
	};

	private stop(member: GuildMember) {
		const { client: { musicQueue }, guild, voice: { channel } } = member;

		const queue = musicQueue.get(guild.id);

		if (!queue) return warning("There is no queue");
		if (!channel) return warning("You must be in a voice channel to stop");
		if (channel != queue.voiceChannel) return warning("You must be in the same voice channel to skip");

		queue.clear(false);
		return success("Stopped playback");
	}
}
