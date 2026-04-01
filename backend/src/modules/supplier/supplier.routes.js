import express from "express";
import authMiddleware from "../../middlewares/auth.middleware.js";

const router = express.Router();

const supplierRoutes = (controllers) => {
    const { getAll, getById, create, update, remove } = controllers;

    router.get("/",    authMiddleware, getAll);
    router.get("/:id", authMiddleware, getById);
    router.post("/",   authMiddleware, create);
    router.put("/:id", authMiddleware, update);
    router.delete("/:id", authMiddleware, remove);

    return router;
};

export default supplierRoutes;
