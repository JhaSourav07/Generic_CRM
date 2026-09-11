# Vynexa CRM — System Overview & Architecture Guide

This document provides a comprehensive technical overview of everything implemented in **Vynexa CRM** to date. It serves as an authoritative guide for human developers and AI coding agents inspecting, maintaining, or extending the codebase.

---

## 1. EXECUTIVE SUMMARY & SCOPE

Vynexa CRM is a commercial-grade, multi-tenant enterprise SaaS Customer Relationship Management system built with Linear-/Stripe-caliber refinement. 

### Current Progress (Phase 1, Phase 2, Phase 3 & Phase 4 Complete)
- **Technical Architecture**: Full client/server setup using React 18, Vite, TypeScript, Express, Node.js, PostgreSQL, and Prisma ORM.
- **Database Architecture (Phase 2)**: Complete PostgreSQL schema with 24 relational models, 10 enums, composite indexes, multi-tenant boundaries (`organizationId`), and a reproducible seeding script ([prisma/seed.ts](file:///run/media/sourav/New%20Volume/Projects/Generic_CRM/prisma/seed.ts)).
- **Public Landing Page (Phase 3)**: Complete 11-component market-ready landing page (`/`) featuring hero positioning, interactive CRM product viewport preview with Indian currency formatting (`₹`), 6-capability grid, 7-stage customer lifecycle sequence, pipeline showcase, daily agenda workspace, business intelligence KPI rows, enterprise security highlight, final CTA, and footer.
- **Production-Ready Authentication (Phase 4)**: Real PostgreSQL database-backed authentication system featuring transactional Organization + Admin user signup, bcrypt password hashing, signed JWT session management via HttpOnly cookies (`vynexa_token`), Express `requireAuth` and `requireRole` middleware, client `AuthContext` provider with session restoration, `ProtectedRoute` client route guard, connected login/signup forms, and topbar account context & functional logout.
- **Design System**: Vynexa Charcoal Dark Theme (`#0D0D0D` base), typography-driven layout using `Manrope` for UI prose and `IBM Plex Mono` for tabular/numerical data.
- **20 UI Primitives**: Standardized atomic UI components matching the charcoal visual language.
- **Application Shell**: High-density collapsible sidebar with 8 navigation domains, topbar command search, organization context, and account menu.
- **Public & Protected Pages**: Public Landing Page (`/`), Authentication portals (`/login`, `/signup`), and Protected Application Viewports (`/app/dashboard`, `/app/leads`, `/app/customers`, `/app/contacts`, `/app/pipeline`).
- **Super Admin Governance**: Unlimited system access authorization engine configured via environment variables.

---

## 2. PROJECT DIRECTORY LAYOUT

```
Generic_CRM/
├── AGENTS.md                  # Project constitution (authoritative development rules)
├── .env                       # Active runtime environment secrets & configuration
├── .env.example               # Template environment configuration
├── package.json               # Root workspace scripts (concurrent dev, builds, typechecks)
├── README.md                  # Quickstart guide
├── docs/                      # Technical documentation
│   └── process/
│       └── SYSTEM_OVERVIEW.md # THIS FILE (Detailed technical reference)
├── prisma/
│   └── schema.prisma          # PostgreSQL datasource & Prisma ORM configuration
├── server/                    # Node.js + Express + TypeScript Backend
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       ├── app.ts             # Express application configuration & middleware pipeline
│       ├── server.ts          # Server listener entrypoint
│       ├── config/
│       │   └── env.ts         # Zod runtime environment variable validation
│       ├── middleware/
│       │   ├── auth.middleware.ts # requireAuth & requireRole security middleware
│       │   └── errorHandler.ts # Centralized Express error handler (AGENTS.md envelope)
│       ├── modules/
│       │   └── auth/          # Authentication module (service, controller, routes, validation, types)
│       │       ├── auth.controller.ts
│       │       ├── auth.routes.ts
│       │       ├── auth.service.ts
│       │       ├── auth.types.ts
│       │       └── auth.validation.ts
│       ├── routes/
│       │   └── health.routes.ts # Health check endpoint (/api/health)
│       └── utils/
│           └── rbac.ts        # Role-Based Access Control & Super Admin privilege checks
└── client/                    # React 18 + Vite + TypeScript Frontend
    ├── package.json
    ├── index.html             # Manrope & IBM Plex Mono font imports
    ├── vite.config.ts         # Vite bundler configuration & API proxy
    ├── tailwind.config.js     # Vynexa Charcoal design system color tokens
    ├── postcss.config.js
    ├── tsconfig.json
    └── src/
        ├── main.tsx           # React DOM root render entrypoint
        ├── App.tsx            # Global provider wrapper (QueryClient, ToastProvider, AuthProvider, Router)
        ├── components/
        │   ├── auth/          # ProtectedRoute.tsx (Session guard for /app/*)
        │   └── ui/            # 20 Reusable atomic UI primitives
        ├── context/
        │   └── AuthContext.tsx # Centralized authentication context provider & useAuth hook
        ├── layouts/           # Sidebar, Topbar, ApplicationShell
        ├── pages/
        │   ├── public/        # LandingPage.tsx
        │   ├── auth/          # LoginPage.tsx, SignupPage.tsx
        │   └── app/           # DashboardPage, LeadsPage, CustomersPage, ContactsPage, PipelinePage
        ├── routes/
        │   └── index.tsx      # React Router definition with ProtectedRoute & PublicOnlyRoute guards
        ├── services/
        │   ├── api.ts         # Centralized Fetch wrapper with credentials: 'include'
        │   └── auth.service.ts # Frontend authentication API service
        ├── lib/
        │   ├── utils.ts       # Tailwind class merger helper (`cn`)
        │   └── queryClient.ts # TanStack Query client configuration
        ├── types/
        │   ├── index.ts       # Global TypeScript interfaces & API response envelope
        │   └── auth.types.ts  # Frontend authentication types & payloads
        └── styles/
            └── index.css      # CSS reset, dark scrollbars, focus indicators
```

---

## 3. BACKEND ARCHITECTURE & LOGIC DETAILS

The backend API engine is built with Node.js, Express, and TypeScript. All responses strictly adhere to the standard API response envelope defined in `AGENTS.md`.

### 3.1 Response & Error Contract
- **Success Response**:
  ```json
  {
    "success": true,
    "data": { ... },
    "meta": { "page": 1, "limit": 20, "total": 100 },
    "error": null
  }
  ```
- **Error Response**:
  ```json
  {
    "success": false,
    "data": null,
    "error": {
      "code": "ERROR_CODE",
      "message": "Human readable error details"
    }
  }
  ```

### 3.2 Backend Module Breakdown

1. **Environment Config (`server/src/config/env.ts`)**:
   - Uses `zod` to validate all incoming `process.env` variables on application boot up.
   - Required Variables:
     - `PORT`: Port number (default `5000`).
     - `NODE_ENV`: Application mode (`development`, `production`, `test`).
     - `CLIENT_URL`: Allowed CORS origin (`http://localhost:5173`).
     - `DATABASE_URL`: PostgreSQL connection string.
     - `AUTH_SECRET`: Secret key for JWT / session signing.
     - `ADMIN_EMAIL`: Super Admin user email (`admin@vynexa.com`).
     - `ADMIN_PASSWORD`: Super Admin password.
     - `ADMIN_SECRET_KEY`: System bypass key.
   - *Logic*: If any required variable fails validation, the backend logs detailed field errors and crashes early (`process.exit(1)`).

2. **Express Application Pipeline (`server/src/app.ts` & `server/src/server.ts`)**:
   - Enables CORS allowing requests from `CLIENT_URL` with `credentials: true`.
   - Mounts `cookie-parser` for reading HttpOnly session cookies.
   - Parses inbound JSON and URL-encoded bodies.
   - Mounts health check routes at `/api` and auth routes at `/api/auth`.
   - Catches unknown routes with a standard 404 error envelope.
   - Invokes centralized error middleware.

3. **Centralized Error Handler (`server/src/middleware/errorHandler.ts`)**:
   - Intercepts all unhandled Express errors (`AppError`).
   - Logs detailed error messages and stack traces server-side.
   - Returns sanitized JSON error responses to client endpoints without exposing internal database stack traces in production.

4. **Health Check Endpoint (`server/src/routes/health.routes.ts`)**:
   - `GET /api/health`
   - *Logic*: Evaluates server health status and returns standard envelope JSON containing status `healthy`, service name, current environment, and ISO timestamp.

5. **RBAC & Super Admin Governance (`server/src/utils/rbac.ts`)**:
   - Exports `isSuperAdmin(context)` and `hasPermission(context, permission)`.
   - *Logic*: Evaluates if a user's role is `SUPER_ADMIN` or matches `ADMIN_EMAIL`. Super Admin users bypass all granular permission restrictions, granting **unlimited system access** across all organization boundaries and entity actions.

---

## 4. FRONTEND ARCHITECTURE & DESIGN SYSTEM

### 4.1 Visual Design System & Tokens
Vynexa CRM uses a dark charcoal visual theme configured in `client/tailwind.config.js` and `client/src/styles/index.css`:

| Token Name | Hex Code | Purpose |
|---|---|---|
| `vynexa-bg` | `#0D0D0D` | Main application background |
| `vynexa-surface` | `#141414` | Main sidebar, table, and panel surface |
| `vynexa-surface-secondary` | `#191919` | Inputs, cards, table header surface |
| `vynexa-surface-elevated` | `#202020` | Modals, dropdown menus, tooltips |
| `vynexa-text-primary` | `#F5F5F5` | Headings, active text, primary labels |
| `vynexa-text-secondary` | `#A1A1A1` | Subtitles, field labels, metadata |
| `vynexa-text-muted` | `#6F6F6F` | Placeholders, timestamps, borders |
| `vynexa-border` | `#292929` | Structural dividers and panel outlines |
| `Status Accents` | Restrained Emerald (`#10B981`), Amber (`#F59E0B`), Red (`#EF4444`), Blue (`#3B82F6`) |

#### Typography Rules
- **Primary Font**: `Manrope` (Clean geometric font for all UI prose, headings, and labels).
- **Monospace Font**: `IBM Plex Mono` (Reserved exclusively for monetary values, reference codes, entity IDs, and statistics).

---

### 4.2 Reusable UI Primitive Component Suite (`client/src/components/ui/`)

1. **Button (`button.tsx`)**: Supports 6 variants (`primary`, `secondary`, `outline`, `ghost`, `danger`, `subdued`), loading spinner, and left/right Lucide icons.
2. **Input (`input.tsx`)**: Monochromatic input field with focus state, label, helper text, error indicator, and left/right icon slots.
3. **Textarea (`textarea.tsx`)**: Auto-resizing textarea input.
4. **Select (`select.tsx`)**: Styled dropdown select with chevron indicator.
5. **Checkbox (`checkbox.tsx`)**: Accessible custom checkbox control with label.
6. **Switch (`switch.tsx`)**: Smooth toggle switch for settings.
7. **Badge (`badge.tsx`)**: Status pill badge supporting muted emerald, amber, red, blue, slate, and outline variants.
8. **Avatar (`avatar.tsx`)**: User avatar rendering image or generated two-letter uppercase initials in IBM Plex Mono.
9. **Tooltip (`tooltip.tsx`)**: Hover context tooltip supporting top, bottom, left, and right positions.
10. **Dropdown (`dropdown.tsx`)**: Context menu container (`Dropdown`), items (`DropdownItem`), and dividers (`DropdownSeparator`).
11. **Dialog (`dialog.tsx`)**: Modal overlay component with backdrop blur, title, description, close button, and Escape key listener.
12. **Drawer (`drawer.tsx`)**: Slide-out drawer sheet container.
13. **Tabs (`tabs.tsx`)**: Segmented tab control with active pill indicator and item count badges.
14. **Card (`card.tsx`)**: Card container suite (`Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter`) with standard 8–10px border radius.
15. **Table (`table.tsx`)**: High-density data grid suite (`Table`, `TableHeader`, `TableBody`, `TableRow`, `TableHead`, `TableCell`).
16. **Skeleton (`skeleton.tsx`)**: Animated pulse placeholder for micro-loading states.
17. **Toast (`toast.tsx`)**: Context provider (`ToastProvider`) and hook (`useToast`) for pop-up notification messages.
18. **Separator (`separator.tsx`)**: Horizontal or vertical divider line.
19. **Breadcrumb (`breadcrumb.tsx`)**: Navigation hierarchy breadcrumb trail.
20. **PageHeader (`page-header.tsx`)**: Standardized view header containing title, subtitle, breadcrumbs, and action button bar.

---

### 4.3 Layout Components (`client/src/layouts/`)

1. **Sidebar (`Sidebar.tsx`)**:
   - Displays Vynexa CRM branding logo and version badge.
   - Supports expanding/collapsing sidebar drawer.
   - Contains 8 organized navigation sections:
     - **OVERVIEW**: Dashboard
     - **CRM**: Leads, Customers, Contacts, Organizations
     - **SALES**: Pipeline, Opportunities, Quotes, Orders, Products
     - **WORKSPACE**: Tasks, Activities, Follow-ups, Documents
     - **SUPPORT**: Support Cases
     - **MARKETING**: Campaigns
     - **INSIGHTS**: Reports
     - **ADMINISTRATION**: Users, Roles & Permissions, Settings, Audit Logs
   - Highlights active routes with subtle `#191919` surface highlights.

2. **Topbar (`Topbar.tsx`)**:
   - Contains mobile drawer toggle button.
   - Features active Organization context badge (`user.organization.name` & `user.role.name`).
   - Features global search input placeholder (`Cmd+K`).
   - Features notification bell indicator.
   - Includes user account dropdown menu displaying user's full name, email, and functional `Sign Out` action.

3. **ApplicationShell (`ApplicationShell.tsx`)**:
   - Full viewport layout integrating Sidebar, Topbar, and responsive scrollable `<Outlet />` viewport.

---

### 4.4 Pages & Routing Logic (`client/src/pages/` & `client/src/routes/`)

1. **Landing Page (`/` -> `pages/public/LandingPage.tsx`)**:
   - Public marketing page presenting Vynexa CRM's value proposition.
   - Features Hero section ("Customer relationships, intelligently organized."), primary CTA ("Get Started" -> `/signup`), secondary CTA ("Sign In" -> `/login`).
   - Features interactive system showcase preview simulating pipeline Kanban board.
   - Features Capabilities section (Lead Management, Deal Pipelines, Commercial Engine).
   - Features Enterprise Security section highlighting row-level multi-tenancy and server-side RBAC.
   - Features clean footer.

2. **Login Page (`/login` -> `pages/auth/LoginPage.tsx`)**:
   - Production workspace sign-in portal connected to `useAuth().login()`.
   - Renders Vynexa CRM logo, Email input, Password input, Sign In button with pending spinner state, error alert banners, and redirect logic.

3. **Signup Page (`/signup` -> `pages/auth/SignupPage.tsx`)**:
   - Organization onboarding portal connected to `useAuth().signup()`.
   - Renders Full Name, Work Email, Organization Name, Password, and Confirm Password fields.
   - Triggers transactional creation of Organization, Admin User, Role, and default Sales Pipeline in PostgreSQL.

4. **Dashboard Page (`/app/dashboard` -> `pages/app/DashboardPage.tsx`)**:
   - Executive overview workspace shell displaying module quick-navigation cards and architecture status details.

5. **Leads Page (`/app/leads` -> `pages/app/LeadsPage.tsx`)**:
   - Lead management directory shell featuring a high-density table structure, status badges, and action buttons.

6. **Customers Page (`/app/customers` -> `pages/app/CustomersPage.tsx`)**:
   - Customer accounts directory shell.

7. **Contacts Page (`/app/contacts` -> `pages/app/ContactsPage.tsx`)**:
   - Individual decision maker contact directory shell.

8. **Sales Pipeline Page (`/app/pipeline` -> `pages/app/PipelinePage.tsx`)**:
   - 5-stage visual Kanban board layout shell (`QUALIFICATION`, `VALUE PROPOSAL`, `NEGOTIATION`, `CLOSED WON`, `CLOSED LOST`).

9. **Module Placeholder (`routes/index.tsx`)**:
   - Renders a clean structural shell for remaining navigation routes until their domain modules are built in future roadmap phases.

---

## 5. PHASE 2 — DATABASE ARCHITECTURE & PRISMA SCHEMA

Phase 2 establishes the production-grade PostgreSQL database foundation and Prisma ORM layer. It is designed to support multi-tenant isolation, high-performance querying, and historical commercial data stability.

### 5.1 Multi-Tenant Isolation Strategy
- **Tenant Boundary**: Every organization-owned table includes an `organizationId` foreign key referencing `Organization(id)`.
- **Server Enforcement**: All database queries must enforce `WHERE organizationId = context.organizationId`. Client-supplied organization IDs are never trusted directly.

### 5.2 Domain Enums (10 Enums)
- `LeadStatus`: `NEW`, `QUALIFIED`, `ASSIGNED`, `CONTACTED`, `CONVERTED`, `LOST`
- `OpportunityStatus`: `OPEN`, `WON`, `LOST`
- `ActivityType`: `CALL`, `MEETING`, `EMAIL`, `NOTE`, `OTHER`
- `TaskStatus`: `TODO`, `IN_PROGRESS`, `COMPLETED`, `CANCELLED`
- `TaskPriority`: `LOW`, `MEDIUM`, `HIGH`, `URGENT`
- `ProductType`: `PRODUCT`, `SERVICE`
- `QuoteStatus`: `DRAFT`, `SENT`, `VIEWED`, `APPROVED`, `REJECTED`, `EXPIRED`
- `OrderStatus`: `PENDING`, `CONFIRMED`, `PROCESSING`, `COMPLETED`, `CANCELLED`
- `SupportCaseStatus`: `OPEN`, `IN_PROGRESS`, `RESOLVED`, `CLOSED`
- `SupportCasePriority`: `LOW`, `MEDIUM`, `HIGH`, `URGENT`

### 5.3 Detailed Relational Model Breakdown (24 Models)

1. **`Organization`**: Multi-tenant root boundary entity (`slug` `@unique`).
2. **`User`**: System user profile linked to an Organization and Role (`@@unique([organizationId, email])`).
3. **`Role`**: RBAC system & custom organization roles (`SUPER_ADMIN`, `SALES_MANAGER`, `SALES_REPRESENTATIVE`, `MARKETING_MANAGER`, `SUPPORT_AGENT`, `OPERATIONS_FINANCE`, `EXECUTIVE`).
4. **`Permission`**: Resource action permission definition (`resource` + `action`).
5. **`RolePermission`**: Composite primary key junction connecting roles and permissions (`@@id([roleId, permissionId])`).
6. **`Lead`**: Prospective customer record with optional conversion links `convertedAccountId` and `convertedContactId`.
7. **`Account`**: Customer company account record storing industry, contact, and address context.
8. **`Contact`**: Individual person record tied to an Account.
9. **`Pipeline`**: Sales deal workflow pipeline with default pipeline flag (`isDefault`).
10. **`PipelineStage`**: Configurable deal stage with order-based win probability (`@@unique([pipelineId, order])`).
11. **`Opportunity`**: Sales deal record storing Decimal value, probability, stage, and lost reason.
12. **`Activity`**: Customer interaction log (calls, meetings, emails, notes, duration).
13. **`Task`**: Action item and follow-up task assigned to a user.
14. **`Product`**: Product and service catalog item with SKU (`@@unique([organizationId, sku])`).
15. **`Quote`**: Formal commercial price proposal with status and `quoteNumber` `@unique`.
16. **`QuoteItem`**: Quote line item storing snapshot `unitPrice`, `discount`, `tax`, and `total` to preserve historical pricing.
17. **`Order`**: Commercial order generated from an approved quote (`orderNumber` `@unique`).
18. **`OrderItem`**: Order line item preserving historical price snapshot.
19. **`SupportCase`**: Customer support ticket tracking SLA priority, status, and resolution text.
20. **`Campaign`**: Marketing campaign tracking budget, type, and dates.
21. **`CampaignLead`**: Composite junction connecting campaigns to targeted leads (`@@id([campaignId, leadId])`).
22. **`Document`**: CRM file metadata storing `mimeType`, `size`, and `storageKey` for external object storage integration.
23. **`Notification`**: In-app alert notification assigned to a user (`@@index([organizationId, userId, isRead])`).
24. **`AuditLog`**: Immutable audit log recording user actions (`oldValue`, `newValue`, `metadata` JSON).

---

## 6. PHASE 3 — PUBLIC LANDING PAGE ARCHITECTURE

Phase 3 implements the market-ready public landing page at route `/`. Built with an 11-component modular architecture, it showcases the product capabilities, pipeline metrics, and enterprise security of Vynexa CRM without relying on generic AI marketing clichés.

### 6.1 Positioning & Visual Polish
- **Core Message**: *"One system for the entire customer lifecycle."*
- **Design Language**: Dark charcoal palette (`#0D0D0D` base), typography-driven visual hierarchy using `Manrope` for UI prose and `IBM Plex Mono` for tabular/numerical data.
- **Anti-AI-Slop Compliance**: Zero neon gradients, zero glowing borders, zero cartoon illustrations, zero fake testimonials, zero fake partner logos, and zero fake customer counts.

### 6.2 Modular Component Breakdown (`client/src/components/landing/`)
1. **`Navbar.tsx`**: Sticky wordmark `VYNEXA CRM`, navigation links, `Log in` and `Get started` buttons.
2. **`Hero.tsx`**: Value proposition headline, subheadline, CTAs, and architecture assurance bar.
3. **`ProductPreview.tsx`**: Application viewport preview with Indian currency formatting (`₹`).
4. **`CRMCapabilities.tsx`**: Editorial 6-grid capability layout.
5. **`CustomerLifecycle.tsx`**: Connected 7-stage customer journey timeline (`01 Lead` → `07 Retention`).
6. **`PipelineShowcase.tsx`**: Sales pipeline stage totals and historical pricing protection details.
7. **`TeamWorkspace.tsx`**: Operational daily activity agenda schedule.
8. **`InsightsShowcase.tsx`**: Analytics viewport with KPI metrics and monthly funnel SVG chart.
9. **`SecuritySection.tsx`**: Row-level multi-tenancy, RBAC roles, and audit log overview.
10. **`FinalCTA.tsx`**: Closing call-to-action block.
11. **`Footer.tsx`**: 4-column product & legal footer.

---

## 7. PHASE 4 — PRODUCTION-READY AUTHENTICATION ARCHITECTURE

Phase 4 implements real, secure, database-backed authentication for Vynexa CRM connected directly to PostgreSQL through Prisma ORM.

### 7.1 Security & Session Model
- **Password Hashing**: Passwords are hashed server-side using `bcryptjs` with a salt round / cost factor of `10`. Plaintext passwords are never stored in the database or returned in API responses.
- **Session Tokens**: Authentication tokens are signed JWTs containing `userId`, `organizationId`, `roleId`, `roleName`, and `email` with a 7-day expiration (`expiresIn: '7d'`).
- **HttpOnly Cookie Storage**: Tokens are stored in HttpOnly cookies (`vynexa_token`) configured with `httpOnly: true`, `sameSite: 'lax'`, and `secure: process.env.NODE_ENV === 'production'`. Passwords and secret tokens are never stored in client `localStorage` or exposed to client-side scripts.
- **Generic Auth Errors**: Login failures return generic 401 error messages (`Invalid email or password`) to prevent account enumeration attacks.

### 7.2 Transactional Signup Engine (`AuthService.signup`)
When a new organization registers via `/api/auth/signup`, the operation executes inside a **Prisma Database Transaction** (`prisma.$transaction`) ensuring strict atomicity:
1. **Organization Creation**: Creates the Organization entity with a unique slug derived from the organization name.
2. **Email Uniqueness Verification**: Enforces unique email addresses per organization (`@@unique([organizationId, email])`).
3. **Role Assignment**: Assigns `SUPER_ADMIN` if the email matches `ADMIN_EMAIL`, or creates/assigns an Organization Administrator role (`SALES_MANAGER`).
4. **User Creation**: Hashes the password with bcrypt and creates the User record with `isActive: true`.
5. **Default Sales Pipeline**: Automatically initializes the organization's default Sales Pipeline with 5 stages (`Qualification`, `Value Proposal`, `Negotiation`, `Closed Won`, `Closed Lost`).

### 7.3 Backend Authentication Module Breakdown (`server/src/modules/auth/`)
- `auth.validation.ts`: Zod validation schemas for `signupSchema` (organizationName, name, email, password, confirmPassword) and `loginSchema` (email, password).
- `auth.service.ts`: Business logic methods (`hashPassword`, `comparePassword`, `generateToken`, `verifyToken`, `sanitizeUser`, `signup`, `login`, `getMe`).
- `auth.controller.ts`: Express controllers (`signup`, `login`, `logout`, `getMe`) managing HttpOnly cookies and returning standard response envelopes.
- `auth.routes.ts`: Route declarations mounted at `/api/auth` (`POST /signup`, `POST /login`, `POST /logout`, `GET /me`).

### 7.4 Security Middleware (`server/src/middleware/auth.middleware.ts`)
- `requireAuth`: Extracts JWT token from `req.cookies.vynexa_token` or `Authorization: Bearer <token>`, verifies signature, and attaches `req.user` payload context. Throws 401 `AppError` if token is missing or expired.
- `requireRole(...roles)`: Verifies if `req.user.roleName` matches allowed roles. `SUPER_ADMIN` role bypasses role-specific restrictions. Throws 403 `AppError` if unauthorized.

### 7.5 Frontend Authentication State (`client/src/context/AuthContext.tsx`)
- `AuthProvider`: Centralized React context provider wrapping the entire application in `App.tsx`.
- `fetchCurrentUser`: On initial mount, sends `GET /api/auth/me` with `credentials: 'include'` to restore authenticated user state automatically if a valid cookie exists.
- `useAuth()` Hook: Exposes `user`, `loading`, `isAuthenticated`, `signup`, `login`, `logout`, and `refetchUser`.

### 7.6 Route Protection & Layout Integration
- **`ProtectedRoute.tsx`**: Guards all `/app/*` application viewports. Renders a smooth charcoal loading indicator while verifying session state, redirects unauthenticated requests to `/login`, and renders child routes (`<Outlet />`) when authenticated.
- **`PublicOnlyRoute`**: Redirects authenticated users away from `/login` and `/signup` back to `/app/dashboard`.
- **`LoginPage.tsx` & `SignupPage.tsx`**: Connected directly to `useAuth()`, displaying real validation error banners and toast notifications.
- **`Topbar.tsx`**: Renders real authenticated user name, email, organization name, role badge, and handles functional `Sign Out` action.

---

## 8. HOW TO EXTEND OR EDIT THIS CODEBASE

When modifying or adding new functionality to Vynexa CRM, strictly follow these rules:

1. **Read `AGENTS.md` First**: Ensure all changes align with the permanent project constitution.
2. **Reuse Existing UI Primitives**: Always import UI controls from `@/components/ui/` (`Button`, `Input`, `Card`, `Badge`, `Table`, `Dialog`, etc.). Never write raw unstyled HTML buttons or custom floating cards.
3. **Preserve Color Tokens**: Use Tailwind tokens (`bg-vynexa-bg`, `bg-vynexa-surface`, `border-vynexa-border`, `text-vynexa-text-primary`, `text-vynexa-text-secondary`, `font-mono`, `font-sans`).
4. **Follow Server API Response Envelope**: Wrap all new backend controller responses in `{ success: true, data: ..., error: null }`.
5. **Enforce Server-Side Security**: Always derive `organizationId` and user permissions from the validated server session; never trust client-supplied organization IDs.
6. **Verify Build**: Always run `npm run typecheck` and `npm run build` after making code updates.
