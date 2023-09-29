import Command from "../../Command";
import {
	type Message,
	type ChatInputCommandInteraction,
	SlashCommandBuilder,
	GuildMember,
} from "discord.js";
import { Access, LoopMode } from "../../components/enums";
import { critical, success, warning } from "../../components/messages";

export default class Skip extends Command {
	name = "skip";
	description = "Skips current song";
	aliases = ["s"];
	args = [];
	access = Access.User;

	data = new SlashCommandBuilder()
		.setName(this.name)
		.setDescription(this.description);

	executeSlash = async (interaction: ChatInputCommandInteraction) => {
		interaction.reply({ embeds: [this.skip(interaction.member as GuildMember)] });
	};

	executePrefix = async (message: Message) => {
		message.reply({ embeds: [this.skip(message.member as GuildMember)] });
	};

	private skip(member: GuildMember) {
		const { client: { musicQueue }, guild, voice: { channel } } = member;

		const queue = musicQueue.get(guild.id);

		if (!queue?.playing) return warning("Nothing is playing now");
		if (queue.list.length === 0) return warning("There is nothing to skip");
		if (!channel) return warning("You must be in a voice channel to skip");
		if (channel != queue.voiceChannel) return warning("You must be in the same voice channel to skip");

		// TODO: Skip vote

		try {
			const old = queue.list[0].title;
			if (queue.loopMode == LoopMode.Track) queue.list.shift();
			queue.player?.stop();
			return success("Skipped", `Track \`${old}\` was skipped by ${member.user}`);
		} catch (e) {
			console.error(e);
			queue.clear(false);
			return critical("Error occurred!", `\`\`\`\n${e}\n\`\`\``);
		}
	}
}
