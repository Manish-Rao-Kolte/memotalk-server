import "dotenv/config";
import { server, io } from "./app.js";
import { connectDB } from "./config/mongoose.config.js";

const port = process.env.PORT || 3001;

connectDB()
    .then(() => {
        server.listen(port, () => {
            console.log(`server is running on port : ${port}`);
        });
        io.on("connection", (socket) => {
            // console.log("a user connected!");
            socket.on("chat-message", (msg) => {
                io.emit("chat-message", msg);
            });
            socket.on("disconnect", () => {
                // console.log("user disconnected!");
            });
        });
    })
    .catch((err) => {
        console.log(`Mongo DB connection failure: ${err}`);
    });
