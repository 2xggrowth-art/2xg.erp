# CLAUDE.md — 2XG ERP System

This file provides guidance to Claude Code when working with this repository.

## Repository Structure

Monorepo for the 2XG ERP system. **Active code is at root level** (not inside `2xg-dashboard/`).

```
/backend/              → Express + TypeScript + Supabase (DEPLOYED by Coolify)
/frontend/             → React 18 + Vite + TypeScript + Tailwind CSS (DEPLOYED by Coolify)
/2xg-dashboard/        → LEGACY copy — DO NOT EDIT or deploy from here
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
SUPABASE_URL=<kong-url>            # Base URL only — NO /rest/v1 suffix (Supabase JS client adds it)
SUPABASE_SERVICE_ROLE_KEY=<jwt>
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

## Database Schema — Actual Column Names (Verified Jan 2026)

> **CRITICAL**: The actual deployed database has extra columns added via migrations beyond what's
> in the base schema files. Always verify against PostgREST before adding new queries.

### `items` table
| Column | Type | Notes |
|--------|------|-------|
| `name` | TEXT NOT NULL | Original column — **REQUIRED** |
| `item_name` | TEXT | Added later — backend service uses THIS for display |
| `sku` | TEXT UNIQUE | |
| `unit_price` | DECIMAL | Backend uses this (not `selling_price`) |
| `selling_price` | DECIMAL | Original schema column |
| `cost_price` | DECIMAL | |
| `current_stock` | INTEGER | Added later — backend uses this |
| `opening_stock` | INTEGER | Original schema column |
| `reorder_point` | INTEGER | |
| `unit_of_measurement` | TEXT | Added later — backend uses this (not `unit`) |
| `is_active` | BOOLEAN | Added later |
| `category_id` | UUID | FK → `product_categories` |
| **NO** `organization_id` | — | This table has NO org column |
| **NO** `tax_rate` | — | Not in table |

### `suppliers` table (queried by vendors service)
| Column | Type | Notes |
|--------|------|-------|
| `supplier_name` | TEXT NOT NULL | **NOT** `name` — REQUIRED |
| `organization_id` | UUID | |
| `contact_person` | TEXT | |
| `email` | TEXT | |
| `phone` | TEXT | |
| `city`, `state`, `country` | TEXT | Separate fields, **NOT** single `address` |
| `payment_terms` | TEXT | Default: `Due on Receipt` |
| `is_active` | BOOLEAN | |
| **NO** `company_name` | — | Does not exist |
| **NO** `name` | — | Use `supplier_name` |
| **NO** `address` | — | Use `city`/`state`/`country` separately |
| **NO** `status` | — | Use `is_active` boolean |

### `customers` table
| Column | Type | Notes |
|--------|------|-------|
| `customer_name` | TEXT NOT NULL | **NOT** `name` — REQUIRED |
| `company_name` | TEXT | |
| `email` | TEXT | |
| `phone` | TEXT | |
| `billing_address` | TEXT | **NOT** `address` |
| `shipping_address` | TEXT | |
| `gstin`, `pan` | TEXT | Indian tax IDs |
| `payment_terms` | TEXT | Default: `Net 30` |
| **NO** `name` | — | Use `customer_name` |
| **NO** `address` | — | Use `billing_address` |
| **NO** `organization_id` | — | Not in table |
| **NO** `status` | — | Not in table |

### `expense_categories` table
| Column | Type | Notes |
|--------|------|-------|
| `category_name` | TEXT NOT NULL | **NOT** `name` — has UNIQUE constraint |
| `description` | TEXT | |
| **NO** `organization_id` | — | Not in table |

### `expenses` table
| Column | Type | Notes |
|--------|------|-------|
| `expense_number` | TEXT NOT NULL | **REQUIRED** |
| `expense_date` | DATE NOT NULL | **REQUIRED** |
| `amount` | DECIMAL NOT NULL | **REQUIRED** |
| `total_amount` | DECIMAL NOT NULL | **REQUIRED** |
| `category_id` | UUID | FK → `expense_categories` |
| `category_name` | TEXT | Denormalized |
| `status` | TEXT | Default: `pending` |
| `organization_id` | UUID | |
| `vendor_id`, `vendor_name` | — | Optional vendor link |
| `payment_method` | TEXT | |

### Other schema quirks
| Detail | Notes |
|--------|-------|
| Expenses FK constraint | Named `fk_category` (NOT auto-generated) |
| Vendor credits | Has `vendor_credit_items` child table |
| `product_categories` | Has `organization_id` column |
| `sales_transactions` | Has `organization_id` column |

## API Patterns

**Date filtering**: `?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD`
**Response format**: `{ success: boolean, data?: any, error?: string, message?: string }`

## Git Workflow

- **Main branch**: `main`
- **Remote**: https://github.com/2xggrowth-art/2xg.erp.git
- **Auto-deploy**: Coolify watches `main` and auto-deploys on push

## Developer Rules

> **These rules are NON-NEGOTIABLE. Violating them will break production.**

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

### 7. NEVER rename or remove database columns without a migration plan
Existing columns are referenced by deployed backend services. Renaming a column (e.g. `supplier_name` → `name`) will immediately break the production API. If a column needs renaming:
1. Add the new column
2. Update all backend services to use the new column
3. Migrate data
4. Deploy and verify
5. Only then drop the old column

### 8. NEVER change the authentication system
Auth uses custom JWT (NOT Supabase Auth). Do not:
- Switch to Supabase GoTrue
- Change the JWT signing algorithm or secret
- Modify the `users` table `password_hash` column format
- Remove bcrypt password hashing

### 9. NEVER change the Supabase client configuration
The Supabase client in `backend/src/config/supabase.ts` uses the **service role key** (bypasses RLS). Do not:
- Switch to anon key (will break all queries behind RLS)
- Add RLS policies without updating the client
- Change the `global.headers.Prefer` setting (breaks return=representation)

### 10. NEVER modify CORS without testing
CORS in `backend/src/server.ts` controls which domains can call the API. Do not:
- Remove `https://erp.2xg.in` from allowed origins
- Change the CORS middleware to `origin: '*'` in production
- Remove the `credentials: true` setting

### 11. NEVER delete or restructure existing API routes
All 24 API route prefixes are consumed by the deployed frontend. Renaming `/api/items` to `/api/inventory` will break the frontend immediately. Add new routes alongside existing ones if needed.

### 12. NEVER push directly to main without building first
`main` branch auto-deploys via Coolify. Always verify before pushing:
```bash
cd backend && npm run build
cd frontend && npm run build
```
If either build fails, the deploy will fail and production goes down.

### 13. NEVER commit secrets or credentials
Files like `.env`, `.github_token`, service role keys, JWT secrets must stay in `.gitignore`. Check `git status` before committing.

### 14. NEVER change the database column names that services depend on
These column-to-table mappings are sacred — changing them breaks the API:
- `items.item_name` — used by items service for display
- `items.current_stock` / `items.unit_price` — used by items service
- `suppliers.supplier_name` — used by vendors service
- `customers.customer_name` — used by customers service
- `expense_categories.category_name` — used by expenses service
- `expenses.expense_number` / `expenses.total_amount` — required fields

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
| `backend/src/utils/database-schema.sql` | Base DB schema |
| `frontend/.env.production` | API URL (overridden by Coolify env) |
| `frontend/src/services/api.client.ts` | Axios base config |
| `frontend/src/App.tsx` | All frontend routes |
