import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

const dbConnect = async () => {
    try {
        if (!process.env.MONGODB_URI) {
            throw new Error("MONGODB_URI environment variable is not set");
        }
        if (!DB_NAME) {
            throw new Error("DB_NAME is not defined in constants.js");
        }
        const connectionStatus = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
        console.log("Database Connected Successfully, HOST:", connectionStatus.connection.host);
    } catch (error) {
        console.error("DATABASE CONNECTION ERROR:", error.message);
        process.exit(1);
    }
};

export default dbConnect;