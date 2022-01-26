const Localization = require("../../core/Localization");
const Messages = require("../../core/Messages");

module.exports = {
	name: "github",
	aliases: ["git", "repo"],
	execute(message) {
		const l = Localization.server(message.client, message.guild, this.name);
		Messages.url(message, require('../../package.json').repository.raw, l.repo, {footer: l.thanks});
	},
};