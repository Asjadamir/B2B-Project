import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import nodemailer from "nodemailer";
import queries from "./auth.queries.js";
import env from "../../config/env.js";

const transporter = nodemailer.createTransport({
    port: 465,
    host: "smtp.gmail.com",
    auth: {
        user: env.EMAIL_USER,
        pass: env.EMAIL_PASSWORD,
    },
});

const authControllers = {
    signup: async (req, res) => {
        try {
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
        } catch (error) {
            console.error("Signup error:", error);
            return res.status(500).json({ message: "Internal server error." });
        }
    },

    login: async (req, res) => {
        try {
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
        } catch (error) {
            console.error("Login error:", error);
            return res.status(500).json({ message: "Internal server error." });
        }
    },

    logout: async (req, res) => {
        res.clearCookie("token", {
            httpOnly: true,
            secure: env.NODE_ENV === "production",
            sameSite: "strict",
        });
        return res.status(200).json({ message: "Logged out successfully." });
    },

    verifyEmail: async (req, res) => {
        try {
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

            const user = await queries.findUserById(record.UserID);

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
                message: "Email verified successfully. You are now logged in.",
                data: {
                    email: user.Email,
                    userId: user.UserID,
                    userName: user.FullName,
                },
            });
        } catch (error) {
            console.error("Verify email error:", error);
            return res.status(500).json({ message: "Internal server error." });
        }
    },

    me: async (req, res) => {
        try {
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
        } catch (error) {
            console.error("Me error:", error);
            return res.status(500).json({ message: "Internal server error." });
        }
    },

    forgotPassword: async (req, res) => {
        try {
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
        } catch (error) {
            console.error("Forgot password error:", error);
            return res.status(500).json({ message: "Internal server error." });
        }
    },

    resetPassword: async (req, res) => {
        try {
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
        } catch (error) {
            console.error("Reset password error:", error);
            return res.status(500).json({ message: "Internal server error." });
        }
    },
};

export default authControllers;
