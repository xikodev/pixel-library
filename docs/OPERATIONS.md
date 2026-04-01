# Operations Notes

## Secrets

- Never commit `.env` files.
- Store production secrets in your host secret manager or deployment platform.
- Rotate `JWT_SECRET` and database passwords immediately if they were ever committed or shared.

## Monitoring

Minimum recommended setup:

- Uptime monitor hitting `GET /api/health`
- Centralized log collection for API stdout/stderr
- Error alerting on repeated `5xx` responses
- Database CPU, memory, storage, and connection alerts

## Backups

- Schedule automated daily MySQL backups
- Keep at least 7 daily backups and 4 weekly backups
- Test restore procedure before first public launch
- Take an on-demand backup before every Prisma production migration

## Incident Priorities

- `401/403` spikes after release: check JWT secret, auth headers, and CORS origin settings
- `429` spikes: review auth throttling thresholds and abuse traffic
- Session write failures: verify Prisma migrations and database health
- Group session failures: confirm `studyGroupID` migration is applied
