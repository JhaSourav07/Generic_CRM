# Vynexa CRM — Enterprise SaaS Platform

Vynexa CRM is a commercial enterprise SaaS Customer Relationship Management system designed with Linear-/Stripe-grade visual refinement and a dark charcoal design system.

## Stack Overview
- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, TanStack Query, React Router, Lucide Icons, React Hook Form, Zod
- **Backend**: Node.js, Express, TypeScript, Zod, Cors
- **Database & ORM**: PostgreSQL, Prisma ORM
- **Design System**: Vynexa Charcoal Dark Theme (`#0D0D0D` base), Manrope typography, IBM Plex Mono data font

## Getting Started

### Prerequisites
- Node.js >= 18
- PostgreSQL server instance

### Setup & Development Commands

1. **Install Dependencies**:
   ```bash
   npm install
   cd client && npm install
   cd ../server && npm install
   cd ..
   ```

2. **Environment Setup**:
   Copy `.env.example` to `.env` and configure `DATABASE_URL`.

3. **Prisma Generation**:
   ```bash
   npx prisma generate
   ```

4. **Run Development Server**:
   ```bash
   npm run dev
   ```
   This concurrent script starts both:
   - Frontend Vite app at `http://localhost:5173`
   - Express Backend API at `http://localhost:5000`

5. **Type Checking & Linting**:
   ```bash
   npm run typecheck
   npm run lint
   ```
