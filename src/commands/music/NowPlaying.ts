import Command from "../../Command";
import {
	type Message,
	type ChatInputCommandInteraction,
	SlashCommandBuilder,
	GuildMember,
	EmbedBuilder,
} from "discord.js";
import { Access, Colors } from "../../components/enums";
import { warning } from "../../components/messages";

export default class NowPlaying extends Command {
	name = "nowplaying";
	description = "Displays current song";
	aliases = ["np", "now"];
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
		const { client: { musicQueue }, guild } = member;

		const queue = musicQueue.get(guild.id);

		if (!queue?.playing || queue.list.length === 0) return warning("Nothing is playing now");

		const song = queue.list[0];
		const du = {
			hours: Math.floor(song.duration/(60*60)),
			minutes: Math.floor((song.duration/60) % 60),
			seconds: Math.floor(song.duration % 60)
		};

		return new EmbedBuilder({
			color: Colors.Regular,
			thumbnail: {
				url: song.thumbnailUrl
			},
			title: song.title,
			url: song.url,
			description: `Duration: \`${("0"+du.hours).slice(-2)}:${("0"+du.minutes).slice(-2)}:${("0"+du.seconds).slice(-2)}\`\nSource: ${song.service}`,
			footer: {
				text: `Requested by ${song.requestedBy.displayName}`,
				iconURL: song.requestedBy.displayAvatarURL({ size: 256 })
			}
		});
	}
}
