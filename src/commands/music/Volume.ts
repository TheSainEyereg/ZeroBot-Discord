import Command from "../../Command";
import {
	type Message,
	type ChatInputCommandInteraction,
	SlashCommandBuilder,
	GuildMember,
} from "discord.js";
import { Access } from "../../components/enums";
import { regular, success, warning } from "../../components/messages";
import { hasAccess } from "../../components/checkManager";

export default class Ping extends Command {
	name = "volume";
	description = "Change playback volume";
	aliases = ["v"];
	args = ["(volume)"];
	access = Access.User;

	data = new SlashCommandBuilder()
		.setName(this.name)
		.setDescription(this.description)
		.addIntegerOption(option =>
			option
				.setName("volume")
				.setDescription("volume")
				.setMinValue(1)
				.setMaxValue(100)
		);

	executeSlash = async (interaction: ChatInputCommandInteraction) => {
		const volume = interaction.options.getInteger("volume");

		interaction.reply({ embeds: [await this.stop(interaction.member as GuildMember, volume)] });
	};

	executePrefix = async (message: Message, args: string[]) => {
		const volume = parseInt(args[0]) || null;

		message.reply({ embeds: [await this.stop(message.member as GuildMember, volume)] });
	};

	private async stop(member: GuildMember, volume: number | null) {
		const { client: { musicQueue }, guild, voice: { channel } } = member;

		const queue = musicQueue.get(guild.id);

		if (!queue?.playing) return warning("Nothing is playing now");
		if (queue.list.length === 0) return warning("There is nothing to skip");
		if (!channel) return warning("You must be in a voice channel to skip");
		if (channel != queue.voiceChannel) return warning("You must be in the same voice channel to skip");
		
		if (!volume) return regular(`The current volume is ${queue.volume * 100}%`);

		const isOverdrive = volume > 100;
		if (volume < 1 || isOverdrive && !await hasAccess(member, Access.Moderator)) return warning("Volume must be a number between 1 and 100");
	
		queue.volume = isOverdrive ? 1 : volume * 0.01;
		queue.resource?.volume?.setVolumeLogarithmic(volume * 0.01 * 0.5);

		return (isOverdrive ? warning : success)("Volume changed!", `Set ${isOverdrive ? "overdrive " : ""}volume to ${volume}%`);
	}
}
