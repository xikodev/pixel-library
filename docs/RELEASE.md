# Release Runbook

## Preconditions

- Working tree reviewed and intentional
- `client/.env` and `server/.env` created from example files
- Production secrets rotated and stored outside the repo
- Production database reachable and backed up
- Expo account ownership, bundle identifiers, and store accounts confirmed

## Verification

Run these commands before cutting a release:

```bash
cd client
npm install
npm run preflight
```

```bash
cd server
npm install
npm run prisma:generate
npm test
```

## Manual QA

- Sign up with a new account
- Log in with username
- Log in with email
- Create a group
- Join a group by invite code
- Rotate invite code as admin
- Start a solo session
- Start a group session
- Start and end a break
- End a session and confirm totals
- Edit profile fields
- Delete account

## Backend Deployment

1. Back up the production database.
2. Export production environment variables on the server.
3. Run Prisma deploy migrations:

```bash
cd server
npm install --omit=dev
npm run prisma:generate
npm run prisma:deploy
```

4. Start the API with `npm start`.
5. Confirm `GET /api/health` returns `200`.

## Mobile Build

From `client/`:

```bash
eas login
eas build --platform android --profile production
eas build --platform ios --profile production
```

For internal testing:

```bash
eas build --platform android --profile preview
eas build --platform ios --profile preview
```

## Store Submission Checklist

- Final app name and description
- Privacy policy URL
- Support URL / contact email
- Screenshot set for phone sizes
- App icon and splash reviewed on device
- Age rating questionnaire completed
- Account deletion behavior described
- Permissions reviewed and justified

## Rollback

- Keep the previous server deployment available
- Keep a database backup from immediately before migration
- Pause store rollout if a signed build shows a regression
