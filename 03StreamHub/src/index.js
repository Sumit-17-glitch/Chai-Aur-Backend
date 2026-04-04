import dotenv from "dotenv";
dotenv.config();

import dbConnect from "./DB/index.js";
import { app } from "./app.js";

dbConnect()
.then(() => {
    app.listen(process.env.PORT || 8000, () => {
        console.log(`Server is listning on port ${process.env.PORT || 8000}`);
    })
    app.get("/", (req, res) => {
        res.send("get succesfull")
    })
})
.catch((e) => {
    console.log("MONGO db connection error : ", e);
})


