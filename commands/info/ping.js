const Messages = require("../../components/Messages");

module.exports = {
	name: "ping",
	execute(message, args) {
		Messages.regular(message, `Pong! ${Date.now()-message.createdTimestamp}ms.`, {big: true})
	}
};