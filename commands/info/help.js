const fs = require("fs")
const Messages = require("../../core/Messages");
const Permissions = require("../../core/Permissions");

module.exports = {
	name: "help",
	aliases: ["cmds", "commands", "list"],
	description: "Displays list of commands",
	arguments: ["(category)"],
    optional: true,
	async execute(message, args) {
        const {ignore, hide, suOnly, adminsOnly, modsOnly} = require("../config.json");
        const perms = Permissions.check(message);
		const out = [];
		category = args[0];
		if (category) category = category.replace(/\\|\//g,"");
		if (!category) {
			for (const folder of fs.readdirSync(`./commands`)) {
                if (fs.lstatSync(`./commands/${folder}`).isFile()) continue;
                if (ignore.includes(folder)) continue;
                if (hide.includes(folder)) continue;

                if (suOnly.includes(folder) && !["superuser"].includes(perms)) continue;
                if (adminsOnly.includes(folder) && !["superuser", "administrator"].includes(perms)) continue;
                if (modsOnly.includes(folder) && !["superuser", "administrator", "moderator"].includes(perms)) continue;

                out.push(`**${folder}**\n`);
            }
			return Messages.advanced(message, "Categories:", out.join(""), {custom: `Type ${require("../../config.json").prefix}help (category) for category commands.`});
		}

        if (
            (suOnly.includes(category) && !["superuser"].includes(perms)) ||
            (adminsOnly.includes(category) && !["superuser", "administrator"].includes(perms)) ||
            (modsOnly.includes(category) && !["superuser", "administrator", "moderator"].includes(perms))
        ) {
            Logs.security(__filename, `User ${message.author.id} (Rank "${perms}") tried to view category "${category}" when it requires higher rank.`);
            return Messages.warning(message, `You do not have access to category \`${category}\``);
        }

		try {
			for (const file of fs.readdirSync(`./commands/${category}`)) {
				const cmd = require(`../${category}/${file}`);
				out.push(`**${require("../../config.json").prefix}${cmd.name}** ${cmd.arguments ? `\`${cmd.arguments.join("\` \`")}\``: ""} — ${cmd.description}\n`);
			}
			Messages.advanced(message, `Commands of \`${category}\`:`, out.join(""));
		} catch (e) {
			Messages.warning(message, `Category \`${category}\` not found!`);
		}
	}
};