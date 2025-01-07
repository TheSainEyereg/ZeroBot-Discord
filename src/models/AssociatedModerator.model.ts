import { Document, Schema, model, Model } from "mongoose";

interface AssociatedModerator extends Document {
	serverId: string;
	userId: string;
}

type AssociatedModeratorModel = Model<AssociatedModerator>

const schema = new Schema<AssociatedModerator, AssociatedModeratorModel>({
	serverId: { type: String, required: true },
	userId: { type: String, required: true }
}, { collection: "moderators" });

const AssociatedModerator = model<AssociatedModerator, AssociatedModeratorModel>("moderators", schema);
export default AssociatedModerator;