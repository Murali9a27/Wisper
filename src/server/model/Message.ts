import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
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

    status: {
      type: String,
      enum: ["sent", "delivered", "seen"],
      default: "sent",
    },

    time: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

export const Message =
  mongoose.models.Message ||
  mongoose.model("Message", messageSchema);
