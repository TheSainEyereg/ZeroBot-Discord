const { MessageEmbed } = require("discord.js");
const Messages = require("../../core/Messages");

module.exports = {
	name: "queue",
	description: "Music queue",
	aliases: ["q"],
	execute(message, args) {
		const queue = message.client.queue.get(message.guild.id);
		if (!queue) return Messages.warning(message, "There is nothing playing now!");
		if (queue.list.length === 0) return Messages.warning(message, "Queue is empty!");

		const max = 15
		const queueList = Array.from(queue.list)//.reverse();
		const list = [];
		let totalDuration = 0; 
		for (let i = 0; i < (queueList.length > max ? max : queueList.length); i++) {
			const song = queueList[i];
			totalDuration+=song.duration;
			const du = {
				hours: Math.floor(song.duration/(60*60)),
				minutes: Math.floor((song.duration/60) % 60),
				seconds: Math.floor(song.duration % 60)
			}
			list.push(`${i == 0 ? ":arrow_forward:" : `**${i}.**`} **${song.title}** \`${("0"+du.hours).slice(-2)}:${("0"+du.minutes).slice(-2)}:${("0"+du.seconds).slice(-2)}\``);
		}
		const du = {
			hours: Math.floor(totalDuration/(60*60)),
			minutes: Math.floor((totalDuration/60) % 60),
			seconds: Math.floor(totalDuration % 60)
		}
		message.channel.send({embeds: [
			new MessageEmbed({
				color: Messages.colors.regular,
				title: "Music queue",
				description: list.join("\n") + (queueList.length > max ? `\n\n__**And ${queueList.length-max} more...**__` : ""),
				footer:	{
					text: `Total songs: ${queueList.length} | Total duration: ${("0"+du.hours).slice(-2)}:${("0"+du.minutes).slice(-2)}:${("0"+du.seconds).slice(-2)}`
				}
			})
		]})
	}
}