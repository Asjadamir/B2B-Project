import jwt from "jsonwebtoken";
import env from "../config/env.js";

const authMiddleware = (req, res, next) => {
    const token = req.cookies?.token;

    if (!token) {
        return res.status(401).json({ message: "Unauthorized. Please log in." });
    }

    try {
        const decoded = jwt.verify(token, env.JWT_SECRET);
        req.user = { userId: decoded.userId, email: decoded.email };
        next();
    } catch (error) {
        return res.status(401).json({ message: "Invalid or expired session. Please log in again." });
    }
};

export default authMiddleware;
