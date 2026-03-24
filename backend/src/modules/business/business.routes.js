import express from "express";
import authMiddleware from "../../middlewares/auth.middleware.js";

const router = express.Router();

const businessRoutes = (controllers) => {
    const { create, getMy, getById, update, remove } = controllers;

    router.post("/", authMiddleware, create);
    router.get("/my", authMiddleware, getMy);
    router.get("/:id", authMiddleware, getById);
    router.put("/:id", authMiddleware, update);
    router.delete("/:id", authMiddleware, remove);

    return router;
};

export default businessRoutes;
