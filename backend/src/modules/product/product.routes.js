import express from "express";
import authMiddleware from "../../middlewares/auth.middleware.js";

const router = express.Router();

const productRoutes = (controllers) => {
    const { getAll, getById, create, update, remove, addSupplier, removeSupplier } = controllers;

    router.get("/",                              authMiddleware, getAll);
    router.get("/:id",                           authMiddleware, getById);
    router.post("/",                             authMiddleware, create);
    router.put("/:id",                           authMiddleware, update);
    router.delete("/:id",                        authMiddleware, remove);
    router.post("/:id/suppliers",                authMiddleware, addSupplier);
    router.delete("/:id/suppliers/:supplierId",  authMiddleware, removeSupplier);

    return router;
};

export default productRoutes;
