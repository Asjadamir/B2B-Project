import mysql from "mysql2/promise";
import env from "./env.js";
import mssql from "mssql";

// const connectDB = async () => {
//     try {
//         const pool = await mysql.createPool({
//             host: env.DB_HOST,
//             port: env.DB_PORT,
//             user: env.DB_USER,
//             password: env.DB_PASSWORD,
//             database: env.DB_NAME,
//         });
//         console.log("Connected to MySQL database");
//         return pool;
//     } catch (error) {
//         console.error("Error connecting to MySQL database:", error);
//         throw error;
//     }
// };

const config = {
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    server: env.DB_HOST,
    database: env.DB_NAME,

    options: {
        encrypt: false, // true for Azure
        trustServerCertificate: true,
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
