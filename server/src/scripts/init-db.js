require("dotenv").config();

const fs = require("fs/promises");
const path = require("path");
const mysql = require("mysql2/promise");

function buildConnectionConfig() {
    const databaseUrl = process.env.DATABASE_URL;

    if (databaseUrl) {
        const url = new URL(databaseUrl);

        return {
            host: url.hostname,
            port: Number(url.port || 3306),
            user: decodeURIComponent(url.username),
            password: decodeURIComponent(url.password),
            database: url.pathname.replace(/^\//, ""),
        };
    }

    return {
        host: process.env.DB_HOST || "127.0.0.1",
        port: Number(process.env.DB_PORT || 3306),
        user: process.env.DB_USER || "",
        password: process.env.DB_PASSWORD || "",
        database: process.env.DB_NAME || "",
    };
}

async function main() {
    const sqlPath = path.join(__dirname, "../../sql/schema.sql");
    const sql = await fs.readFile(sqlPath, "utf8");
    const connection = await mysql.createConnection({
        ...buildConnectionConfig(),
        multipleStatements: true,
    });

    try {
        await connection.query(sql);
        console.log("Database schema initialized");
    } finally {
        await connection.end();
    }
}

main().catch((error) => {
    console.error("Failed to initialize database:", error);
    process.exit(1);
});
