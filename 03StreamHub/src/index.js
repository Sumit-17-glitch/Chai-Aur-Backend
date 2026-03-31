import dotenv from "dotenv";
dotenv.config();
import express from "express";
import dbConnect from "./DB/index.js";

console.log(process.env.MONGODB_URI);

const app = express();

dbConnect();


