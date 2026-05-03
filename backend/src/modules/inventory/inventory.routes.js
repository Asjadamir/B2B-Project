import express from "express";
import authMiddleware from "../../middlewares/auth.middleware.js";

const router = express.Router();

const inventoryRoutes = (controllers) => {
    const { getAll, adjust, transfer } = controllers;

    router.get("/",          authMiddleware, getAll);
    router.post("/adjust",   authMiddleware, adjust);
    router.post("/transfer", authMiddleware, transfer);

    return router;
};

export default inventoryRoutes;
