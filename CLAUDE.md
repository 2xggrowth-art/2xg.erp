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

**Running migrations via pg-meta** (from a Node.js script in `/backend`):
```js
const response = await fetch(`${SUPABASE_URL}/pg/query`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
    'apikey': SERVICE_ROLE_KEY,
  },
  body: JSON.stringify({ query: sql }),
});
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
├── routes/                # 30 route files
├── controllers/           # 29 controller files
├── services/              # 31 service files
├── types/index.ts
└── utils/
    ├── database-schema.sql
    ├── create-transfer-orders-table.sql
    └── seedData.ts
```

**30 API route prefixes** (registered in `server.ts`):

Public:
`/api/auth`, `/api/mobile-auth`

Protected (require JWT):
`/api/erp`, `/api/logistics`, `/api/care`, `/api/crm`, `/api/items`, `/api/purchases`, `/api/vendors`, `/api/purchase-orders`, `/api/bills`, `/api/sales`, `/api/expenses`, `/api/tasks`, `/api/reports`, `/api/search`, `/api/ai`, `/api/payments`, `/api/vendor-credits`, `/api/transfer-orders`, `/api/invoices`, `/api/customers`, `/api/sales-orders`, `/api/payments-received`, `/api/delivery-challans`, `/api/bin-locations`, `/api/locations`, `/api/brands`, `/api/manufacturers`, `/api/pos-sessions`

### Backend Migrations

Located in `backend/migrations/`. Each file exports `up` and `down` SQL strings. Run via Supabase pg-meta endpoint.

| Migration | Purpose |
|-----------|---------|
| `005_add_serial_numbers.js` | Add serial number tracking to bill/invoice items |
| `006_add_item_type_size_color_variant.js` | Add item_type, size, color, variant columns to items |
| `007_add_subcategories.js` | Create `product_subcategories` table, add `subcategory_id` to items |
| `008_recreate_transfer_orders.js` | Drop/recreate `transfer_orders` + `transfer_order_items` tables |
| `009_create_transfer_order_allocations.js` | Create `transfer_order_allocations` for stock movement tracking |

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
│   ├── reports/            # Report components
│   ├── shared/             # CategoryPicker, CreatableSelect, ItemSelector
│   └── modules/            # ERP, Logistics, CARE, CRM
├── contexts/               # Auth, DateFilter contexts
├── hooks/
├── pages/                  # 50 page components
├── services/               # 27 API service files (incl. api.client.ts)
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

Mobile auth (`/api/mobile-auth`) — separate routes for mobile app authentication.

## CORS

Configured in `backend/src/server.ts`. Allowed origins:
- `http://localhost:*` (any port)
- `https://erp.2xg.in`
- `https://2xg-erp.vercel.app` (legacy)
- `https://2xg-dashboard-pi.vercel.app` (legacy)
- `process.env.FRONTEND_URL`

## Database Schema — Actual Column Names (Verified Feb 2026)

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
| `subcategory_id` | UUID | FK → `product_subcategories` (migration 007) |
| `item_type` | TEXT | e.g. 'goods', 'service' (migration 006) |
| `size` | TEXT | Product size (migration 006) |
| `color` | TEXT | Product color (migration 006) |
| `variant` | TEXT | Product variant (migration 006) |
| **NO** `organization_id` | — | This table has NO org column |
| **NO** `tax_rate` | — | Not in table |

### `product_categories` table
| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID PK | |
| `name` | TEXT NOT NULL UNIQUE | Category name |
| `organization_id` | UUID | |

### `product_subcategories` table (migration 007)
| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID PK | |
| `category_id` | UUID NOT NULL | FK → `product_categories(id)` ON DELETE CASCADE |
| `name` | TEXT NOT NULL | Subcategory name |
| | | UNIQUE constraint on (`category_id`, `name`) |

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

### `locations` table
| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID PK | |
| `name` | TEXT NOT NULL UNIQUE | Location name (e.g. 'Warehouse', 'Head Office') |
| `description` | TEXT | |
| `status` | TEXT | Default: `active` |

### `bin_locations` table
| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID PK | |
| `bin_code` | VARCHAR(50) UNIQUE | e.g. 'BIN-001', 'A-01-01' |
| `warehouse` | VARCHAR(100) | Legacy text field |
| `location_id` | UUID | FK → `locations(id)` ON DELETE RESTRICT |
| `description` | TEXT | |
| `status` | VARCHAR(20) | Default: `active` |

### `bill_item_bin_allocations` table (tracks incoming stock per bin)
| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID PK | |
| `bill_item_id` | UUID | FK → `bill_items(id)` ON DELETE CASCADE |
| `bin_location_id` | UUID | FK → `bin_locations(id)` ON DELETE RESTRICT |
| `quantity` | DECIMAL(15,2) | CHECK (quantity > 0) |

### `invoice_item_bin_allocations` table (tracks outgoing stock per bin)
| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID PK | |
| `invoice_item_id` | UUID | FK → `invoice_items(id)` ON DELETE CASCADE |
| `bin_location_id` | UUID | FK → `bin_locations(id)` ON DELETE RESTRICT |
| `quantity` | DECIMAL(15,2) | CHECK (quantity > 0) |

### `transfer_orders` table
| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID PK | |
| `organization_id` | UUID NOT NULL | Default: `00000000-...` |
| `transfer_order_number` | VARCHAR(50) UNIQUE NOT NULL | e.g. 'TO-0001' |
| `transfer_date` | DATE NOT NULL | |
| `source_location` | VARCHAR(255) NOT NULL | Location name string |
| `destination_location` | VARCHAR(255) NOT NULL | Location name string |
| `reason` | TEXT | |
| `status` | VARCHAR(50) | `draft`, `initiated`, `in_transit`, `received`, `cancelled` |
| `total_items` | INT | |
| `total_quantity` | DECIMAL(15,2) | |
| `notes` | TEXT | |
| | | CHECK: source_location <> destination_location |

### `transfer_order_items` table
| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID PK | |
| `transfer_order_id` | UUID NOT NULL | FK → `transfer_orders(id)` ON DELETE CASCADE |
| `item_id` | UUID | |
| `item_name` | VARCHAR(255) NOT NULL | |
| `source_availability` | DECIMAL(15,2) | Stock at source when order was created |
| `destination_availability` | DECIMAL(15,2) | Stock at destination when order was created |
| `transfer_quantity` | DECIMAL(15,2) NOT NULL | CHECK (> 0) |
| `unit_of_measurement` | VARCHAR(50) | |

### `transfer_order_allocations` table (tracks stock movements)
| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID PK | |
| `transfer_order_id` | UUID NOT NULL | FK → `transfer_orders(id)` ON DELETE CASCADE |
| `transfer_order_item_id` | UUID | FK → `transfer_order_items(id)` ON DELETE CASCADE |
| `item_id` | UUID NOT NULL | |
| `source_bin_location_id` | UUID NOT NULL | FK → `bin_locations(id)` — stock deducted from here |
| `destination_bin_location_id` | UUID NOT NULL | FK → `bin_locations(id)` — stock added here |
| `quantity` | DECIMAL(15,2) NOT NULL | CHECK (> 0) |

### Other schema quirks
| Detail | Notes |
|--------|-------|
| Expenses FK constraint | Named `fk_category` (NOT auto-generated) |
| Vendor credits | Has `vendor_credit_items` child table |
| `sales_transactions` | Has `organization_id` column |

## Stock Tracking System

Stock is tracked at the **bin location** level. Net stock per bin is calculated dynamically:

```
bin_stock = Σ(bill_item_bin_allocations.quantity)        # purchases IN
           - Σ(invoice_item_bin_allocations.quantity)    # sales OUT
           - Σ(transfer_order_allocations.quantity WHERE source_bin = this_bin)     # transfers OUT
           + Σ(transfer_order_allocations.quantity WHERE dest_bin = this_bin)       # transfers IN
```

**Key services:**
- `binLocations.service.ts` → `getBinLocationsWithStock()` — all bins with calculated stock
- `binLocations.service.ts` → `getBinLocationsForItem(itemId)` — specific item's distribution across bins
- `transfer-orders.service.ts` → `getItemStockByLocation(itemId)` — item stock aggregated by location (for transfer form)

**Transfer order stock flow:**
1. Transfer created as **draft** → no stock movement
2. Transfer status → **initiated** → `processTransferStockMovement()` creates allocation records (stock moves)
3. Transfer status → **cancelled** → allocation records deleted (stock reverts)
4. `items.current_stock` = global aggregate (not per-location)

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
All 30 API route prefixes are consumed by the deployed frontend. Renaming `/api/items` to `/api/inventory` will break the frontend immediately. Add new routes alongside existing ones if needed.

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

### 15. Frontend services MUST use `apiClient` (not raw `axios`)
All frontend API calls must go through `frontend/src/services/api.client.ts` which adds the auth Bearer token via interceptor. Using raw `axios` will result in 401 errors.

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
- [ ] Frontend services use `apiClient`, not raw `axios`

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
| `backend/src/services/binLocations.service.ts` | Bin stock tracking (purchases - sales - transfers) |
| `backend/src/services/transfer-orders.service.ts` | Transfer orders with stock movement processing |
| `backend/src/services/locations.service.ts` | Location CRUD |
| `backend/src/services/items.service.ts` | Items, categories, subcategories |
| `backend/src/utils/database-schema.sql` | Base DB schema |
| `backend/migrations/` | SQL migration files (005-009) |
| `frontend/.env.production` | API URL (overridden by Coolify env) |
| `frontend/src/services/api.client.ts` | Axios base config with auth interceptor |
| `frontend/src/App.tsx` | All frontend routes |
| `frontend/src/components/shared/CategoryPicker.tsx` | Category/subcategory picker (double-click expand) |
| `frontend/src/components/shared/CreatableSelect.tsx` | Dropdown with create-new option |
