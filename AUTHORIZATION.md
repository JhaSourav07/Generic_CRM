# Vynexa CRM — Authorization, Ownership & Business-Rule Matrix (AUTHORIZATION.md)

This document establishes the definitive authorization architecture, multi-tenant isolation principles, domain ownership rules, and state-machine transitions enforced throughout **Vynexa CRM**.

---

## 1. THREE-TIER ACCESS MODEL

Security in Vynexa CRM is enforced across three sequential validation gates on every non-public API endpoint:

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Tenant Isolation Gate                                    │
│    WHERE organizationId = context.organizationId            │
│    (Cross-tenant access yields 404 NOT_FOUND — Zero Leakage)│
└──────────────────────────────┬──────────────────────────────┘
                               │ PASS
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. Role-Based Access Control (RBAC) Permission Gate         │
│    requirePermission(resource, action)                      │
│    (Super Admin bypasses; other roles checked in DB)        │
└──────────────────────────────┬──────────────────────────────┘
                               │ PASS
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. Record Ownership & Business-Rule Domain Gate             │
│    assertResourceOwnership(context, target, options)        │
│    - Record Owner / Assignee / Creator                      │
│    - Domain Manager / Super Admin Override                  │
│    (Unauthorized mutations yield 403 FORBIDDEN)            │
└─────────────────────────────────────────────────────────────┘
```

1. **Tier 1: Tenant Boundary (Multi-Tenancy)**
   - Every entity in the database is scoped to an `organizationId`.
   - The server extracts `organizationId` directly from the verified session/JWT (`req.user.organizationId`). Client-supplied tenant IDs in request bodies or query parameters are unconditionally discarded.
   - Any query attempting to access a record belonging to another organization returns HTTP `404 Not Found` (never 403), completely preventing entity enumeration or IDOR leakage.

2. **Tier 2: Role-Based Access Control (RBAC)**
   - Route middleware (`requirePermission(resource, action)`) checks if the user's role has been granted the required permission (e.g. `('tasks', 'UPDATE')`).
   - `SUPER_ADMIN` has platform-wide bypass for operational continuity.
   - Unauthorized attempts return HTTP `403 Forbidden` (`PERMISSION_DENIED`).

3. **Tier 3: Domain Ownership & Business Validation**
   - Even if a user has the broad `UPDATE` permission for a resource, they cannot mutate records assigned to or owned by other team members unless they possess a managerial or administrative role for that domain.
   - Enforced by server-side utility guards in `server/src/utils/auth-helpers.ts`.

---

## 2. DOMAIN OWNERSHIP & ROLE HIERARCHY MATRIX

| CRM Module | Read / List Access | Creation | Update / Status Mutation | Reassignment / Transfer | Deletion | Approval / Final State |
|---|---|---|---|---|---|---|
| **Tasks** | Organization Members | Any authorized member | Assigned User, Creator, or Sales Manager / Super Admin | Assigned User, Creator, or Sales Manager / Super Admin | Creator or Sales Manager / Super Admin | Assignee, Creator, or Sales Manager / Super Admin |
| **Leads** | Organization Members | Any authorized member | Lead Owner or Sales Manager / Super Admin | Lead Owner or Sales Manager / Super Admin | Sales Manager or Super Admin | Lead Owner or Sales Manager / Super Admin (Convert) |
| **Opportunities** | Organization Members | Any authorized member | Opportunity Owner or Sales Manager / Super Admin | Opportunity Owner or Sales Manager / Super Admin | Opportunity Owner or Sales Manager / Super Admin | Opportunity Owner or Sales Manager / Super Admin (Win/Lose) |
| **Quotes** | Organization Members | Sales Reps, Managers, Admins | Quote Creator or Sales Manager / Super Admin (Draft only) | Creator, Sales Manager, or Super Admin | Creator or Sales Manager / Super Admin (Draft only) | **Sales Manager or Super Admin Only** (`approveQuote` / `rejectQuote`) |
| **Orders** | Organization Members | System Conversion or Authorized Roles | Creator, Operations/Finance, Sales Manager, Super Admin | Operations/Finance, Sales Manager, Super Admin | Operations/Finance, Sales Manager, Super Admin (Pending/Cancelled only) | **Operations/Finance, Sales Manager, or Super Admin Only** (`confirm`, `process`, `complete`, `cancel`) |
| **Support Cases** | Organization Members | Any authorized member | Assigned Agent, Creator, or Support/Sales Manager / Super Admin | Assigned Agent, Support/Sales Manager, Super Admin (or any member if Unassigned) | Support/Sales Manager or Super Admin | Assigned Agent, Creator, or Support/Sales Manager / Super Admin |
| **Documents** | Organization Members | Any authorized member | File Uploader or Sales Manager / Super Admin | Uploader or Sales Manager / Super Admin | File Uploader or Sales Manager / Super Admin | N/A |
| **Campaigns** | Organization Members | Marketing Manager, Sales Manager, Super Admin | Campaign Creator, Marketing Manager, Sales Manager, Super Admin | Marketing Manager, Sales Manager, Super Admin | Marketing Manager, Sales Manager, Super Admin | Marketing Manager, Sales Manager, Super Admin |
| **Users** | Organization Members | Administrators | Administrator | Administrator | Administrator (Deactivate) | **Self-Demotion Blocked; Self-Deactivation Blocked; Last-Admin Protected** |

---

## 3. STATE MACHINE WORKFLOWS

All critical state transitions are validated atomically inside PostgreSQL database transactions (`prisma.$transaction`) with immutable audit logging.

### 3.1 Task Lifecycle
```
[ TODO ] <───────────> [ IN_PROGRESS ] ───────────► [ COMPLETED ]
   │                          │                           │
   └──────────────────────────┴───────────────────────────┴──► [ CANCELLED ]
```
- **Permission**: The assignee, creator, or sales manager/super admin can toggle task status or mark it completed.
- **Rule**: Unassigned tasks can be completed or claimed by any team member in the organization. Once assigned to User A, User B cannot complete or alter it.

### 3.2 Lead Conversion Engine
```
[ NEW ] ──► [ CONTACTED ] ──► [ QUALIFIED ] ──► [ CONVERTED ]
                                                      │
                       ┌──────────────────────────────┴──────────────────────────────┐
                       ▼                                                             ▼
             [ Customer Account ] + [ Contact ]                       [ Initial Deal (Opportunity) ]
```
- **Transaction**: Creates `Account`, creates `Contact`, optionally creates initial `Opportunity`, links them together, updates `Lead` status to `CONVERTED`, sets `convertedAt` timestamp, and logs `LEAD_CONVERTED` in audit logs.
- **Rule**: Only the assigned lead owner or sales manager/super admin can trigger conversion.

### 3.3 Commercial Quote-to-Order Workflow
```
[ DRAFT ] ──► [ PENDING_APPROVAL ] ──► [ APPROVED ] ──► [ CONVERTED_TO_ORDER ]
    │                 │                      │
    ▼                 ▼                      ▼
[ REJECTED ]      [ REJECTED ]          [ EXPIRED ]
```
- **Quote Approval Rule**: Only `SALES_MANAGER` or `SUPER_ADMIN` can approve or reject price proposals. Sales representatives are rejected with `403 Forbidden`.
- **Order Conversion Transaction**: Atomically verifies quote is `APPROVED`, creates new `Order`, calculates taxes and line-item totals from catalog, converts quote status to `CONVERTED_TO_ORDER`, and records `QUOTE_CONVERTED_TO_ORDER` in audit logs.

### 3.4 Order Financial Fulfillment
```
[ PENDING ] ──► [ CONFIRMED ] ──► [ PROCESSING ] ──► [ COMPLETED ]
     │                │
     └────────────────┴─────────────────────────────► [ CANCELLED ]
```
- **Rule**: Transitions to `CONFIRMED`, `PROCESSING`, `COMPLETED`, and `CANCELLED` are strictly restricted to `OPERATIONS_FINANCE`, `SALES_MANAGER`, and `SUPER_ADMIN`.
- **Immutability**: Orders with status `COMPLETED` cannot be cancelled or modified (`ORDER_LOCKED`).

### 3.5 Customer Support Ticketing
```
[ OPEN ] ──► [ IN_PROGRESS ] ──► [ RESOLVED ] ──► [ CLOSED ]
                                    │                │
                                    └────────────────┴──► [ REOPEN ] ──► [ OPEN ]
```
- **Rule**: Transition to `RESOLVED`, `CLOSED`, or `REOPEN` requires case assignment ownership, creator status, or support/sales managerial privileges.
- **Rule**: Closed cases cannot be transitioned directly without the explicit reopen workflow.

---

## 4. USER & TENANT SELF-PROTECTION RULES

1. **Self-Role Modification Block (`FORBIDDEN`)**:
   - A user cannot change their own role (`currentUserId === targetUserId && input.roleId`).
   - Prevents privilege escalation or accidental self-demotion. Another administrator must change the role.

2. **Self-Deactivation Block (`CANNOT_DEACTIVATE_SELF`)**:
   - A user cannot deactivate their own active session (`!isActive && currentUserId === targetUserId`).

3. **Last-Admin Protection (`LAST_ADMIN_PROTECTION`)**:
   - The system validates that at least one active administrator (`SUPER_ADMIN` or `SALES_MANAGER`) remains in the organization before permitting admin demotion or deactivation.

---

## 5. AUDIT LOGGING PROTOCOL

Every security-sensitive operation writes an immutable record to the `audit_logs` table:
- **`organizationId`**: Active tenant context.
- **`userId`**: Authenticated actor.
- **`action`**: Verb (e.g. `TASK_COMPLETED`, `LEAD_ASSIGNED`, `QUOTE_APPROVED`, `ORDER_CONFIRMED`).
- **`entity`**: Target table name (e.g. `Task`, `Quote`, `Order`, `User`).
- **`entityId`**: Primary key UUID of target record.
- **`oldValue` / `newValue`**: Snapshot delta.
- **`createdAt`**: Monotonic server timestamp.

---

## 6. FRONTEND UX ALIGNMENT

- Frontend components (e.g. `TasksPage.tsx`) query `useAuth()` to determine the current user's identity and managerial status.
- Action controls, one-click checkboxes, reassignment buttons, and delete actions are rendered disabled (`opacity-40 cursor-not-allowed`) with informative tooltip hints when a user lacks modification authority.
- The backend remains the authoritative gatekeeper; any unauthorized client requests bypass attempts are unconditionally rejected with 403 Forbidden.
