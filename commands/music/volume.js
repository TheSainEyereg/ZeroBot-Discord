const Messages = require("../../core/Messages");
const Servers = require("../../core/Servers");
const Permissions = require("../../core/Permissions.js");

module.exports = {
    name: "volume",
    description: "Changes music volume",
    arguments: ["volume"],
    optional: true,
    aliases: ["vol"],
    execute(message, args) {
        const queue = message.client.queue.get(message.guild.id);
        const {channel} = message.member.voice;
        if (!queue?.playing) return Messages.warning(message, "There is nothing playing now!");
        if (!channel) return Messages.warning(message, "You are not in the voice channel!");
        if (channel != queue.voiceChannel) return Messages.warning(message, "You are in the wrong voice channel!");

		if (!args[0]) return Messages.regular(message, `The current volume is: **${queue.volume * 100}**`);

        const volume = parseInt(args[0]) / 100;
        const overdrive = args[1] == "overdrive";
		if (!volume) return Messages.warning(message, "This must be number.");
		if (volume<0.01) return Messages.warning(message, `Given volume is too small (min volume is 1)`);
		if (volume>1 && !overdrive) return Messages.warning(message, `Given volume is too big (max volume is 100)`);
		if (overdrive && !Permissions.has(message, "moderator")) return Messages.warning(message, `You should have rank moderator or higher to use overdrive!`);
        if (volume>10 && overdrive) return Messages.warning(message, "Max overdrive volume is 1000");

        queue.resource.volume.setVolumeLogarithmic(volume * 0.5);
        queue.volume = volume;
        if (!overdrive) Servers.set(message.guild.id, "musicVolume", volume);
        Messages[!overdrive ? "complete" : "warning"](message, `Set ${overdrive?"overdrive ":""} volume to **${volume*100}**`);
    }
}