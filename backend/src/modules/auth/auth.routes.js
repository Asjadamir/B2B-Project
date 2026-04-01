import express from "express";
const router = express.Router();

const userRoutes = (controllers) => {
    const { signup, login, logout, verifyEmail, forgotPassword, resetPassword } = controllers;
    router.post("/signup", signup);
    router.post("/login", login);
    router.post("/logout", logout);
    router.get("/verify-email/:token", verifyEmail);
    router.post("/forgot-password", forgotPassword);
    router.post("/reset-password/:token", resetPassword);
    return router;
};

export default userRoutes;
