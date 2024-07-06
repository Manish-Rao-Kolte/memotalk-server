import redisClient from "../config/redisClient.config.js";

const setupSocket = (io) => {
  io.use((socket, next) => {
    const userID = socket.handshake.auth.userID;
    if (!userID) {
      return next(new Error("invalid userID"));
    }
    socket.userID = userID; // Store userID in the socket object
    next();
  });

  io.on("connection", async (socket) => {
    // Map userID to socket.id
    await redisClient
      .set(socket.userID, socket.id)
      .catch((err) => console.log("Redis: ", err));

    console.log(
      `User connected: ${socket.userID} with socket ID: ${socket.id}`
    );

    // Handle user disconnection
    socket.on("disconnect", async () => {
      await redisClient.del(socket.userID).catch(console.error);
      console.log(`User disconnected: ${socket.userID}`);
    });

    // Handle sending a message
    socket.on("sendMessage", async (data) => {
      const { recipientID, message } = data;
      try {
        //get previousely stored socket id from redis
        const recipientSocketID = await redisClient.get(recipientID);
        if (!recipientSocketID) {
          console.log(`User ${recipientID} is not connected.`);
          return;
        }
        //emit to recipient
        io.to(recipientSocketID).emit("privateMessage", {
          senderID: socket.userID,
          message,
        });
      } catch (error) {
        console.error("Redis error:", err);
        return;
      }
    });

    socket.on("messageRead", (messageId) => {
      // Update your database (set message with `messageId` to read = true)
      // Emit an event to all connected clients that message with `messageId` is read
      io.emit("messageRead", messageId);
    });
  });
};

export default setupSocket;
