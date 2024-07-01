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
		interaction.reply({ embeds: [this.now(interaction.member as GuildMember)] });
	};

	executePrefix = async (message: Message) => {
		message.reply({ embeds: [this.now(message.member as GuildMember)] });
	};

	private now(member: GuildMember) {
		const { client: { musicQueue }, guild } = member;

		const queue = musicQueue.get(guild.id);

		if (!queue?.playing || queue.list.length === 0) return warning("Nothing is playing now");

		const song = queue.list[0];
		const splitTime = (time: number) => ({
			hours: Math.floor(time/(60*60)),
			minutes: Math.floor((time/60) % 60),
			seconds: Math.floor(time % 60)
		});

		const du = splitTime(song.duration);
		const pr = splitTime((Date.now() - queue.startTime) / 1000);

		return new EmbedBuilder({
			color: Colors.Regular,
			thumbnail: {
				url: song.thumbnailUrl
			},
			title: escapeMarkdown(song.title),
			url: song.url,
			description: `Duration: \`${du.hours ? `${pr.hours.toString().padStart(2, "0")}:` : ""}${pr.minutes.toString().padStart(2, "0")}:${pr.seconds.toString().padStart(2, "0")}\`${song.duration ? `/\`${du.hours ? `${du.hours.toString().padStart(2, "0")}:` : ""}${du.minutes.toString().padStart(2, "0")}:${du.seconds.toString().padStart(2, "0")}\`` : ""}`
				+ `\nSource: ${song.service}`,
			footer: {
				text: `Requested by ${song.requestedBy.displayName}`,
				iconURL: song.requestedBy.displayAvatarURL({ size: 256 })
			}
		});
	}
}
