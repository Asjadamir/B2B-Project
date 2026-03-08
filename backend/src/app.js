import express from "express";
import connectdb from "./config/db.js";

const app = express();

const pool = await connectdb();

app.get("/", (req, res) => {
    res.send("Hello World!");
});

export default app;
