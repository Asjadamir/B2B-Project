import app from "./src/app.js";
import http from "http";
import env from "./src/config/env.js"

const startServer = () => {

    const server = http.createServer(app);

    server.listen(env.PORT, () => {
        console.log(`Server is listening on Port ${env.PORT}`);
    });

    // ── Graceful Shutdown ────────────────────────────────────────────────────

    const shutdown = (signal) => {
        console.log(
            `\n[SERVER] ${signal} received. Shutting down gracefully...`,
        );
        server.close(() => {
            console.log("[SERVER] HTTP server closed.");
            process.exit(0);
        });

        // Force shutdown after 10 seconds if something is hanging
        setTimeout(() => {
            console.error("[SERVER] Forcing shutdown after timeout.");
            process.exit(1);
        }, 10000);
    };

    process.on("SIGTERM", () => shutdown("SIGTERM")); // Docker/Kubernetes stop
    process.on("SIGINT", () => shutdown("SIGINT")); // Ctrl+C

    // ── Unhandled Rejection Safety Net ──────────────────────────────────────
    process.on("unhandledRejection", (reason, promise) => {
        console.error("[SERVER] Unhandled Rejection:", reason);
        // In production, you might want to exit and let the process manager restart
        // For now, log and continue — don't crash on every async edge case
    });
};

startServer();
