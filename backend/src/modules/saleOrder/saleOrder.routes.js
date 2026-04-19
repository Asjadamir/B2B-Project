import express from "express";
import authMiddleware from "../../middlewares/auth.middleware.js";
import { saleOrderValidator, validate } from "../../utils/validator.js";

const router = express.Router();

const saleOrderRoutes = (controllers) => {
    const {
        getWarehouseProducts,
        getAll,
        getById,
        create,
        updateStatus,
        addItem,
        updateItem,
        removeItem,
    } = controllers;

    // Must be above /:id to avoid "warehouse" being matched as an id param
    router.get("/warehouse/:warehouseId/products", authMiddleware, getWarehouseProducts);

    router.get("/",             authMiddleware, getAll);
    router.get("/:id",          authMiddleware, getById);
    router.post("/",            authMiddleware, saleOrderValidator.createRules, validate, create);
    router.patch("/:id/status", authMiddleware, saleOrderValidator.updateStatusRules, validate, updateStatus);

    router.post("/:id/items",           authMiddleware, saleOrderValidator.addItemRules, validate, addItem);
    router.put("/:id/items/:itemId",    authMiddleware, saleOrderValidator.updateItemRules, validate, updateItem);
    router.delete("/:id/items/:itemId", authMiddleware, removeItem);

    return router;
};

export default saleOrderRoutes;
