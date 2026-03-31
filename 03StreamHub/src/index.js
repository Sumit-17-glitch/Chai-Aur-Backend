import dotenv from "dotenv";
dotenv.config({
  path: "./env",
});
import mongoose from "mongoose";
import { DB_NAME } from "./constants.js";
import express from "express";
import dbConnect from "./DB/index.js";

const app = express();

dbConnect();

// effies
// (async () => {
//   console.log("started async part");

//   try {
//     console.log("before await");

//     app.listen(process.env.PORT, ()=>{
//         console.log(`App is listning on port ${process.env.PORT}`);
//     })

//     await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
//     console.log("after await");
//     app.on("error", (error) => {
//         console.log("ERROR :", error);
//         // throw error;
//     })

//   } catch (error) {
//     console.log("ERROR :", error);
//     //   throw error;
//   }
// })();
