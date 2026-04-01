function createRateLimiter(options = {}) {
    const windowMs = Number(options.windowMs) || 15 * 60 * 1000;
    const max = Number(options.max) || 10;
    const bucket = new Map();

    return function rateLimitMiddleware(req, res, next) {
        const now = Date.now();
        const forwardedFor = req.headers["x-forwarded-for"];
        const ip = typeof forwardedFor === "string" ? forwardedFor.split(",")[0].trim() : req.ip;
        const key = `${ip}:${req.path}`;
        const existing = bucket.get(key);

        if (!existing || existing.resetAt <= now) {
            bucket.set(key, { count: 1, resetAt: now + windowMs });
            return next();
        }

        if (existing.count >= max) {
            res.setHeader("Retry-After", String(Math.ceil((existing.resetAt - now) / 1000)));
            return res.status(429).json({ message: "Too many authentication attempts. Please try again later." });
        }

        existing.count += 1;
        return next();
    };
}

module.exports = createRateLimiter;
