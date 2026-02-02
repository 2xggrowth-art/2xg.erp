# 2XG ERP System

Full-featured ERP system built with React + Express + Supabase, deployed on a self-hosted OVH server via Coolify.

| Component | URL |
|-----------|-----|
| Frontend | https://erp.2xg.in |
| Backend API | https://api.erp.2xg.in |

## Repository Structure

```
/backend/    Express + TypeScript + Supabase
/frontend/   React 18 + Vite + TypeScript + Tailwind CSS
```

## Modules

- **Inventory** -- Items, categories, brands, manufacturers, bin locations
- **Sales** -- Sales orders, invoices, delivery challans, POS
- **Purchases** -- Purchase orders, bills, vendor credits
- **Payments** -- Payments made, payments received
- **Expenses** -- Expense tracking with categories and approvals
- **Customers & Vendors** -- Contact management
- **Transfer Orders** -- Inter-location stock transfers
- **Reports** -- 34 system-generated reports across 10 categories
- **Dashboard** -- ERP, Logistics, CARE, CRM modules with charts

## Quick Start

See [DEV_SETUP.md](DEV_SETUP.md) for full developer setup instructions.

```bash
# Backend
cd backend && npm install && cp .env.example .env
# Fill in .env with credentials from admin
npm run dev

# Frontend
cd frontend && npm install && cp .env.example .env
npm run dev
```

## Deployment

Production is deployed via **Coolify** (Docker-based PaaS) on an OVH server. Pushes to `main` trigger auto-deploy.

```bash
# Always verify builds before pushing to main
cd backend && npm run build
cd frontend && npm run build
```

## Key Documentation

- [CLAUDE.md](CLAUDE.md) -- Detailed architecture, DB schema, developer rules
- [DEV_SETUP.md](DEV_SETUP.md) -- Developer onboarding with read-only mode

## Tech Stack

**Backend:** Node.js, Express, TypeScript, Supabase (self-hosted), JWT auth, Multer

**Frontend:** React 18, TypeScript, Vite, Tailwind CSS, Recharts, Lucide icons, Axios
