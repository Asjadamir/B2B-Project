import express from "express";
import authMiddleware from "../../middlewares/auth.middleware.js";
import { productValidator, validate } from "../../utils/validator.js";

const router = express.Router();

const productRoutes = (controllers) => {
    const { getAll, getById, create, update, remove, addSupplier, removeSupplier } = controllers;

    router.get("/",                              authMiddleware, getAll);
    router.get("/:id",                           authMiddleware, getById);
    router.post("/",                             authMiddleware, productValidator.createRules, validate, create);
    router.put("/:id",                           authMiddleware, productValidator.updateRules, validate, update);
    router.delete("/:id",                        authMiddleware, remove);
    router.post("/:id/suppliers",                authMiddleware, productValidator.addSupplierRules, validate, addSupplier);
    router.delete("/:id/suppliers/:supplierId",  authMiddleware, removeSupplier);

    return router;
};

export default productRoutes;
