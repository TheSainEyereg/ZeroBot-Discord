const Canvas = require("canvas");
const Logs = require("../../components/Logs");
const Localization = require("../../components/Localization");

module.exports = {
	name: "rip",
	optional: true,
	async execute(message, args) {
		const l = Localization.server(message.client, message.guild, this.name);
		message.channel.sendTyping();
		
		const user = message.mentions.users.first() || message.author;
		const username = user.username;

		const canvas = Canvas.createCanvas(653, 425);
		const ctx = canvas.getContext("2d");
		
		ctx.font = "40px sans-serif";
		ctx.fillStyle = "#010101";

		try {
			const background = await Canvas.loadImage("https://olejka.ru/r/24b70f0c.jpg");
			const avatar = await Canvas.loadImage(user.displayAvatarURL({ format: "jpg", size: 512 }));
			
			ctx.drawImage(background, 0, 0, canvas.width, canvas.height);
			ctx.drawImage(avatar, canvas.width/2-125/2-20, 80, 125, 125);
		} catch (e) {
			Messages.critical(message, `${l.error}: ${e}`);
			Logs.critical(`${this.name} command`, `Error in getting/drawing image: ${e}`);
			console.error(e);
		}

		const date = new Date();
		const time = `${("0"+date.getFullYear().toString().slice(2)).slice(-2)}.${("0"+(date.getMonth()+1)).slice(-2)}.${("0"+date.getDate()).slice(-2)}`;
		
		if (!args[1] || args[1] != "quick") {
			const imgData = ctx.getImageData(canvas.width/2-125/2-20, 80, 125, 125);
			for (i = 0; i < imgData.data.length; i += 4) {
				const colour = imgData.data[i] * .3 + imgData.data[i+1] * .59 + imgData.data[i+2] * .11;
	
				imgData.data[i] = colour;
				imgData.data[i + 1] = colour;
				imgData.data[i + 2] = colour;
				imgData.data[i + 3] = 255;
			}
			ctx.putImageData(imgData, canvas.width/2-125/2-20, 80);
		}
		ctx.fillText(username , (canvas.width/2-20) - (ctx.measureText(username).width / 2), 255);
		ctx.fillText(time , (canvas.width/2-20) - (ctx.measureText(time).width / 2), 300);

		message.channel.send({files: [{
			attachment: canvas.toBuffer(),
			name: "rip.png"
		}]});
	}
};