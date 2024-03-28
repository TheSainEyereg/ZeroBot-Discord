import { Client } from "discord.js";

export default abstract class Event {
	abstract event: string;
	abstract execute(...args: (unknown | undefined)[]): void;
	client: Client;
	once = false;

	constructor(client: Client) { this.client = client; }
}
