import Command from "../../Command";
import {
	type Message,
	type ChatInputCommandInteraction,
	SlashCommandBuilder,
	GuildMember,
} from "discord.js";
import { Access, LoopMode } from "../../enums";
import { success, warning } from "../../components/messages";

export default class Skip extends Command {
	name = "skip";
	description = "Skips current song";
	aliases = ["s"];
	args = [];
	access = Access.User;

	data = new SlashCommandBuilder()
		.setName(this.name)
		.setDescription(this.description)
		.addIntegerOption(option =>
			option
				.setName("amount")
				.setDescription("Amount of songs to skip")
				.setMinValue(1)
				.setRequired(false)
		);

	executeSlash = async (interaction: ChatInputCommandInteraction) => {
		const amount = interaction.options.getInteger("amount") || 1;

		interaction.reply({ embeds: [this.skip(interaction.member as GuildMember, amount)] });
	};

	executePrefix = async (message: Message, args: string[]) => {
		const amount = parseInt(args[0]) || 1;

		message.reply({ embeds: [this.skip(message.member as GuildMember, amount)] });
	};

	private skip(member: GuildMember, amount: number) {
		const { client: { musicQueue }, guild, voice: { channel } } = member;

		const queue = musicQueue.get(guild.id);

		if (!queue?.playing) return warning("Nothing is playing now");
		if (queue.list.length === 0) return warning("There is nothing to skip");
		if (!channel) return warning("You must be in a voice channel to skip");
		if (channel != queue.voiceChannel) return warning("You must be in the same voice channel to skip");

		const oldLength = queue.list.length, oldTrack = queue.list[0].title;

		// TODO: Skip vote

		queue.list.splice(1, amount - 1); // Start from index 1 because 1st is the current song

		if (queue.loopMode == LoopMode.Track) queue.list.shift();
		queue.player?.stop();

		return success("Skipped", `${amount === 1 ?  `Track \`${oldTrack}\`` : `\`${amount > oldLength ? oldLength : amount}\` tracks`} was skipped by ${member.user}`);
	}
}
