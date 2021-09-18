const { MessageEmbed } = require("discord.js");
const Logs = require("../../core/Logs");
const Messages = require("../../core/Messages");
const Servers = require("../../core/Servers");

module.exports = {
	name: "kick",
	description: "Kicks user for given reason",
    arguments: ["[user]", "(reason)"],
    access: "moderator",
	execute(message, args) {
        const user = message.mentions.users.first();
        if (!user) return Messages.critical(message, "User was not found!");
        const reason = args[1] ? args.slice(1).join(" ") : "No reason";
        const channel = message.guild.channels.cache.find(c => c.id === Servers.get(message.guild.id, "logs"))
        message.guild.members.fetch(user.id).then(member => {
            const embed = new MessageEmbed({
                color: "#f0fa32",
                title: "Kicked",
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
            if (!member.kickable) return Messages.critical(message, `I can't kick ${member}`);
            member.kick(reason).then(_=>{
                Messages.complete(message, `Kicked ${member}`);
                if (channel) channel.send({embeds:[embed]});
            }).catch(e=>{
                console.log(e);
                Messages.critical(message, `Can't kick member: \`\`\`${e}\`\`\``);
                Logs.critical(__filename, `Cant kick member with ID ${member.user.id} from guild with ID ${message.guild.id} due to "${e}"`);
            })
        })
    }
}