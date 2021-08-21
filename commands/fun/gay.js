const Canvas = require("canvas");

module.exports = {
	name: "gay",
	description: "Makes someone gay",
	arguments: ["(user mention)"],
    optional: true,
	async execute(message, args) {
        message.channel.sendTyping();
        
        const user = message.mentions.users.first() || message.author;

        const canvas = Canvas.createCanvas(512, 512);
        const ctx = canvas.getContext("2d");

        try {
            const avatar = await Canvas.loadImage(user.displayAvatarURL({ format: "jpg", size: 512 }));
            const background = await Canvas.loadImage("https://olejka.ru/s/475b9ef6.png");
    
            ctx.drawImage(avatar, 0, 0, canvas.width, canvas.height);
            ctx.globalAlpha = 0.6
            ctx.drawImage(background, 0, 0, canvas.width, canvas.height);
        } catch (e) {
            Messages.critical(message, `Error in getting/drawing image: ${e}`);
            Logs.critical(__filename, `Error in getting/drawing image: ${e}`);
            console.error(e);
        }

        message.channel.send({files: [{
            attachment: canvas.toBuffer(),
            name: "gay.png"
        }]});
	}
};