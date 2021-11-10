const Messages = require("../../core/Messages");

module.exports = {
    name: "skip",
    description: "Skips music",
    aliases: ["s"],
    execute(message, args) {
        const queue = message.client.queue.get(message.guild.id);
        const {channel} = message.member.voice;
        if (!queue) return Messages.warning(message, "There is nothing playing now!");
        if (!channel) return Messages.warning(message, "You are not in the voice channel!");
        if (channel != queue.voiceChannel) return Messages.warning(message, "You are in the wrong voice channel!");
        try {
            const old = queue.list[0].title;
            if (queue.loop == "song") queue.list.shift();
            queue.player.stop();
            Messages.success(message, `Skipped \`${old}\`!`);
        } catch (e) {
            Messages.critical(message, `Skip error!\n\`${e}\``);
            message.client.queue.delete(message.guild.id);
            console.error(e);
        }
    }
}