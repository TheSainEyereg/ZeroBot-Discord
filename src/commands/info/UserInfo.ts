import Command from "../../Command";
import {
	type Message,
	type CommandInteraction,
	type GuildMember,
	SlashCommandBuilder,
	EmbedBuilder,
} from "discord.js";
import { Access, Colors } from "../../components/enums";

export default class UserInfo extends Command {
	name = "user-info";
	description = "Shows info about user";
	aliases = ["user"];
	args = ["(@mention)"];
	access = Access.User;

	data = new SlashCommandBuilder()
		.setName(this.name)
		.setDescription(this.description).addUserOption(option =>
			option
				.setName("target")
				.setDescription("User to show info about")
				.setRequired(false)
		);

	executeSlash = async (interaction: CommandInteraction) => {
		const member = interaction.options.getMember("target") || interaction.member;

		interaction.reply({ embeds: [this.displayUserInfo(member as GuildMember)] });
	};

	executePrefix = async (message: Message) => {
		const member = message.mentions.members!.first() || message.member;

		message.reply({ embeds: [this.displayUserInfo(member as GuildMember)] });
	};

	private displayUserInfo(member: GuildMember) {
		const { user } = member;

		return new EmbedBuilder({
			color: Colors.Regular,
			description: `Info about \`${member.nickname || user.username}\``,
			thumbnail: {
				url: user.displayAvatarURL()
			},
			fields: [
				{
					name: "Id",
					value: `\`${user.id}\``,
					inline: true
				},
				{
					name: "Username",
					value: user.username + (user.discriminator !== "0" ? `#${user.discriminator}` : ""),
					inline: true
				},
				{
					name: "Is Bot",
					value: user.bot ? "Yes" : "No",
					inline: true
				},
				{
					name: "Roles",
					value: `\`${member.roles.cache.map(role => role.name).join(", ")}\``,
					inline: false
				},
				{
					name: "Created at",
					value: `<t:${Math.floor(user.createdAt.getTime() / 1000)}>`,
					inline: false
				},
				{
					name: "Joined at",
					value: `<t:${Math.floor(member.joinedAt!.getTime() / 1000)}>`,
					inline: false
				}
			]
		});
	}
}
