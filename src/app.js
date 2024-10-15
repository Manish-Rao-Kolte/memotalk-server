import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import userRouter from "./routes/api/user.route.js";
import cookieParser from "cookie-parser";
import messageRouter from "./routes/api/message.route.js";

const app = express();
app.use(
  cors({
    origin: process.env.CLIENT_URL,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    credentials: true,
  })
);

app.use(
  express.urlencoded({
    extended: true,
    limit: "15mb",
  })
);

app.use(
  express.json({
    limit: "15mb",
  })
);

app.use(cookieParser());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    credentials: true,
  },
});

app.use("/api/users", userRouter);
app.use("/api/messages", messageRouter);

app.use((err, req, res, next) => {
  if (err) {
    console.log("From error handler: ", err);
    // Determine the status code based on the error
    const statusCode = err?.statusCode || 500; // Default to 500 if no status code is set

    // Send a JSON response with the error message and status code
    res.status(statusCode).json({ error: err?.message });
  } else {
    next();
  }
});

export { server, io };
