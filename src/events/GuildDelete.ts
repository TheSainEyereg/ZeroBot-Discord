import Event from "../Event";
import { ActivityType, Events, Guild } from "discord.js";

export default class GuildDelete extends Event {
	event = Events.GuildDelete;
	once = true;

	execute = async (guild: Guild) => {
		const { client: { user, guilds }} = guild;
		
		user.setActivity(`${guilds.cache.size} servers`, { type: ActivityType.Watching });
	};
}