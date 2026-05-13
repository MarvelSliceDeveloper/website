# Local Development Setup Guide

You can run this LMS project locally in two ways depending on whether you have Docker installed on your computer.

## 0. Initial Setup

Before running the application using either method below, you must clone the repository and install the dependencies.

```bash
# 1. Clone the repository
git clone https://github.com/your-username/lms-portal.git
cd lms-portal

# 2. Install dependencies (Using pnpm)
npm install -g pnpm  # If you don't have pnpm installed
pnpm install
```

---

## Method 1: Using Docker (Recommended)

This is the easiest method because Docker will automatically download and run PostgreSQL and Redis for you without needing to install them directly onto Windows/macOS.

### Prerequisites
1. Download and install [Docker Desktop](https://www.docker.com/products/docker-desktop/).
2. Ensure Docker Desktop is running in the background.

### Setup Steps
1. **Start the databases**: Open a terminal in the project root and run:
   ```bash
   docker-compose up -d
   ```
   *(This starts PostgreSQL on port 5432 and Redis on port 6379 in the background).*

2. **Setup your Environment**: Copy `.env.example` to `.env` if you haven't already. The default variables in `.env.example` are already configured to connect to your local Docker containers.

3. **Migrate the Database**: Push the 15-table schema into your new database:
   ```bash
   pnpm prisma:migrate
   ```

4. **Seed the Database**: Create demo admin + student accounts for API login:
   ```bash
   pnpm prisma:seed
   ```

5. **Start the App**:
   ```bash
   pnpm dev
   ```

### Demo Login Credentials (API-backed)

These accounts are created by `pnpm prisma:seed` and authenticate via `POST /api/auth/login`.
Ensure the API is running before signing in.

| Role | Email | Password | Landing Page |
|------|-------|----------|--------------|
| Student | student@lms.local | student123 | `/student/dashboard` |
| Admin | admin@lms.local | admin123 | `/admin/mentorship` |

### Stopping Docker
When you are done working for the day, you can stop the databases from consuming your RAM:
```bash
docker-compose stop
```

---

## Method 2: Without Docker (Cloud Database)

If you **do not** have Docker installed and do not want to install it, you can easily use free cloud services to host your development databases.

### Setup Steps
1. **Get a Free PostgreSQL Database**:
   - Go to [Neon.tech](https://neon.tech/) or [Supabase](https://supabase.com/).
   - Create a free account and a new project.
   - Copy the provided "Connection String" (it starts with `postgresql://...`).

2. **Get a Free Redis Database** (Optional for Phase 1 & 2):
   - Go to [Upstash](https://upstash.com/).
   - Create a free Redis database and copy the Redis URL (starts with `rediss://...`).

3. **Update your `.env` File**:
   Replace the default localhost URLs in your `.env` file with your new cloud URLs:
   ```env
   # Replace these lines in your .env file
   DATABASE_URL=postgresql://your_neon_username:your_neon_password@ep-cold-wave-1234.us-east-2.aws.neon.tech/neondb?sslmode=require
   REDIS_URL=rediss://default:your_upstash_password@upstash-url.com:6379
   ```

4. **Migrate & Seed**: Since you are connected to a real database now, run the Prisma commands:
   ```bash
   pnpm prisma:migrate
   pnpm prisma:seed
   ```

5. **Start the App**:
   ```bash
   pnpm dev
   ```

---

## Troubleshooting

- **"PrismaClientInitializationError: Can't reach database server"**
  - *If using Docker:* Make sure Docker Desktop is open and you ran `docker-compose up -d`.
  - *If using Cloud DB:* Make sure your internet connection is active and you copied the `.env` URL correctly.

- **"Prisma schema validation (P1012): Environment variable not found: DATABASE_URL"**
   - This can happen if your terminal has an empty `DATABASE_URL` value that overrides `.env`.
   - In PowerShell, run:
      ```powershell
      Remove-Item Env:DATABASE_URL -ErrorAction SilentlyContinue
      ```
   - Then rerun:
      ```bash
      pnpm prisma:migrate
      ```

- **"Port 3000 or 4000 is already in use"**
  - You likely have another app (or an old instance of this app) running in the background. Kill the terminal or close the old process.
