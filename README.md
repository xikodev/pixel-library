# Pixel Library

Pixel Library is a mobile-first focus app that turns study time into a lightweight social experience.
Users can track focused sessions, manage breaks, and study with friends in invite-only groups.

## What The App Does

- Creates a personal study profile
- Tracks focus sessions with real start/end server timestamps
- Tracks breaks per session (count + duration)
- Calculates total study time, total breaks, and total break time per user
- Lets users create private study groups
- Uses unique 8-letter invite codes to join groups
- Allows only group admins to rotate invite links and remove members

## Core Experience

1. Sign up and create your profile
2. Start a study session
3. Take breaks when needed
4. End the session and store totals
5. Join or manage study groups with invite codes

## Product Principles

- Mobile-first usage
- Simple, low-friction session flow
- Private group collaboration
- Clear ownership and permission rules

## Current Scope

- Authentication (signup/login)
- Group system with admin controls
- Session lifecycle with break handling
- Automatic total aggregation into user stats

## Planned Direction

- React Native mobile client
- Better profile and avatar progression
- Session history and analytics views
- Group activity and collaborative features

## Release Checklist

- Add production values for `client/.env` and `server/.env` based on the example files only
- Rotate database credentials and JWT secrets before any public deploy
- Apply Prisma migrations with `npm run prisma:generate` and your production migration workflow
- Confirm the mobile app points at the production API over HTTPS
- Run `npm run lint` in `client` and `npm test` in `server`
- Verify signup, login, group join, session start, break start/end, session end, profile edit, and account delete on a production-like environment
- Fill in store metadata, privacy policy, support contact, and screenshots before App Store / Play submission

## Deployment Notes

- The mobile client reads `EXPO_PUBLIC_API_BASE_URL`.
- The server requires `DATABASE_URL`, `JWT_SECRET`, and should define `CORS_ORIGIN`.
- Authentication endpoints are rate limited through environment configuration.
- Production builds should use unique mobile identifiers from `client/app.json`.

## Publishing Docs

- Release runbook: [docs/RELEASE.md](C:/Users/borna/WebstormProjects/pixel-library/docs/RELEASE.md)
- Operations notes: [docs/OPERATIONS.md](C:/Users/borna/WebstormProjects/pixel-library/docs/OPERATIONS.md)
- Privacy policy draft: [docs/PRIVACY.md](C:/Users/borna/WebstormProjects/pixel-library/docs/PRIVACY.md)
- Support policy draft: [docs/SUPPORT.md](C:/Users/borna/WebstormProjects/pixel-library/docs/SUPPORT.md)

## Licensing

This project is being prepared for licensing.
All rights are reserved by default unless a separate license agreement is provided.
For licensing inquiries, contact the project owner.
