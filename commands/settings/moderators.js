const Logs = require("../../core/Logs");
const Messages = require("../../core/Messages");
const Servers = require("../../core/Servers");

module.exports = {
	name: "moderators",
	aliases: ["moderator", "mods"],
	description: "Add/remove moderator",
    arguments: ["add/remove", "[user mention]"],
    access: "administartor",
	async execute(message, args) {
		const moderators = Servers.get(message.guild.id, "moderators");
        const user = message.mentions.users.first();
		if (!user) return Messages.critical(message, "User was not found!");

		switch (args[0]) {
			case "add":
				if (moderators.includes(user.id)) return Messages.warning(message, "User already is a moderator!");
				moderators.push(user.id);
				Logs.regular(__filename, `User ${message.author.id} (${message.author.tag}) added ${user.id} (${user.tag}) to moderators list for server ${message.guild.id}`);
				Messages.complete(message, `Added ${user} to list`);
				break;
		
			case "remove":
				if (!moderators.includes(user.id)) return Messages.warning(message, "User is not a moderator!");
				const mod = moderators.indexOf(user.id);
				moderators.splice(mod, 1);
				Logs.regular(__filename, `User ${message.author.id} (${message.author.tag}) removed ${user.id} (${user.tag}) from moderators list for server ${message.guild.id}`);
				Messages.complete(message, `Removed ${user} from list`);
				break;

			default:
				Messages.warning(message, "Please provide \"add\" or \"remove\" operators!");
				break;
		}

		Servers.set(message.guild.id, "moderators", moderators);
	}
};