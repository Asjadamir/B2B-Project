import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import nodemailer from "nodemailer";
import queries from "./auth.queries.js";
import env from "../../config/env.js";

// ── Email sender ─────────────────────────────────────────────
const transporter = nodemailer.createTransport({
    port: 465,
    host: "smtp.gmail.com",
    auth: {
        user: env.EMAIL_USER,
        pass: env.EMAIL_PASSWORD,
    },
});

const authControllers = (pool) => {
    const {
        findUserByEmail,
        createUser,
        updateUnverifiedUser,
        saveVerifyToken,
        findVerifyToken,
        deleteVerifyToken,
        deleteVerifyTokensByUserId,
        markUserVerified,
        saveResetToken,
        findResetToken,
        deleteResetToken,
        updatePassword,
    } = queries(pool);

    return {
        // ── SIGNUP ───────────────────────────────────────────────────
        signup: async (req, res) => {
            try {
                const { fullName, email, password } = req.body;

                // 1. Validate fields
                if (!fullName || !email || !password) {
                    return res
                        .status(400)
                        .json({ message: "All fields are required." });
                }

                // 2. Check if email already registered
                const existingUser = await findUserByEmail(email);

                if (existingUser) {
                    // 2a. Already verified — reject
                    if (existingUser.IsVerified) {
                        return res
                            .status(409)
                            .json({ message: "Email is already registered." });
                    }

                    // 2b. Exists but unverified — update credentials and resend
                    const passwordHash = await bcrypt.hash(password, 12);
                    await updateUnverifiedUser(
                        existingUser.UserID,
                        fullName,
                        passwordHash,
                    );

                    const token = crypto.randomBytes(32).toString("hex");
                    await deleteVerifyTokensByUserId(existingUser.UserID);
                    await saveVerifyToken(existingUser.UserID, token);

                    const verifyUrl = `${env.FRONTEND_URL}/verify-email/${token}`;
                    await transporter.sendMail({
                        from: env.EMAIL_USER,
                        to: email,
                        subject: "CoreChain — Verify your email",
                        html: `
                            <h2>Welcome to CoreChain, ${fullName}!</h2>
                            <p>Your details have been updated. Click the link below to verify your account.</p>
                            <p>This link expires in 2 hours.</p>
                            <a href="${verifyUrl}">${verifyUrl}</a>
                        `,
                    });

                    return res.status(200).json({
                        message:
                            "A new verification link has been sent to your email.",
                    });
                }

                // 3. New user — hash password
                const passwordHash = await bcrypt.hash(password, 12);

                // 4. Create user
                const userId = await createUser(fullName, email, passwordHash);

                // 5. Generate and save token
                const token = crypto.randomBytes(32).toString("hex");
                await saveVerifyToken(userId, token);

                // 6. Send verification email
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
                    message:
                        "Account created. Please check your email to verify your account.",
                });
            } catch (error) {
                console.error("Signup error:", error);
                return res
                    .status(500)
                    .json({ message: "Internal server error." });
            }
        },

        // ── LOGIN ────────────────────────────────────────────────────
        login: async (req, res) => {
            try {
                const { email, password } = req.body;

                // 1. Validate fields
                if (!email || !password) {
                    return res
                        .status(400)
                        .json({ message: "Email and password are required." });
                }

                // 2. Find user
                const user = await findUserByEmail(email);
                if (!user) {
                    return res
                        .status(401)
                        .json({ message: "Invalid email or password." });
                }

                // 3. Compare password
                const isMatch = await bcrypt.compare(
                    password,
                    user.PasswordHash,
                );
                if (!isMatch) {
                    return res
                        .status(401)
                        .json({ message: "Invalid email or password." });
                }

                // 4. Block unverified users and resend a fresh verification email
                if (!user.IsVerified) {
                    const newToken = crypto.randomBytes(32).toString("hex");
                    await deleteVerifyTokensByUserId(user.UserID);
                    await saveVerifyToken(user.UserID, newToken);

                    const verifyUrl = `${env.FRONTEND_URL}/verify-email/${newToken}`;
                    await transporter.sendMail({
                        from: env.EMAIL_USER,
                        to: user.Email,
                        subject: "CoreChain — Verify your email",
                        html: `
                            <h2>Email Verification Required</h2>
                            <p>You must verify your email before signing in.</p>
                            <p>Click the link below — it expires in 2 hours.</p>
                            <a href="${verifyUrl}">${verifyUrl}</a>
                        `,
                    });

                    return res.status(403).json({
                        message:
                            "Your email is not verified. A new verification link has been sent to your inbox.",
                    });
                }

                // 5. Sign JWT and set HTTP-only cookie
                const token = jwt.sign(
                    { userId: user.UserID, email: user.Email },
                    env.JWT_SECRET,
                    { expiresIn: env.JWT_EXPIRES_IN },
                );

                res.cookie("token", token, {
                    httpOnly: true,
                    secure: env.NODE_ENV === "production",
                    sameSite: "strict",
                    maxAge: 24 * 60 * 60 * 1000,
                });

                return res.status(200).json({
                    message: "Login successful.",
                    email: user.Email,
                });
            } catch (error) {
                console.error("Login error:", error);
                return res
                    .status(500)
                    .json({ message: "Internal server error." });
            }
        },

        // ── LOGOUT ───────────────────────────────────────────────────
        logout: async (req, res) => {
            res.clearCookie("token", {
                httpOnly: true,
                secure: env.NODE_ENV === "production",
                sameSite: "strict",
            });
            return res
                .status(200)
                .json({ message: "Logged out successfully." });
        },

        // ── FORGOT PASSWORD ──────────────────────────────────────────
        forgotPassword: async (req, res) => {
            try {
                const { email } = req.body;

                if (!email) {
                    return res
                        .status(400)
                        .json({ message: "Email is required." });
                }

                const user = await findUserByEmail(email);

                // Always return 200 to avoid revealing whether the email exists
                if (!user) {
                    return res.status(200).json({
                        message:
                            "If that email is registered, a reset link has been sent.",
                    });
                }

                const token = crypto.randomBytes(32).toString("hex");
                await saveResetToken(user.UserID, token);

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
                    message:
                        "If that email is registered, a reset link has been sent.",
                });
            } catch (error) {
                console.error("Forgot password error:", error);
                return res
                    .status(500)
                    .json({ message: "Internal server error." });
            }
        },

        // ── RESET PASSWORD ───────────────────────────────────────────
        resetPassword: async (req, res) => {
            try {
                const { token } = req.params;
                const { password } = req.body;

                if (!password) {
                    return res
                        .status(400)
                        .json({ message: "New password is required." });
                }

                const record = await findResetToken(token);
                if (!record) {
                    return res
                        .status(400)
                        .json({ message: "Invalid or expired reset link." });
                }

                if (new Date() > new Date(record.ValidTill)) {
                    await deleteResetToken(token);
                    return res
                        .status(400)
                        .json({
                            message:
                                "Reset link has expired. Please request a new one.",
                        });
                }

                const passwordHash = await bcrypt.hash(password, 12);
                await updatePassword(record.UserID, passwordHash);
                await deleteResetToken(token);

                return res
                    .status(200)
                    .json({
                        message:
                            "Password reset successfully. You can now log in.",
                    });
            } catch (error) {
                console.error("Reset password error:", error);
                return res
                    .status(500)
                    .json({ message: "Internal server error." });
            }
        },

        // ── VERIFY EMAIL ─────────────────────────────────────────────
        verifyEmail: async (req, res) => {
            try {
                const { token } = req.params;

                // 1. Find the token in VerifyTokens table
                const record = await findVerifyToken(token);
                if (!record) {
                    return res
                        .status(400)
                        .json({ message: "Invalid verification link." });
                }

                // 2. Check if token has expired
                const now = new Date();
                if (now > new Date(record.ValidTill)) {
                    await deleteVerifyToken(token); // clean up expired token
                    return res.status(400).json({
                        message:
                            "Verification link has expired. Please sign up again.",
                    });
                }

                // 3. Mark user as verified and delete the token
                await markUserVerified(record.UserID);
                await deleteVerifyToken(token);

                // 4. Auto-login: sign JWT and set it as an HTTP-only cookie
                const jwtToken = jwt.sign(
                    { userId: record.UserID, email: record.Email },
                    env.JWT_SECRET,
                    { expiresIn: env.JWT_EXPIRES_IN },
                );

                res.cookie("token", jwtToken, {
                    httpOnly: true,
                    secure: env.NODE_ENV === "production",
                    sameSite: "strict",
                    maxAge: 24 * 60 * 60 * 1000, // 1 day in ms
                });

                return res.status(200).json({
                    message:
                        "Email verified successfully. You are now logged in.",
                    email: record.Email,
                });
            } catch (error) {
                console.error("Verify email error:", error);
                return res
                    .status(500)
                    .json({ message: "Internal server error." });
            }
        },
    };
};

export default authControllers;
