import express from "express";
import authMiddleware from "../../middlewares/auth.middleware.js";
import { employeeValidator, validate } from "../../utils/validator.js";

const router = express.Router();

const employeeRoutes = (controllers) => {
    const { sendInvite, getInviteInfo, acceptInvite, getEmployees, getPendingInvites, updateRole, expel, leave } = controllers;

    // Invite management
    router.post("/invite",              authMiddleware, employeeValidator.sendInviteRules, validate, sendInvite);
    router.get("/invite/:token",                       getInviteInfo);   // public — no auth needed
    router.post("/invite/:token/accept",               employeeValidator.acceptInviteRules, validate, acceptInvite);    // public — no auth needed

    // Employee listing & pending invites
    router.get("/",                     authMiddleware, getEmployees);
    router.get("/invites",              authMiddleware, getPendingInvites);

    // Employee management
    router.patch("/:staffId/role",      authMiddleware, employeeValidator.updateRoleRules, validate, updateRole);
    router.delete("/:staffId",          authMiddleware, expel);
    router.post("/leave",               authMiddleware, employeeValidator.leaveRules, validate, leave);

    return router;
};

export default employeeRoutes;
