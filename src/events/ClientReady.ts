import Event from "../Event";
import { Client, Events } from "discord.js";

export default class Ready extends Event {
	event = Events.ClientReady;
	once = true;

	execute = async (client: Client) => {
		console.log(`Ready! Logged in as ${client.user!.tag}`);

		// Merge commands with duplicate names
		let commandsJSON = client.commands.filter(cmd => cmd.data !== null).map(cmd => cmd.data!.toJSON());
		commandsJSON.forEach(cmd => commandsJSON.forEach(c => (c.name === cmd.name && c !== cmd) && (cmd.options = [... cmd.options!, ... c.options!])));
		commandsJSON = commandsJSON.filter((cmd, i) => commandsJSON.findIndex(c => c.name === cmd.name) === i);

		//await client.application!.commands.set([]);
		await client.application!.commands.set(commandsJSON);
		console.log("Slash commands registered!");
	};
}