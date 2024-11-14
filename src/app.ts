import process, { env, stdin } from "node:process";
import { Client } from "./Client";
import Database from "./utils/Database";
import config from "./config";
const { surrealDB } = config;

stdin.resume();

const db = new Database({
	prefix: config.prefix,
	prefixEnabled: config.prefixEnabled,
	language: config.language,
	musicVolume: config.music.volumeDefault,
});
db.connect(surrealDB.url, surrealDB.namespace, surrealDB.database);

const client = new Client(db);
client.loginWithDB(config.token, surrealDB.user, surrealDB.pass);

async function handleInterrupt(code: number) {
	process.removeAllListeners();

	console.log("Trying to exit gracefully...");
	env.NODE_ENV !== "development" && await client.application?.commands.set([]);
	await client.destroy();

	console.log("Bot exiting with code: " + code);
	process.exit(isNaN(code) ? 0 : code);
}

process.once("exit", handleInterrupt);
process.once("SIGINT", handleInterrupt);
process.once("SIGUSR1", handleInterrupt);
process.once("SIGUSR2", handleInterrupt);


process.on("unhandledRejection", (reason) => {
	if (reason instanceof Error) {
		if (reason.name === "AbortError" || reason.message === "Status code: 403")
			return;

		console.error(`unhandledRejection N"${reason.name}" M"${reason.message}"\r\n`, reason);
	} else
		console.error("unhandledRejection\r\n", reason);

	handleInterrupt(1);
});