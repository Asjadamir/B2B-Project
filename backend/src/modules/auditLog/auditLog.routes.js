import express from "express";
import authMiddleware from "../../middlewares/auth.middleware.js";

const router = express.Router();

const auditLogRoutes = (controllers) => {
    const { getAll } = controllers;
    router.get("/", authMiddleware, getAll);
    return router;
};

export default auditLogRoutes;
