const { MessageEmbed } = require("discord.js")
const Messages = require("../../core/Messages");
const Servers = require("../../core/Servers");

module.exports = {
	name: "ban",
	description: "Bans user for given reason",
    arguments: ["[user]", "(reason)"],
    access: "moderator",
	execute(message, args) {
        const user = message.mentions.users.first();
        if (!user) return Messages.critical(message, "User was not found!");
        const reason = args[1] ? args.slice(1).join(" ") : "No reason";
        const channel = message.guild.channels.cache.find(c => c.id === Servers.get(message.guild.id, "logs"))
        message.guild.members.fetch(user.id).then(member => {
            const embed = new MessageEmbed({
                color: "#fa3232",
                title: "Banned",
                fields: [
                    {
                        name: "Member",
                        value: `${member} (ID ${member.id})`
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
                        name: "Reason",
                        value: `\`${reason}\``,
                        inline: true
                    }
                ],
                timestamp: new Date()
            })
            member.ban({reason: reason}).then(_=>{
                Messages.complete(message, `Banned ${member.user.tag}`);
                if (channel) channel.send({embeds:[embed]});
            }).catch(e=>{
                console.log(e);
                Messages.critical(message, `Can't ban member: \`\`\`${e}\`\`\``);
                Logs.critical(__filename, `Cant ban member with ID ${member.user.id} from guild with ID ${message.guild.id} due to "${e}"`);
            })
        })
    }
}