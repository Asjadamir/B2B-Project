import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import nodemailer from "nodemailer";
import queries from "./auth.queries.js";
import env from "../../config/env.js";
import asyncHandler from "../../utils/asyncHandler.js";

const transporter = nodemailer.createTransport({
    port: 465,
    host: "smtp.gmail.com",
    auth: {
        user: env.EMAIL_USER,
        pass: env.EMAIL_PASSWORD,
    },
});

const authControllers = {
    signup: asyncHandler(async (req, res) => {
        const { fullName, email, password } = req.body;

        if (!fullName || !email || !password) {
            return res.status(400).json({ message: "All fields are required." });
        }

        const existingUser = await queries.findUserByEmail(email);

        if (existingUser && existingUser.IsVerified) {
            return res.status(409).json({ message: "Email is already registered." });
        }

        const passwordHash = await bcrypt.hash(password, 12);
        const token = crypto.randomBytes(32).toString("hex");

        if (existingUser && !existingUser.IsVerified) {
            const existingToken = await queries.getVerifyTokenByUserId(existingUser.UserID);

            if (existingToken && new Date() < new Date(existingToken.ValidTill)) {
                return res.status(200).json({
                    message: "A verification email has already been sent. Please check your inbox.",
                });
            }

            await queries.updateUnverifiedUser(existingUser.UserID, fullName, passwordHash);
            await queries.deleteVerifyTokensByUserId(existingUser.UserID);
            await queries.createVerifyToken(
                existingUser.UserID,
                token,
                new Date(Date.now() + 2 * 60 * 60 * 1000),
            );

            const verifyUrl = `${env.FRONTEND_URL}/verify-email/${token}`;
            await transporter.sendMail({
                from: env.EMAIL_USER,
                to: email,
                subject: "CoreChain — Verify your email",
                html: `
                    <h2>Welcome back to CoreChain, ${fullName}!</h2>
                    <p>Your details have been updated. Click the link below to verify your account.</p>
                    <p>This link expires in 2 hours.</p>
                    <a href="${verifyUrl}">${verifyUrl}</a>
                `,
            });

            return res.status(200).json({ message: "A new verification link has been sent to your email." });
        }

        const userId = await queries.createUser(fullName, email, passwordHash);
        await queries.createVerifyToken(
            userId,
            token,
            new Date(Date.now() + 2 * 60 * 60 * 1000),
        );

        const verifyUrl = `${env.FRONTEND_URL}/verify-email/${token}`;
        await transporter.sendMail({
            from: env.EMAIL_USER,
            to: email,
            subject: "CoreChain — Verify your email",
            html: `
                <h2>Welcome to CoreChain, ${fullName}!</h2>
                <p>Click the link below to verify your account.</p>
                <p>This link expires in 2 hours.</p>
                <a href="${verifyUrl}">${verifyUrl}</a>
            `,
        });

        return res.status(201).json({
            message: "Account created. Please check your email to verify your account.",
        });
    }),

    login: asyncHandler(async (req, res) => {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: "Email and password are required." });
        }

        const user = await queries.findUserByEmail(email);
        if (!user) {
            return res.status(401).json({ message: "Invalid email or password." });
        }

        const isMatch = await bcrypt.compare(password, user.PasswordHash);
        if (!isMatch) {
            return res.status(401).json({ message: "Invalid email or password." });
        }

        if (!user.IsVerified) {
            return res.status(401).json({
                message: "Email is not registered or verified. Please sign up again.",
            });
        }

        const jwtToken = jwt.sign(
            { userId: user.UserID, email: user.Email },
            env.JWT_SECRET,
            { expiresIn: env.JWT_EXPIRES_IN },
        );

        res.cookie("token", jwtToken, {
            httpOnly: true,
            secure: env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 24 * 60 * 60 * 1000,
        });

        return res.status(200).json({
            message: "Login successful.",
            data: {
                email: user.Email,
                userId: user.UserID,
                userName: user.FullName,
            },
        });
    }),

    logout: asyncHandler(async (req, res) => {
        res.clearCookie("token", {
            httpOnly: true,
            secure: env.NODE_ENV === "production",
            sameSite: "strict",
        });
        return res.status(200).json({ message: "Logged out successfully." });
    }),

    verifyEmail: asyncHandler(async (req, res) => {
        const { token } = req.params;

        const record = await queries.getVerifyToken(token);
        if (!record) {
            return res.status(400).json({ message: "Invalid verification link." });
        }

        if (new Date() > new Date(record.ValidTill)) {
            await queries.deleteVerifyToken(token);
            return res.status(400).json({
                message: "Verification link has expired. Please sign up again.",
            });
        }

        await queries.markUserVerified(record.UserID);
        await queries.deleteVerifyToken(token);

        return res.status(200).json({
            message: "Email verified successfully. You can now log in.",
        });
    }),

    me: asyncHandler(async (req, res) => {
        const user = await queries.findUserById(req.user.userId);
        if (!user) {
            return res.status(404).json({ message: "User not found." });
        }
        return res.status(200).json({
            data: {
                email: user.Email,
                userId: user.UserID,
                userName: user.FullName,
            },
        });
    }),

    forgotPassword: asyncHandler(async (req, res) => {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ message: "Email is required." });
        }

        const user = await queries.findUserByEmail(email);

        if (!user || !user.IsVerified) {
            return res.status(404).json({
                message: "Email is not registered or verified. Please sign up again.",
            });
        }

        const token = crypto.randomBytes(32).toString("hex");
        await queries.saveResetToken(
            user.UserID,
            token,
            new Date(Date.now() + 60 * 60 * 1000),
        );

        const resetUrl = `${env.FRONTEND_URL}/reset-password/${token}`;
        await transporter.sendMail({
            from: env.EMAIL_USER,
            to: email,
            subject: "CoreChain — Reset your password",
            html: `
                <h2>Password Reset Request</h2>
                <p>Click the link below to reset your password. This link expires in 1 hour.</p>
                <a href="${resetUrl}">${resetUrl}</a>
                <p>If you did not request this, ignore this email.</p>
            `,
        });

        return res.status(200).json({
            message: "A password reset link has been sent to your email.",
        });
    }),

    resetPassword: asyncHandler(async (req, res) => {
        const { token } = req.params;
        const { password } = req.body;

        if (!password) {
            return res.status(400).json({ message: "New password is required." });
        }

        const record = await queries.getResetToken(token);
        if (!record) {
            return res.status(400).json({ message: "Invalid or expired reset link." });
        }

        if (new Date() > new Date(record.ValidTill)) {
            await queries.deleteResetToken(token);
            return res.status(400).json({
                message: "Reset link has expired. Please request a new one.",
            });
        }

        const passwordHash = await bcrypt.hash(password, 12);
        await queries.updatePassword(record.UserID, passwordHash);
        await queries.deleteResetToken(token);

        return res.status(200).json({
            message: "Password reset successfully. You can now log in.",
        });
    }),
};

export default authControllers;
