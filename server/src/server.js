require("dotenv").config();
const app = require("./app");
const { query, closePool } = require("./config/db");

if (!process.env.DATABASE_URL) {
    const user = encodeURIComponent(process.env.DB_USER || "");
    const password = encodeURIComponent(process.env.DB_PASSWORD || "");
    const host = process.env.DB_HOST || "127.0.0.1";
    const port = process.env.DB_PORT || "3306";
    const database = process.env.DB_NAME || "";

    process.env.DATABASE_URL = `mysql://${user}:${password}@${host}:${port}/${database}`;
}

if (!process.env.JWT_SECRET) {
    console.error("Missing JWT_SECRET in environment");
    process.exit(1);
}

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || "0.0.0.0";

function getNetworkUrls(port) {
    const os = require("os");

    return Object.values(os.networkInterfaces())
        .flat()
        .filter((net) => net && net.family === "IPv4" && !net.internal)
        .map((net) => `http://${net.address}:${port}`);
}

async function startServer() {
    try {
        await query("SELECT 1");
        console.log("Database connection established");

        app.listen(PORT, HOST, () => {
            const networkUrls = getNetworkUrls(PORT);

            console.log(`API on http://localhost:${PORT}`);

            if (networkUrls.length > 0) {
                console.log(`API on ${networkUrls.join(", ")}`);
            }
        });
    } catch (error) {
        console.error("Failed to start server:", error.message);
        process.exit(1);
    }
}

startServer();

process.on("SIGINT", async () => {
    await closePool();
    process.exit(0);
});

process.on("SIGTERM", async () => {
    await closePool();
    process.exit(0);
});
