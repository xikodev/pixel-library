require("dotenv").config();
const app = require("./app");

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

const prisma = require("./config/db");

const PORT = process.env.PORT || 3000;

async function startServer() {
    try {
        await prisma.$connect();
        await prisma.$queryRaw`SELECT 1`;
        console.log("Database connection established");

        app.listen(PORT, () => console.log(`API on http://localhost:${PORT}`));
    } catch (error) {
        console.error("Failed to start server:", error.message);
        process.exit(1);
    }
}

startServer();

process.on("SIGINT", async () => {
    await prisma.$disconnect();
    process.exit(0);
});

process.on("SIGTERM", async () => {
    await prisma.$disconnect();
    process.exit(0);
});
