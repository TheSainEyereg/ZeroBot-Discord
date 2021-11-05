const Messages = require("../../core/Messages");

module.exports = {
    name: "stop",
    description: "Stops music",
    aliases: ["stp"],
    execute(message, args) {
        const queue = message.client.queue.get(message.guild.id);
        const {channel} = message.member.voice;
        if (!queue) return Messages.warning(message, "There is nothing playing now!");
        if (!channel) return Messages.warning(message, "You are not in the voice channel!");
        if (channel != queue.voiceChannel) return Messages.warning(message, "You are in the wrong voice channel!");
        queue.list = [];
        try {
            queue.player.stop();
            Messages.success(message, `Stopped music playback!`);
        } catch (e) {
            Messages.critical(message, `Stop error!\n\`${e}\``);
            message.client.queue.delete(message.guild.id);
            console.error(e);
        }
    }
}