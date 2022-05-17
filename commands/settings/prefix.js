const Localization = require("../../components/Localization");
const Logs = require("../../components/Logs");
const Messages = require("../../components/Messages");
const Servers = require("../../components/Servers");

module.exports = {
	name: "prefix",
	aliases: ["pref"],
	access: "administrator",
	execute(message, args) {
		const l = Localization.server(message.client, message.guild, this.name);
		if (args[0].length > 3) return Messages.warning(message,l.max_warn);
		Servers.set(message.guild.id, "prefix", args[0]);
		Logs.regular(`${this.name} command`, `User ${message.author.id} (${message.author.tag}) changed prefix for server ${message.guild.id} to "${args[0]}"`);
		Messages.success(message, `${l.changed} \`${args[0]}\``);
	}
};
