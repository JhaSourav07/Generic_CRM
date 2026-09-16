# Vynexa CRM — Commercial Enterprise SaaS Platform

[![CI Pipeline](https://github.com/vynexa/vynexa-crm/actions/workflows/ci.yml/badge.svg)](https://github.com/vynexa/vynexa-crm/actions/workflows/ci.yml)
[![License: Proprietary](https://img.shields.io/badge/License-Proprietary-blue.svg)](LICENSE)
[![PostgreSQL: 15+](https://img.shields.io/badge/PostgreSQL-15%2B-336791.svg)](https://www.postgresql.org/)
[![TypeScript: 5.5+](https://img.shields.io/badge/TypeScript-5.5%2B-3178C6.svg)](https://www.typescriptlang.org/)

**Vynexa CRM** is a production-hardened, commercial enterprise SaaS Customer Relationship Management system. Built for multi-tenant business operations with Linear-/Stripe-grade visual refinement, high information density, and strict database-level data integrity.

---

## 1. TECHNOLOGY STACK

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, TanStack Query, React Router v6, Lucide Icons, React Hook Form, Zod
- **Backend**: Node.js, Express, TypeScript, Zod validation, Helmet security armor, rate-limiting
- **Database**: PostgreSQL with strict foreign keys, compound indexes, and ACID transaction boundaries
- **ORM**: Prisma (Singleton connection pool with active liveness probing)
- **Visual Design**: Vynexa Charcoal Dark Theme (`#0D0D0D` base), Manrope UI typography, IBM Plex Mono for monetary figures and entity identifiers
- **Testing**: Vitest, Supertest, V8 Coverage Engine

---

## 2. PROJECT ARCHITECTURE & FEATURE DOMAINS

Vynexa CRM implements a modular domain-driven architecture:

- **Public Experience**: High-converting marketing landing page, secure authentication, tenant registration.
- **Sales Engine**: Leads triage & conversion engine, Visual Kanban sales pipeline, multi-currency Opportunity management.
- **Commercial Suite**: SKU catalog, Price Quotes with automated tax/discount calculations, Quote-to-Order conversion.
- **Customer Directory**: Organizations, Accounts (Companies), Contacts with complete communication histories.
- **Operational Workspace**: Tasks, Activities, Interaction logging, Follow-up triggers.
- **Support & Marketing**: Support Case tickethub with SLA tracking, Multi-channel Marketing Campaigns.
- **Business Intelligence**: Native PostgreSQL aggregation reports (Leads, Sales, Tasks, Pipeline, Support) and CSV exports.
- **Security & Governance**: Fine-grained RBAC permissions, immutable Audit Logs with credential redaction, session management.

---

## 3. GETTING STARTED

### 3.1 Prerequisites
- **Node.js**: `>= 20.0.0`
- **npm**: `>= 10.0.0`
- **PostgreSQL**: `>= 15.0`
- **Docker** (Optional, for local containerized database)

### 3.2 Installation & Setup

1. **Clone the repository and install dependencies**:
   ```bash
   npm install
   ```

2. **Environment Configuration**:
   ```bash
   cp .env.example .env
   ```
   *Configure your PostgreSQL database URL in `.env`*.

3. **Generate Prisma Client & Apply Migrations**:
   ```bash
   npm run db:generate
   npm run db:deploy
   ```

4. **Seed Initial Permissions & Roles** (Optional):
   ```bash
   npm run db:seed
   ```

5. **Start Concurrent Development Servers**:
   ```bash
   npm run dev
   ```
   - **Frontend Application**: `http://localhost:5173`
   - **Backend API Gateway**: `http://localhost:5000`
   - **API Health Endpoint**: `http://localhost:5000/api/health`

---

## 4. SCRIPTS & OPERATIONAL COMMANDS

| Command | Description |
|---|---|
| `npm run dev` | Starts concurrent Vite dev server and Express API with hot reloading |
| `npm run build` | Builds both frontend and backend for production |
| `npm run start` | Boots the compiled production server |
| `npm run typecheck` | Validates TypeScript across client and server |
| `npm run lint` | Runs TypeScript linting and type correctness checks |
| `npm run test` | Executes Vitest test suite |
| `npm run test:unit` | Runs backend unit tests |
| `npm run test:api` | Runs API integration test suite against PostgreSQL |
| `npm run test:security` | Runs security, IDOR, penetration and RBAC regression tests |
| `npm run test:coverage` | Computes test coverage with V8 engine |
| `npm run db:generate` | Generates Prisma Client TypeScript bindings |
| `npm run db:deploy` | Applies committed Prisma migrations to database |

---

## 5. PRODUCTION DEPLOYMENT & HARDENING

For complete infrastructure architecture, containerization instructions, zero-downtime database migration procedures, and disaster recovery runbooks, refer to:

👉 **[DEPLOYMENT.md](file:///run/media/sourav/New%20Volume/Projects/Generic_CRM/DEPLOYMENT.md)**

Key production features implemented:
- **Prisma Connection Pooling**: Centralized singleton with health check probes.
- **Helmet Security Armor**: Strict-Transport-Security (HSTS), nosniff, and clickjacking protection.
- **Strict CORS & Input Limits**: Whitelisted production origins and bounded JSON body sizes.
- **Graceful Shutdown**: Intercepts `SIGTERM`/`SIGINT`, flushes in-flight connections, and cleanly disconnects database sockets.
- **Code Splitting & Bundle Optimization**: Frontend route lazy loading with manual vendor chunking.

---

## 6. DEVELOPMENT CONSTITUTION

All contributors and AI coding agents working on this codebase must strictly adhere to the permanent development principles outlined in:

👉 **[AGENTS.md](file:///run/media/sourav/New%20Volume/Projects/Generic_CRM/AGENTS.md)**
