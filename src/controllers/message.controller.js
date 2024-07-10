import { asyncHandler } from "../utils/asyncHandler.js";
import { apiError } from "../utils/apiError.js";
import Message from "../models/message.model.js";
import { apiResponse } from "../utils/apiResponse.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import fs from "fs";

const createMessage = asyncHandler(async (req, res) => {
  const filePath = req?.file?.path;
  if (!req.user) {
    if (filePath) {
      fs.unlinkSync(filePath);
    }
    throw new apiError(401, "Unauthorized access!");
  }
  const { message, sender, recipient } = req.body;
  if (!sender || !recipient) {
    throw new apiError(400, "Sender data and recipient data is required!");
  }
  if (!filePath && !message) {
    throw new apiError(400, "Message content or file data is required!");
  }

  const messageData = {
    sender,
    recipient,
    message,
    file: "",
  };
  if (filePath) {
    const instance = await uploadOnCloudinary(filePath);
    if (!instance || instance?.name === "Error") {
      fs.unlinkSync(filePath); //deleting file from temp to clear storage.
      throw new apiError(500, "Error while uploading file!");
    }
    messageData.file = instance.url;
    fs.unlinkSync(filePath);
  }

  const newMessage = await Message.create(messageData);

  if (!newMessage) {
    throw new apiError(500, "Error while creating new message!");
  }

  return res
    .status(201)
    .json(
      new apiResponse(201, true, newMessage, "Message crated successfully!")
    );
});

const getMessages = asyncHandler(async (req, res) => {
  const { user, friend } = req.query;
  if (!user && !friend) {
    throw new apiError(400, "Sender and Reciver id is required!");
  }
  const messages = await Message.find({
    $or: [
      { sender: user, recipient: friend },
      { sender: friend, recipient: user },
    ],
  }).sort({ timestamp: 1 });
  if (!messages) {
    throw new apiError(500, "Error while fetching messages!");
  }
  return res
    .status(200)
    .json(
      new apiResponse(200, true, messages, "Messages fetched successfully!")
    );
});

const markMessagesAsRead = asyncHandler(async (req, res) => {
  const { userId, senderId } = req.body;

  if (!userId || !senderId) {
    throw new apiError(400, "Recipient and sender id's are required!");
  }

  const markedChatsAsRead = await Message.updateMany(
    {
      sender: senderId,
      recipient: userId,
    },
    {
      $set: { read: true },
    }
  );

  return res
    .status(200)
    .json(new apiResponse(200, true, null, "Messages update successfully!"));
});

const markMessageAsRead = asyncHandler(async (req, res) => {
  const { messageId } = req.body;

  if (!messageId) {
    throw new apiError(400, "Message Id is required!");
  }

  const updatedMessage = await Message.findByIdAndUpdate(messageId, {
    $set: { read: true },
  });

  if (!updatedMessage) {
    throw new apiError(500, "Unable to mark message as read!");
  }

  return res
    .status(200)
    .json(new apiResponse(200, true, null, "Message marked as read!"));
});

export { createMessage, getMessages, markMessagesAsRead, markMessageAsRead };
