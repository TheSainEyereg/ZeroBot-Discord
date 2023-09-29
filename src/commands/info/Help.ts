import Command from "../../Command";
import {
	type Message,
	type ChatInputCommandInteraction,
	type GuildMember,
	SlashCommandBuilder,
	EmbedBuilder,
} from "discord.js";
import { Access, Colors } from "../../components/enums";
import { regular, warning } from "../../components/messages";
import meta from "../meta";
import { hasAccess } from "../../components/checkManager";

export default class Help extends Command {
	name = "help";
	description = "Sends commands list sorted by category";
	aliases = ["list", "cmds", "?"];
	args = ["(category)"];
	access = Access.User;

	data = new SlashCommandBuilder()
		.setName(this.name)
		.setDescription(this.description)
		.addStringOption((option) =>
			option
				.setName("category")
				.setDescription("Category")
				.setChoices(...meta.filter(({ ignored, hidden, access }) => !ignored && !hidden && access !== Access.SuperUser).map(({ name }) => ({ name, value: name })))
				.setRequired(false)
		);

	executeSlash = async (interaction: ChatInputCommandInteraction) => {
		const { member } = interaction;
		const category = interaction.options.getString("category");

		interaction.reply({ embeds: [ await this.help(member as GuildMember, true, category) ] });
	};

	executePrefix = async (message: Message, args: string[]) => {
		const { member } = message;
		const category = args.join(" ") || null;

		message.reply({ embeds: [ await this.help(member!, false, category) ] });
	};

	private async help(member: GuildMember, isSlash: boolean, category: string | null) {
		const { client, client: { db, commands, application }, guild } = member;

		const { prefix } = await db.getServer(guild.id);

		const targetCommands = commands.filter(({ data }) => !isSlash || !!data);

		const filterRes = await Promise.all(meta.map(async ({ ignored, hidden, access }) => !ignored && (!hidden && access !== Access.SuperUser || await hasAccess(member, Access.SuperUser))));
		const categories = (await Promise.all(meta.filter((_, i) => filterRes[i]).map(async ({ name, access }) => ({
			name,
			displayName: name.charAt(0).toUpperCase() + name.slice(1),
			commands: targetCommands
				.filter(({ categoryMeta }) => categoryMeta?.name === name)
				.map(({ description, args }, key) => {
					const [command, subcommand] = key.split(":");
					return {
						description, args,
						displaySlash: `</${command}${subcommand ? ` ${subcommand}` : ""}:${application.commands.cache.find(({ name }) => name === command)?.id}>`,
						displayPrefix: `${prefix}${subcommand || command}`,
					};
				}),
			hasAccess: !access || await hasAccess(member, access)
		})))).filter(({ commands }) => commands.length);

		if (!category) return new EmbedBuilder({
			color: Colors.Regular,
			author: {
				name: "List of commands",
				icon_url: client.user.displayAvatarURL({ size: 256 }),
			},
			fields: categories.map(({ displayName, hasAccess, commands }) => ({
				name: displayName, value: !hasAccess ? "**⚠️ No access!**" :
					commands.map(({ displaySlash, displayPrefix }) => isSlash ? `**${displaySlash}**` : `\`${displayPrefix}\``).join(" ")
			})),
			footer: {
				text: `Use ${isSlash ? "/help with category name" : `${prefix}help [category]`} for more info.`,
			}
		});

		const foundCategory = categories.find(({ name }) => name === category);
		if (!foundCategory) return warning(isSlash ? "Empty" : "Not found", `Category \`${category}\` ${isSlash ? "doesn't have slash commands" : "doesn't exist"}`);
		if (!foundCategory.hasAccess) return warning("No access", `You don't have rights to view category \`${category}\``);

		const commandsLines = isSlash ?
			foundCategory.commands.map(({ description, displaySlash }) => `**${displaySlash}** — ${description}`) :
			foundCategory.commands.map(({ description, args, displayPrefix }) => `**${displayPrefix}** ${args.map(arg => `\`${arg}\``).join(" ")} — ${description}`);

		return regular(`Commands of category \`${category}\`:`, commandsLines.join("\n"), { footerUser: client.user });
	}
}
