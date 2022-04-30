const { MessageEmbed } = require("discord.js");
const Localization = require("../../core/Localization");
const Messages = require("../../core/Messages");

module.exports = {
	name: "queue",
	aliases: ["q"],
	optionsl: true,
	execute(message, args) {
		const l = Localization.server(message.client, message.guild, this.name);
		const queue = message.client.queue.get(message.guild.id);
		if (!queue) return Messages.warning(message, l.nothing);
		if (queue.list.length === 0) return Messages.warning(message, l.empty);

		function getDuration(seconds) {
			return {
				hours: Math.floor(seconds/(60*60)),
				minutes: Math.floor((seconds/60) % 60),
				seconds: Math.floor(seconds % 60)
			}
		}
		function getDurationString(seconds) {
			const duration = getDuration(seconds);
			return `${("0" + duration.hours).slice(-2)}:${("0" + duration.minutes).slice(-2)}:${("0" + duration.seconds).slice(-2)}`;
		}

		const max = 15
		const queueList = Array.from(queue.list)//.reverse();
		
		const list = [];
		
		for (let i = 0; i < (queueList.length > max ? max : queueList.length); i++) {
			const song = queueList[i];
			list.push(`${i == 0 ? ":arrow_forward:" : `**${i}.**`} **${song.title}** \`${getDurationString(song.duration)}\``);
		}
		
		const totalDuration = queueList.map(e => e.duration).reduce((a,b) => a + b);

		message.channel.send({embeds: [
			new MessageEmbed({
				color: Messages.colors.regular,
				title: l.queue,
				description: list.join("\n") + (queueList.length > max ? `\n\n__**${l.and_more[0]} ${queueList.length-max} ${l.and_more[1]}**__` : ""),
				footer:	{
					text: `${l.total_s} ${queueList.length} | ${l.total_d} ${getDurationString(totalDuration)} | ${queue.loop ? l["looping_"+queue.loop] : l.looping_disabled}`
				}
			})
		]})
	}
}