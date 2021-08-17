const Messages = require("../../core/Messages");

module.exports = {
    name: "clear",
    aliases: ["clean", "remove"],
    description: "Removes messages that are not older than 2 weeks",
	arguments: ["[count]"],
    access: "moderator",
    execute(message, args) {
        const amount = parseInt(args[0]);
        if (isNaN(amount)) return Messages.warning("You must give amount");
        if (amount > 100) return message.channel.send("Max amount is 100");
        async function delete_messages() {
            await message.channel.messages
                .fetch({limit: amount+1})
                .then(messages => {
                    message.channel.bulkDelete(messages)
                        .then(_ => {
                            Messages.complete(message, `Deleted ${amount} messages!`, {callback: embed => {
                                message.channel.send({embeds: [embed]})
                                .then(message => {setTimeout(_=>{message.delete()}, 3000)})
                                .catch();
                            }});
                        })
                        .catch(e => {return message.channel.send(`Oh no: \`${e}\``)});
                });
        }
        delete_messages();
    },
};