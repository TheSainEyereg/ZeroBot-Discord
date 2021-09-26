const { MessageEmbed } = require("discord.js");
const Logs = require("../../core/Logs");
const Messages = require("../../core/Messages");
const Servers = require("../../core/Servers");
const Localization = require("../../core/Localization");

module.exports = {
	name: "kick",
    access: "moderator",
	execute(message, args) {
		const l = Localization.server(message.client, message.guild, this.name);
        const user = message.mentions.users.first();
        if (!user) return Messages.critical(message, l.not_found);
        const reason = args[1] ? args.slice(1).join(" ") : l.no_reason;
        const channel = message.guild.channels.cache.find(c => c.id === Servers.get(message.guild.id, "logs"))
        message.guild.members.fetch(user.id).then(member => {
            const embed = new MessageEmbed({
                color: "#f0fa32",
                title: l.kicked,
                fields: [
                    {
                        name: l.member,
                        value: `${member} (ID ${member.id})`
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
                        value: `\`${reason}\``,
                        inline: true
                    }
                ],
                timestamp: new Date()
            })
            if (!member.kickable) return Messages.critical(message, `${l.cant_kick} ${member}`);
            member.kick(reason).then(_=>{
                Messages.complete(message, `${l.has_kicked} ${member}`);
                if (channel) channel.send({embeds:[embed]});
            }).catch(e=>{
                console.log(e);
                Messages.critical(message, `${l.error}: \`\`\`${e}\`\`\``);
                Logs.critical(__filename, `Cant kick member with ID ${member.user.id} from guild with ID ${message.guild.id} due to "${e}"`);
            })
        })
    }
}