# Vynexa CRM — Permanent Development Constitution (AGENTS.md)

This document is the authoritative, permanent development constitution for **Vynexa CRM**. Every AI coding agent and human developer working on this codebase MUST strictly adhere to the architecture, design language, security models, database principles, and development workflows established herein.

---

## 1. PROJECT IDENTITY & SCOPE

### 1.1 Product Vision
**Vynexa CRM** is a production-oriented, commercial enterprise SaaS Customer Relationship Management system. It is designed to be a high-performance, real-world software product capable of handling multi-tenant business operations with Linear-/Stripe-grade refinement. It is **NOT** a prototype, dashboard template, or college-level demo app.

### 1.2 Feature Footprint

#### Public Experience
- **Landing Page**: Premium marketing page presenting product features, value proposition, and pricing.
- **Login**: Secure user authentication portal.
- **Signup**: Organization registration and initial administrator onboarding flow.

#### Protected Application (CRM Core)
- **Dashboard**: High-density executive and operational metrics workspace.
- **Leads**: Capture, triage, scoring, assignment, and status management.
- **Customers**: Accounts/Companies management with financial and operational context.
- **Organizations**: Multi-tenant organization boundaries and configurations.
- **Contacts**: Individual person records tied to organizations and accounts.
- **Opportunities**: Deal management with value tracking, stages, and probability.
- **Sales Pipeline**: Visual Kanban and tabular deal movement workspace.
- **Activities**: Calls, meetings, emails, notes, and interaction logging.
- **Tasks**: Action item management, assignments, due dates, and status tracking.
- **Follow-ups**: Scheduled customer check-ins and reminder triggers.
- **Products/Services**: Product catalog, line items, pricing tiers, and SKUs.
- **Quotes**: Formal price proposals, line items, discounts, and approval workflows.
- **Orders**: Closed commercial agreements converted from approved quotes.
- **Documents**: File attachments, contract uploads, and entity document associations.
- **Notifications**: In-app activity stream and action notifications.
- **Support Cases**: Customer issue tickethub, SLAs, priority, and resolution tracking.
- **Marketing Campaigns**: Lead source tracking, campaign ROI, and target lists.
- **Reports/Analytics**: Custom charts, sales performance, conversion funnels, and export tools.
- **Users**: Team member management and user profiles.
- **Roles & Permissions**: Fine-grained Role-Based Access Control (RBAC) setup.
- **Audit Logs**: Immutable history of critical business actions and system modifications.
- **Settings**: Organization preferences, integrations, security settings, and personal profiles.

---

## 2. CORE TECHNOLOGY STACK

### 2.1 Primary Stack
- **Frontend**: React, TypeScript, Vite
- **Backend**: Node.js, Express, TypeScript
- **Database**: PostgreSQL (Relational Source of Truth)
- **ORM**: Prisma

### 2.2 Approved Supporting Libraries
Only introduce third-party libraries when there is a clear, unavoidable operational need. The approved default auxiliary stack includes:
- **Styling**: Tailwind CSS, shadcn/ui primitives
- **Icons**: Lucide React (`lucide-react`)
- **Routing**: React Router (`react-router-dom`)
- **State & Data Fetching**: TanStack Query (`@tanstack/react-query`)
- **Validation**: Zod
- **Form Management**: React Hook Form (`react-hook-form` + `@hookform/resolvers`)

---

## 3. ARCHITECTURE PRINCIPLES

1. **Modular Architecture & Domain Boundaries**: Structure code by domain features (e.g., `features/leads`, `features/opportunities`) rather than giant monolith folders.
2. **Separation of Concerns**: Keep UI rendering, business logic, data access, and input validation strictly separated.
3. **Reusable Services & Primitives**: Avoid code duplication. Common routines belong in shared services or utility modules.
4. **Predictable Naming**: Use clear, camelCase/PascalCase naming conventions matching domain entity names across frontend, backend API, and database models.
5. **No Giant Files**: Split large files before they become unmaintainable (keep UI components under ~250 lines and services modular).
6. **No Circular Dependencies**: Ensure clear downward dependency graphs (e.g., UI -> State Hooks -> API Client -> Backend Route -> Controller -> Service -> Database).
7. **Seamless Feature Integration**: Integrate new features directly into the existing architecture. Never build isolated "silo" implementations or duplicate design patterns.

---

## 4. DATABASE & MULTI-TENANCY RULES

### 4.1 Database Design Standards
- **PostgreSQL** is the absolute source of truth.
- **Prisma** is the mandatory ORM layer.
- Schemas must enforce:
  - Strict data types and foreign key constraint relationships.
  - Mandatory indexes on frequently queried fields (`organizationId`, `status`, `assignedToId`, `createdAt`, foreign keys).
  - Explicit unique constraints (e.g., compound index on `[organizationId, email]`).
  - Appropriate nullability rules (never make a field nullable without a domain justification).
  - Standard audit timestamps (`createdAt`, `updatedAt`, `deletedAt` for soft deletes where required).
- Relational data MUST be stored in structured tables with proper relations, never stuffed into unstructured JSON blocks when a relational model is appropriate.

### 4.2 Mandatory Transactions
Any multi-step workflow or operation involving multiple database records MUST be wrapped inside a **Prisma Database Transaction** (`prisma.$transaction`).
*Crucial Transaction Workflows:*
- Lead → Customer conversion (creates Customer, Contact, initial Opportunity, and updates Lead status).
- Quote → Order conversion (creates Order, line items, updates Quote status, reserves stock/inventory).
- Multi-record bulk assignments or updates.
- Entity creation combined with initial audit log record generation.

### 4.3 Strict Multi-Tenancy
- Vynexa CRM operates as a multi-organization SaaS platform.
- Every organization-owned table MUST contain an `organizationId` foreign key.
- **Never trust client-supplied `organizationId` or `userId` values.**
- All queries MUST infer the active `organizationId` directly from the validated server-side authentication session/token.
- Data cross-contamination between organizations is a critical security violation. Every database lookup must strictly enforce `WHERE organizationId = context.organizationId`.

---

## 5. AUTHENTICATION & AUTHORIZATION (RBAC)

### 5.1 Access Boundaries
- **Public Routes**: Marketing Landing Page (`/`), Login (`/login`), Signup (`/signup`).
- **Protected Routes**: Entire `/app/*` application domain.

### 5.2 Server-Side Security Enforcement
- Frontend route guards are strictly for UX redirect convenience.
- **All security checks MUST be enforced server-side at the API gateway/middleware level.**
- Passwords must be hashed using industry-standard secure algorithms (e.g., `argon2` or `bcrypt`).
- Authentication sessions/tokens (e.g., HttpOnly cookies) must be securely managed with proper flags (`SameSite`, `Secure`, `HttpOnly`).
- Environment variables and secrets must never be exposed to the client bundle or committed to git repositories.

### 5.3 Role-Based Access Control (RBAC)
Supported System Roles:
1. **Super Admin**: Full tenant control, organization management, system settings, audit oversight.
2. **Sales Manager**: Pipeline management, team assignments, quote approvals, team reporting.
3. **Sales Representative**: Individual lead management, opportunity pipeline, activity tracking, personal tasks.
4. **Marketing Manager**: Lead ingestion, campaign tracking, target audience management.
5. **Customer Support Agent**: Support cases, SLA resolution, customer contacts, ticket activities.
6. **Operations / Finance User**: Order processing, catalog management, invoicing/quote auditing.
7. **Management / Executive**: Read-only executive reports, analytics, high-level dashboards.

Enforced Action Permissions:
- `view`, `create`, `edit`, `delete`, `assign`, `approve`, `export`

Backend middleware must check permissions prior to controller invocation (e.g., `requirePermission('opportunity:approve')`). UI components may visually hide or disable unauthorized buttons based on session state, but backend APIs must independently reject unauthorized requests.

---

## 6. DESIGN SYSTEM & VISUAL LANGUAGE

### 6.1 Quality Target
Vynexa CRM must match the visual polish, clean density, and aesthetic caliber of top-tier modern software tools (e.g., Linear, Stripe, Raycast). The UI must look like an enterprise product designed for power users who spend hours in the app daily.

### 6.2 Anti AI-Slop Rules (Strictly Enforced)
NEVER generate standard AI template aesthetics. The following visual anti-patterns are strictly prohibited:
- ❌ NO purple/blue neon gradients or vibrant colorful cards.
- ❌ NO heavy glassmorphism, background blur overuse, or glowing borders.
- ❌ NO decorative blobs, floating elements, or ambient background light spots.
- ❌ NO cartoon/isometric stock illustrations or random non-semantic colorful icons.
- ❌ NO giant floating cards with excessive border-radius (`rounded-3xl`).
- ❌ NO giant unscalable text headings or wasted whitespace.
- ❌ NO generic SaaS copy (e.g., "Welcome to your dashboard 🚀", "Let's boost sales!").
- ❌ NO uniform cards for every single UI widget.

### 6.3 Vynexa Color Palette (Charcoal Dark Theme)
The application utilizes a dark charcoal color system built for high focus and zero eye-strain:

| Token | Hex Value | Application |
|---|---|---|
| **Background** | `#0D0D0D` | Main application backdrop |
| **Primary Surface** | `#141414` | Sidebar, main content panels, table backgrounds |
| **Secondary Surface** | `#191919` | Cards, input fields, header bars |
| **Elevated Surface** | `#202020` | Modals, dropdown menus, popovers, tooltips |
| **Primary Text** | `#F5F5F5` | Primary headings, table data, active labels |
| **Secondary Text** | `#A1A1A1` | Subtitles, field labels, metadata |
| **Muted Text** | `#6F6F6F` | Placeholders, timestamps, disabled states |
| **Border** | `#292929` | Structural dividers, panel borders, field outlines |
| **Light Surface** | `#F7F7F5` | Contrast elements (light mode accents if needed) |
| **White** | `#FFFFFF` | Pure white highlights |

*Status Indicators*: Use muted, desaturated status colors with restraint (never let status colors dominate the UI):
- **Success**: Muted Emerald (e.g., `#10B981` at low opacity background `#064E3B`/`#022C22`)
- **Warning**: Muted Amber (e.g., `#F59E0B` at low opacity)
- **Danger**: Muted Rose/Red (e.g., `#EF4444` at low opacity)
- **Info**: Muted Slate/Cyan (e.g., `#3B82F6` at low opacity)

### 6.4 Typography
- **Primary Font**: `Manrope` (Clean, geometric, professional UI typography for all prose, headings, and labels).
- **Monospace Font**: `IBM Plex Mono` (Strictly reserved for monetary figures, entity IDs, reference codes, technical metadata, and tabular statistics). Never use monospace for general UI prose.

### 6.5 Spacing, Radius & Density
- **Spacing Scale**: Strictly follow `4px`, `8px`, `12px`, `16px`, `20px`, `24px`, `32px`, `40px`, `48px`.
- **Border Radius**: Subdued `8px` to `10px` (`rounded-md` / `rounded-lg`). Avoid excessive pill shapes except for status badges and tags.
- **Density**: High information density. Compact tables, detailed data grids, dense filter toolbars, and streamlined forms.

### 6.6 Iconography
- Use **Lucide React** (`lucide-react`) exclusively.
- Size: Standard `16px` to `20px`.
- Color: Monochrome (`#A1A1A1` or `#F5F5F5`). Never use multi-colored decorative icons.

---

## 7. UX, FORMS & RESPONSIVE DESIGN

### 7.1 State Handling Spectrum
Every view, feature, and dynamic data component must explicitly account for all 7 state representations:
1. **Loading**: Micro-skeletons (no full-screen spinners).
2. **Empty**: Contextual empty state with clear call-to-action button.
3. **Error**: Inline error state with retry option.
4. **Success**: Subtle toast feedback or inline status transition.
5. **Confirmation**: Destructive action modals with clear warnings.
6. **Disabled**: Visually distinct disabled controls with tooltip explanations where applicable.
7. **Permission Denied**: Clean access restriction screen.

### 7.2 Form Behavior & Validation
- Built with `React Hook Form` and `Zod` schema validation.
- Provide explicit input labels, helper text, and real-time inline validation feedback.
- Disable submit buttons during pending requests and display loading spinners inside the action button.
- Support full keyboard navigation (`Tab`, `Enter`, `Escape`).

### 7.3 Responsive Design Adaptations
- **Desktop (Primary)**: Collapsible sidebar, deep multi-column tables, command palettes, split-panel viewports.
- **Tablet**: Adaptive navigation, responsive grid collapse.
- **Mobile**: Touch-friendly slide-out drawers, single-column forms, scrollable data tables (no horizontal window overflow).

---

## 8. COMPONENT SYSTEM & API GUIDELINES

### 8.1 Reusable UI Primitives
Never reinvent UI components on individual pages. Standardize components in `@/components/ui`:
- Buttons, Inputs, Selects, Comboboxes, Checkboxes, Switch
- Dialogs/Modals, Drawers/Sheets, Dropdown Menus, Popovers, Tooltips
- Data Tables (built with TanStack Table), Pagination, Tabs, Badges, Avatars
- Page Headers, Breadcrumbs, Global Search, Command Palette (`Cmd+K`)
- Loading Skeletons, Empty States, Error Boundaries, Toast Notifications

### 8.2 API Contract & Data Validation
- Backend controllers MUST validate all inbound `req.body`, `req.query`, and `req.params` using `Zod` schemas.
- Consistent API response envelope:
  ```json
  {
    "success": true,
    "data": { ... },
    "meta": { "page": 1, "limit": 20, "total": 150 },
    "error": null
  }
  ```
- Error response format:
  ```json
  {
    "success": false,
    "data": null,
    "error": {
      "code": "PERMISSION_DENIED",
      "message": "You do not have permission to approve quotes."
    }
  }
  ```

---

## 9. SECURITY, AUDIT & FILE HANDLING

### 9.1 Security Hardening
- Enforce rate limiting on authentication endpoints (`/api/auth/login`, `/api/auth/signup`).
- Set secure HTTP response headers (`Helmet`).
- Sanitize input to prevent SQL injection (handled via Prisma parameterization) and XSS.
- Audit environment configuration on server boot up (crash early if required secrets are missing).

### 9.2 Error Handling Protocols
- Centralized Express error-handling middleware.
- Log error details (stack trace, payload) internally on the server using structured logging.
- **NEVER return internal stack traces or database error strings to client endpoints.**

### 9.3 Abstracted Storage Architecture
- Documents and file uploads MUST be managed through an abstracted storage interface (`FileStorageService`).
- Storage backend should support local disk storage for development and seamlessly plug into S3/Cloud Storage for production.
- Enforce strict file type whitelisting (PDF, PNG, JPG, CSV, DOCX) and file size caps.

### 9.4 Audit Logging System
The application must record immutable audit events for all critical business actions:
- User login / authentication events.
- Entity record creation, updates, and archives/deletions.
- Stage transitions (e.g., Opportunity status change, Lead conversion).
- Permission changes or user role assignments.
- Quote approvals and Order conversions.

*Audit Log Structure*: `who` (userId), `what` (action name), `when` (timestamp), `entity` (e.g., "Opportunity"), `entityId` (UUID), `changes` (before/after delta JSON), `organizationId`.

---

## 10. CORE BUSINESS WORKFLOW LIFECYCLES

All state transitions in Vynexa CRM are deliberate business actions and MUST be validated server-side.

```
1. Lead Lifecycle:
   [ New ] ──► [ Qualified ] ──► [ Assigned ] ──► [ Contacted ] ──► [ Converted to Customer/Contact/Opportunity ]

2. Sales Opportunity Lifecycle:
   [ Qualification ] ──► [ Value Proposal ] ──► [ Negotiation ] ──► [ Closed Won / Closed Lost ]

3. Commercial Quote-to-Order Lifecycle:
   [ Opportunity ] ──► [ Draft Quote ] ──► [ Manager Approval ] ──► [ Order Generation ]

4. Customer Support Lifecycle:
   [ Issue Reported ] ──► [ Case Created ] ──► [ Agent Assigned ] ──► [ In Progress ] ──► [ Resolved / Closed ]
```

---

## 11. EIGHTEEN-PHASE INCREMENTAL DEVELOPMENT ROADMAP

Development of Vynexa CRM must proceed systematically in the following strict order:

1. **Phase 1: Foundation & Design System Setup** (Tailwind, Tokens, Typography, UI Primitives)
2. **Phase 2: Public Experience & Marketing Landing Page**
3. **Phase 3: Authentication & Onboarding Infrastructure** (JWT/Sessions, Login, Signup)
4. **Phase 4: Database Schema & Prisma ORM Configuration**
5. **Phase 5: CRM Application Shell, Layout & Dashboard**
6. **Phase 6: Multi-Tenant Organizations, User Management & RBAC**
7. **Phase 7: Lead Management & Lead Conversion Engine**
8. **Phase 8: Customers (Accounts) & Contact Directories**
9. **Phase 9: Sales Pipeline & Opportunity Management (Kanban + Data Grids)**
10. **Phase 10: Interaction Tracking (Activities, Tasks, & Follow-ups)**
11. **Phase 11: Catalog & Commercial Engine (Products, Quotes, & Orders)**
12. **Phase 12: Entity Document Management, Notifications, & Support Ticket Hub**
13. **Phase 13: Marketing Campaigns & Business Intelligence / Analytics**
14. **Phase 14: System Audit Logs & Security Hardening**
15. **Phase 15: Global Search (`Cmd+K`), Filters, & UX Polish**
16. **Phase 16: Automated Testing & Performance Optimization**
17. **Phase 17: Production Build, Dockerization, & Deployment Pipelines**
18. **Phase 18: Final Quality Assurance & Release Validation**

---

## 12. RULES FOR AI AGENTS & DEVELOPERS

When working on Vynexa CRM, all AI coding agents MUST strictly follow these rules before making any changes:

1. **Inspect Before Mutating**: Carefully inspect existing files, utilities, and components before writing code.
2. **Reuse Existing Patterns**: Check `@/components/ui`, shared hooks, and existing domain services. Never re-implement an existing visual component or utility function.
3. **Make Surgical, Clean Changes**: Avoid touching unrelated files or making blanket refactors unless instructed.
4. **No Fake / Stub Functionality**: Do not write mock API endpoints or hardcode fake frontend arrays where real database persistence is required by the current phase.
5. **Design System Fidelity**: Verify that all new UI components match the Vynexa Visual Language (charcoal dark palette `#0D0D0D`, Manrope font, IBM Plex Mono for figures, compact enterprise density).
6. **Never Overwrite Working Features**: Respect previously completed phases and existing tests.
7. **Test & Verify**: Always run TypeScript type-checks (`tsc --noEmit`), linters, and relevant build tests before declaring a task complete.
8. **Honest Reporting**: Summarize changes precisely and explicitly communicate any unresolved edge cases or follow-up needs.

---

*AGENTS.md is the binding constitution for the Vynexa CRM codebase. All current and future development must strictly align with this document.*
