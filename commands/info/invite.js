const Messages = require("../../core/Messages");

module.exports = {
	name: "invite",
	description: "Gives you ivite for your server",
	async execute(message) {
        Messages.url(message, require("../../config.json").invite, "Invite ZeroBot to server", {footer: "Thanks for joining ZeroBot community :)"});
	},
};