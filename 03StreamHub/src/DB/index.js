import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";


const dbConnect = async () => {
    try {
        const connectionStatus = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
        console.log("DATAbase Connceted succesfull, HOST :", connectionStatus.connection.host);
    } catch (error) {
        console.log("DATABASE CONNECTION ERROR :" , error);
        process.exit(1) ;       
    }
}

export default dbConnect;