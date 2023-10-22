import Command from "../../Command";
import {
	type Message,
	type ChatInputCommandInteraction,
	SlashCommandBuilder,
	GuildMember,
	EmbedBuilder,
} from "discord.js";
import { Access, Colors } from "../../enums";
import { warning } from "../../components/messages";

const MAX_ITEMS = 15;

export default class Queue extends Command {
	name = "queue";
	description = "Music queue";
	aliases = ["q"];
	args = [];
	access = Access.User;

	data = new SlashCommandBuilder()
		.setName(this.name)
		.setDescription(this.description);

	executeSlash = async (interaction: ChatInputCommandInteraction) => {
		interaction.reply({ embeds: [this.queue(interaction.member as GuildMember)] });
	};

	executePrefix = async (message: Message) => {
		message.reply({ embeds: [this.queue(message.member as GuildMember)] });
	};

	private getDuration = (seconds: number) => ({
		hours: Math.floor(seconds/(60*60)),
		minutes: Math.floor((seconds/60) % 60),
		seconds: Math.floor(seconds % 60)
	});

	private getDurationString(seconds: number) {
		const duration = this.getDuration(seconds);
		return `${("0" + duration.hours).slice(-2)}:${("0" + duration.minutes).slice(-2)}:${("0" + duration.seconds).slice(-2)}`;
	}

	private queue(member: GuildMember) {
		const { client: { musicQueue }, guild } = member;

		const queue = musicQueue.get(guild.id);

		if (!queue) return warning("Nothing is playing now");
		if (queue.list.length === 0) return warning("Queue is empty");

		const queueList = Array.from(queue.list);
		
		const list = queueList.slice(0, MAX_ITEMS).map((song, i) => `${(queue.playing || queue.paused) && i == 0 ? queue.playing ? ":arrow_forward:" : ":pause_button:" : `**${i + 1}.**`} **[${song.title}](${song.url})** \`${this.getDurationString(song.duration)}\` by \`${song.requestedBy.displayName}\``);
		
		const totalDuration = queueList.map(e => e.duration).reduce((a,b) => a + b);

		return new EmbedBuilder({
			color: Colors.Regular,
			title: "Music queue",
			description: list.join("\n") + (queueList.length > MAX_ITEMS ? `\n\n__**And ${queueList.length-MAX_ITEMS} more**__` : ""),
			footer:	{
				text: `Total songs: ${queueList.length} | Total duration: ${this.getDurationString(totalDuration)} | Looping ${queue.loopMode}`,
			}
		});
	}
}
