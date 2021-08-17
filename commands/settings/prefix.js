const Logs = require("../../core/Logs");
const Messages = require("../../core/Messages");
const Servers = require("../../core/Servers");

module.exports = {
	name: "prefix",
	aliases: ["pref"],
	description: "Changes prefix",
    arguments: ["[prefix]"],
    access: "administrator",
	execute(message, args) {
		if (args[0].length > 3) return Messages.warning(message,"Max prefix length is 3!");
        Servers.set(message.guild.id, "prefix", args[0]);
        Logs.regular(__filename, `User ${message.author.id} (${message.author.tag}) changed prefix for server ${message.guild.id} to "${args[0]}"`);
        Messages.complete(message, `Successfuly changed prefix to "${args[0]}"`);
	}
};
