const Messages = require("../../core/Messages");
const Localization = require("../../core/Localization");

module.exports = {
    name: "clear",
    aliases: ["clean", "remove"],
    access: "moderator",
    execute(message, args) {
		const l = Localization.server(message.client, message.guild, this.name);
        const amount = parseInt(args[0]);
        if (isNaN(amount)) return Messages.warning(message, l.no_amount);
        if (amount > 100) return Messages.warning(message, l.max_amount);
        async function delete_messages() {
            await message.channel.messages
                .fetch({limit: amount})
                .then(messages => {
                    message.channel.bulkDelete(messages)
                        .then(_ => {
                            Messages.complete(message, `${l.deleted[0]} ${amount} ${l.deleted[1]}`, {callback: embed => {
                                message.channel.send({embeds: [embed]})
                                .then(message => {setTimeout(_=>{message.delete()}, 3000)})
                                .catch();
                            }});
                        })
                        .catch(e => {return message.channel.send(`${l.error}: \`${e}\``)});
                });
        }
        delete_messages();
    },
};