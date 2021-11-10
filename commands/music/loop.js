const Messages = require("../../core/Messages");

module.exports = {
	name: "loop",
	description: "Loop the current song.",
	aliases: ["repeat"],
	arguments: ["(song | queue | off)"],
	optional: true,
	execute(message, args) {
        const queue = message.client.queue.get(message.guild.id);
        const {channel} = message.member.voice;
        if (!queue) return Messages.warning(message, "There is nothing playing that I could loop.");
		if (!channel) return Messages.warning(message, "You need to be in a voice channel to use that command.");
		if (channel != queue.voiceChannel) return Messages.warning(message, "You need to be in the same voice channel as the bot to use that command.");
		if (queue.list.length === 0) return Messages.warning(message, "There are no songs in the queue to loop.");

		if (args[0] === "queue" || args[0] === "q") {
			if (queue.loop === "queue") return Messages.warning(message, "The queue loop is already enabled.");
			queue.loop = "queue";
			return Messages.success(message, "The queue loop has been enabled.");
		} else if (args[0] === "song" || args[0] === "s") {
			if (queue.loop === "song") return Messages.warning(message, "The song loop is already enabled.");
			queue.loop = "song";
			return Messages.success(message, "The song loop has been enabled.");
		} else if (args[0] === "off" || args[0] === "false") {
			if (!queue.loop) return Messages.warning(message, "The loop is already disabled.");
			queue.loop = false;
			return Messages.success(message, "The loop has been disabled.");
		} else {
			if (!queue.loop) {
				queue.loop = "queue";
				Messages.success(message, "Started looping the queue.");
			} else if (queue.loop === "queue") {
				queue.loop = "song"
				Messages.success(message, "Looping the current song.");
			} else if (queue.loop === "song") {
				queue.loop = false;
				Messages.success(message, "Looping is now disabled.");
			}
		}
	}
}