# Vynexa CRM — Enterprise Production Deployment Guide

This document provides definitive instructions, architecture diagrams, environment specifications, database migration runbooks, and disaster recovery procedures for deploying **Vynexa CRM** to production environments.

---

## 1. ARCHITECTURE OVERVIEW

Vynexa CRM is architected as a high-density, multi-tenant enterprise SaaS platform consisting of four core decoupled layers:

```mermaid
graph TD
    Client[Browser / Client SPA - React 18 + Vite] -->|HTTPS / Port 443| LB[Reverse Proxy / Ingress / Cloudflare]
    LB -->|Reverse Proxy / Port 5000| API[Vynexa API Server - Node.js Express]
    API -->|Connection Pool / SSL| DB[(PostgreSQL 16 Relational DB)]
    API -->|Local Mount / S3 API| Storage[(File Storage - Volume / Object Store)]
    
    subgraph Container Pod / Instance
        API
    end
```

| Component | Technology | Production Target | Scaling Model |
|---|---|---|---|
| **Frontend SPA** | React 18, TypeScript, Vite | Nginx / CDN / Cloudflare Pages / Static S3 | Distributed CDN Edge / Cacheable static assets |
| **Backend API** | Node.js, Express, TypeScript | Docker Container (Distroless / Alpine) | Horizontal Stateless Scaling (Multi-instance behind Load Balancer) |
| **Relational Database** | PostgreSQL 15+ | AWS RDS / GCP Cloud SQL / Managed HA Postgres | Primary-Replica with automated daily snapshots & PITR |
| **File Storage** | Abstraction (`FileStorageService`) | Persistent NVMe Volume / AWS S3 / MinIO | Scalable Persistent Storage |

---

## 2. PRODUCTION ENVIRONMENT VARIABLES SPECIFICATION

The backend runtime strictly validates all environment variables at startup using **Zod** schema enforcement (`server/src/config/env.ts`). If any required variable is absent or contains unsafe development defaults in production mode, **the server will immediately fail to boot with an explicit error code**.

| Variable | Type | Required | Description / Production Constraint |
|---|---|---|---|
| `NODE_ENV` | `production` \| `staging` \| `development` | **Yes** | Must be `production` in live environments. |
| `PORT` | `number` | No (Default: `5000`) | Port on which the Express HTTP server listens. |
| `DATABASE_URL` | `string` (Postgres URL) | **Yes** | Connection string with SSL enabled (`sslmode=require` or `prefer`). |
| `JWT_SECRET` | `string` (min 32 chars) | **Yes** | High-entropy random cryptographic secret. Default strings (`vynexa_super_secret...`) are strictly prohibited in production. |
| `JWT_EXPIRES_IN` | `string` | No (Default: `7d`) | Token lifetime duration (e.g., `24h`, `7d`). |
| `COOKIE_SECRET` | `string` (min 32 chars) | **Yes** | High-entropy secret used to sign session cookies. |
| `CLIENT_URL` | `string` (URL) | **Yes** | Fully-qualified production domain of the web client (e.g., `https://crm.vynexa.com`). No wildcards (`*`) permitted in production. |
| `STORAGE_PATH` | `string` | No (Default: `./uploads`) | Absolute path to persistent storage directory mount. |
| `ADMIN_EMAIL` | `string` (email) | No (Default: `admin@vynexa.com`) | Initial bootstrap email address granted super-admin oversight. |

### Generating Cryptographic Secrets
Generate 256-bit cryptographic secrets before provisioning:
```bash
# Generate JWT_SECRET
openssl rand -base64 32

# Generate COOKIE_SECRET
openssl rand -base64 32
```

---

## 3. DATABASE MIGRATIONS & SCHEMA INTEGRITY

Vynexa CRM utilizes **Prisma ORM** for type-safe database access with strict schema-driven migrations.

### 3.1 Migration Execution in CI/CD & Deployments
Never use `prisma migrate dev` in production pipelines or non-interactive containers. Always use `prisma migrate deploy`, which runs pending committed migrations without prompting:

```bash
# 1. Generate Prisma Client bindings
npx prisma generate

# 2. Apply all pending migrations to production PostgreSQL
npx prisma migrate deploy
```

### 3.2 Automated Zero-Downtime Migration Policy
- **Additive Changes**: Add new tables, nullable columns, and non-blocking indexes in Phase A.
- **Data Backfill**: Populate new columns if required via non-locking batch scripts.
- **Contract Enforcement**: Enforce NOT NULL constraints or defaults in Phase B after existing code is adapted.
- **Safe Index Creation**: In high-load databases, indexes can be verified via `pg_stat_activity` and created concurrently if necessary.

### 3.3 Database Backup & Point-in-Time Recovery (PITR)
Establish automated daily snapshot schedules and WAL archiving.

```bash
# Full Database Backup
pg_dump -h <DB_HOST> -p 5432 -U <DB_USER> -d <DB_NAME> -F c -b -v -f /backups/vynexa_crm_$(date +%Y%m%d_%H%M%S).dump

# Database Restoration
pg_restore -h <DB_HOST> -p 5432 -U <DB_USER> -d <DB_NAME> -v --clean --no-owner /backups/vynexa_crm_20260916.dump
```

---

## 4. CONTAINERIZATION & DOCKER DEPLOYMENT

### 4.1 Production Dockerfile (Multi-Stage Build)

```dockerfile
# syntax=docker/dockerfile:1.4

# -------------------------------------------------------------
# Stage 1: Build Dependencies & Code
# -------------------------------------------------------------
FROM node:20-alpine AS builder
WORKDIR /app

# Install build dependencies
RUN apk add --no-cache python3 make g++

# Copy package manifests
COPY package*.json ./
COPY prisma ./prisma/
COPY server/package*.json ./server/
COPY client/package*.json ./client/

# Install dependencies across workspaces
RUN npm ci --include=dev

# Copy source trees
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Build Frontend & Backend
RUN npm run build

# -------------------------------------------------------------
# Stage 2: Production Minimal Runtime
# -------------------------------------------------------------
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
RUN apk add --no-cache curl tzdata

# Create unprivileged application user
RUN addgroup -S vynexa && adduser -S vynexa -G vynexa

# Copy production dependencies and build artifacts
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/server/dist ./server/dist
COPY --from=builder /app/server/package*.json ./server/
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/client/dist ./client/dist

# Create storage directory with correct permissions
RUN mkdir -p /app/server/uploads && chown -R vynexa:vynexa /app

USER vynexa

EXPOSE 5000

HEALTHCHECK --interval=15s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:5000/api/health || exit 1

CMD ["node", "server/dist/server.js"]
```

### 4.2 Docker Compose Production Deployment

```yaml
version: '3.8'

services:
  app:
    image: vynexa/crm:latest
    restart: unless-stopped
    ports:
      - "5000:5000"
    environment:
      - NODE_ENV=production
      - PORT=5000
      - DATABASE_URL=postgresql://vynexa_user:${DB_PASSWORD}@postgres:5432/vynexa_crm?schema=public&sslmode=prefer
      - JWT_SECRET=${JWT_SECRET}
      - COOKIE_SECRET=${COOKIE_SECRET}
      - CLIENT_URL=https://crm.vynexa.com
      - STORAGE_PATH=/app/uploads
    volumes:
      - crm_storage:/app/uploads
    depends_on:
      postgres:
        condition: service_healthy

  postgres:
    image: postgres:16-alpine
    restart: unless-stopped
    environment:
      POSTGRES_USER: vynexa_user
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: vynexa_crm
    volumes:
      - pg_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U vynexa_user -d vynexa_crm"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  crm_storage:
  pg_data:
```

---

## 5. HEALTH CHECKS & LOAD BALANCING

Vynexa CRM exposes active health inspection endpoints at `/api/health`:

- **Route**: `GET /api/health`
- **Behavior**:
  - Executes active `SELECT 1;` query through the Prisma connection pool.
  - If the database is responsive: returns `HTTP 200 OK` with `{ status: "healthy", database: "connected" }`.
  - If the database connection drops: returns `HTTP 503 Service Unavailable` with `{ status: "degraded", database: "disconnected" }`.
- **Load Balancer Integration**: Configure your reverse proxy (AWS ALB, Nginx, Traefik, HAProxy) to query `/api/health` with a 15-second interval and a 5-second timeout. Unhealthy instances will automatically be deregistered before dropping traffic.

---

## 6. GRACEFUL SHUTDOWN & LIFECYCLE MANAGEMENT

The application implements active listeners for `SIGTERM` and `SIGINT` signals:

1. **Stop Ingress Traffic**: The HTTP server ceases accepting new connections.
2. **In-Flight Request Drain**: Existing requests are allowed up to 10,000ms to conclude processing.
3. **Database Pool Disconnect**: `prisma.$disconnect()` is called to flush and close all active PostgreSQL socket connections.
4. **Clean Exit**: The process exits with code `0`.

---

## 7. SECURITY HARDENING MEASURES

The production deployment complies with industry enterprise SaaS standards:

1. **HTTP Security Headers (Helmet)**:
   - `Strict-Transport-Security`: Enforces HTTPS with `maxAge: 31536000` (1 year) and `includeSubDomains`.
   - `X-Content-Type-Options: nosniff`: Prevents MIME type sniffing.
   - `X-Frame-Options: SAMEORIGIN`: Prevents clickjacking attacks.
   - `Content-Security-Policy`: Protects against cross-site scripting (XSS).
2. **CORS Whitelisting**: Strictly restricts origin matching to `CLIENT_URL` in production; wildcard origins (`*`) are disallowed.
3. **Rate Limiting Protection**:
   - Authentication Endpoints (`/api/auth/*`): 15 requests per 15 minutes.
   - Global Search (`/api/search`): 60 queries per minute.
   - File Uploads (`/api/documents/upload`): 20 uploads per 15 minutes.
   - CSV / Analytical Exports: 10 requests per minute.
4. **Credential Redaction in Logs**: Centralized JSON structured logger (`server/src/utils/logger.ts`) automatically strips passwords, password hashes, secrets, and authorization headers from logs.

---

## 8. FILE STORAGE PERSISTENCE & CLOUD MIGRATION

Documents and uploaded entity attachments are managed via the abstracted `FileStorageService`:

- **Local Storage Configuration**: Set `STORAGE_PATH=/mnt/storage/vynexa` to point to a persistent volume or Kubernetes PersistentVolumeClaim (PVC).
- **File Validation**: Enforces MIME whitelist (`application/pdf`, `image/png`, `image/jpeg`, `text/csv`, `application/vnd.openxmlformats-officedocument.wordprocessingml.document`) and 10MB maximum file size limit.
- **S3 / Object Storage Transition**: The storage interface (`IStorageProvider`) allows drop-in replacement with `@aws-sdk/client-s3` without altering any CRM domain services.

---

## 9. RELEASE VERIFICATION RUNBOOK

Following any production deployment or rolling update, execute the verification runbook:

```bash
# 1. Verify health status
curl -i https://crm.vynexa.com/api/health

# 2. Verify security response headers
curl -I https://crm.vynexa.com/api/health | grep -E "Strict-Transport-Security|X-Content-Type-Options"

# 3. Verify database migration status
npx prisma migrate status

# 4. Check application logs for error signatures
tail -n 100 /var/log/vynexa/app.log | grep "ERROR"
```
