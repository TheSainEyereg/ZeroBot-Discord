const Messages = require("../../components/Messages");
const Localization = require("../../components/Localization");

module.exports = {
	name: "invite",
	execute(message) {
		const l = Localization.server(message.client, message.guild, this.name);
		Messages.url(message, require("../../config.json").invite, l.invite, {footer: l.thanks});
	},
};