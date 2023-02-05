const Canvas = require("canvas");
const Logs = require("../../components/Logs");
const Localization = require("../../components/Localization");

module.exports = {
	name: "god",
	aliases: ["bog", "asbestos"],
	optional: true,
	async execute(message, args) {
		const l = Localization.server(message.client, message.guild, this.name);
		message.channel.sendTyping();
		
		const user = message.mentions.users.first() || message.author;
		const username = user.username;

		const canvas = Canvas.createCanvas(786, 675);
		const ctx = canvas.getContext("2d");

		try {
			const background = await Canvas.loadImage("./assets/images/bog.png");
			const avatar = await Canvas.loadImage(user.displayAvatarURL({ format: "jpg", size: 512 }));

			ctx.drawImage(background, 0, 0, canvas.width, canvas.height);
			ctx.drawImage(avatar, 305, 102, 90, 90);
		} catch (e) {
			Messages.critical(message, `${l.error}: ${e}`);
			Logs.critical(`${this.name} command`, `Error in getting/drawing image: ${e}`);
			return console.error(e);
		}

		message.channel.send({files: [{
			attachment: canvas.toBuffer(),
			name: "bog.png"
		}]});
	}
};