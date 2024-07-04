import "dotenv/config";
import { server, io } from "./app.js";
import { connectDB } from "./config/mongoose.config.js";
import setupSocket from "./utils/socket.js";

const port = process.env.PORT || 8000;

connectDB()
  .then(() => {
    setupSocket(io);

    server.listen(port, () => {
      console.log(`server is running on port : ${port}`);
    });
  })
  .catch((err) => {
    console.log(`Mongo DB connection failure: ${err}`);
  });
