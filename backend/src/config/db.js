import env from "./env.js";
import mssql from "mssql";

const config = {
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    server: env.DB_HOST,
    database: env.DB_NAME,

    options: {
        encrypt: env.NODE_ENV === "production", // true for Azure
        trustServerCertificate: env.NODE_ENV !== "production", // false for production
    },
};

export const connectMSSQL = async () => {
    try {
        await mssql.connect(config);
        console.log("Connected to MSSQL database");
    } catch (error) {
        console.error("Error connecting to MSSQL database:", error);
        throw error;
    }
};

export default mssql;
