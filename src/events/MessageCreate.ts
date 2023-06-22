import Event from "../Event";
import { ChannelType, Events, GuildMember, Message } from "discord.js";
import { hasAccess, hasMissedArg } from "../components/checkManager";
import { critical, regular, warning } from "../components/messages";

export default class Ready extends Event {
	event = Events.MessageCreate;

	execute = async (message: Message) => {
		if (message.author.bot) return;
		const { client } = message;

		if (message.channel.type === ChannelType.DM) {
			return message.reply({
				embeds: [
					critical("Sorry, I'm not accepting commands in DM")
				]
			});
		}

		const { prefix } = await client.db.getServer(message.guild!.id);
		if (!message.content.startsWith(prefix!) && ![`<@!${client.user!.id}>`, `<@${client.user!.id}>`].includes(message.content.replace(/ /g, ""))) return;

		if ([`<@!${client.user!.id}>`, `<@${client.user!.id}>`].includes(message.content.replace(/ /g, ""))) {
			return message.reply({
				embeds: [
					regular(`My prefix is "${prefix}"`, undefined, { footer: `Use slash command /help or type ${prefix}help for commands` })
				]
			});
		}

		const args = message.content.slice(prefix!.length).split(/ +/);
		const commandString = args.shift()!.toLowerCase().replace(/ /g, "");
		if (commandString.length === 0) return;


		const command = client.commands.get(commandString) || client.commands.find(cmd => cmd.aliases && cmd.aliases.includes(commandString));
		if (!command) return message.reply({
			embeds: [
				critical("Command was not found!", undefined, { footer: `Use slash command /help or type ${prefix}help for commands` })
			]
		});


		if (!await hasAccess(message.member as GuildMember, command.access)) return message.reply({
			embeds: [
				warning("No access!", "This command requires higher level permissions")
			]
		});

		const missedArg = hasMissedArg(args, command.args);
		if (missedArg.missing) return message.reply({
			embeds: [
				warning("Invalid arguments!", `Command **${command.name}** requires \`${missedArg.text}\` as argument ${missedArg.pos} but you didn't provide it!`)
			]
		});

		try {
			await command.executePrefix(message, args);
		} catch (e: unknown) {
			console.error(e);
			message.reply({
				embeds: [
					critical("Error occurred!", `Error: \`${e}\``)
				]
			});
		}
	};
}