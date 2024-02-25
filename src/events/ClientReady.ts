import { env } from "node:process";
import Event from "../Event";
import { ActivityType, Client, Events } from "discord.js";

export default class Ready extends Event {
	event = Events.ClientReady;
	once = true;

	execute = async (client: Client<true>) => {
		const { application, commands, user, guilds } = client;

		console.log(`Ready! Logged in as ${user.tag}`);
		user.setActivity(`${guilds.cache.size} servers`, { type: ActivityType.Watching });

		// Merge commands with duplicate names
		let commandsJSON = commands.filter(cmd => cmd.data !== null).map(cmd => cmd.data!.toJSON());
		commandsJSON.forEach(cmd => commandsJSON.forEach(c => (c.name === cmd.name && c !== cmd) && (cmd.options = [... cmd.options!, ... c.options!])));
		commandsJSON = commandsJSON.filter((cmd, i) => commandsJSON.findIndex(c => c.name === cmd.name) === i);

		env.NODE_ENV !== "development" ? await application.commands.set(commandsJSON) : await guilds.fetch(env.DEV_GUILD!).then(guild => guild.commands.set(commandsJSON));
		console.log("Slash commands registered!");
	};
}