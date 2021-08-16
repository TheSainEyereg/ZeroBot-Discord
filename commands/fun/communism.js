const Canvas = require("canvas");

module.exports = {
	name: "communism",
	description: "Stolen idea from BoobBot",
	arguments: ["(user)"],
    optional: true,
	async execute(message, args) {
        message.channel.sendTyping();
        
        const user = message.mentions.users.first() || message.author;

        const canvas = Canvas.createCanvas(512, 512);
        const ctx = canvas.getContext("2d");

        const avatar = await Canvas.loadImage(user.displayAvatarURL({ format: "jpg", size: 512 }));
        const background = await Canvas.loadImage("https://olejka.ru/s/6ad3593b.png");

        ctx.drawImage(avatar, 0, 0, canvas.width, canvas.height);
        ctx.globalAlpha = 0.6
        ctx.drawImage(background, 0, 0, canvas.width, canvas.height);

        message.channel.send({files: [{
            attachment: canvas.toBuffer(),
            name: "communism.png"
        }]});
	}
};