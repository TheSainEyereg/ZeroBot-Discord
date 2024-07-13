import { config } from "dotenv";
config();

export default {
	token: process.env.BOT_TOKEN!,
	prefix: process.env.BOT_PREFIX!,
	invite: process.env.BOT_INVITE_LINK!,
	prefixEnabled: !!process.env.BOT_PREFIX,
	superusers: process.env.BOT_SUS?.split(/ +/),

	language: "en-US",

	surrealDB: {
		url: process.env.SURREAL_DB_URL!,
		user: process.env.SURREAL_DB_USER!,
		pass: process.env.SURREAL_DB_PASS!,

		namespace: process.env.SURREAL_DB_NAMESPACE!,
		database: process.env.SURREAL_DB_DATABASE!
	},

	music: {
		volumeDefault: 0.8,

		youtube: {
			cookie: process.env.YOUTUBE_COOKIE!
		},
		spotify: {
			client_id: process.env.SPOTIFY_CLIENT_ID!,
			client_secret: process.env.SPOTIFY_CLIENT_SECRET!,
			refresh_token: process.env.SPOTIFY_REFRESH_TOKEN!,
			market: process.env.SPOTIFY_MARKET!,

			lyricsCookie: process.env.SPOTIFY_LYRICS_COOKIE!
		},
		yandex: {
			uid: parseInt(process.env.YANDEX_UID!),
			access_token: process.env.YANDEX_TOKEN!
		}
	}
};