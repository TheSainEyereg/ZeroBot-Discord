/* eslint-disable */
const fs = require("fs");
const { Surreal } = require("surrealdb.js");
require("dotenv").config();

const db = new Surreal(process.env.SURREAL_DB_URL, {
	ns: "bots",
	db: "zerobot"
});

(async () => {
	await db.signin({
		user: process.env.SURREAL_DB_USER,
		pass: process.env.SURREAL_DB_PASS
	});
	
	for (const file of fs.readdirSync("./storage")) {
		const settings = JSON.parse(fs.readFileSync(`./storage/${file}`));
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

		for (const userId of settings.moderators) await this.db.create("moderators", { serverId, userId }).catch(() => {});
		
		console.log(`Server ${serverId} migrated!`);
	}

	await db.close();

	fs.unlinkSync("./storage");

})().catch(err => console.error(err));