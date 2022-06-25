const axios = require('axios');
const Localization = require("../../components/Localization");
const Messages = require('../../components/Messages');

module.exports = {
	name: "ascii",
	execute(message, args) {
		const l = Localization.server(message.client, message.guild, this.name);
		axios.get(`https://api.olejka.ru/v2/figlet?text=${args.join(" ")}`)
		.then(res => {
			message.channel.send(`\`\`\`\n${res.data.text}\`\`\``);
		})
		.catch(e => {
			Logs.critical(`${this.name} command`, `Error in ascii convertation: ${e}`);
			return Messages.critical(message, `${l.error}: \`\`\`${e.response?.data?.error || e}\`\`\``);
		});
	}
};