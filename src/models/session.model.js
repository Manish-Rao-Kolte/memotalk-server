import mongoose, { Schema } from "mongoose";

const sessionSchema = new Schema(
  {
    username: {
      type: String,
      required: true,
    },
    sessionID: {
      type: String,
      required: true,
    },
    userID: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

const Session = mongoose.model("Session", sessionSchema);

export default Session;
