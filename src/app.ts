import process, { env, stdin } from "node:process";
import { Client } from "./Client";
import Database from "./utils/Database";
import config from "./config";

stdin.resume();

const db = new Database();
const client = new Client(db);
client.loginWithDB(config.token, config.mongoUrl);

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

process.on("uncaughtException", (error) => {
	if (error instanceof Error) {
		if (error.message === "write EPIPE")
			return; // console.log("EPIPE was thrown");

		console.error(`uncaughtException N"${error.name}" M"${error.message}"\r\n`, error);
	} else
		console.error("uncaughtException\r\n", error);

	handleInterrupt(1);
});

process.on("unhandledRejection", (reason) => {
	if (reason instanceof Error) {
		if (reason.name === "AbortError" || reason.message === "Status code: 403")
			return;

		console.error(`unhandledRejection N"${reason.name}" M"${reason.message}"\r\n`, reason);
	} else
		console.error("unhandledRejection\r\n", reason);

	handleInterrupt(1);
});