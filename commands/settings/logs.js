const Logs = require("../../core/Logs");
const Messages = require("../../core/Messages");
const Servers = require("../../core/Servers");

module.exports = {
	name: "logs",
	aliases: ["log", "log-channel"],
	description: "Changes log channel",
    arguments: ["[channel]"],
	optional: true,
    access: "administartor",
	async execute(message, args) {
		if (!args[0]) return Messages.regular(message, `Current log channel is <#${Servers.get(message.guild.id, "logs")}>`);
		const channel = message.mentions.channels.first() || message.guild.channels.cache.find(c => c.name === args[0]);
        if (!channel) return Messages.warning(message, "No channel was found!");
		Servers.set(message.guild.id, "logs", channel.id);
        Logs.regular(__filename, `User ${message.author.id} (${message.author.tag}) changed log channel for server ${message.guild.id} to "${channel.id}" (${channel.name})`);
        Messages.complete(message, `Successfuly changed log channel to "${channel.name}"`);
	}
};