import Event from "../Event";
import { ActivityType, Events } from "discord.js";

export default class ShardResume extends Event {
	event = Events.ShardResume;
	once = true;

	execute = async () => {
		const { client: { user, guilds }} = this;
		
		user?.setActivity(`${guilds.cache.size} servers`, { type: ActivityType.Watching });
	};
}