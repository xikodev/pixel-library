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

const connectionConfig = buildConnectionConfig();

const pool = mysql.createPool({
    ...connectionConfig,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    timezone: "Z",
});

async function query(sql, params = []) {
    const [rows] = await pool.query(sql, params);
    return rows;
}

async function getConnection() {
    return pool.getConnection();
}

async function closePool() {
    await pool.end();
}

module.exports = {
    pool,
    query,
    getConnection,
    closePool,
};
