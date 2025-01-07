import { Document, Schema, model, Model } from "mongoose";

interface RestrictedUser extends Document {
	userId: string;
}

type RestrictedUserModel = Model<RestrictedUser>;

const schema = new Schema<RestrictedUser, RestrictedUserModel>({
	userId: { type: String, required: true }
}, { collection: "restricted" });

const RestrictedUser = model<RestrictedUser, RestrictedUserModel>("restricted", schema);
export default RestrictedUser;