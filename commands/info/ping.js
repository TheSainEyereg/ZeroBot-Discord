const Messages = require("../../core/Messages");

module.exports = {
	name: "ping",
	description: "Shows delay between server an bot",
	async execute(message, args) {
        Messages.regular(message, `Pong! ${Date.now()-message.createdTimestamp}ms.`, {big: true})
	}
};