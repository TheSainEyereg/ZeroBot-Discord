const Messages = require("../../core/Messages");

module.exports = {
	name: "shuffle",
	aliases: ["shuff", "shuf"],
	execute(message, args) {
		const l = Localization.server(message.client, message.guild, this.name);
		const queue = message.client.queue.get(message.guild.id);
		const {channel} = message.member.voice;
		if (!queue) return Messages.warning(message, l.nothing);
		if (queue.list.length === 0) return Messages.warning(message, l.empty_warn);
		if (!channel) return Messages.warning(message, l.join_warn);
		if (channel !== queue.voiceChannel) return Messages.warning(message, l.channel_warn);

		// shuffle queue arrray excluding current song which is at index 0
		queue.list = [...queue.list.slice(0, 1), ...queue.list.slice(1).sort(() => Math.random() - 0.5)];	

		Messages.success(message, l.shuffled);
	}
};