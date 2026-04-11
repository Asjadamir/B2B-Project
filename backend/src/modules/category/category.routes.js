import express from "express";
import authMiddleware from "../../middlewares/auth.middleware.js";

const router = express.Router();

const categoryRoutes = (controllers) => {
    const { getAll, create, update, remove } = controllers;

    router.get("/",    authMiddleware, getAll);
    router.post("/",   authMiddleware, create);
    router.put("/:id", authMiddleware, update);
    router.delete("/:id", authMiddleware, remove);

    return router;
};

export default categoryRoutes;
