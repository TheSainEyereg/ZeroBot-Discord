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
        if (amount > 99) return Messages.warning(message, l.max_amount);
        async function delete_messages() {
            await message.channel.messages
                .fetch({limit: amount+1})
                .then(messages => {
                    message.channel.bulkDelete(messages)
                        .then(_ => {
                            Messages.success(message, `${l.deleted[0]} ${amount} ${l.deleted[1]}`)
							.then(message => {setTimeout(_=>{message.delete()}, 3000)})
							.catch();
                        })
                        .catch(e => {return message.channel.send(`${l.error}: \`${e}\``)});
                });
        }
        delete_messages();
    },
};