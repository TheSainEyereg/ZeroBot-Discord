const Messages = require("../../components/Messages");
const Localization = require("../../components/Localization");

module.exports = {
	name: "time",
	aliases: ["utc", "date"],
	execute(message) {
		const l = Localization.server(message.client, message.guild, this.name);
		Messages.regular(message, `${l.time}:\n**\`${new Date().toUTCString().replace("GMT", "UTC")}\`**`, {big: false});
	},
};