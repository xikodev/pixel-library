const test = require("node:test");
const assert = require("node:assert/strict");

process.env.JWT_SECRET = process.env.JWT_SECRET || "test-secret";
process.env.CORS_ORIGIN = process.env.CORS_ORIGIN || "http://localhost:8081";

const app = require("../src/app");

async function request(path, options = {}) {
    const server = app.listen(0);

    try {
        const address = server.address();
        const url = `http://127.0.0.1:${address.port}${path}`;
        const response = await fetch(url, options);
        const text = await response.text();
        const body = text ? JSON.parse(text) : null;

        return { response, body };
    } finally {
        await new Promise((resolve, reject) => {
            server.close((error) => {
                if (error) {
                    reject(error);
                    return;
                }

                resolve();
            });
        });
    }
}

test("GET /api/health returns ok", async () => {
    const { response, body } = await request("/api/health");

    assert.equal(response.status, 200);
    assert.deepEqual(body, { ok: true });
});

test("protected API requires bearer token", async () => {
    const { response, body } = await request("/api/users/me");

    assert.equal(response.status, 401);
    assert.deepEqual(body, { message: "Unauthorized" });
});

test("unknown protected API route is rejected before route lookup", async () => {
    const { response, body } = await request("/api/does-not-exist");

    assert.equal(response.status, 401);
    assert.deepEqual(body, { message: "Unauthorized" });
});

test("unknown public route returns 404 JSON", async () => {
    const { response, body } = await request("/does-not-exist");

    assert.equal(response.status, 404);
    assert.deepEqual(body, { message: "Route not found" });
});
