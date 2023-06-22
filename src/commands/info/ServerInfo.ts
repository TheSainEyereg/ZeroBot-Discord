import Command from "../../Command";
import {
	type Message,
	type CommandInteraction,
	type Guild,
	SlashCommandBuilder,
	EmbedBuilder,
} from "discord.js";
import { Access, Colors } from "../../components/enums";

export default class ServerInfo extends Command {
	name = "server-info";
	description = "Shows info about server";
	aliases = ["server"];
	args = [];
	access = Access.User;

	data = new SlashCommandBuilder()
		.setName(this.name)
		.setDescription(this.description);

	executeSlash = async (interaction: CommandInteraction) => {
		interaction.reply({ embeds: [this.displayServerInfo(interaction.guild!)] });
	};

	executePrefix = async (message: Message) => {
		message.reply({ embeds: [this.displayServerInfo(message.guild!)] });
	};

	private displayServerInfo(guild: Guild) {

		return new EmbedBuilder({
			color: Colors.Regular,
			description: `Info about \`${guild.name}\``,
			thumbnail: {
				url: guild.iconURL()!
			},
			fields: [
				{
					name: "Id",
					value: `\`${guild.id}\``,
					inline: true
				},
				{
					name: "Members count",
					value: guild.memberCount.toString(),
					inline: true
				},
				{
					name: "Is verified",
					value: guild.verified ? "Yes" : "No",
					inline: true
				},
				{
					name: "Owner",
					value: `<@${guild.ownerId}>`,
					inline: true
				},
				{
					name: "Description",
					value: guild.description ? guild.description : "No description",
					inline: false
				},
				{
					name: "Created at",
					value: `<t:${Math.floor(guild.createdAt.getTime() / 1000)}>`,
					inline: false
				}
			]
		});
	}
}
