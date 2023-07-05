import Command from "../../Command";
import {
	type Message,
	type ChatInputCommandInteraction,
	type GuildMember,
	SlashCommandBuilder,
	EmbedBuilder
} from "discord.js";
import { Access, Colors } from "../../components/enums";

export default class Ascii extends Command {
	name = "avatar";
	description = "Sends user's profile picture";
	aliases = ["pfp", "ava"];
	args = ["(@mention)"];
	access = Access.User;

	data = new SlashCommandBuilder()
		.setName(this.name)
		.setDescription(this.description)
		.addUserOption(option =>
			option
				.setName("target")
				.setDescription("Get specified user's profile picture")
				.setRequired(false)
		);

	executeSlash = async (interaction: ChatInputCommandInteraction) => {
		const member = interaction.options.getMember("target") || interaction.member;

		interaction.reply({ embeds: [this.pfp(member as GuildMember)] });
	};

	executePrefix = async (message: Message) => {
		const member = message.mentions.members?.first() || message.member;

		message.reply({ embeds: [this.pfp(member!)] });
	};

	private pfp(member: GuildMember) {
		return new EmbedBuilder({
			color: Colors.Regular,
			title: `Profile picture of \`${member.user.username}\``,
			image: {
				url: member.displayAvatarURL({size: 1024}),
			}
		});
	}
}
