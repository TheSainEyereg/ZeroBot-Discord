const Localization = require("../../core/Localization");
const Logs = require("../../core/Logs");
const Messages = require("../../core/Messages");
const Servers = require("../../core/Servers");

module.exports = {
	name: "logs",
	aliases: ["log", "log-channel"],
	description: "Changes log channel",
    arguments: ["[channel]"],
	optional: true,
    access: "administrator",
	execute(message, args) {
		const l = Localization.server(message.client, message.guild, this.name);
		if (!args[0]) return Servers.get(message.guild.id, "logs") ? Messages.regular(message, `${l.current} <#${Servers.get(message.guild.id, "logs")}>`) : Messages.warning(message, l.not_setup)
		const channel = message.mentions.channels.first() || message.guild.channels.cache.find(c => c.name === args[0]);
        if (!channel) return Messages.warning(message, l.not_found);
		Servers.set(message.guild.id, "logs", channel.id);
        Logs.regular(__filename, `User ${message.author.id} (${message.author.tag}) changed log channel for server ${message.guild.id} to "${channel.id}" (${channel.name})`);
        Messages.complete(message, `${l.changed} ${channel}`);
	}
};
