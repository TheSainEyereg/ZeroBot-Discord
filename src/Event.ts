import { Client } from "./Client";


export default abstract class Event {
	client: Client;

	abstract event: string;
	abstract execute(args?: unknown): void;
	once = false;

	constructor(client: Client) {
		this.client = client;
	}
}
