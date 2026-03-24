import express from "express";
import connectdb from "./config/db.js";
import authControllers from "./modules/auth/auth.controllers.js";
import authRoutes from "./modules/auth/auth.routes.js";

const app = express();

const pool = await connectdb();

app.use(express.json());
app.use(cookieParser());

app.use("/api/auth", authRoutes(authControllers(pool)));

app.get("/", (req, res) => {
    res.send("Hello World!");
});

export default app;
