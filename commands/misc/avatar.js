const {MessageEmbed } = require("discord.js");

module.exports = {
	name: "avatar",
    aliases: ["ava", "profile"],
	description: "Sends user avatar (1024x1024)",
	arguments: ["(user mention)"],
    optional: true,
	async execute(message, args) {
        message.channel.sendTyping();
        
        const user = message.mentions.users.first() || message.author;
        
        try {
            const embed = new MessageEmbed({
                color: "#1194f0",
                description: `Avatar of **\`${user.tag}\`**`,
                image: {
                    url: await user.displayAvatarURL({ format: "png", size: 1024 })
                }
            });
            message.channel.send({embeds: [embed]});
        } catch (e) {
            Messages.critical(message, `Error in getting/sending image: ${e}`);
            Logs.critical(__filename, `Error in getting/sending image: ${e}`);
            console.error(e);
        }
	}
};