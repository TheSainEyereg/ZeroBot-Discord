import { Access } from "../enums";
import { CategoryMeta } from "../interfaces/bot";


const meta: CategoryMeta[] = [
	{
		name: "info",
		description: "Commands with useful information",
	},
	{
		name: "moderation",
		description: "Commands for moderation",
		access: Access.Moderator
	},
	{
		name: "music",
		description: "Commands related to music playback and control",
	},
	{
		name: "other",
		description: "Uncategorized miscellaneous commands",
	},
	{
		name: "service",
		description: "Unlisted commands for bot superusers",
		access: Access.SuperUser
	},
	{
		name: "settings",
		access: Access.Administrator,
		description: "Settings"
	},
	{
		name: "ignored",
		description: "-",
		ignored: true
	},
	{
		name: "test",
		description: "-",
		hidden: true
	}
];


export default meta;