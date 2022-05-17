const Localization = require("../../components/Localization");
const Messages = require("../../components/Messages");

module.exports = {
	name: "coin",
	aliases: ["flip", "headtail"],
	execute(message, args) {
		const l = Localization.server(message.client, message.guild, this.name);
		Messages.regular(message, `:coin: ${l.got} ${Math.random() < 0.5 ? l.heads : l.tails}!`, {big:true});
	}
};