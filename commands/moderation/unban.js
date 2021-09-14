const { MessageEmbed } = require("discord.js")
const Messages = require("../../core/Messages");
const Servers = require("../../core/Servers");

module.exports = {
	name: "unban",
    aliases: ["pardon"], // Wow minecraft reference
	description: "Unbans user by ID",
    arguments: ["[ID]"],
    access: "moderator",
	execute(message, args) {
        const channel = message.guild.channels.cache.find(c => c.id === Servers.get(message.guild.id, "logs"))
        message.guild.bans.fetch(args[0]).then(ban=>{
            const embed = new MessageEmbed({
                color: "#44e838",
                title: "Unbanned",
                fields: [
                    {
                        name: "User",
                        value: `${ban.user} (ID ${ban.user.id})`
                    },
                    {
                        name: "By",
                        value: `${message.author} (ID ${message.author.id})`
                    },
                    {
                        name: "Channel",
                        value: `${message.channel} (ID ${message.channel.id})`
                    },
                    {
                        name: "Was banned for",
                        value: `\`${ban.reason}\``,
                        inline: true
                    }
                ],
                timestamp: new Date()
            })
            message.guild.bans.remove(ban.user).then(_=>{
                Messages.complete(message, `Unbanned ${ban.user.tag}`)
                if (channel) channel.send({embeds:[embed]});
            }).catch(e=>{
                console.log(e);
                Messages.critical(message, `Can't unban user: \`\`\`${e}\`\`\``);
                Logs.critical(__filename, `Cant unban user with ID ${ban.user.id} from guild with ID ${message.guild.id} due to "${e}"`);
            })
        }).catch(e=>{
            Messages.critical(message, "Can't fetch ban! Make sure you gave correct ID!")
        })
    }
}