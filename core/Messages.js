const {MessageEmbed} = require("discord.js");

module.exports = {
    colors: {
        regular: "#ce38e8",
        url: "#1194f0",
        complete: "#44e838",
        warning: "#e5e838",
        critical: "#e83838"
    },
	async regular(message, text, opt) {
        const embed = new MessageEmbed().setColor(this.colors.regular);
        opt && opt.big ? embed.setTitle(text) : embed.setDescription(text);
        if (opt && opt.callback) return opt.callback(embed);
        message.channel.send({embeds: [embed]});
	},
    async advanced(message, title, text, opt) {
        const embed = new MessageEmbed()
        title ? embed.setTitle(title) : null;
        text ? embed.setDescription(text) :null;
        opt && opt.color ? embed.setColor(opt.color) : embed.setColor(this.colors.regular);
        if (opt && opt.author && opt.noicon) embed.setFooter(`For ${message.author.tag} :)`);
        else if (opt && opt.author) embed.setFooter(`For ${message.author.tag} :)`, message.author.avatarURL({ format: "png", size: 256 }));
        else if (opt && opt.custom && opt.noicon) embed.setFooter(opt.custom);
        else if (opt && opt.custom) embed.setFooter(opt.custom, message.client.user.avatarURL({ format: "png", size: 256 }));
        else embed.setFooter(`ZeroBot`, message.client.user.avatarURL({ format: "png", size: 256 }));
        if (opt && opt.callback) return opt.callback(embed);
        message.channel.send({embeds: [embed]});
    },
	async url(message, url, text, opt) {
        const embed = new MessageEmbed().setColor(this.colors.url);
        embed.setURL(url).setTitle(text);
        opt && opt.footer ? embed.setFooter(opt.footer) : null;
        if (opt && opt.callback) return opt.callback(embed);
        message.channel.send({embeds: [embed]});
	},
    async complete (message, text, opt) {
        const embed = new MessageEmbed().setColor(this.colors.complete);
        !(opt && opt.color) ? text = `${text} :white_check_mark:` : text = `${text} :green_circle:`;
        opt && opt.big ? embed.setTitle(text) : embed.setDescription(text);
        if (opt && opt.callback) return opt.callback(embed);
        message.channel.send({embeds: [embed]});
    },
    async warning (message, text, opt) {
        const embed = new MessageEmbed().setColor(this.colors.warning);
        !(opt && opt.color) ? text = `${text} :warning:` : text = `${text} :yellow_circle:`;
        opt && opt.big ? embed.setTitle(text) : embed.setDescription(text);
        if (opt && opt.callback) return opt.callback(embed);
        message.channel.send({embeds: [embed]});
    },
    async critical (message, text, opt) {
        const embed = new MessageEmbed().setColor(this.colors.critical);
        !(opt && opt.color) ? text = `${text} :no_entry_sign:` : text = `${text} :red_circle:`;
        opt && opt.big ? embed.setTitle(text) : embed.setDescription(text);
        if (opt && opt.callback) return opt.callback(embed);
        message.channel.send({embeds: [embed]});
    }
};