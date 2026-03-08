import mysql from "mysql2/promise";
import env from "./env.js";

const connectDB = async () => {
    try {
        const pool = await mysql.createPool({
            host: env.DB_HOST,
            port: env.DB_PORT,
            user: env.DB_USER,
            password: env.DB_PASSWORD,
            database: env.DB_NAME,
        });
        console.log("Connected to MySQL database");
        return pool;
    } catch (error) {
        console.error("Error connecting to MySQL database:", error);
        throw error;
    }
};
