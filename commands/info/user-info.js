const { MessageEmbed } = require("discord.js");
const Localization = require("../../core/Localization");

module.exports = {
	name: "user-info",
	aliases: ["user"],
	optional: true,
	execute(message, args) {
		const l = Localization.server(message.client, message.guild, this.name);
		const user = message.mentions.users.first() || message.author
		message.guild.members.fetch(user.id).then(member => {
			const embed = new MessageEmbed({
				color: "#ce38e8",
				description: `${l.about} \`${user.tag}\``,
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
						name: l.nick,
						value: member.nickname ? member.nickname : user.username,
						inline: true
					},
					{
						name: l.bot,
						value: user.bot ? l.yes : l.no,
						inline: true
					},
					{
						name: l.roles,
						value: `\`${member.roles.cache.map(role => role.name).join(", ")}\``,
						inline: false
					},
					{
						name: l.created,
						value: user.createdAt.toUTCString().replace("GMT", "UTC"),
						inline: false
					},
					{
						name: l.joined,
						value: member.joinedAt.toUTCString().replace("GMT", "UTC"),
						inline: false
					}
				]
			});
			message.channel.send({embeds: [embed]});
		})
	}
};