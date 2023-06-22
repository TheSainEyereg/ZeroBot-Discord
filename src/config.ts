import { config } from "dotenv";
config();

export default {
	token: process.env.BOT_TOKEN!,
	prefix: process.env.BOT_PREFIX!,
	superusers: process.env.BOT_SUS?.split(/ +/),

	language: "en-US",

	surrealDB: {
		url: process.env.SURREAL_DB_URL!,
		user: process.env.SURREAL_DB_USER!,
		pass: process.env.SURREAL_DB_PASS!,

		namespace: "bots",
		database: "zerobot"
	},

	music: {
		volumeDefault: 0.8
	}
};