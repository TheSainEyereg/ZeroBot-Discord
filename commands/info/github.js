const Localization = require("../../components/Localization");
const Messages = require("../../components/Messages");

module.exports = {
	name: "github",
	aliases: ["git", "repo"],
	execute(message) {
		const l = Localization.server(message.client, message.guild, this.name);
		Messages.url(message, require('../../package.json').repository.raw, l.repo, {footer: l.thanks});
	},
};