import Command from "../../Command";
import {
	type Message,
	type ChatInputCommandInteraction,
	SlashCommandBuilder,
	GuildMember,
} from "discord.js";
import { Access } from "../../enums";
import { success, warning } from "../../utils/messages";

export default class Pause extends Command {
	name = "pause";
	description = "Pauses playback";
	aliases = [];
	args = [];
	access = Access.User;

	data = new SlashCommandBuilder()
		.setName(this.name)
		.setDescription(this.description);

	executeSlash = async (interaction: ChatInputCommandInteraction) => {
		interaction.reply({ embeds: [this.pause(interaction.member as GuildMember)] });
	};

	executePrefix = async (message: Message) => {
		message.reply({ embeds: [this.pause(message.member as GuildMember)] });
	};

	private pause(member: GuildMember) {
		const { client: { musicQueue }, guild, voice: { channel } } = member;

		const queue = musicQueue.get(guild.id);

		if (!queue) return warning("There is no queue");
		if (!queue.playing) return warning("Nothing is playing now");
		if (queue.paused) return warning("Playback is already paused");
		if (!channel) return warning("You must be in a voice channel to pause");
		if (channel != queue.voiceChannel) return warning("You must be in the same voice channel to pause");

		try {
			queue.player?.pause();
			queue.trackTime = Date.now() - queue.startTime;
			queue.paused = true;
		} catch (error) {
			queue.clear(false);
			throw error;
		}

		return success("Paused playback");
	}
}
