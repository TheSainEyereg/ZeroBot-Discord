const Messages = require("../../components/Messages");
const Servers = require("../../components/Servers");
const Permissions = require("../../components/Permissions.js");

module.exports = {
	name: "volume",
	optional: true,
	aliases: ["vol", "v"],
	execute(message, args) {
		const l = Localization.server(message.client, message.guild, this.name);
		const queue = message.client.queue.get(message.guild.id);
		const {channel} = message.member.voice;
		if (!queue?.playing) return Messages.warning(message, l.nothing);
		if (!channel) return Messages.warning(message, l.join_warn);
		if (channel != queue.voiceChannel) return Messages.warning(message, l.channel_warn);

		if (!args[0]) return Messages.regular(message, `${l.current} **${queue.volume * 100}**`);

		const volume = parseInt(args[0]) / 100;

		if (!volume) return Messages.warning(message, l.number_warn);
		if (volume<0.01) return Messages.warning(message, l.small_warn);

		const overdrive = volume > 1 && Permissions.has(message, "superuser");
		
		if (volume>1 && !overdrive) return Messages.warning(message, l.big_warn);
		if (volume>10 && overdrive) return Messages.warning(message, l.ovrdrive_max_warn);

		queue.resource.volume.setVolumeLogarithmic(volume * 0.5);
		queue.volume = volume;
		if (!overdrive) Servers.set(message.guild.id, "musicVolume", volume);
		Messages[!overdrive ? "success" : "warning"](message, `${l.set[0]} ${overdrive?"overdrive ":""} ${l.set[1]} **${volume*100}**`);
	}
}