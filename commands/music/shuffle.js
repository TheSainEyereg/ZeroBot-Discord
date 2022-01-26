const Messages = require("../../core/Messages");

module.exports = {
	name: "shuffle",
	aliases: ["shuf"],
	execute(message, args) {
		const l = Localization.server(message.client, message.guild, this.name);
		const queue = message.client.queue.get(message.guild.id);
        const {channel} = message.member.voice;
		if (!queue) return Messages.warning(message, l.nothing);
		if (queue.list.length === 0) return Messages.warning(message, l.empty_warn);
		if (!channel) return Messages.warning(message, l.join_warn);
		if (channel !== queue.voiceChannel) return Messages.warning(message, l.channel_warn);

		// shuffle queue arrray
		queue.list = queue.list.sort(() => Math.random() - 0.5);
		Messages.success(message, l.shuffled);
	}
};