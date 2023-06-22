import Event from "../Event";
import { Client, Events } from "discord.js";

export default class Ready extends Event {
	event = Events.ClientReady;
	once = true;

	execute = async (client: Client) => {
		console.log("Ready!");

		//await client.application!.commands.set([]);
		await client.application!.commands.set(client.commands.filter(cmd => cmd.data !== null).map(cmd => cmd.data!));
	};
}