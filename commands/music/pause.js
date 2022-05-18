const Messages = require("../../components/Messages");

module.exports = {
	name: "pause",
	execute(message, args) {
		const l = Localization.server(message.client, message.guild, this.name);
		const queue = message.client.queue.get(message.guild.id);
		const {channel} = message.member.voice;
		if (!queue?.playing) return Messages.warning(message, l.nothing);
		if (!channel) return Messages.warning(message, l.join_warn);
		if (channel !== queue.voiceChannel) return Messages.warning(message, l.channel_warn);

		if (queue.paused) return Messages.warning(message, l.already_paused);

		try {
			queue.player.pause();
			queue.paused = true;
			Messages.success(message, l.paused);
		} catch (e) {
			Messages.critical(message, `${l.error}\n\`${e}\``);
			queue.clear();
			console.error(e);
		}
	}
}