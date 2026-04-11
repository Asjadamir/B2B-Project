import express from "express";
import connectdb from "./config/db.js";
import cookieParser from "cookie-parser";
import authControllers from "./modules/auth/auth.controllers.js";
import authRoutes from "./modules/auth/auth.routes.js";
import businessControllers from "./modules/business/business.controllers.js";
import businessRoutes from "./modules/business/business.routes.js";
import supplierControllers from "./modules/supplier/supplier.controllers.js";
import supplierRoutes from "./modules/supplier/supplier.routes.js";
import categoryControllers from "./modules/category/category.controllers.js";
import categoryRoutes from "./modules/category/category.routes.js";
import productControllers from "./modules/product/product.controllers.js";
import productRoutes from "./modules/product/product.routes.js";

const app = express();

const pool = await connectdb();

app.use(express.json());
app.use(cookieParser());

app.use("/api/auth", authRoutes(authControllers(pool)));

app.use("/api/business", businessRoutes(businessControllers(pool)));

app.use("/api/supplier", supplierRoutes(supplierControllers(pool)));
app.use("/api/category", categoryRoutes(categoryControllers(pool)));
app.use("/api/product",  productRoutes(productControllers(pool)));

app.get("/", (req, res) => {
    res.send("Hello World!");
});

export default app;
