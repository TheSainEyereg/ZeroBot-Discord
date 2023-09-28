import Event from "../Event";
import { Client, Events } from "discord.js";

export default class Ready extends Event {
	event = Events.ClientReady;
	once = true;

	execute = async (client: Client) => {
		console.log(`Ready! Logged in as ${client.user!.tag}`);

		// Merge commands with duplicate names
		const commandsJSON = client.commands.filter(cmd => cmd.data !== null).map(cmd => cmd.data!.toJSON());
		for (const cmd of commandsJSON) {
			for (const c of commandsJSON) {
				if (c.name === cmd.name && c !== cmd) {
					commandsJSON.splice(commandsJSON.indexOf(c), 1);
					cmd.options = [...cmd.options!, ...c.options!];
				}
			}
		}

		//await client.application!.commands.set([]);
		await client.application!.commands.set(commandsJSON);
		console.log("Slash commands registered!");
	};
}