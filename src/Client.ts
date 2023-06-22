import fs from "fs";
import path from "path";
import Event from "./Event";
import Command from "./Command";
import type Database from "./components/Database";
import { MusicQueue } from "./interfaces/music";
import { Client as OriginalClient, GatewayIntentBits, Partials, Collection } from "discord.js";


export class Client extends OriginalClient {
	commands: Collection<string, Command>;
	musicQueue: Collection<string, MusicQueue>;
	db: Database;

	constructor(database: Database) {
		super({
			intents: [
				GatewayIntentBits.Guilds, 
				GatewayIntentBits.GuildMessages,
				GatewayIntentBits.GuildMembers, //Whitelist required after 100 servers
				GatewayIntentBits.GuildVoiceStates,
				GatewayIntentBits.GuildMessageReactions,
				GatewayIntentBits.MessageContent, //Whitelist required after 100 servers
				GatewayIntentBits.DirectMessages
			],
			partials: [Partials.Channel, Partials.Message],
			allowedMentions: {
				repliedUser: false
			}
		});
        
		this.commands = new Collection();
		this.musicQueue = new Collection();
		this.db = database;

		const commandsPath = path.join(__dirname, "commands");
		for (const directory of fs.readdirSync(commandsPath)) {
			const dirPath = path.join(commandsPath, directory);
			if (!fs.statSync(dirPath).isDirectory()) continue;

			for (const file of fs.readdirSync(dirPath).filter(f => f.endsWith(".ts") || f.endsWith(".js"))) {
				const filePath = path.join(dirPath, file);

				// eslint-disable-next-line @typescript-eslint/no-var-requires
				const required = require(filePath).default;
	
				const command: Command = new required();
				this.commands.set(command.name, command);
			}
		}

		const eventsPath = path.join(__dirname, "events");
		for (const file of fs.readdirSync(eventsPath).filter(f => f.endsWith(".ts") || f.endsWith(".js"))) {
			const filePath = path.join(eventsPath, file);

			// eslint-disable-next-line @typescript-eslint/no-var-requires
			const required = require(filePath).default;

			const event: Event = new required();
			if (event.once) {
				this.once(event.event, event.execute);
			} else {
				this.on(event.event, event.execute);
			}
		}

		console.log("Bot started");
	}

	loginWithDB = async (token: string, db_username: string, db_password: string) => {
		if (db_username && db_password) await this.db.authenticate(db_username, db_password);
		await this.login(token);
	};
}