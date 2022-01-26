const Messages = require("../../core/Messages");

module.exports = {
    name: "stop",
    aliases: ["stp"],
    execute(message, args) {
		const l = Localization.server(message.client, message.guild, this.name);
        const queue = message.client.queue.get(message.guild.id);
        const {channel} = message.member.voice;
        if (!queue) return Messages.warning(message, l.nothing);
        if (!channel) return Messages.warning(message, l.join_warn);
        if (channel != queue.voiceChannel) return Messages.warning(message, l.channel_warn);
        queue.list = [];
        try {
            queue.player.stop();
            Messages.success(message, l.stopped);
        } catch (e) {
            Messages.critical(message, `${l.error}\n\`${e}\``);
            message.client.queue.delete(message.guild.id);
            console.error(e);
        }
    }
}