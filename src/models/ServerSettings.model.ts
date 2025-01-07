import { Document, Schema, model, Model } from "mongoose";
import config from "../config";

interface  ServerSettings extends Document {
	serverId: string;
	language: string;
	prefix: string;
	prefixEnabled: boolean;
	musicVolume: number;
	musicChannel?: string; 
	logChannel?: string;
}

type ServerSettingsModel = Model<ServerSettings>;

const schema = new Schema<ServerSettings, ServerSettingsModel>({
	serverId: { type: String, required: true },
	language: { type: String, default: config.language },
	prefix: { type: String, default: config.prefix },
	prefixEnabled: { type: Boolean, default: config.prefixEnabled },
	musicVolume: { type: Number, default: config.music.volumeDefault },
	musicChannel: { type: String },
	logChannel: { type: String }
}, { collection: "servers" });

const ServerSettings = model<ServerSettings, ServerSettingsModel>("servers", schema);
export default ServerSettings;