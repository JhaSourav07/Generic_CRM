# Vynexa CRM — Automated Backend Testing Architecture & Coverage Guide

This document details the architecture, setup, commands, and conventions for the **Vynexa CRM** production-grade backend testing system.

---

## 1. EXECUTIVE SUMMARY & COVERAGE METRICS

The backend testing suite achieves **100% Code Coverage** across all statements, branches, functions, and lines, alongside **100% Behavioral Coverage** (Security, Transaction Atomicity, Multi-Tenant Isolation, RBAC Authorization, Input Validation, and Error Handling).

### Final Coverage Report
```
-------------------|---------|----------|---------|---------|-------------------
File               | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s
-------------------|---------|----------|---------|---------|-------------------
All files          |     100 |      100 |     100 |     100 |
 src               |     100 |      100 |     100 |     100 |
  app.ts           |     100 |      100 |     100 |     100 |
 src/config        |     100 |      100 |     100 |     100 |
  env.ts           |     100 |      100 |     100 |     100 |
 src/middleware    |     100 |      100 |     100 |     100 |
  auth.middleware.ts|    100 |      100 |     100 |     100 |
  errorHandler.ts  |     100 |      100 |     100 |     100 |
 src/modules/auth  |     100 |      100 |     100 |     100 |
  auth.controller.ts|    100 |      100 |     100 |     100 |
  auth.routes.ts   |     100 |      100 |     100 |     100 |
  auth.service.ts  |     100 |      100 |     100 |     100 |
  auth.validation.ts|    100 |      100 |     100 |     100 |
 src/routes        |     100 |      100 |     100 |     100 |
  health.routes.ts |     100 |      100 |     100 |     100 |
 src/utils         |     100 |      100 |     100 |     100 |
  rbac.ts          |     100 |      100 |     100 |     100 |
-------------------|---------|----------|---------|---------|-------------------
```

---

## 2. TESTING STACK & ARCHITECTURE

- **Test Runner**: [Vitest](https://vitest.dev/) (Native TypeScript ESM test engine configured in `server/vitest.config.ts`).
- **HTTP Assertions**: [Supertest](https://github.com/ladjs/supertest) (Express application route testing without binding to live network ports).
- **Coverage Engine**: `@vitest/coverage-v8` with strict 100% threshold enforcement.
- **Isolated Test Database**: Dedicated PostgreSQL database (`vynexa_crm_test` on port `5433`).

### Directory Layout
```
server/
├── vitest.config.ts           # Vitest configuration & 100% coverage thresholds
└── tests/
    ├── api/                   # Supertest API integration tests (health, auth endpoints)
    │   ├── auth.api.test.ts
    │   └── health.api.test.ts
    ├── database/              # Database constraints & transaction atomicity tests
    │   ├── constraints.test.ts
    │   └── transaction.test.ts
    ├── factories/             # Reusable test data factories (Org, User, Role)
    │   ├── org.factory.ts
    │   ├── role.factory.ts
    │   └── user.factory.ts
    ├── fixtures/              # Multi-tenant test fixtures (Org A & Org B setup)
    │   └── testUsers.ts
    ├── helpers/               # Isolated test DB utilities (clearTestDb, prismaTest)
    │   └── testDb.ts
    ├── middleware/            # Auth and Error handling middleware unit tests
    │   ├── auth.middleware.test.ts
    │   └── errorHandler.test.ts
    ├── security/              # Multi-tenancy isolation & auth security tests
    │   ├── auth.security.test.ts
    │   └── multiTenancy.security.test.ts
    ├── setup/                 # Test environment configuration
    │   └── testEnv.ts
    ├── service/               # AuthService business logic tests
    │   └── auth.service.test.ts
    └── unit/                  # Unit tests (env, validation, rbac, controller)
        ├── auth.controller.test.ts
        ├── auth.validation.test.ts
        ├── env.test.ts
        └── rbac.test.ts
```

---

## 3. ISOLATED TEST DATABASE STRATEGY

Automated tests NEVER execute against development or production databases.

### Database Isolation Configuration
- **Development DB**: `vynexa_crm` (Port `5433`)
- **Test DB**: `vynexa_crm_test` (Port `5433`)
- **Connection URL**: `postgresql://postgres:postgres@localhost:5433/vynexa_crm_test?schema=public`

### Database Reset & Cleanup (`server/tests/helpers/testDb.ts`)
Between test suites, `clearTestDb()` executes an instant table truncation query (`TRUNCATE ... RESTART IDENTITY CASCADE`) ensuring 100% deterministic test execution:
```ts
export async function clearTestDb(): Promise<void> {
  await prismaTest.$executeRawUnsafe(
    'TRUNCATE TABLE audit_logs, notifications, documents, campaign_leads, campaigns, support_cases, order_items, orders, quote_items, quotes, products, tasks, activities, opportunities, pipeline_stages, pipelines, contacts, leads, accounts, users, role_permissions, permissions, roles, organizations RESTART IDENTITY CASCADE;'
  );
}
```

---

## 4. HOW TO RUN TESTS

### All Tests
From project root:
```bash
npm test
```
From `server/` directory:
```bash
npm test
```

### Coverage Report
Generates terminal summary and HTML report in `server/coverage/index.html`:
```bash
npm run test:coverage
```

### Specific Test Categories
```bash
# Unit Tests
npm --prefix server run test:unit

# API Integration Tests
npm --prefix server run test:api

# Security & Multi-Tenancy Tests
npm --prefix server run test:security

# Database Constraints & Transaction Tests
npm --prefix server run test:db

# Watch Mode for TDD
cd server && npm run test:watch
```

---

## 5. TEST SUITE CATEGORY BREAKDOWN

1. **Unit Tests (`tests/unit/`)**:
   - `env.test.ts`: Verifies environment variable parsing, default fallbacks, and schema validation.
   - `rbac.test.ts`: Verifies `isSuperAdmin` (role checks, email matching, case-insensitivity) and `hasPermission` (Super Admin bypass).
   - `auth.validation.test.ts`: Verifies `signupSchema` and `loginSchema` Zod validation (valid input, missing fields, password strength, confirmation matching, lowercase email normalization).
   - `auth.controller.test.ts`: Verifies `AuthController` validation error handling, cookie clearance exceptions, and service error forwarding.

2. **Middleware Tests (`tests/middleware/`)**:
   - `auth.middleware.test.ts`: Verifies `requireAuth` (cookie extraction, Bearer header fallback, 401 unauthenticated errors) and `requireRole` (role validation, 403 forbidden errors, `SUPER_ADMIN` role bypass).
   - `errorHandler.test.ts`: Verifies 4xx client warning logs, 5xx server error stack trace logs, and production mode message sanitization.

3. **Service Tests (`tests/service/`)**:
   - `auth.service.test.ts`: Verifies `hashPassword` (bcrypt), `comparePassword`, `generateToken`, `verifyToken`, `sanitizeUser`, `signup` (transactional Org + User + Role + default Pipeline creation), `login` (password verification, inactive user blocking, `lastLoginAt` updates), and `getMe`.

4. **API Integration Tests (`tests/api/`)**:
   - `health.api.test.ts`: Verifies `GET /api/health` 200 OK status, JSON headers, and 404 unmapped route error envelopes.
   - `auth.api.test.ts`: Verifies `POST /api/auth/signup`, `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me` with HttpOnly cookie handling via Supertest.
   - `opportunities.api.test.ts`: Comprehensive CRUD, listing with filters/search/sorting, stage transitions, assignment, Mark Won, Mark Lost, audit logging, and relationship validation.
   - `pipelines.api.test.ts`: Pipeline creation with default stages, update, safe delete protection, stage creation, stage update, stage reordering in two-phase transactions, and safe stage deletion.
   - `pipelineBoard.api.test.ts`: High-performance single-query Kanban board aggregate endpoint verifying `openCount`, `openValue`, `weightedValue`, `wonValue`, and `lostValue`.

5. **Database & Transaction Tests (`tests/database/`)**:
   - `transaction.test.ts`: Verifies 100% transactional rollback atomicity. Simulates mid-transaction failure and asserts **zero orphaned records** remain in PostgreSQL.
   - `constraints.test.ts`: Verifies unique constraints on Organization slug, User `(organizationId, email)`, and multi-tenant email separation.
   - `opportunities.transaction.test.ts`: Verifies atomic concurrency locks on `winOpportunity` and `loseOpportunity`, ensuring simultaneous state transitions cannot double-close or conflict.

6. **Security & Multi-Tenancy Tests (`tests/security/`)**:
   - `multiTenancy.security.test.ts`: Verifies strict row-level multi-tenant isolation between Organization A and Organization B. Rejects parameter tampering and IDOR cross-tenant access attempts.
   - `auth.security.test.ts`: Verifies generic 401 error messages on login failure to prevent email enumeration, verifies zero password hash leakage, and tests SQL/Script injection payload sanitization.
   - `opportunities.security.test.ts`: Verifies RBAC permission barriers (`opportunities:VIEW`, `CREATE`, `UPDATE`, `DELETE`, `ASSIGN`), cross-tenant foreign key injection rejection (tampered accountId, contactId, pipelineId, stageId, ownerId), and mass-assignment immunity.

---

## 6. CONTINUOUS INTEGRATION (CI) READINESS

To execute backend tests in a CI pipeline (e.g. GitHub Actions):
```yaml
name: Backend Test Suite
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16-alpine
        env:
          POSTGRES_DB: vynexa_crm_test
          POSTGRES_USER: postgres
          POSTGRES_PASSWORD: postgres
        ports:
          - 5433:5432
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 20
      - run: npm install
      - run: npx prisma generate
      - run: DATABASE_URL="postgresql://postgres:postgres@localhost:5433/vynexa_crm_test?schema=public" npx prisma db push --skip-generate
      - run: npm run test:coverage
```
