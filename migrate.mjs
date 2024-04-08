import { env } from "node:process";
import { readdir, readFile, rm } from "node:fs/promises";
import { config } from "dotenv";
import { Surreal } from "surrealdb.js";

config();

const db = new Surreal(env.SURREAL_DB_URL, {
	ns: env.SURREAL_DB_NAMESPACE,
	db: env.SURREAL_DB_DATABASE
});


await db.signin({
	user: env.SURREAL_DB_USER,
	pass: env.SURREAL_DB_PASS
});

for (const file of await readdir("./storage")) {
	const settings = JSON.parse(await readFile(`./storage/${file}`));
	const serverId = file.split(".")[0];

	try {
		await db.create(`servers:${serverId}`, {
			prefix: settings.prefix,
			prefixEnabled: true,
			language: settings.language,
			musicVolume: settings.musicVolume,
			musicChannel: settings.musicChannel || undefined,
			logChannel: settings.logsChannel || undefined,
		});
	} catch (error) {
		console.log(`Server ${serverId} already migrated!`);
		continue;
	}

	for (const userId of settings.moderators) await this.db.create("moderators", { serverId, userId }).catch(() => null);
	
	console.log(`Server ${serverId} migrated!`);
}

await db.close();

await rm("./storage", { recursive: true, force: true });