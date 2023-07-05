import { EmbedBuilder } from "discord.js";
import { Colors } from "./enums";
import { EmbedOptions } from "../interfaces/bot";


export function advanced(title?: string, description?: string, opt?: EmbedOptions): EmbedBuilder  {
	const embed = new EmbedBuilder({color: opt?.color || Colors.Regular});

	title && embed.setTitle(title);
	description && embed.setDescription(description);

	if (opt) {
		opt.url && embed.setURL(opt.url);
		opt.footer && embed.setFooter({text: opt.footer});
		opt.footer && opt.footerIcon && embed.setFooter({iconURL: opt.footerIcon, text: opt.footer});
		opt.footerUser && embed.setFooter({iconURL: opt.footerUser.displayAvatarURL({ size: 256 }), text: opt.footerUser.username});
	}

	return embed;
}


export function regular(title?: string, description?: string, opt?: EmbedOptions) {
	return advanced(title, description, opt);
} 

export function url(title: string, url: string, description?: string, opt?: EmbedOptions) {
	return advanced(title, description, Object.assign({color: Colors.Url, url}, opt));
}

export function success(title?: string, description?: string, opt?: EmbedOptions) {
	return advanced((opt?.circle ? ":green_circle: " : ":white_check_mark: ") + title, description, Object.assign({color: Colors.Success}, opt));
}

export function warning(title?: string, description?: string, opt?: EmbedOptions) {
	return advanced((opt?.circle ? ":yellow_circle: " : ":warning: ") + title, description, Object.assign({color: Colors.Warning}, opt));
}

export function critical(title?: string, description?: string, opt?: EmbedOptions) {
	return advanced((opt?.circle ? ":red_circle: " : ":no_entry_sign: ") + title, description, Object.assign({color: Colors.Critical}, opt));
}

export function question(title?: string, description?: string, opt?: EmbedOptions) {
	return advanced((opt?.circle ? ":blue_circle: " : ":question: ") + title, description, Object.assign({color: Colors.Question}, opt));
}