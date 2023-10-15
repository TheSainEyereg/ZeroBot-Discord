import Command from "../../Command";
import {
	type Message,
	type ChatInputCommandInteraction,
	SlashCommandBuilder,
	GuildMember,
} from "discord.js";
import { Access } from "../../components/enums";
import { critical, success, warning } from "../../components/messages";
import { VoiceConnectionStatus, getVoiceConnection } from "@discordjs/voice";

export default class Leave extends Command {
	name = "leave";
	description = "Leaves the voice channel";
	aliases = ["l"];
	args = [];
	access = Access.User;

	data = new SlashCommandBuilder()
		.setName(this.name)
		.setDescription(this.description);

	executeSlash = async (interaction: ChatInputCommandInteraction) => {
		interaction.reply({ embeds: [ this.leave(interaction.member as GuildMember) ] });
	};

	executePrefix = async (message: Message) => {
		message.reply({ embeds: [ this.leave(message.member as GuildMember) ] });
	};

	private leave(member: GuildMember) {
		const { client: { musicQueue }, guild, voice: { channel } } = member;

		const connection = getVoiceConnection(guild.id);
		if (connection?.state.status != VoiceConnectionStatus.Ready) return warning("Bot isn't in a voice channel");

		const queue = musicQueue.get(guild.id);
		if (!queue) return critical("Guild music queue is absent", "Disconnect bot from the voice channel manually");

		if (!channel) return warning("You must be in a voice channel");
		if (channel != queue.voiceChannel) return warning("You must be in the same voice channel");

		queue.leaveChannel();

		return success("Disconnected", `${member.user} asked me to leave the voice channel`);
	}
}
