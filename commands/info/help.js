const fs = require("fs")
const Messages = require("../../core/Messages");
const Permissions = require("../../core/Permissions");

module.exports = {
	name: "help",
	aliases: ["?", "commands", "cmds", "list", "ls"],
	description: "Displays list of commands",
	arguments: ["(category)"],
    optional: true,
	execute(message, args) {
        const {ignore, hide, suOnly, adminsOnly, modsOnly} = require("../config.json");
		const out = [];
		category = args[0];
		if (category) category = category.replace(/\\|\//g,"");
		if (!category) {
			for (const folder of fs.readdirSync(`./commands`)) {
                if (fs.lstatSync(`./commands/${folder}`).isFile()) continue;
                if (ignore.includes(folder)) continue;
                if (hide.includes(folder)) continue;

                if (suOnly.includes(folder) && !Permissions.has(message, "superuser")) continue;
                if (adminsOnly.includes(folder) && !Permissions.has(message, "administrator")) continue;
                if (modsOnly.includes(folder) && !Permissions.has(message, "moderator")) continue;

                out.push(`**${folder}**\n`);
            }
			return Messages.advanced(message, "Categories:", out.join(""), {custom: `Type ${Servers.get(message.guild.id, "prefix")}help (category) for category commands.`});
		}

        if (
            (suOnly.includes(category) && !Permissions.has(message, "superuser")) ||
            (adminsOnly.includes(category) && !Permissions.has(message, "administrator")) ||
            (modsOnly.includes(category) && !Permissions.has(message, "moderator"))
        ) {
            Logs.security(__filename, `User ${message.author.id} (Ranks [${Permissions.get(message).join(", ")}]) tried to view category "${category}" when it requires higher rank.`);
            return Messages.warning(message, `You do not have access to category \`${category}\``);
        }

		try {
			for (const file of fs.readdirSync(`./commands/${category}`)) {
				const cmd = require(`../${category}/${file}`);
				out.push(`**${Servers.get(message.guild.id, "prefix")}${cmd.name}** ${cmd.arguments ? `\`${cmd.arguments.join("\` \`")}\``: ""} — ${cmd.description}\n`);
			}
			Messages.advanced(message, `Commands of \`${category}\`:`, out.join(""));
		} catch (e) {
			Messages.warning(message, `Category \`${category}\` not found!`);
		}
	}
};