const Localization = require("../../core/Localization");
const Logs = require("../../core/Logs");
const Messages = require("../../core/Messages");
const Servers = require("../../core/Servers");

module.exports = {
	name: "language",
	aliases: ["localization", "lang"],
	optional: true,
    access: "administrator",
	execute(message, args) {
		let l = Localization.server(message.client, message.guild, this.name);
        const localizations = message.client.localization;
		const lang = args[0] ? localizations.get(args[0]) || localizations.find(lang => lang.alt && lang.alt.includes(args[0].toLowerCase())) : null;
        if (!lang) return Messages.advanced(message, `${l.available}:`, (_=>{
            let out = "";
            localizations.each(lang => out+=`\`${lang.name}\` (${lang.alt.join(", ")})\n`);
            const current = Localization.server(message.client, message.guild);
            out+=`\n${l.current}: **\`${current.name}\`**${current.flag}`
            return out;
        })(), {custom: `${l.help[0]} ${Servers.get(message.guild.id, "prefix")}language ${l.help[1]}`});
		l = Localization.get(message.client, lang.name, "language");
		Servers.set(message.guild.id, "language", lang.name);
        Logs.regular(__filename, `User ${message.author.id} (${message.author.tag}) changed language for server ${message.guild.id} to "${lang.name}" (${args[0]})`);
        Messages.success(message, `${l.changed} **\`${lang.name}\`**`);
	}
};
