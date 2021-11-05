const Logs = require("../../core/Logs");
const Messages = require("../../core/Messages");
const Servers = require("../../core/Servers");
const Localization = require("../../core/Localization")

module.exports = {
	name: "moderators",
	aliases: ["moderator", "mods"],
    access: "administrator",
	execute(message, args) {
		const l = Localization.server(message.client, message.guild, this.name);
		const moderators = Servers.get(message.guild.id, "moderators");
        const user = message.mentions.users.first();
		if (!user) return Messages.critical(message, l.not_found);

		switch (args[0]) {
			case "add":
				if (moderators.includes(user.id)) return Messages.warning(message, l.already_in);
				moderators.push(user.id);
				Logs.regular(__filename, `User ${message.author.id} (${message.author.tag}) added ${user.id} (${user.tag}) to moderators list for server ${message.guild.id}`);
				Messages.success(message, `${l.added[0]} ${user} ${l.added[1]}`);
				break;
		
			case "remove":
				if (!moderators.includes(user.id)) return Messages.warning(message, l.not_in);
				const mod = moderators.indexOf(user.id);
				moderators.splice(mod, 1);
				Logs.regular(__filename, `User ${message.author.id} (${message.author.tag}) removed ${user.id} (${user.tag}) from moderators list for server ${message.guild.id}`);
				Messages.success(message, `${l.removed[0]} ${user} ${l.removed[1]}`);
				break;

			default:
				Messages.warning(message, l.warn);
				break;
		}

		Servers.set(message.guild.id, "moderators", moderators);
	}
};
