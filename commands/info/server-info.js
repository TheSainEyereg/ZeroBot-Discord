const { MessageEmbed } = require("discord.js");
const Localization = require("../../core/Localization");

module.exports = {
	name: "server-info",
    aliases: ["server"],
	execute(message, args) {
		const l = Localization.server(message.client, message.guild, this.name);
        const guild = message.guild;
        message.guild.members.fetch(message.guild.ownerId).then(owner => {
            const embed = new MessageEmbed({
                color: "#ce38e8",
                description: `${l.about} \`${guild.name}\``,
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
                        name: l.count,
                        value: guild.memberCount.toString(),
                        inline: true
                    },
                    {
                        name: l.verified,
                        value: guild.verified ? l.yes : l.no,
                        inline: true
                    },
                    {
                        name: l.owner,
                        value: owner.user.tag,
                        inline: true
                    },
                    {
                        name: l.desc,
                        value: guild.description ? guild.description : l.no_desc,
                        inline: false
                    },
                    {
                        name: l.created,
                        value: guild.createdAt.toUTCString().replace("GMT", "UTC"),
                        inline: false
                    }
                ]
            });
            message.channel.send({embeds: [embed]});
        })
	}
};