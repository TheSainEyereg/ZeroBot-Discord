const Messages = require("../../core/Messages");

module.exports = {
	name: "coin",
	aliases: ["flip", "headtail"],
	description: "Flips a coin",
	execute(message, args) {
		Messages.regular(message, `:coin: You got a ${Math.random() < 0.5 ? "head" : "tail"}!`, {big:true});
	}
};