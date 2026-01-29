# CLAUDE.md — 2XG ERP System

This file provides guidance to Claude Code when working with this repository.

## Repository Structure

Monorepo for the 2XG ERP system. **Active code is at root level** (not inside `2xg-dashboard/`).

```
/backend/              → Express + TypeScript + Supabase (DEPLOYED by Coolify)
/frontend/             → React 18 + Vite + TypeScript + Tailwind CSS (DEPLOYED by Coolify)
/2xg-dashboard/        → LEGACY copy — DO NOT EDIT or deploy from here
/api/                  → Legacy Vercel serverless entry — not used
```

## Deployment — Self-Hosted Coolify (NOT Vercel)

Production runs on an OVH server via **Coolify** (Docker-based PaaS). `vercel.json` files are legacy artifacts.

| Component | URL | Coolify UUID |
|-----------|-----|-------------|
| Frontend  | https://erp.2xg.in | `z8wwkcgs4koc00c044skw00w` |
| Backend   | https://api.erp.2xg.in | `ws8swsow4wg88kwkswkkc48c` |
| Supabase  | internal Kong gateway | `joo0o40k84kw8wk0skc0o0g8` |
| Coolify Panel | http://51.195.46.40:8000 | — |

### Coolify Config

**Backend**: base_directory `/backend`, Nixpacks, port 5000, `npm run build` → `npm start`
**Frontend**: base_directory `/frontend`, Nixpacks, `npm run build` → serves `dist/`

### Environment Variables

Backend (Coolify):
```
PORT=5000  NODE_ENV=production  FRONTEND_URL=https://erp.2xg.in
SUPABASE_URL=<kong-url>/rest/v1  SUPABASE_SERVICE_ROLE_KEY=<jwt>
JWT_SECRET=<secret>  JWT_EXPIRES_IN=7d
```

Frontend (Coolify build-time):
```
VITE_API_URL=https://api.erp.2xg.in/api
```

### Self-Hosted Supabase

Runs as Coolify service with Kong API Gateway, PostgREST, PostgreSQL, Studio, GoTrue (unused — app uses custom JWT auth), Realtime, Storage, etc.

After DDL changes, always reload PostgREST cache:
```sql
NOTIFY pgrst, 'reload schema';
```

## Development Commands

```bash
# Backend
cd backend
npm run dev              # Dev with nodemon
npm run build            # Compile TypeScript
npm start                # Run compiled JS
npm run seed             # Seed mock data
npm run test-connection  # Test Supabase

# Frontend
cd frontend
npm run dev              # Dev server (localhost:3000)
npm run build            # Vite production build
npm run build:check      # TypeScript + Vite build
```

## Architecture

### Backend — Routes → Controllers → Services → Supabase

```
backend/src/
├── server.ts              # Express app, CORS, route registration
├── config/supabase.ts     # Supabase admin client (service role key)
├── middleware/             # Auth middleware
├── routes/                # 24 route files
├── controllers/           # 23 controller files
├── services/              # 25 service files
├── types/index.ts
└── utils/
    ├── database-schema.sql
    └── seedData.ts
```

**24 API route prefixes:**
`/api/auth`, `/api/erp`, `/api/logistics`, `/api/care`, `/api/crm`, `/api/items`, `/api/purchases`, `/api/vendors`, `/api/purchase-orders`, `/api/bills`, `/api/sales`, `/api/expenses`, `/api/tasks`, `/api/reports`, `/api/search`, `/api/ai`, `/api/payments`, `/api/vendor-credits`, `/api/transfer-orders`, `/api/invoices`, `/api/customers`, `/api/sales-orders`, `/api/payments-received`, `/api/delivery-challans`

### Frontend — Components → Services (axios) → Backend API

```
frontend/src/
├── App.tsx                 # All routes
├── components/
│   ├── auth/               # Login, user management
│   ├── layout/             # Sidebar, Header
│   ├── dashboard/          # MetricCard, charts
│   ├── common/             # DateRangeFilter, shared UI
│   ├── items/              # Inventory CRUD
│   ├── vendors/            # Vendor management
│   ├── invoices/           # Invoice generation
│   ├── expenses/           # Expense management
│   ├── bills/              # Bill management
│   ├── purchase-orders/    # PO management
│   ├── sales-orders/       # SO management
│   ├── delivery-challans/  # Delivery challans
│   ├── transfer-orders/    # Transfer orders
│   ├── vendor-credits/     # Vendor credits
│   ├── customers/          # Customer management
│   ├── payments/           # Payments made
│   ├── payments-received/  # Payments received
│   ├── pos/                # Point of sale
│   ├── shared/             # Shared components
│   └── modules/            # ERP, Logistics, CARE, CRM
├── contexts/               # Auth, DateFilter contexts
├── hooks/
├── pages/                  # 42 page components
├── services/               # 21 API service files
├── types/
└── utils/
    ├── csvParser.ts
    ├── itemImportTemplate.ts
    ├── invoiceImportTemplate.ts
    └── pdfGenerators/
```

## Authentication

Custom JWT auth (NOT Supabase Auth):
- `POST /api/auth/login` — bcrypt compare → JWT
- `GET /api/auth/verify` — validate JWT, return user
- `POST /api/auth/register` — create user (admin only)
- `POST /api/auth/change-password`
- `GET /api/auth/users` — list all users
- `PUT /api/auth/users/:id` — update user
- `DELETE /api/auth/users/:id` — delete user

## CORS

Configured in `backend/src/server.ts`. Allowed origins:
- `http://localhost:*` (any port)
- `https://erp.2xg.in`
- `https://2xg-erp.vercel.app` (legacy)
- `https://2xg-dashboard-pi.vercel.app` (legacy)
- `process.env.FRONTEND_URL`

## Database Schema Quirks

| Detail | Notes |
|--------|-------|
| `expense_categories` column | Uses `category_name` (NOT `name`) |
| Expenses FK constraint | Named `fk_category` (NOT auto-generated) |
| Vendors service | Queries `suppliers` table (NOT `vendors`) |
| Items table | Has both `name` and `item_name` columns |
| Items FK | `category_id` → `product_categories` table |
| Vendor credits | Has `vendor_credit_items` child table |

## API Patterns

**Date filtering**: `?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD`
**Response format**: `{ success: boolean, data?: any, error?: string, message?: string }`

## Git Workflow

- **Main branch**: `main`
- **Remote**: https://github.com/2xggrowth-art/2xg.erp.git
- **Auto-deploy**: Coolify watches `main` and auto-deploys on push

## Developer Rules

### 1. NEVER change directory structure without updating Coolify
Coolify deploys from `/backend` and `/frontend` at root. Moving these breaks deployment silently.

### 2. NEVER edit files in `/2xg-dashboard/`
This is the legacy directory. All work must happen in root `/backend/` and `/frontend/`. Changes to `2xg-dashboard/` will NOT be deployed.

### 3. NEVER hardcode API URLs
Use `VITE_API_URL` (frontend) and `SUPABASE_URL` / `FRONTEND_URL` (backend) env vars.

### 4. VITE_ env vars require REBUILD
`VITE_*` variables are baked into the JS bundle at build time. Changing in Coolify needs a rebuild, not restart.

### 5. Keep schema and service code in sync
Column names in service files must match database. After DDL changes run `NOTIFY pgrst, 'reload schema'`.

### 6. PostgREST FK hints must match constraint names
If code uses `expense_categories!fk_category`, the DB constraint must be named `fk_category`.

## PR Review Checklist

Before merging:
- [ ] All changes are in root `/backend/` and `/frontend/` (NOT `2xg-dashboard/`)
- [ ] No hardcoded URLs — uses env vars
- [ ] CORS origins updated if new domains added (in `server.ts`)
- [ ] Database migrations included if schema changes
- [ ] PostgREST FK hints match DB constraint names
- [ ] New env vars documented
- [ ] No secrets committed
- [ ] `cd backend && npm run build` succeeds
- [ ] `cd frontend && npm run build` succeeds
- [ ] Service file column names match DB columns

## Adding a New Module

1. `backend/src/services/module.service.ts`
2. `backend/src/controllers/module.controller.ts`
3. `backend/src/routes/module.routes.ts`
4. Register in `server.ts`: `app.use('/api/module', moduleRoutes)`
5. `frontend/src/services/module.service.ts`
6. `frontend/src/components/module/`
7. Add route in `App.tsx`

## Testing

```bash
curl https://api.erp.2xg.in/api/health                              # Health check
curl -H "Origin: https://erp.2xg.in" https://api.erp.2xg.in/api/health  # CORS test
cd backend && npm run test-connection                                 # Supabase test
```

## Key Files

| File | Purpose |
|------|---------|
| `backend/src/server.ts` | Express entry, CORS, route registration |
| `backend/src/config/supabase.ts` | Supabase admin client |
| `backend/src/routes/auth.routes.ts` | All auth endpoints |
| `backend/COMPLETE_SCHEMA_FIXED.sql` | Full DB schema for fresh setup |
| `frontend/.env.production` | API URL (overridden by Coolify env) |
| `frontend/src/services/api.client.ts` | Axios base config |
| `frontend/src/App.tsx` | All frontend routes |
