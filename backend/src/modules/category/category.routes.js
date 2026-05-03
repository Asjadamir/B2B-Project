import express from "express";
import authMiddleware from "../../middlewares/auth.middleware.js";
import { categoryValidator, validate } from "../../utils/validator.js";

const router = express.Router();

const categoryRoutes = (controllers) => {
    const { getAll, create, update, remove } = controllers;

    router.get("/", authMiddleware, getAll);
    router.post(
        "/",
        authMiddleware,
        categoryValidator.createRules,
        validate,
        create,
    );
    router.put(
        "/:id",
        authMiddleware,
        categoryValidator.updateRules,
        validate,
        update,
    );
    router.delete("/:id", authMiddleware, remove);

    return router;
};

export default categoryRoutes;
