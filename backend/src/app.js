import express from "express";
import connectdb from "./config/db.js";
import cookieParser from "cookie-parser";
import authControllers from "./modules/auth/auth.controllers.js";
import authRoutes from "./modules/auth/auth.routes.js";
import businessControllers from "./modules/business/business.controllers.js";
import businessRoutes from "./modules/business/business.routes.js";
import supplierControllers from "./modules/supplier/supplier.controllers.js";
import supplierRoutes from "./modules/supplier/supplier.routes.js";

const app = express();

const pool = await connectdb();

app.use(express.json());
app.use(cookieParser());

app.use("/api/auth", authRoutes(authControllers(pool)));

app.use("/api/business", businessRoutes(businessControllers(pool)));

app.use("/api/supplier", supplierRoutes(supplierControllers(pool)));

app.get("/", (req, res) => {
    res.send("Hello World!");
});

export default app;
