const Logs = require("../../core/Logs");
const Messages = require("../../core/Messages");
const Servers = require("../../core/Servers");

module.exports = {
	name: "djs",
	aliases: ["dj", "DJ"],
    access: "administrator",
	execute(message, args) {
		const l = Localization.server(message.client, message.guild, this.name);
		const djs = Servers.get(message.guild.id, "djs");
        const user = message.mentions.users.first();

		switch (args[0]) {
			case "enable":
				Servers.set(message.guild.id, "dj", true);
				Logs.regular(__filename, `User ${message.author.id} (${message.author.tag}) enabled DJs list for server ${message.guild.id}`);
				Messages.complete(message, l.enabled);
				break;

			case "disable":
				Servers.set(message.guild.id, "dj", false);
				Logs.regular(__filename, `User ${message.author.id} (${message.author.tag}) disabled DJs list for server ${message.guild.id}`);
				Messages.complete(message, l.disabled);
				break;

			case "add":
				if (!user) return Messages.critical(message, l.not_found);
				if (djs.includes(user.id)) return Messages.warning(message, l.already_in);
				djs.push(user.id);
				Logs.regular(__filename, `User ${message.author.id} (${message.author.tag}) added ${user.id} (${user.tag}) to DJs list for server ${message.guild.id}`);
				Messages.complete(message, `${l.added[0]} ${user} ${l.added[1]}`);
				break;
		
			case "remove":
				if (!user) return Messages.critical(message, l.not_found);
				if (!djs.includes(user.id)) return Messages.warning(message, l.not_in);
				const mod = djs.indexOf(user.id);
				djs.splice(mod, 1);
				Logs.regular(__filename, `User ${message.author.id} (${message.author.tag}) removed ${user.id} (${user.tag}) from DJs list for server ${message.guild.id}`);
				Messages.complete(message, `${l.removed[0]} ${user} ${l.removed[1]}`);
				break;

			default:
				Messages.warning(message, l.warn);
				break;
		}

		Servers.set(message.guild.id, "djs", djs);
	}
};
