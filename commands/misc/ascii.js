const axios = require('axios');
const Localization = require("../../core/Localization");
const Messages = require('../../core/Messages');

module.exports = {
	name: "ascii",
	execute(message, args) {
		const l = Localization.server(message.client, message.guild, this.name);
        axios.get(`https://artii.herokuapp.com/make?text=${args.join(" ")}`)
        .then(res => {
            message.channel.send(`\`\`\`${res.data}\`\`\``);
        })
        .catch(e => {
            Logs.critical(`${this.name} command`, `Error in ascii converting: ${e}`);
            return Messages.critical(message, `${l.error}: \`\`\`${e}\`\`\``);
        });
	}
};