const Messages = require("../../components/Messages");
const Permissions = require("../../components/Permissions");
const Localization = require("../../components/Localization");

module.exports = {
	name: "aliases",
	execute(message, args) {
		const l = Localization.server(message.client, message.guild, this.name);
		const command = message.client.commands.get(args[0]) || message.client.commands.find(cmd => cmd.aliases && cmd.aliases.includes(args[0]));
		if (!command) return Messages.critical(message, l.not_found);
		if (command.access && !Permissions.has(message, command.access)) {
			Logs.security(`${this.name} command`, `User ${message.author.id} (Ranks [${Permissions.get(message).join(", ")}]) tried to list "${command.name}" aliases when it requires higher rank.`);
			return Messages.warning(message, l.prems_warn);
		}
		Messages.advanced(message, 
			`${l.for} \`${command.name}\`:`,
			`**\`${command.aliases.join("\`**\n**\`")}\`**` ,
			{custom:l.alert})
	}
};