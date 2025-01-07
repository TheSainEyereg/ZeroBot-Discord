import { env } from "node:process";
import assert from "node:assert";
import { config } from "dotenv";
import mongoose from "mongoose";
import { Surreal } from "surrealdb.js";

config();
const { MONGODB_URL, SURREAL_DB_URL, SURREAL_DB_NAMESPACE, SURREAL_DB_DATABASE, SURREAL_DB_USER, SURREAL_DB_PASS } = env;

assert(MONGODB_URL, "MONGODB_URL is not defined!");
assert(SURREAL_DB_URL && SURREAL_DB_NAMESPACE && SURREAL_DB_DATABASE && SURREAL_DB_USER && SURREAL_DB_PASS, "SURREAL_DB vars is not defined!");

await mongoose.connect(MONGODB_URL);
const mongo = mongoose.connection.db;

const surreal = new Surreal(SURREAL_DB_URL, {
	ns: SURREAL_DB_NAMESPACE,
	db: SURREAL_DB_DATABASE
});

await surreal.signin({
	user: SURREAL_DB_USER,
	pass: SURREAL_DB_PASS
});

const servers = await surreal.select("servers");
for (const server of servers) {
	const [, serverId ] = server.id.split(":");
	const { prefix, prefixEnabled, language, musicVolume, musicChannel, logChannel } = server;

	if (await mongo.collection("servers").findOne({ serverId }))
		continue;

	await mongo.collection("servers").insertOne({
		serverId,
		prefix,
		prefixEnabled,
		language,
		musicVolume,
		musicChannel,
		logChannel
	});
}
console.log(`${servers.length} servers migrated!`);

const moderators = await surreal.select("moderators");
for (const moderator of moderators) {
	const { serverId, userId } = moderator;

	if (await mongo.collection("moderators").findOne({ serverId, userId }))
		continue;

	await mongo.collection("moderators").insertOne({
		serverId,
		userId
	});
}
console.log(`${moderators.length} moderators migrated!`);

const restricted = await surreal.select("restricted");
for (const restrictedUser of restricted) {
	const { userId } = restrictedUser;

	if (await mongo.collection("restricted").findOne({ userId }))
		continue;

	await mongo.collection("restricted").insertOne({
		userId
	});
}
console.log(`${restricted.length} restricted users migrated!`);

await surreal.close();
await mongoose.disconnect();