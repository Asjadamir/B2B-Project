import express from "express";
import rateLimit from "express-rate-limit";
import { authValidator, validate } from "../../utils/validator";

const router = express.Router();

// 10 attempts per 15 minutes on sensitive auth endpoints
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: "Too many attempts. Please try again later." },
});

const userRoutes = (controllers) => {
    const {
        signup,
        login,
        logout,
        verifyEmail,
        forgotPassword,
        resetPassword,
    } = controllers;

    router.post("/signup", authValidator.registerRules, validate, signup);
    router.post(
        "/login",
        authValidator.loginRules,
        validate,
        authLimiter,
        login,
    );
    router.post("/logout", logout);
    router.get("/verify-email/:token", verifyEmail);
    router.post(
        "/forgot-password",
        authValidator.forgotPasswordRules,
        validate,
        authLimiter,
        forgotPassword,
    );
    router.post(
        "/reset-password/:token",
        authValidator.resetPasswordRules,
        validate,
        authLimiter,
        resetPassword,
    );
    return router;
};

export default userRoutes;
