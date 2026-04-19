import express from "express";
import authMiddleware from "../../middlewares/auth.middleware.js";
import { businessValidator, validate } from "../../utils/validator.js";

const router = express.Router();

const businessRoutes = (controllers) => {
    const { create, getMy, getById, update, remove } = controllers;

    router.post("/",    authMiddleware, businessValidator.createRules, validate, create);
    router.get("/my",   authMiddleware, getMy);
    router.get("/:id",  authMiddleware, getById);
    router.put("/:id",  authMiddleware, businessValidator.updateRules, validate, update);
    router.delete("/:id", authMiddleware, remove);

    return router;
};

export default businessRoutes;
