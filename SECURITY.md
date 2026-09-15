# Vynexa CRM — Security Policy & Architecture

## Overview
**Vynexa CRM** is designed with enterprise-grade defense-in-depth security principles. Multi-tenancy isolation, strict role-based access control, cryptographic integrity, and proactive vulnerability mitigation are enforced at the architectural level.

---

## 1. Authentication & Session Management

- **Session Tokens**: Authentication state is maintained via cryptographically signed JSON Web Tokens (`vynexa_token`) issued upon verified credential exchange.
- **HttpOnly Cookies**: Session cookies are transmitted with strict security flags:
  - `HttpOnly`: Prevents client-side scripts from accessing session tokens, mitigating Cross-Site Scripting (XSS) credential theft.
  - `SameSite=Lax` / `Strict`: Protects against Cross-Site Request Forgery (CSRF).
  - `Secure`: Enforced in production environments to guarantee transmission exclusively across TLS/HTTPS connections.
- **Password Hashing**: User passwords are encrypted using adaptive salt rounds with `bcrypt` / `argon2` before persistence. Raw passwords and password hashes are never logged, exposed via APIs, or included in audit trails.
- **Timing-Attack Resistance**: Authentication failures return identical generic errors (`Invalid email or password`) with consistent verification execution times to prevent user enumeration.

---

## 2. Strict Multi-Tenancy & Isolation

- **Tenant Scoping**: All tenant-owned records in the relational schema mandate an `organizationId` foreign key.
- **Server-Inferred Context**: Client-provided `organizationId` or `userId` request fields are discarded. The active tenant identifier is derived exclusively from the verified server-side JWT session context (`req.user.organizationId`).
- **Query Boundary Enforcement**: Every database query across all controllers and services strictly enforces:
  ```typescript
  where: {
    id: entityId,
    organizationId: req.user.organizationId
  }
  ```
- **In-Memory Cross-Tenant Leak Prevention**: Multi-tenant transactions use strict relational constraints and Prisma transactions (`prisma.$transaction`) to ensure atomic execution and complete isolation between tenant organizations.

---

## 3. Role-Based Access Control (RBAC)

Vynexa implements fine-grained Role-Based Access Control combining system roles with granular permission tuples (`resource` : `action`).

### Supported Roles
1. **SUPER_ADMIN**: Complete tenant control, organization settings, role assignment, and audit oversight.
2. **SALES_MANAGER**: Pipeline control, quote approvals, team assignment, and commercial management.
3. **SALES_REP**: Lead handling, personal opportunities, contact updates, and task management.
4. **MARKETING_MANAGER**: Lead ingestion, campaign lifecycle, and target list administration.
5. **SUPPORT_AGENT**: Support ticket triage, SLA monitoring, customer service communications.
6. **OPERATIONS_FINANCE**: Catalog pricing, quote-to-order verification, and billing oversight.
7. **MANAGEMENT_EXECUTIVE**: Read-only access to operational analytics, dashboards, and reports.

### Server-Side Enforcement
Frontend route guards and button disablement are considered UX enhancements only. All permissions are authoritatively validated server-side by route middleware:
```typescript
router.get('/audit-logs', requireAuth, requirePermission('audit_logs', 'VIEW'), auditLogsController.getLogs);
```

---

## 4. Protection Against Common Web Vulnerabilities

### Insecure Direct Object References (IDOR)
- Entity identifiers (UUIDv4) are accompanied by tenant validation in every read, update, and delete operation.
- Accessing valid UUIDs belonging to foreign organizations returns `404 NOT_FOUND` rather than revealing existence via `403`.

### SQL Injection Prevention
- All database interactions utilize Prisma ORM parameterized queries.
- Raw SQL queries with string interpolation are strictly prohibited.

### Mass Assignment & Parameter Injection
- Inbound request payloads (`body`, `query`, `params`) are strictly validated against runtime `Zod` schemas.
- Extra parameters (such as `organizationId`, `roleId`, `createdAt`, `passwordHash`) are stripped or rejected during controller ingestion.

### Last Administrator Protection Rule
- The system enforces a safety guard preventing the deactivation or demotion of an organization's last active administrator (`SUPER_ADMIN` or `SALES_MANAGER`).
- Any attempt to remove or demote the final administrator returns `400 LAST_ADMIN_PROTECTION` with actionable error guidance.

---

## 5. Audit Logging & Credential Redaction

- **Immutable Audit Trail**: All business-critical events (user authentication, status changes, financial approvals, lead conversions) generate permanent entries in `audit_logs`.
- **Client Immutability**: The `/api/audit-logs` endpoint is strictly read-only (`GET` only). Client attempts to create, alter, or delete audit logs via HTTP are rejected with `404`.
- **Sensitive Key Redaction**: All audit log payloads (`oldValue`, `newValue`, `metadata`) undergo recursive sanitization before API dispatch. Fields matching sensitive patterns are masked as `[REDACTED]`:
  - `password`, `passwordHash`, `token`, `secret`, `creditCard`, `authorization`

---

## 6. Rate Limiting & Throttling

To mitigate denial-of-service, brute force, and credential stuffing attacks, Vynexa deploys sliding-window rate limiters:
- **Authentication Rate Limiter**: 15 requests per 60 seconds on `/api/auth/*`.
- **Export & Report Throttler**: 30 downloads per 5 minutes on intensive analytical exports.
- **Exceeded Threshold Response**: Triggers HTTP `429 Too Many Requests` with standard rate limit response headers (`X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`).

---

## 7. File Storage Security

- **MIME Whitelist**: File uploads (`FileStorageService`) accept only approved enterprise document formats:
  - PDF (`application/pdf`)
  - Images (`image/png`, `image/jpeg`, `image/webp`)
  - Office Documents (`application/vnd.openxmlformats-officedocument...`)
  - CSV (`text/csv`)
- **Size Limits**: Enforced per-upload file size caps (10 MB maximum).
- **Path Traversal Defense**: Uploaded files are stored with random UUID identifiers on disk or object storage, completely disassociating user-controlled filenames from filesystem paths.

---

## 8. HTTP Security Headers & CORS Policy

- **Helmet**: All HTTP responses include hardened security headers:
  - `X-Content-Type-Options: nosniff`
  - `X-Frame-Options: SAMEORIGIN`
  - `X-DNS-Prefetch-Control: off`
  - `X-Download-Options: noopen`
- **Cross-Origin Resource Sharing (CORS)**: Restricted to explicitly whitelisted origin domains with credentials support. Wildcards (`*`) are disallowed for authenticated routes.
- **Database Error Sanitization**: Internal database error codes (`P2002`, `P2003`, `P2025`) are mapped to clean client-safe error envelopes. Stack traces, raw table names, and database connection strings are never leaked to clients.

---

## 9. Reporting Security Vulnerabilities

If you discover a security vulnerability in Vynexa CRM, please do NOT file a public issue. Report findings responsibly to the security team:
- **Security Contact**: `security@vynexa.internal`
- Provide detailed steps to reproduce, impact assessment, and proof-of-concept payloads where applicable.
- Reports will be acknowledged within 24 hours with coordinated remediation timelines.
