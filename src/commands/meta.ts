import { Access } from "../components/enums";
import { CategoryMeta } from "../interfaces/bot";


const meta: CategoryMeta[] = [
	{
		name: "info",
		description: "Category with commands that returns useful information",
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
	}
];


export default meta;