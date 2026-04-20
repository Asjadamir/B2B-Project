import express from "express";
import cors from "cors";
import connectdb from "./config/db.js";
import cookieParser from "cookie-parser";
import env from "./config/env.js";
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
import employeeControllers from "./modules/employee/employee.controller.js";
import employeeRoutes from "./modules/employee/employee.routes.js";
import warehouseControllers from "./modules/warehouse/warehouse.controller.js";
import warehouseRoutes from "./modules/warehouse/warehouse.routes.js";
import purchaseOrderRoutes from "./modules/purchaseOrder/purchaseOrder.routes.js";
import purchaseOrderControllers from "./modules/purchaseOrder/purchaseOrder.controller.js";
import saleOrderControllers from "./modules/saleOrder/saleOrder.controller.js";
import saleOrderRoutes from "./modules/saleOrder/saleOrder.routes.js";
import auditLogControllers from "./modules/auditLog/auditLog.controller.js";
import auditLogRoutes from "./modules/auditLog/auditLog.routes.js";

const app = express();

const pool = await connectdb();

app.use(cors({ origin: env.FRONTEND_URL, credentials: true }));
app.use(express.json({ limit: "10kb" }));
app.use(cookieParser());

app.use("/api/auth", authRoutes(authControllers(pool)));

app.use("/api/business", businessRoutes(businessControllers(pool)));

app.use("/api/supplier", supplierRoutes(supplierControllers(pool)));
app.use("/api/category", categoryRoutes(categoryControllers(pool)));
app.use("/api/product", productRoutes(productControllers(pool)));
app.use("/api/employee", employeeRoutes(employeeControllers(pool)));
app.use("/api/warehouse", warehouseRoutes(warehouseControllers(pool)));
app.use(
    "/api/purchaseorder",
    purchaseOrderRoutes(purchaseOrderControllers(pool)),
);
app.use("/api/saleorder", saleOrderRoutes(saleOrderControllers(pool)));
app.use("/api/auditlog", auditLogRoutes(auditLogControllers(pool)));

app.get("/", (req, res) => {
    res.send("Hello World!");
});

// Global error handler — catches any unhandled errors thrown in route handlers
app.use((err, req, res, next) => {
    console.error("Unhandled error:", err);
    res.status(500).json({ message: "Internal server error." });
});

export default app;
