const Messages = require("../../core/Messages");
const Localization = require("../../core/Localization");

module.exports = {
	name: "invite",
	execute(message) {
		const l = Localization.server(message.client, message.guild, this.name);
        Messages.url(message, require("../../config.json").invite, l.invite, {footer: l.thanks});
	},
};