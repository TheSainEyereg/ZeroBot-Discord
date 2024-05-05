import Command from "../../Command";
import {
	type Message,
	type ChatInputCommandInteraction,
	SlashCommandBuilder,
	GuildMember,
} from "discord.js";
import { Access } from "../../enums";
import { success, warning } from "../../components/messages";

export default class Resume extends Command {
	name = "resume";
	description = "Resumes playback";
	aliases = [];
	args = [];
	access = Access.User;

	data = new SlashCommandBuilder()
		.setName(this.name)
		.setDescription(this.description);

	executeSlash = async (interaction: ChatInputCommandInteraction) => {
		interaction.reply({ embeds: [await this.resume(interaction.member as GuildMember)] });
	};

	executePrefix = async (message: Message) => {
		message.reply({ embeds: [await this.resume(message.member as GuildMember)] });
	};

	private async resume(member: GuildMember) {
		const { client: { musicQueue }, guild, voice: { channel } } = member;

		const queue = musicQueue.get(guild.id);

		if (!queue) return warning("There is no queue");
		if (!queue.playing) return warning("Nothing is playing now");
		if (!queue.paused) return warning("Playback is not paused");
		if (!channel) return warning("You must be in a voice channel to resume playback");
		if (!queue.left && channel != queue.voiceChannel) return warning("You must be in the same voice channel to resume playback");

		try {
			queue.voiceChannel = channel;
			await queue.joinChannel();
			
			queue.player?.unpause();
			queue.startTime = Date.now() - queue.trackTime;
			queue.paused = false;
		} catch (error) {
			queue.clear(false);
			throw error;
		}

		return success("Resumed playback");
	}
}
