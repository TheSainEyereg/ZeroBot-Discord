const Messages = require("../../core/Messages");
const Permissions = require("../../core/Permissions");

module.exports = {
	name: "aliases",
	description: "Shows aliases for command",
    arguments: ["command"],
	execute(message, args) {
        const command = message.client.commands.get(args[0]) || message.client.commands.find(cmd => cmd.aliases && cmd.aliases.includes(args[0]));
        if (!command) return Messages.critical(message, "No command for aliases was found!");
        if (command.access && !Permissions.has(message, command.access)) {
            Logs.security(__filename, `User ${message.author.id} (Ranks [${Permissions.get(message).join(", ")}]) tried to list "${command.name}" aliases when it requires higher rank.`);
            return Messages.warning(message, `You have no permission to view aliases for this command!`);
        }
        Messages.advanced(message, 
            `Aliases for \`${command.name}\`:`,
            `**\`${command.aliases.join("\`**\n**\`")}\`**` ,
            {custom:`You can use any alias to execute this command!`})
	}
};