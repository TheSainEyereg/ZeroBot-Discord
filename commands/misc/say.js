const Messages = require("../../core/Messages");
const Localization = require("../../core/Localization");

module.exports = {
	name: "say",
	aliases: ["echo"],
	description: "Repeat given word",
	arguments: ["[words]"],
	execute(message, args) {
		const l = Localization.server(message.client, message.guild, this.name);
		let out = args.join(" ");
		const re = /@|.:\/\/|https:\/\/|http:\/\/|ftp:\/\//gi;
		while (out.match(re)) out = out.replace(re,"");
		if (!out) return Messages.warning(message, l.error);
		Messages.advanced(message, out, 0, {custom:`By ${message.author.tag}`, noicon:true});
	}
};