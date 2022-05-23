const Messages = require("../../components/Messages");

module.exports = {
	name: "stop",
	aliases: ["stp"],
	execute(message, args) {
		const l = Localization.server(message.client, message.guild, this.name);
		const queue = message.client.queue.get(message.guild.id);
		const {channel} = message.member.voice;
		if (!queue?.playing) return Messages.warning(message, l.nothing);
		if (queue.list.length === 0) return Messages.warning(message, l.empty_warn);
		if (!channel) return Messages.warning(message, l.join_warn);
		if (channel != queue.voiceChannel) return Messages.warning(message, l.channel_warn);

		try {
			queue.clear(false);
			Messages.success(message, l.stopped);
		} catch (e) {
			Messages.critical(message, `${l.error}\n\`${e}\``);
			console.error(e);
		}
	}
}