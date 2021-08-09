const Messages = require("../../core/Messages");

module.exports = {
	name: "say",
	aliases: ["echo"],
	description: "Repeat given word",
	arguments: ["[words]"],
	execute(message, args) {
		let out = args.join(" ");
		const re = /@|.:\/\/|https:\/\/|http:\/\/|ftp:\/\//gi;
		while (out.match(re)) out = out.replace(re,"");
		if (!out) return Messages.warning(message, "Can't send empty message!");
		Messages.advanced(message, out, 0, {custom:`By ${message.author.tag}`, noicon:true});
	}
};