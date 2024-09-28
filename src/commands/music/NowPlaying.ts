import Command from "../../Command";
import {
	type Message,
	type ChatInputCommandInteraction,
	SlashCommandBuilder,
	GuildMember,
	EmbedBuilder,
	escapeMarkdown,
} from "discord.js";
import { Access, Colors } from "../../enums";
import { warning } from "../../utils/messages";

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
		interaction.reply({ embeds: [this.now(interaction.member as GuildMember)] });
	};

	executePrefix = async (message: Message) => {
		message.reply({ embeds: [this.now(message.member as GuildMember)] });
	};

	private getDuration = (seconds: number) => ({
		hours: Math.floor(seconds/(60*60)),
		minutes: Math.floor((seconds/60) % 60),
		seconds: Math.floor(seconds % 60)
	});

	private getDurationString = (seconds: number) => {
		const duration = this.getDuration(seconds);
		return `${duration.hours ? `${duration.hours.toString().padStart(2, "0")}:` : ""}${duration.minutes.toString().padStart(2, "0")}:${duration.seconds.toString().padStart(2, "0")}`;
	};

	private now(member: GuildMember) {
		const { client: { musicQueue }, guild } = member;

		const queue = musicQueue.get(guild.id);

		if (!queue?.playing || queue.list.length === 0) return warning("Nothing is playing now");

		const song = queue.list[0];

		const full = this.getDurationString(song.duration);
		const pos = this.getDurationString((queue.paused ? queue.trackTime : Date.now() - queue.startTime) / 1000);

		return new EmbedBuilder({
			color: Colors.Regular,
			thumbnail: {
				url: song.thumbnailUrl
			},
			title: escapeMarkdown(song.title),
			url: song.url,
			description: `Duration: \`${pos}\`${song.duration ? `/\`${full}\`` : ""}`
				+ `\nSource: ${song.service}`,
			footer: {
				text: `Requested by ${song.requestedBy.displayName}`,
				iconURL: song.requestedBy.displayAvatarURL({ size: 256 })
			}
		});
	}
}
