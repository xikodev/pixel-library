# Pixel Library Client

Expo React Native client for Pixel Library.

## Required Environment

Create `client/.env` from `client/.env.example`.

`EXPO_PUBLIC_API_BASE_URL`
- Public HTTPS base URL for the deployed API, including `/api`

Environment templates are also available for:

- `client/.env.development.example`
- `client/.env.preview.example`
- `client/.env.production.example`

## Useful Commands

```bash
npm install
npm run start
npm run lint
npm run preflight
```

## Release Notes

- `app.json` contains the mobile app identity used for release builds.
- `eas.json` contains development, preview, and production build profiles.
- Replace placeholder store metadata and branding values if ownership changes.
- Verify login, signup, history, groups, session flow, and profile editing against the production API before submitting builds.
