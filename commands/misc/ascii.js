const axios = require('axios');
const Localization = require("../../core/Localization");
const Messages = require('../../core/Messages');

module.exports = {
	name: "ascii",
	description: "Makes ascii art",
	arguments: ["[text]"],
	execute(message, args) {
		const l = Localization.server(message.client, message.guild, this.name);
        axios.get(`https://artii.herokuapp.com/make?text=${args.join(" ")}`)
        .then(res => {
            message.channel.send(`\`\`\`${res.data}\`\`\``);
        })
        .catch(e => {
            Logs.critical(__filename, `Error in ascii converting: ${e}`);
            return Messages.critical(message, `${l.error}: \`\`\`${e}\`\`\``);
        });
	}
};