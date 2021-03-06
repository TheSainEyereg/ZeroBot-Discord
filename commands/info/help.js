const fs = require("fs")
const Messages = require("../../components/Messages");
const Permissions = require("../../components/Permissions");
const Localization = require("../../components/Localization");

module.exports = {
	name: "help",
	aliases: ["?", "commands", "cmds", "list", "ls"],
	optional: true,
	execute(message, args) {
		const l = Localization.server(message.client, message.guild, this.name);
		const {ignore, hide, suOnly, adminsOnly, modsOnly} = require("../config.json");
		const out = [];
		category = args[0];
		if (category) category = category.replace(/\\|\//g,"");
		if (!category) {
			for (const folder of fs.readdirSync(`./commands`)) {
				if (
					fs.lstatSync(`./commands/${folder}`).isFile() ||
					ignore.includes(folder) ||
					hide.includes(folder) ||
					suOnly.includes(folder) && !Permissions.has(message, "superuser")
				) continue;

				if (
					adminsOnly.includes(folder) && !Permissions.has(message, "administrator") ||
					modsOnly.includes(folder) && !Permissions.has(message, "moderator")
				) out.push(`~~${folder}~~\n`);
				else out.push(`**${folder}**\n`);
			}
			return Messages.advanced(message, `${l.cat_list}:`, out.join(""), {custom: `${l.help[0]} ${Servers.get(message.guild.id, "prefix")}help ${l.help[1]}${Permissions.has(message, "administrator") ? "" : `\n${l.perms_alert}`}`});
		}

		if (
			(suOnly.includes(category) && !Permissions.has(message, "superuser")) ||
			(adminsOnly.includes(category) && !Permissions.has(message, "administrator")) ||
			(modsOnly.includes(category) && !Permissions.has(message, "moderator"))
		) {
			Logs.security(`${this.name} command`, `User ${message.author.id} (Ranks [${Permissions.get(message).join(", ")}]) tried to view category "${category}" when it requires higher rank.`);
			return Messages.warning(message, `${l.perms_warn} \`${category}\``);
		}

		const cmdl = Localization.server(message.client, message.guild);
		if (!fs.existsSync(`./commands/${category}`)) return Messages.warning(message, `${l.not_found[0]} \`${category}\` ${l.not_found[1]}`);
		for (const file of fs.readdirSync(`./commands/${category}`)) {
			const cmd = require(`../${category}/${file}`);
			const l = cmdl[cmd.name];

			const description = l && l.description ? l.description : cmd.description;
			const arguments = l && l.arguments ? `\`${l.arguments.join("\` \`")}\`` : cmd.arguments ? `\`${cmd.arguments.join("\` \`")}\`` : "";

			out.push(`**${Servers.get(message.guild.id, "prefix")}${cmd.name}** ${arguments} ??? ${description}`);
		}
		Messages.advanced(message, `${l.cmd_list} \`${category}\`:`, out.join("\n"));
	}
};