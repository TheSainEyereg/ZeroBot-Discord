const Messages = require("../../core/Messages");

module.exports = {
	name: "time",
    aliases: ["utc", "date"],
	description: "Sending current date and time in UTC format",
	async execute(message) {
		Messages.regular(message, `Current UTC date & time:\n**\`${new Date().toUTCString().replace("GMT", "UTC")}\`**`, {big: false});
	},
};