const {MessageEmbed} = require("discord.js");

module.exports = {
	async regular(message, text, opt) {
        const embed = new MessageEmbed().setColor("#ce38e8");
        opt && opt.big ? embed.setTitle(text) : embed.setDescription(text);
        message.channel.send({embeds: [embed]});
	},
    async advanced(message, title, text, opt) {
        const embed = new MessageEmbed().setColor("#ce38e8").setDescription(text);
        title ? embed.setTitle(title) : null;
        if (opt && opt.author && opt.noicon) embed.setFooter(`For ${message.author.tag} :)`);
        else if (opt && opt.author) embed.setFooter(`For ${message.author.tag} :)`, message.author.avatarURL({ format: "png", size: 256 }));
        else if (opt && opt.custom && opt.noicon) embed.setFooter(opt.custom);
        else if (opt && opt.custom) embed.setFooter(opt.custom, message.client.user.avatarURL({ format: "png", size: 256 }));
        else embed.setFooter(`ZeroBot`, message.client.user.avatarURL({ format: "png", size: 256 }));
        message.channel.send({embeds: [embed]});
    },
	async url(message, url, text, opt) {
        const embed = new MessageEmbed().setColor("#1194f0");
        embed.setURL(url).setTitle(text);
        opt && opt.footer ? embed.setFooter(opt.footer) : null;
        message.channel.send({embeds: [embed]});
	},
    async complete (message, text, opt) {
        const embed = new MessageEmbed().setColor("#44e838");
        !(opt && opt.color) ? text = `${text} :white_check_mark:` : text = `${text} :green_circle:`;
        opt && opt.big ? embed.setTitle(text) : embed.setDescription(text);
        message.channel.send({embeds: [embed]});
    },
    async warning (message, text, opt) {
        const embed = new MessageEmbed().setColor("#e5e838");
        !(opt && opt.color) ? text = `${text} :warning:` : text = `${text} :yellow_circle:`;
        opt && opt.big ? embed.setTitle(text) : embed.setDescription(text);
        message.channel.send({embeds: [embed]});
    },
    async critical (message, text, opt) {
        const embed = new MessageEmbed().setColor("#e83838");
        !(opt && opt.color) ? text = `${text} :no_entry_sign:` : text = `${text} :red_circle:`;
        opt && opt.big ? embed.setTitle(text) : embed.setDescription(text);
        message.channel.send({embeds: [embed]});
    }
};