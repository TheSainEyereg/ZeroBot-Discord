const Messages = require("../../core/Messages");

module.exports = {
	name: "loop",
	aliases: ["repeat"],
	description: "Loop the current song.",
	execute(message, args) {
        const queue = message.client.queue.get(message.guild.id);
        const {channel} = message.member.voice;
        if (!queue) return Messages.warning(message, "There is nothing playing that I could loop.");
		if (!channel) return Messages.warning(message, "You need to be in a voice channel to use that command.");
		if (channel != queue.voiceChannel) return Messages.warning(message, "You need to be in the same voice channel as the bot to use that command.");
		if (queue.list.length === 0) return Messages.warning(message, "There are no songs in the queue to loop.");

		if (!queue.loop) {
			queue.loop = 1
			Messages.success(message, "Started looping the queue.");
		} else if (queue.loop === 1) {
			queue.loop = 2
			Messages.success(message, "Looping the current song.");
		} else if (queue.loop === 2) {
			queue.loop = 0
			Messages.success(message, "Looping is now disabled.");
		}
	}
}