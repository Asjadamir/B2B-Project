import express from "express";
import authMiddleware from "../../middlewares/auth.middleware.js";
import { supplierValidator, validate } from "../../utils/validator.js";

const router = express.Router();

const supplierRoutes = (controllers) => {
    const { getAll, getById, create, update, remove } = controllers;

    router.get("/",       authMiddleware, getAll);
    router.get("/:id",    authMiddleware, getById);
    router.post("/",      authMiddleware, supplierValidator.createRules, validate, create);
    router.put("/:id",    authMiddleware, supplierValidator.updateRules, validate, update);
    router.delete("/:id", authMiddleware, remove);

    return router;
};

export default supplierRoutes;
