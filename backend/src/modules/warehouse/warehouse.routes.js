import express from "express";
import authMiddleware from "../../middlewares/auth.middleware.js";

const router = express.Router();

const warehouseRoutes = (controllers) => {
    const {
        getAll, getById, create, update, remove,
        getStaff, getStaffAssignments,
        assignStaffToWarehouse, updateStaffRole, removeStaffFromWarehouse,
    } = controllers;

    // Warehouse CRUD
    router.get("/",    authMiddleware, getAll);
    router.get("/:id", authMiddleware, getById);
    router.post("/",   authMiddleware, create);
    router.put("/:id", authMiddleware, update);
    router.delete("/:id", authMiddleware, remove);

    // Staff-warehouse assignments
    router.get("/staff/:staffId",          authMiddleware, getStaffAssignments);
    router.get("/:id/staff",               authMiddleware, getStaff);
    router.post("/:id/staff",              authMiddleware, assignStaffToWarehouse);
    router.patch("/:id/staff/:staffId",    authMiddleware, updateStaffRole);
    router.delete("/:id/staff/:staffId",   authMiddleware, removeStaffFromWarehouse);

    return router;
};

export default warehouseRoutes;
