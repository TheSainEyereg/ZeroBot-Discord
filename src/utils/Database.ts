import mongoose from "mongoose";

import ServerSettings from "../models/ServerSettings.model";
import AssociatedModerator from "../models/AssociatedModerator.model";
import RestrictedUser from "../models/RestrictedUser.model";

export default class Database {
	connect = (url: string) => mongoose.connect(url);
	close = () => mongoose.disconnect();

	getServer = (serverId: string) => ServerSettings
		.findOne({ serverId })
		.then(r => r || ServerSettings.create({ serverId }));

	updateServer = (serverId: string, key: keyof ServerSettings, value: ServerSettings[keyof ServerSettings]) => ServerSettings.findOneAndUpdate({ serverId }, { [key]: value });

	getModerators = (serverId: string) => AssociatedModerator
		.find({ serverId })
		.then(r => r.map(({ userId }) => userId));

	addModerator = (serverId: string, userId: string) => AssociatedModerator.create({ serverId, userId });
	removeModerator = (serverId: string, userId: string) => AssociatedModerator.deleteOne({ serverId, userId });

	getRestricted = () => RestrictedUser
		.find()
		.then(r => r.map(({ userId }) => userId));

	addRestrictedUser = (userId: string) => RestrictedUser.create({ userId });
	removeRestrictedUser = (userId: string) => RestrictedUser.deleteOne({ userId });
}