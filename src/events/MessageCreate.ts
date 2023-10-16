import Event from "../Event";
import config from "../config";
import { ChannelType, Events, GuildMember, Message } from "discord.js";
import { hasAccess, hasMissedArg } from "../components/checkManager";
import { critical, regular, warning } from "../components/messages";
import { Access } from "../enums";

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

		const { prefix, prefixEnabled } = await client.db.getServer(message.guild!.id);
		const commandPrefix = prefixEnabled ? prefix : config.prefix;

		if (!message.content.startsWith(commandPrefix!) && ![`<@!${client.user!.id}>`, `<@${client.user!.id}>`].includes(message.content.replace(/ /g, ""))) return;

		if ([`<@!${client.user!.id}>`, `<@${client.user!.id}>`].includes(message.content.replace(/ /g, ""))) {
			return prefixEnabled && message.reply({
				embeds: [
					regular(`My prefix is "${commandPrefix}"`, undefined, { footer: `Use slash command /help or type ${commandPrefix}help for commands` })
				]
			});
		}

		const args = message.content.slice(commandPrefix.length).split(/ +/);
		const commandString = args.shift()!.toLowerCase().replace(/ /g, "");
		if (commandString.length === 0) return;


		const command = client.commands.get(commandString) || client.commands.find((cmd, key) => (key.split(":")[1] === commandString) || (cmd.aliases && cmd.aliases.includes(commandString)));
		if (!command) return prefixEnabled && message.reply({
			embeds: [
				critical("Command was not found!", undefined, { footer: `Use slash command /help or type ${commandPrefix}help for commands` })
			]
		});


		if (!await hasAccess(message.member as GuildMember, prefixEnabled ? command.access : Access.SuperUser)) return prefixEnabled && message.reply({
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
					critical("Error occurred!", `\`\`\`\n${e}\n\`\`\``)
				]
			});
		}
	};
}