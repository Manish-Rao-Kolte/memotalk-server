import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import userRouter from "./routes/api/user.route.js";
import cookieParser from "cookie-parser";

const app = express();
app.use(
    cors({
        origin: "http://localhost:5173/",
        methods: ["GET", "POST", "PUT", "DELETE"],
        credentials: true,
    })
);

app.use(
    express.urlencoded({
        extended: true,
        limit: "16kb",
    })
);

app.use(
    express.json({
        limit: "16kb",
    })
);

app.use(cookieParser());

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "http://localhost:5173",
        credentials: true,
    },
});

app.use("/api/users", userRouter);

export { server, io };
