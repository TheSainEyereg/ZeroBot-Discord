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
				title: l.queue,
				description: list.join("\n") + (queueList.length > max ? `\n\n__**${l.and_more[0]} ${queueList.length-max} ${l.and_more[1]}**__` : ""),
				footer:	{
					text: `${l.total_s} ${queueList.length} | ${l.total_d} ${("0"+du.hours).slice(-2)}:${("0"+du.minutes).slice(-2)}:${("0"+du.seconds).slice(-2)} | ${queue.loop ? l["looping_"+queue.loop] : l.looping_disabled}`
				}
			})
		]})
	}
}