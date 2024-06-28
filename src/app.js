import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import userRouter from "./routes/api/user.route.js";
import cookieParser from "cookie-parser";

const app = express();
app.use(
  cors({
    origin: process.env.CLIENT_URL,
    methods: ["GET", "POST", "PUT", "DELETE"],
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
    credentials: true,
  },
});

app.use("/api/users", userRouter);

export { server, io };
