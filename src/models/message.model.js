import mongoose, { Schema } from "mongoose";

const messageSchema = new Schema(
    {
        sender: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: [true, "Sender data is required!"],
        },
        receiver: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: [true, "Receiver data is required!"],
        },
        message: {
            type: String,
            required: [true, "Message is required!"],
        },
        file: {
            type: String,
        },
    },
    {
        timestamps: true,
    }
);

const Message = mongoose.model("Message", messageSchema);

export default Message;
