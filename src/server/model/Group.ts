import mongoose, { Schema, Document } from "mongoose";

export interface IGroup extends Document {
  name: string;
  members: string[];
}

const GroupSchema = new Schema<IGroup>(
  {
    name: {
      type: String,
      required: true,
    },
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.models.Group ||
  mongoose.model<IGroup>("Group", GroupSchema);