const Localization = require("../../core/Localization");
const Logs = require("../../core/Logs");
const Messages = require("../../core/Messages");
const Servers = require("../../core/Servers");

module.exports = {
	name: "logs",
	aliases: ["log", "log-channel"],
	optional: true,
	access: "administrator",
	execute(message, args) {
		const l = Localization.server(message.client, message.guild, this.name);
		if (!args[0]) return Servers.get(message.guild.id, "logsChannel") ? Messages.regular(message, `${l.current} <#${Servers.get(message.guild.id, "logsChannel")}>`) : Messages.warning(message, l.not_setup)
		const channel = message.mentions.channels.first() || message.guild.channels.cache.find(c => c.name === args[0]);
		if (!channel) return Messages.warning(message, l.not_found);
		Servers.set(message.guild.id, "logsChannel", channel.id);
		Logs.regular(`${this.name} command`, `User ${message.author.id} (${message.author.tag}) changed log channel for server ${message.guild.id} to "${channel.id}" (${channel.name})`);
		Messages.success(message, `${l.changed} ${channel}`);
	}
};
