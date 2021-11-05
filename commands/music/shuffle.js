const Messages = require("../../core/Messages");

module.exports = {
	name: "shuffle",
	aliases: ["shuf"],
	description: "Shuffles the current queue.",
	execute(message, args) {
		const queue = message.client.queue.get(message.guild.id);
        const {channel} = message.member.voice;
		if (!queue) return Messages.warning(message, "There is nothing playing.");
		if (queue.list.length === 0) return Messages.warning(message, "There is nothing in the queue.");
		if (!channel) return Messages.warning(message, "You are not in a voice channel.");
		if (channel !== queue.voiceChannel) return Messages.warning(message, "You are not in the same voice channel as the bot.");

		// shuffle queue arrray
		queue.list = queue.list.sort(() => Math.random() - 0.5);
		Messages.success(message, "The queue has been shuffled.");
	}
};