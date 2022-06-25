const Messages = require("../../components/Messages");
const Localization = require("../../components/Localization");

module.exports = {
	name: "say",
	aliases: ["echo"],
	execute(message, args) {
		const l = Localization.server(message.client, message.guild, this.name);
		if (!args.join(" ")) return Messages.warning(message, l.error);
		Messages.advanced(message, 0, args.join(" "), {custom:`By ${message.author.tag}`, noicon:true});
	}
};