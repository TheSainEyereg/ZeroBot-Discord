const Messages = require("../../components/Messages");
const {
	getVoiceConnection,
	VoiceConnectionStatus,
	joinVoiceChannel,
	entersState,
	VoiceConnectionDisconnectReason
} = require("@discordjs/voice");

module.exports = {
	name: "resume",
	aliases: ["r", "unpause"],
	async execute(message, args) {
		const l = Localization.server(message.client, message.guild, this.name);
		const queue = message.client.queue.get(message.guild.id);
		const {channel} = message.member.voice;
		const connection = getVoiceConnection(message.guild.id);

		if (!queue?.playing) return Messages.warning(message, l.nothing);
		if (!channel) return Messages.warning(message, l.join_warn);
		
		if ((connection?.state.status === VoiceConnectionStatus.Ready) && (channel !== queue.voiceChannel)) return Messages.warning(message, l.channel_warn);

		async function joinChannel(channel) {
			if (getVoiceConnection(message.guild.id)?.state.status === VoiceConnectionStatus.Ready) return getVoiceConnection(message.guild.id);

			const connection = joinVoiceChannel({
				channelId: channel.id,
				guildId: channel.guild.id,
				adapterCreator: channel.guild.voiceAdapterCreator,
			});
			try {
				await entersState(connection, VoiceConnectionStatus.Ready, 30_000);
				connection.on("stateChange", async (_, newState) => {
					if (newState.status === VoiceConnectionStatus.Disconnected) {
						if (newState.reason === VoiceConnectionDisconnectReason.WebSocketClose && newState.closeCode === 4014) {
							try {
								await entersState(connection, VoiceConnectionStatus.Connecting, 5_000);
							} catch {
								connection.destroy();
								queue.clear();
							}
						} else if (connection.rejoinAttempts < 5) {
							await wait((connection.rejoinAttempts + 1) * 5_000);
							connection.rejoin();
						} else {
							connection.destroy();
							if (!queue.paused) queue.clear();
						}

						const newChannelId = newState.subscription?.connection?.joinConfig?.channelId;
						if (queue && (newChannelId !== queue.voiceChannel.id)) queue.voiceChannel =  message.guild.channels.cache.get(newChannelId);
					}
				});
				return connection;
			} catch (error) {
				connection.destroy();
				queue.clear();
				throw error;
			}
		}

		if (!queue.paused) return Messages.warning(message, l.already_resumed);

		try {
			queue.connection = await joinChannel(channel);
			queue.voiceChannel = channel;
			queue.player.unpause();
			queue.paused = false;
			Messages.success(message, l.resumed);
		} catch (e) {
			Messages.critical(message, `${l.error}\n\`${e}\``);
			queue.clear();
			console.error(e);
		}
	}
}