const { MessageEmbed } = require("discord.js");

module.exports = {
	name: "server-info",
    aliases: ["server"],
	description: "Shows info about server.",
	async execute(message, args) {
        const guild = message.guild;
        message.guild.members.fetch(message.guild.ownerId).then(owner => {
            const embed = new MessageEmbed({
                color: "#ce38e8",
                description: `Info about \`${guild.name}\``,
                thumbnail: {
                    url: guild.iconURL()
                },
                fields: [
                    {
                        name: "Id",
                        value: `\`${guild.id}\``,
                        inline: true
                    },
                    {
                        name: "Members count",
                        value: guild.memberCount.toString(),
                        inline: true
                    },
                    {
                        name: "Verified",
                        value: guild.verified ? "Yes" : "No",
                        inline: true
                    },
                    {
                        name: "Owner",
                        value: owner.user.tag,
                        inline: true
                    },
                    {
                        name: "Description",
                        value: guild.description ? guild.description : "No description.",
                        inline: false
                    },
                    {
                        name: "Created at",
                        value: guild.createdAt.toUTCString().replace("GMT", "UTC"),
                        inline: false
                    }
                ]
            });
            message.channel.send({embeds: [embed]});
        })
	}
};