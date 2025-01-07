import fs from "fs";
import path from "path";
import Event from "./Event";
import Command from "./Command";
import type Database from "./utils/Database";
import MusicQueue from "./utils/MusicQueue";
import { Client as OriginalClient, GatewayIntentBits, Partials, Collection } from "discord.js";
import meta from "./commands/meta";
import type { CategoryMeta } from "./interfaces/bot";


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

		const eventsPath = path.join(__dirname, "events");
		for (const file of fs.readdirSync(eventsPath).filter(f => f.endsWith(".ts") || f.endsWith(".js"))) {
			const filePath = path.join(eventsPath, file);

			// eslint-disable-next-line @typescript-eslint/no-var-requires
			const required: new (_: Client) => Event = require(filePath).default;

			const event = new required(this);
			if (event.once) {
				this.once(event.event, event.execute);
			} else {
				this.on(event.event, event.execute);
			}
		}

		const commandsPath = path.join(__dirname, "commands");
		const requiredCommands: Command[] = [];
		for (const directory of fs.readdirSync(commandsPath)) {
			const dirPath = path.join(commandsPath, directory);
			if (!fs.statSync(dirPath).isDirectory()) continue;
			
			const categoryMeta = meta.find(c => c.name === directory) || null;
			if (categoryMeta?.ignored) continue;

			for (const file of fs.readdirSync(dirPath).filter(f => f.endsWith(".ts") || f.endsWith(".js"))) {
				const filePath = path.join(dirPath, file);

				// eslint-disable-next-line @typescript-eslint/no-var-requires
				const required: new (_: CategoryMeta | null) => Command = require(filePath).default;
	
				const command = new required(categoryMeta);

				requiredCommands.push(command);
			}
		}

		requiredCommands.forEach(command => this.commands.set(command.name !== command.data?.name ? `${command.data?.name}:${command.name}` : command.name, command));
	}

	loginWithDB = async (token: string, mongoUrl: string) => {
		await this.db.connect(mongoUrl);
		await this.login(token);
	};
}