const Messages = require("../../core/Messages");
const {getVoiceConnection} = require("@discordjs/voice");

module.exports = {
    name: "leave",
    description: "Leave from music channel",
    aliases: ["l"],
    execute(message, args) {
        const queue = message.client.queue.get(message.guild.id);
        const {channel} = message.member.voice;
        const connection = getVoiceConnection(message.guild.id);
        if (connection?.state.status != "ready") return Messages.warning(message, "I'm not in the voice channel!");
        if (!channel) return Messages.warning(message, "You are not in the voice channel!");
        if (channel != queue.voiceChannel) return Messages.warning(message, "You are in the wrong voice channel!");
        
        connection.destroy();
        message.client.queue.delete(message.guild.id);
    }
}