const { MessageEmbed } = require("discord.js")
const Messages = require("../../components/Messages");
const Servers = require("../../components/Servers");
const Localization = require("../../components/Localization");

module.exports = {
	name: "unban",
	aliases: ["pardon"], // Wow minecraft reference
	arguments: ["[ID]"],
	access: "moderator",
	execute(message, args) {
		const l = Localization.server(message.client, message.guild, this.name);
		const channel = message.guild.channels.cache.find(c => c.id === Servers.get(message.guild.id, "logsChannel"))
		message.guild.bans.fetch(args[0]).then(ban=>{
			const embed = new MessageEmbed({
				color: "#44e838",
				title: l.unbanned,
				fields: [
					{
						name: l.user,
						value: `${ban.user} (ID ${ban.user.id})`
					},
					{
						name: l.by,
						value: `${message.author} (ID ${message.author.id})`
					},
					{
						name: l.channel,
						value: `${message.channel} (ID ${message.channel.id})`
					},
					{
						name: l.reason,
						value: `\`${ban.reason}\``,
						inline: true
					}
				],
				timestamp: new Date()
			})
			message.guild.bans.remove(ban.user).then(_=>{
				Messages.success(message, `${l.has_unbanned} \`${ban.user.tag}\``)
				if (channel) channel.send({embeds:[embed]});
			}).catch(e=>{
				console.log(e);
				Messages.critical(message, `${l.error}`);
				Logs.critical(`${this.name} command`, `Cant unban user with ID ${ban.user.id} from guild with ID ${message.guild.id} due to "${e}"`);
			})
		}).catch(e=>{
			Messages.critical(message, l.cant_fetch)
		})
	}
}