const Localization = require("../../components/Localization");
const Messages = require("../../components/Messages");
const {MessageEmbed} = require("discord.js");

module.exports = {
	name: "save",
	description: "Send current playing song to DM",
	aliases: ["sav", "like", "favorite", "fav"],
	async execute(message, args) {
		const l = Localization.server(message.client, message.guild, this.name);
		const queue = message.client.queue.get(message.guild.id);
		if (!queue) return Messages.warning(message, l.nothing);

		// Check if the user has DM's enabled
		const DMChannel = await message.author.createDM();
		if (!DMChannel) return Messages.warning(message, l.dm_disabled);

		const song = queue.list[0];
		DMChannel.send({embeds:[new MessageEmbed({
			color: Messages.colors.regular,
			thumbnail: {
				url:song.thumbnail
			},
			title: song.title,
			url: song.url
		})]});
		Messages.success(message, l.sent);
	}
}