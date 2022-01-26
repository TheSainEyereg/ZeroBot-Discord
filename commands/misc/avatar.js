const {MessageEmbed } = require("discord.js");
const Messages = require("../../core/Messages");
const Localization = require("../../core/Localization");

module.exports = {
	name: "avatar",
	aliases: ["ava", "profile"],
	optional: true,
	async execute(message, args) {
		const l = Localization.server(message.client, message.guild, this.name);
		message.channel.sendTyping();
		
		const user = message.mentions.users.first() || message.author;
		
		try {
			const embed = new MessageEmbed({
				color: Messages.colors.url,
				description: `${l.avatar} **\`${user.tag}\`**`,
				image: {
					url: await user.displayAvatarURL({ format: "png", size: 1024 })
				}
			});
			message.channel.send({embeds: [embed]});
		} catch (e) {
			Messages.critical(message, `${l.error}: ${e}`);
			Logs.critical(`${this.name} command`, `Error in getting/sending image: ${e}`);
			console.error(e);
		}
	}
};