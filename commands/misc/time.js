const Messages = require("../../core/Messages");
const Localization = require("../../core/Localization");

module.exports = {
	name: "time",
    aliases: ["utc", "date"],
	description: "Sending current date and time in UTC format",
	execute(message) {
		const l = Localization.server(message.client, message.guild, this.name);
		Messages.regular(message, `${l.time}:\n**\`${new Date().toUTCString().replace("GMT", "UTC")}\`**`, {big: false});
	},
};