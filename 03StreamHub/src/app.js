import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

app.use(cors({ origin: process.env.CORS_ORIGIN, credentials: true })); //check if CORS_ORIGIN is defined or not
app.use(express.json({ limit: "16Kb" }));
app.use(express.urlencoded({ extended: true, limit: "16Kb" }));
app.use(express.static("public"));
app.use(cookieParser());


//import routers
import userRouter from "./routers/user.router.js";

//routes declaration
app.use("/api/v1/users", userRouter);


export { app };
