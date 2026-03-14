# JobTracker

A full-stack job application tracking app built with React, Node.js, and PostgreSQL.

## Features

- Track job applications with statuses: Wishlist, Applied, Phone Screen, Interview, Offer, Rejected, Withdrawn
- Full status history with timestamps for every application
- Kanban board and table views for your applications
- Contact management — create contacts and link them to applications
- Dashboard with stats (response rate, offer rate, recent activity)
- Dark / Light / System theme
- JWT authentication with secure password hashing

## Tech Stack

**Frontend**
- React 18 + TypeScript
- Vite 5
- Tailwind CSS 3 + shadcn/ui components
- React Query v5 (server state)
- Zustand (client state + persistence)
- React Router v6
- Zod + React Hook Form

**Backend**
- Node.js 20 + Express 4 + TypeScript
- Prisma 5 (ORM)
- PostgreSQL 15
- JWT authentication
- Zod validation

**Infrastructure**
- Docker Compose (db, pgAdmin, backend, frontend)

## Getting Started

### Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) with virtualization enabled

### Run locally

```bash
# Clone the repo
git clone https://github.com/Vasilis-Rousis/track-job.git
cd track-job

# Start all services
docker compose up --build

# In a second terminal, run the database migration (first time only)
docker compose exec backend npx prisma migrate dev --name init
```

| Service  | URL                   |
|----------|-----------------------|
| Frontend | http://localhost:5173 |
| Backend  | http://localhost:3000 |
| pgAdmin  | http://localhost:5050 |

**pgAdmin credentials:** `admin@admin.com` / `admin`
**pgAdmin DB connection:** host `db`, port `5432`, user `postgres`, password `postgres`

### Environment variables

The `.env` file at the project root is used by Docker Compose. Key variables:

| Variable         | Description                        |
|------------------|------------------------------------|
| `DATABASE_URL`   | PostgreSQL connection string       |
| `JWT_SECRET`     | Secret for signing JWT tokens      |
| `JWT_EXPIRES_IN` | Token expiry (e.g. `7d`)           |
| `PORT`           | Backend port (default `3000`)      |
| `FRONTEND_URL`   | Allowed CORS origin                |

## Project Structure

```
track-job/
├── backend/
│   ├── prisma/          # Schema and migrations
│   └── src/
│       ├── config/      # Env and DB config
│       ├── controllers/ # Route handlers
│       ├── middleware/  # Auth, error handler, asyncHandler
│       ├── routes/      # Express routers
│       └── schemas/     # Zod validation schemas
├── frontend/
│   └── src/
│       ├── api/         # Axios API calls
│       ├── components/  # UI and feature components
│       ├── hooks/       # React Query hooks
│       ├── pages/       # Route-level page components
│       ├── store/       # Zustand stores (auth, theme)
│       └── types/       # TypeScript interfaces
└── docker-compose.yml
```
