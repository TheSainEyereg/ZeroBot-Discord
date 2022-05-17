const {MessageEmbed, Message, TextChannel, ColorResolvable} = require("discord.js");

module.exports = {
	colors: {
		regular: "#ce38e8",
		url: "#1194f0",
		success: "#44e838",
		complete: this.success,
		warning: "#e5e838",
		critical: "#e83838"
	},
	/**
	 * Regular message
	 * @param {Message|TextChannel} source - A message or text channel to send the message to
	 * @param {String} text - The text to send
	 * @param {Object} [opt] - Optional parameters 
	 * @param {Boolean} opt.big - The text to send in a bigger font 
	 * @param {CallableFunction} opt.embed - A function that returns an embed object and prevents the text from being sent
	 * @returns Promise<Message> | Embed
	 */
	async regular(source, text, opt) {
		const channel = source.channel || source;
		const embed = new MessageEmbed().setColor(this.colors.regular);
		opt && opt.big ? embed.setTitle(text) : embed.setDescription(text);
		if (opt && opt.embed) return opt.embed(embed);
		return channel.send({embeds: [embed]});
	},
	/**
	 * Advanced message
	 * @param {Message|TextChannel} source - A message or text channel to send the message to
	 * @param {String} title - The title of the embed
	 * @param {String} text - The description of the embed
	 * @param {Object} [opt] - Optional parameters
	 * @param {CallableFunction} opt.embed - A function that returns an embed object and prevents the text from being sent
	 * @param {ColorResolvable} opt.color - The color of the embed
	 * @param {String} opt.url - The url of the embed
	 * @param {String} opt.author - Replace default footer with message author (Works only if source is a Message)
	 * @param {String} opt.custom - Custom default footer text
	 * @param {String} opt.icon - Custom footer icon (Works only is opt.custom is set)
	 * @returns Promise<Message> | Embed
	 */
	async advanced(source, title, text, opt) {
		const channel = source.channel || source;
		const embed = new MessageEmbed()
		title ? embed.setTitle(title) : null;
		text ? embed.setDescription(text) : null;
		opt && opt.color ? embed.setColor(opt.color) : embed.setColor(this.colors.regular);
		opt && opt.url ? embed.setURL(opt.url) : null;
		if (source.channel && opt && opt.author && !opt.icon) embed.setFooter({text: `For ${source.author.tag} :)`});
		else if (source.channel && opt && opt.author) embed.setFooter({text: `For ${source.author.tag} :)`, iconURL: source.author.displayAvatarURL({ format: "png", size: 256 })});
		else if (opt && opt.custom && !opt.icon) embed.setFooter({text: opt.custom});
		else if (opt && opt.custom && opt.icon) embed.setFooter({text: opt.custom, iconURL: opt.icon});
		else if (opt && opt.custom) embed.setFooter({text: opt.custom, iconURL: source.client.user.displayAvatarURL({ format: "png", size: 256 })});
		else embed.setFooter({text: `ZeroBot`, iconURL: source.client.user.displayAvatarURL({ format: "png", size: 256 })});
		if (opt && opt.embed) return opt.embed(embed);
		return channel.send({embeds: [embed]});
	},
	/**
	 * Message with a link
	 * @param {Message|TextChannel} source - A message or text channel to send the message to
	 * @param {String} url - The url to send
	 * @param {String} text - The text for the url
	 * @param {Object} [opt] - Optional parameters
	 * @param {Boolean} opt.footer - Custom footer text
	 * @param {CallableFunction} opt.embed - A function that returns an embed object and prevents the text from being sent
	 * @returns Promise<Message> | Embed
	 */
	async url(source, url, text, opt) {
		const channel = source.channel || source;
		const embed = new MessageEmbed().setColor(this.colors.url);
		embed.setURL(url).setTitle(text);
		opt && opt.footer ? embed.setFooter({text: opt.footer}) : null;
		if (opt && opt.embed) return opt.embed(embed);
		return channel.send({embeds: [embed]});
	},
	/**
	 * Success message
	 * @param {Message|TextChannel} source - A message or text channel to send the message to
	 * @param {String} text - The text to send
	 * @param {Object} [opt] - Optional parameters
	 * @param {Boolean} opt.big - The text to send in a bigger font 
	 * @param {Boolean} opt.circle - Replaces emoji with a solid color emoji
	 * @param {CallableFunction} opt.embed - A function that returns an embed object and prevents the text from being sent
	 * @returns Promise<Message> | Embed
	 */
	async success (source, text, opt) {
		const channel = source.channel || source;
		const embed = new MessageEmbed().setColor(this.colors.success);
		!(opt && opt.circle) ? text = `:white_check_mark: ${text}` : text = `:green_circle: ${text}`;
		opt && opt.big ? embed.setTitle(text) : embed.setDescription(text);
		if (opt && opt.embed) return opt.embed(embed);
		return channel.send({embeds: [embed]});
	},
	/**
	 * Warning message
	 * @param {Message|TextChannel} source - A message or text channel to send the message to
	 * @param {String} text - The text to send
	 * @param {Object} [opt] - Optional parameters
	 * @param {Boolean} opt.big - The text to send in a bigger font
	 * @param {Boolean} opt.circle - Replaces emoji with a solid color emoji
	 * @param {CallableFunction} opt.embed - A function that returns an embed object and prevents the text from being sent
	 * @returns Promise<Message> | Embed
	 */
	async warning (source, text, opt) {
		const channel = source.channel || source;
		const embed = new MessageEmbed().setColor(this.colors.warning);
		!(opt && opt.circle) ? text = `:warning: ${text}` : text = `:yellow_circle: ${text}`;
		opt && opt.big ? embed.setTitle(text) : embed.setDescription(text);
		if (opt && opt.embed) return opt.embed(embed);
		return channel.send({embeds: [embed]});
	},
	/**
	 * Critical message
	 * @param {Message|TextChannel} source - A message or text channel to send the message to
	 * @param {String} text - The text to send
	 * @param {Object} [opt] - Optional parameters
	 * @param {Boolean} opt.big - The text to send in a bigger font 
	 * @param {Boolean} opt.circle - Replaces emoji with a solid color emoji
	 * @param {CallableFunction} opt.embed - A function that returns an embed object and prevents the text from being sent
	 * @returns Promise<Message> | Embed
	 */
	async critical (source, text, opt) {
		const channel = source.channel || source;
		const embed = new MessageEmbed().setColor(this.colors.critical);
		!(opt && opt.circle) ? text = `:no_entry_sign: ${text}` : text = `:red_circle: ${text}`;
		opt && opt.big ? embed.setTitle(text) : embed.setDescription(text);
		if (opt && opt.embed) return opt.embed(embed);
		return channel.send({embeds: [embed]});
	}
};