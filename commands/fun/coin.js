const Localization = require("../../core/Localization");
const Messages = require("../../core/Messages");

module.exports = {
	name: "coin",
	aliases: ["flip", "headtail"],
	description: "Flips a coin",
	execute(message, args) {
		const l = Localization.server(message.client, message.guild, this.name);
		Messages.regular(message, `:coin: ${l.got} ${Math.random() < 0.5 ? l.heads : l.tails}!`, {big:true});
	}
};