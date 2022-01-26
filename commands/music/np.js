const { MessageEmbed } = require("discord.js");
const Messages = require("../../core/Messages");

module.exports = {
	name: "np",
	aliases: ["now"],
	execute(message, args) {
		const l = Localization.server(message.client, message.guild, this.name);
		const queue = message.client.queue.get(message.guild.id);
		if (!queue) return Messages.warning(message, l.nothing);

		const song = queue.list[0];
		const du = {
			hours: Math.floor(song.duration/(60*60)),
			minutes: Math.floor((song.duration/60) % 60),
			seconds: Math.floor(song.duration % 60)
		}
		message.channel.send({embeds: [
			new MessageEmbed({
				color: Messages.colors.regular,
				thumbnail: {
					url:song.thumbnail
				},
				title: song.title,
				url: song.url,
				description: `${l.duration} \`${("0"+du.hours).slice(-2)}:${("0"+du.minutes).slice(-2)}:${("0"+du.seconds).slice(-2)}\`\n${l.source} ${song.service}`,
				footer: {
					text: `${l.requested} ${song.requested.tag}`,
					iconURL: song.requested.displayAvatarURL({ format: "png", size: 256 })
				}
			})
		]});
	}
}