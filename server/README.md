# Pixel Library Server

Express and mysql2 API for Pixel Library.

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
npm run db:init
npm run dev
npm test
```

## Release Notes

- Initialize the schema with `npm run db:init` before starting the API in a new environment.
- Restrict `CORS_ORIGIN` to known client origins in production.
- Rotate credentials before any public deploy if secrets were previously shared or stored insecurely.
