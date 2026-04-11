import express from "express";
import authMiddleware from "../../middlewares/auth.middleware.js";

const router = express.Router();

const employeeRoutes = (controllers) => {
    const { sendInvite, getInviteInfo, acceptInvite, getEmployees, getPendingInvites, updateRole, expel, leave } = controllers;

    // Invite management
    router.post("/invite",                authMiddleware, sendInvite);
    router.get("/invite/:token",                         getInviteInfo);   // public — no auth needed
    router.post("/invite/:token/accept",                 acceptInvite);    // public — no auth needed

    // Employee listing & pending invites
    router.get("/",                       authMiddleware, getEmployees);
    router.get("/invites",                authMiddleware, getPendingInvites);

    // Employee management
    router.patch("/:staffId/role",        authMiddleware, updateRole);
    router.delete("/:staffId",            authMiddleware, expel);
    router.post("/leave",                 authMiddleware, leave);

    return router;
};

export default employeeRoutes;
