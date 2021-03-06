const Canvas = require("canvas");
const Localization = require("../../components/Localization");

module.exports = {
	name: "gay",
	optional: true,
	async execute(message, args) {
		const l = Localization.server(message.client, message.guild, this.name);
		message.channel.sendTyping();
		
		const user = message.mentions.users.first() || message.author;

		const canvas = Canvas.createCanvas(512, 512);
		const ctx = canvas.getContext("2d");

		try {
			const avatar = await Canvas.loadImage(user.displayAvatarURL({ format: "jpg", size: 512 }));
			const background = await Canvas.loadImage("./assets/images/lgbtOverlay.png");
	
			ctx.drawImage(avatar, 0, 0, canvas.width, canvas.height);
			ctx.globalAlpha = 0.6
			ctx.drawImage(background, 0, 0, canvas.width, canvas.height);
		} catch (e) {
			Messages.critical(message, `${l.error}: ${e}`);
			Logs.critical(`${this.name} command`, `Error in getting/drawing image: ${e}`);
			return console.error(e);
		}

		message.channel.send({files: [{
			attachment: canvas.toBuffer(),
			name: "gay.png"
		}]});
	}
};