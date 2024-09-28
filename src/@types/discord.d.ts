import type Command from "../Command";
import type Database from "../utils/Database";
import type MusicQueue from "../utils/MusicQueue";
import type { Collection } from "discord.js";


declare module "discord.js" {
    export interface Client {
		commands: Collection<string, Command>;
		musicQueue: Collection<string, MusicQueue>;
		db: Database;

		loginWithDB: (token: string, db_username: string, db_password: string) => Promise<void>;
	}
}