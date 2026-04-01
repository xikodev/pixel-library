const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const authRoutes = require("./routes/auth.routes");
const healthRoutes = require("./routes/health.routes");
const groupRoutes = require("./routes/group.routes");
const sessionRoutes = require("./routes/session.routes");
const userRoutes = require("./routes/user.routes");
const authMiddleware = require("./middleware/auth.middleware");
const notFoundMiddleware = require("./middleware/notFound.middleware");
const errorMiddleware = require("./middleware/error.middleware");
const createRateLimiter = require("./middleware/rateLimit.middleware");
const app = express();

function parseCorsOrigins(value) {
    return String(value || "")
        .split(",")
        .map((origin) => origin.trim())
        .filter(Boolean);
}

const allowedOrigins = parseCorsOrigins(process.env.CORS_ORIGIN);
const authRateLimiter = createRateLimiter({
    windowMs: process.env.AUTH_RATE_LIMIT_WINDOW_MS,
    max: process.env.AUTH_RATE_LIMIT_MAX,
});

app.use(helmet());
app.use(
    cors({
        origin(origin, callback) {
            if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
                return callback(null, true);
            }

            return callback(new Error("Origin not allowed by CORS"));
        },
    })
);
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));
app.use(express.json({ limit: "1mb" }));
app.use("/api/auth", authRateLimiter, authRoutes);
app.use("/api/health", healthRoutes);
app.use("/api", authMiddleware);
app.use("/api/groups", groupRoutes);
app.use("/api/sessions", sessionRoutes);
app.use("/api/users", userRoutes);
app.use(notFoundMiddleware);
app.use(errorMiddleware);

module.exports = app;
