import mongoose from "mongoose";
import { dbName } from "../constants.js";

const connectDB = async () => {
    try {
        const connectionInstance = await mongoose.connect(
            `${process.env.MONGODB_URI}?dbName=${dbName}`
        );
        console.log(`Host : ${connectionInstance.connection.host}`);
        return connectionInstance;
    } catch (error) {
        console.log("DB connection failure: ", error);
        process.exit(1);
    }
};

export { connectDB };
