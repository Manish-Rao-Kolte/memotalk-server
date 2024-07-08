import redis from "redis";
import createRedisClient from "../config/redisClient.config.js";
import User from "../models/user.model.js";

const setupSocket = async (io) => {
  const redisClient = await createRedisClient();

  io.use((socket, next) => {
    const userID = socket.handshake.auth.userID;
    if (!userID) {
      return next(new Error("invalid userID"));
    }
    socket.userID = userID; // Store userID in the socket object
    next();
  });

  io.on("connection", async (socket) => {
    // Handle user connection and send friends' current status
    socket.on("userConnect", async ({ userId }) => {
      const userData = {
        socketId: socket.id,
        status: "online",
        lastSeen: null,
      };

      // Map userID and status details
      await redisClient.hSet(
        "users",
        socket.userID,
        JSON.stringify(userData),
        redis.print
      );

      await User.findByIdAndUpdate(userId, {
        $set: { active: true },
      });

      console.log(
        `User connected: ${socket.userID} with socket ID: ${socket.id}`
      );
      io.emit("userConnected", socket.userID);
    });

    // Handle user disconnection
    socket.on("disconnect", async () => {
      const userData = {
        socketId: null,
        status: "offline",
        lastSeen: new Date().toISOString(),
      };
      await redisClient.hSet(
        "users",
        socket.userID,
        JSON.stringify(userData),
        redis.print
      );
      await User.findByIdAndUpdate(socket.userID, {
        $set: { active: false, lastSeen: new Date().toISOString() },
      });
      console.log(`User disconnected: ${socket.userID}`);
      io.emit("userDisconnected", socket.userID);
    });

    // Handle sending a message
    socket.on("sendMessage", async (data) => {
      const { recipientID, message } = data;
      try {
        const recipient = JSON.parse(
          await redisClient.hGet("users", recipientID)
        );
        const recipientSocketID = recipient?.socketId;
        if (!recipientSocketID) {
          console.log(`User ${recipientID} is not connected.`);
          return;
        }
        // Emit to recipient
        io.to(recipientSocketID).emit("privateMessage", {
          senderID: socket.userID,
          message,
        });
      } catch (error) {
        console.error("Redis error:", error);
      }
    });

    socket.on("messageRead", (data) => {
      // Update database (set message with `messageId` to read = true)
      // Emit an event to all connected clients that the message with `messageId` is read
      io.emit("messageRead", data);
    });
  });
};

export default setupSocket;
