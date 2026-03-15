# JobTracker

A full-stack job application tracking app built with React, Node.js, and PostgreSQL. Dockerized with automated CI/CD deployment.

## Features

- **Application tracking** — Kanban board and table views with statuses: Wishlist, Applied, Phone Screen, Interview, Offer, Rejected, Withdrawn
- **Status history** — Full audit trail with timestamps for every status change
- **Contact management** — Link contacts to applications, store email/phone/LinkedIn
- **Gmail integration** — Connect your Gmail account to send scheduled follow-up emails via OAuth2
- **Scheduled emails** — Queue follow-up emails with BullMQ + Redis, sent automatically at the scheduled time
- **Dashboard** — Stats overview with response rate, offer rate, and recent activity
- **Admin panel** — User registration approval workflow (pending/approved/rejected)
- **Dark / Light / System theme**

## Security

- httpOnly cookie authentication (no tokens in localStorage)
- Token revocation via Redis blacklist on logout and password change
- Rate limiting on all API routes (stricter on login/register)
- Gmail OAuth tokens encrypted at rest (AES-256-GCM)
- Password complexity requirements
- Helmet security headers, CORS, Zod validation on all inputs
- Prisma ORM (parameterized queries, no SQL injection)

## Tech Stack

| Layer | Stack |
|-------|-------|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui, React Query, Zustand, React Router, Zod |
| Backend | Node.js 20, Express, TypeScript, Prisma, Zod, BullMQ, googleapis |
| Database | PostgreSQL 15, Redis 7 |
| Infrastructure | Docker Compose, Caddy (auto HTTPS), GitHub Actions CI/CD |

## Getting Started

### Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/)

### Run locally

```bash
git clone https://github.com/Vasilis-Rousis/track-job.git
cd track-job
cp .env.example .env   # Edit .env with your values
docker compose up --build

# First time only — run migrations and seed
docker compose exec backend npx prisma migrate dev
docker compose exec backend npx prisma db seed
```

| Service  | URL                   |
|----------|-----------------------|
| Frontend | http://localhost:5173 |
| Backend  | http://localhost:3000 |
| pgAdmin  | http://localhost:5050 |

### Environment variables

See `.env.example` for all variables. Key ones:

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Secret for signing JWTs (min 32 chars) |
| `ENCRYPTION_KEY` | 64-char hex key for encrypting Gmail tokens |
| `REDIS_URL` | Redis connection string |
| `GOOGLE_CLIENT_ID` | Google OAuth2 client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth2 client secret |

### Production deployment

See `.env.production.example` for production config. The app deploys automatically on push to `master` via GitHub Actions — a build check runs first, then deploys via SSH.

```bash
cp .env.production.example .env  # On your server, fill in real values
docker compose -f docker-compose.prod.yml up -d --build
docker compose -f docker-compose.prod.yml exec -T backend npx prisma migrate deploy
```
