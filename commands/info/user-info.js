const { MessageEmbed } = require("discord.js");

module.exports = {
	name: "user-info",
    aliases: ["user"],
	description: "Shows info about user",
    arguments: ["(User mention)"],
    optional: true,
	async execute(message, args) {
        const user = message.mentions.users.first() || message.author
        message.guild.members.fetch(user.id).then(member => {
            const embed = new MessageEmbed({
                color: "#ce38e8",
                description: `Info about \`${user.tag}\``,
                thumbnail: {
                    url: user.displayAvatarURL()
                },
                fields: [
                    {
                        name: "Id",
                        value: `\`${user.id}\``,
                        inline: true
                    },
                    {
                        name: "Nickname",
                        value: member.nickname ? member.nickname : user.username,
                        inline: true
                    },
                    {
                        name: "Bot",
                        value: user.bot ? "Yes" : "No",
                        inline: true
                    },
                    {
                        name: "Roles",
                        value: `\`${member.roles.cache.map(role => role.name).join(", ")}\``,
                        inline: false
                    },
                    {
                        name: "Created at",
                        value: user.createdAt.toUTCString().replace("GMT", "UTC"),
                        inline: false
                    },
                    {
                        name: "Joined at",
                        value: member.joinedAt.toUTCString().replace("GMT", "UTC"),
                        inline: false
                    }
                ]
            });
            message.channel.send({embeds: [embed]});
        })
	}
};