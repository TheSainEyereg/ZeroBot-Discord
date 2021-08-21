const Logs = require("../../core/Logs");
const Messages = require("../../core/Messages");
const Servers = require("../../core/Servers");

module.exports = {
	name: "djs",
	aliases: ["dj", "DJ"],
	description: "Enable/disable/add/remove DJs",
    arguments: ["enable/disable or add/remove", "(user mention)"],
    access: "administrator",
	execute(message, args) {
		const djs = Servers.get(message.guild.id, "djs");
        const user = message.mentions.users.first();

		switch (args[0]) {
			case "enable":
				Servers.set(message.guild.id, "dj", true);
				Logs.regular(__filename, `User ${message.author.id} (${message.author.tag}) enabled DJs list for server ${message.guild.id}`);
				Messages.complete(message, `Enabled DJs list`);
				break;

			case "disable":
				Servers.set(message.guild.id, "dj", false);
				Logs.regular(__filename, `User ${message.author.id} (${message.author.tag}) disabled DJs list for server ${message.guild.id}`);
				Messages.complete(message, `Disabled DJs list`);
				break;

			case "add":
				if (!user) return Messages.critical(message, "User was not found!");
				if (djs.includes(user.id)) return Messages.warning(message, "User already is a moderator!");
				djs.push(user.id);
				Logs.regular(__filename, `User ${message.author.id} (${message.author.tag}) added ${user.id} (${user.tag}) to DJs list for server ${message.guild.id}`);
				Messages.complete(message, `Added ${user} to list`);
				break;
		
			case "remove":
				if (!user) return Messages.critical(message, "User was not found!");
				if (!djs.includes(user.id)) return Messages.warning(message, "User is not a moderator!");
				const mod = djs.indexOf(user.id);
				djs.splice(mod, 1);
				Logs.regular(__filename, `User ${message.author.id} (${message.author.tag}) removed ${user.id} (${user.tag}) from DJs list for server ${message.guild.id}`);
				Messages.complete(message, `Removed ${user} from list`);
				break;

			default:
				Messages.warning(message, "Please provide \"add\" or \"remove\" operators!");
				break;
		}

		Servers.set(message.guild.id, "djs", djs);
	}
};
