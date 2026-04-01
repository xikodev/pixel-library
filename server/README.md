# Pixel Library Server

Express and Prisma API for Pixel Library.

## Required Environment

Create `server/.env` from `server/.env.example`.

Required variables:

- `DATABASE_URL`
- `JWT_SECRET`
- `CORS_ORIGIN`

Optional variables:

- `PORT`
- `NODE_ENV`
- `AUTH_RATE_LIMIT_WINDOW_MS`
- `AUTH_RATE_LIMIT_MAX`

## Useful Commands

```bash
npm install
npm run prisma:generate
npm run dev
npm test
```

## Release Notes

- Apply all Prisma migrations before starting the API in a new environment.
- Use `npm run prisma:deploy` for production migration rollout.
- Restrict `CORS_ORIGIN` to known client origins in production.
- Rotate credentials before any public deploy if secrets were previously shared or stored insecurely.
