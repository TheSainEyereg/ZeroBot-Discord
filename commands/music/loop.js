const Messages = require("../../components/Messages");

module.exports = {
	name: "loop",
	aliases: ["repeat"],
	optional: true,
	execute(message, args) {
		const l = Localization.server(message.client, message.guild, this.name);
		const queue = message.client.queue.get(message.guild.id);
		const {channel} = message.member.voice;
		if (!queue) return Messages.warning(message, l.nothing);
		if (!channel) return Messages.warning(message, l.join_warn);
		if (channel !== queue.voiceChannel) return Messages.warning(message, l.channel_warn);
		if (queue.list.length === 0) return Messages.warning(message, l.empty_warn);

		if (args[0] === "queue" || args[0] === "q") {
			if (queue.loop === "queue") return Messages.warning(message, l.queue_warn);
			queue.loop = "queue";
			return Messages.success(message, l.loop);
		} else if (args[0] === "song" || args[0] === "s") {
			if (queue.loop === "song") return Messages.warning(message, l.song_warn);
			queue.loop = "song";
			return Messages.success(message, l.song);
		} else if (args[0] === "off" || args[0] === "false") {
			if (!queue.loop) return Messages.warning(message, l.off_warn);
			queue.loop = false;
			return Messages.success(message, l.off);
		} else {
			if (!queue.loop) {
				queue.loop = "queue";
				Messages.success(message, l.switch_queue);
			} else if (queue.loop === "queue") {
				queue.loop = "song"
				Messages.success(message, l.switch_song);
			} else if (queue.loop === "song") {
				queue.loop = false;
				Messages.success(message, l.off);
			}
		}
	}
}