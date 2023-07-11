import Command from "../../Command";
import {
	type Message,
	type ChatInputCommandInteraction,
	type GuildMember,
	SlashCommandBuilder,
} from "discord.js";
import { Access } from "../../components/enums";
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
				.setChoices(...meta.filter(({ ignored, hidden, access }) => !ignored && !hidden && access !== Access.SuperUser).map( ({ name }) => ({ name, value: name }) ))
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
		const { client: { db, commands, application, user }, guild } = member;

		const { prefix } = await db.getServer(guild.id);

		const targetCommands = commands.filter(({ data }) => !isSlash || !!data);

		const filterRes = await Promise.all(meta.map(async ({ ignored, hidden, access, name }) =>
			!ignored &&
			targetCommands.find(({ categoryMeta }) => categoryMeta?.name === name) &&
			(!hidden && access !== Access.SuperUser || await hasAccess(member, Access.SuperUser))
		));
		const categories = meta.filter((_, i) => filterRes[i]);
		
		const access = await Promise.all(categories.map(async ({ name, access }) => ({ name, access: !access || await hasAccess(member, access) })));

		if (!category) return regular( "Categories:", access.map(({ name, access }) => access ? `**${name}**` : `~~${name}~~`).join("\n"), {
			footer: `Use ${isSlash ? "/help with category name" : `${prefix}help [category]`} for more info. ${access.find(({ access }) => !access) ? "\nIf one or more items is crossed out, you don't have permission to these categories!" : ""}`
		});

		const foundCategoryAccess = access.find(({ name }) => name === category);
		if (!foundCategoryAccess) return warning(isSlash ? "Empty" : "Not found", `Category \`${category}\` ${isSlash ? "doesn't have slash commands" : "doesn't exist"}`);
		if (!foundCategoryAccess.access) return warning("No access", `You don't have rights to view category \`${category}\``);

		const categoryCommands = targetCommands.filter(({ categoryMeta }) => categoryMeta?.name === category);

		const commandsLines = isSlash ?
			categoryCommands.map(({ description }, key) => ({description, key: key.split(":")})).map(({ description, key }) =>`**</${key[0]}${key[1] ? ` ${key[1]}` : ""}:${application.commands.cache.find(({name}) => name === key[0])?.id}>** — ${description}`) :
			categoryCommands.map(({name, description, args}) => `**${prefix}${name}** ${args.map(arg => `\`${arg}\``).join(" ")} — ${description}`);

		return regular(`Commands of category \`${category}\`:`, commandsLines.join("\n"), { footerUser: user });
	}
}
