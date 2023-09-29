import { Client } from "./Client";
import Database from "./components/Database";
import config from "./config";
const { surrealDB } = config;

process.stdin.resume();


const db = new Database({
	prefix: config.prefix,
	prefixEnabled: config.prefixEnabled,
	language: config.language,
	musicVolume: config.music.volumeDefault,
});
db.connect(surrealDB.url, surrealDB.namespace, surrealDB.database);

const client = new Client(db);
client.loginWithDB(config.token, surrealDB.user, surrealDB.pass);


// function handleInterrupt(code: number) {
// 	process.removeAllListeners();

// 	console.log("Bot exiting with code: " + code);

// 	process.exit(code);
// }

// process.once("exit", handleInterrupt);
// process.once("SIGINT", handleInterrupt);
// process.once("SIGUSR1", handleInterrupt);
// process.once("SIGUSR2", handleInterrupt);