const Messages = require("../../core/Messages");
const Localization = require("../../core/Localization");

module.exports = {
	name: "say",
	aliases: ["echo"],
	execute(message, args) {
		const l = Localization.server(message.client, message.guild, this.name);
		if (!args.join(" ")) return Messages.warning(message, l.error);
		Messages.advanced(message, 0, args.join(" "), {custom:`By ${message.author.tag}`, noicon:true});
	}
};