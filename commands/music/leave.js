const Messages = require("../../core/Messages");
const {getVoiceConnection, VoiceConnectionStatus} = require("@discordjs/voice");

module.exports = {
	name: "leave",
	aliases: ["l"],
	execute(message, args) {
		const l = Localization.server(message.client, message.guild, this.name);
		const queue = message.client.queue.get(message.guild.id);
		const {channel} = message.member.voice;
		const connection = getVoiceConnection(message.guild.id);
		if (connection?.state.status != VoiceConnectionStatus.Ready) return Messages.warning(message, l.not_in);
		if (!channel) return Messages.warning(message, l.join_warn);
		if (channel != queue.voiceChannel) return Messages.warning(message, l.channel_warn);
		
		// try {
		// 	queue.player.stop();
		// } catch (e) {}

		connection.destroy();
		message.client.queue.delete(message.guild.id);
	}
}