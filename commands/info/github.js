const {MessageEmbed} = require("discord.js");
const Messages = require("../../core/Messages");

module.exports = {
	name: "github",
    aliases: ["git", "repo"],
	description: "Sending github repo of ZeroBot",
	async execute(message) {
		Messages.url(message, require('../../package.json').repository.raw, "ZeroBot GitHub", {footer: "Thank you all for contributing ;)"});
	},
};