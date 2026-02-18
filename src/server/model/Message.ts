import mongoose, { Schema, Document } from "mongoose";

export interface IMessage extends Document {
  from: string;
  to: string;
  message: string;
  roomId: string;
  status: "sent" | "delivered" | "seen";
  createdAt: Date;
}

const MessageSchema = new Schema<IMessage>(
  {
    from: {
      type: String,
      required: true,
    },

    to: {
      type: String,
      required: true,
    },

    message: {
      type: String,
      required: true,
    },

    roomId: {
      type: String,
      required: true,
    },

    status: {
      type: String,
      enum: ["sent", "delivered", "seen"],
      default: "sent",
    },
  },
  {
    timestamps: true, // adds createdAt & updatedAt
  }
);

export default mongoose.models.Message ||
  mongoose.model<IMessage>("Message", MessageSchema);
