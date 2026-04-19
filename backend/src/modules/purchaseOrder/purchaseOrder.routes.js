import express from "express";
import authMiddleware from "../../middlewares/auth.middleware.js";
import { purchaseOrderValidator, validate } from "../../utils/validator.js";

const router = express.Router();

const purchaseOrderRoutes = (controllers) => {
    const {
        getSupplierProducts,
        getAll,
        getById,
        create,
        updateStatus,
        addItem,
        updateItem,
        removeItem,
    } = controllers;

    // Must be above /:id to avoid "supplier" being matched as an id param
    router.get("/supplier/:supplierId/products", authMiddleware, getSupplierProducts);

    router.get("/",             authMiddleware, getAll);
    router.get("/:id",          authMiddleware, getById);
    router.post("/",            authMiddleware, purchaseOrderValidator.createRules, validate, create);
    router.patch("/:id/status", authMiddleware, purchaseOrderValidator.updateStatusRules, validate, updateStatus);

    router.post("/:id/items",         authMiddleware, purchaseOrderValidator.addItemRules, validate, addItem);
    router.put("/:id/items/:itemId",  authMiddleware, purchaseOrderValidator.updateItemRules, validate, updateItem);
    router.delete("/:id/items/:itemId", authMiddleware, removeItem);

    return router;
};

export default purchaseOrderRoutes;
