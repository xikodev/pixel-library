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
const app = express();

app.use(helmet());
app.use(cors());
app.use(morgan("dev"));
app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/api/health", healthRoutes);
app.use("/api", authMiddleware);
app.use("/api/groups", groupRoutes);
app.use("/api/sessions", sessionRoutes);
app.use("/api/users", userRoutes);
app.use(notFoundMiddleware);
app.use(errorMiddleware);

module.exports = app;
