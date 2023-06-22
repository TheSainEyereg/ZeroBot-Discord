import { GuildMember, PermissionFlagsBits } from "discord.js";
import config from "../config";
import { Access } from "./enums";
import { ArgumentCheckAnswer, ParsedArgument } from "../interfaces/bot";


const order = [Access.SuperUser, Access.Owner, Access.Administrator, Access.Moderator, Access.User];

export async function hasAccess(member: GuildMember, type: Access) {
	if (config.superusers?.includes(member.user.id)) return true;

	const restricted = await member.client.db.getRestricted();
	if (restricted.includes(member.user.id)) return false;

	const cloned = [...order];

	if (member.user.id === member.guild.ownerId) return cloned.splice(Access.Administrator).includes(type);

	if (member.permissions.has(PermissionFlagsBits.Administrator)) return cloned.splice(Access.Administrator).includes(type);

	const moderators = await member.client.db.getModerators(member.guild.id);
	if (moderators.includes(member.user.id)) return cloned.splice(Access.Moderator).includes(type);

	return type === Access.User;
}

export function hasMissedArg(passed: string[], required: string[]): ArgumentCheckAnswer {
	const requiredParsed: ParsedArgument[] = required.map(arg => ({text: arg.replace(/(\(|\[)(.*)(\)|\])/, "$2"), optional: !/^\[.*\]$/.test(arg)}));

	for (const i in requiredParsed) {
		if (!passed[i]) {
			if (!requiredParsed[i].optional) return {missing: true, text: requiredParsed[i].text, pos: parseInt(i)+1, all: requiredParsed};
			break;
		}
	}

	return {missing: false, all: requiredParsed};
}