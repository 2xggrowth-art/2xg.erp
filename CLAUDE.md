# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Structure

Monorepo for the 2XG ERP system. **Active code is at root level** (not inside `2xg-dashboard/`).

```
/backend/              → Express + TypeScript + Supabase (DEPLOYED by Coolify)
/frontend/             → React 18 + Vite + TypeScript + Tailwind CSS (DEPLOYED by Coolify)
/pos-app/              → Electron + React + SQLite POS desktop app (offline-first)
/mobile/               → React Native mobile app (technician/buildline)
/stockcount-app/       → Node.js Google Sheets stock count sync tool
/2xg-dashboard/        → LEGACY copy — DO NOT EDIT or deploy from here

⚠️ SECURITY STATUS (as of Mar 4, 2026):
- /api/auth/register is PUBLIC (no auth middleware) — CRITICAL, needs admin-only fix
- /api/mobile-auth admin routes (GET /users, POST /users, DELETE /users/:id) are PUBLIC
- admin123 hardcoded in backend/src/utils/seedData.ts and debugUser.ts
- See task list Z-1 through Z-4 for fixes
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

```bash
# POS Desktop App
cd pos-app
npm run dev              # Electron dev mode (Vite + Electron)
npm run build            # Build for distribution
npx tsc --noEmit         # Type-check without emitting
```

## Architecture

### Backend — Routes → Controllers → Services → Supabase

```
backend/src/
├── server.ts              # Express app, CORS, route registration
├── config/supabase.ts     # Supabase admin client (service role key)
├── middleware/             # Auth middleware
├── routes/                # 48 route files
├── controllers/           # 47 controller files
├── services/              # 50 service files (incl. scheduleChecker for auto stock counts)
├── types/index.ts
└── utils/
    ├── database-schema.sql
    ├── create-transfer-orders-table.sql
    └── seedData.ts
```

**46 API route prefixes** (registered in `server.ts`):

Public (NO auth middleware — registered BEFORE `authMiddleware`):
`/api/auth`, `/api/mobile-auth`

⚠️ **SECURITY WARNING**: `/api/auth/register` has NO admin check — anyone can create accounts. `/api/mobile-auth` admin routes (GET /users, POST /users, PUT /users/:id/pin, DELETE /users/:id) are also unprotected. These are tasks Z-1 and Z-3.

Protected (require JWT via `authMiddleware` at line 150):
`/api/erp`, `/api/logistics`, `/api/care`, `/api/crm`, `/api/items`, `/api/purchases`, `/api/vendors`, `/api/purchase-orders`, `/api/bills`, `/api/sales`, `/api/expenses`, `/api/tasks`, `/api/reports`, `/api/search`, `/api/ai`, `/api/payments`, `/api/vendor-credits`, `/api/transfer-orders`, `/api/invoices`, `/api/customers`, `/api/sales-orders`, `/api/payments-received`, `/api/delivery-challans`, `/api/bin-locations`, `/api/locations`, `/api/brands`, `/api/manufacturers`, `/api/pos-sessions`, `/api/batches`, `/api/stock-counts`, `/api/damage-reports`, `/api/placement-tasks`, `/api/transfer-tasks`, `/api/placement-history`, `/api/admin`, `/api/exchanges`, `/api/assembly`, `/api/item-sizes`, `/api/item-colors`, `/api/pos-codes`, `/api/gst-settings`, `/api/gst-reports`, `/api/org-settings`, `/api/credit-notes`, `/api/pricelists`, `/api/registers`

### Backend Migrations

Located in `backend/migrations/`. Each file exports `up` and `down` SQL strings. Run via Supabase pg-meta endpoint. Runner scripts (`run_0XX.js`) execute migrations.

⚠️ **Note:** Some migration numbers are duplicated (004, 014/020, 015/024) — likely from rollback/retry attempts. Check actual DB state before re-running.

| Migration | Purpose |
|-----------|---------|
| `005_add_serial_numbers.js` | Add serial number tracking to bill/invoice items |
| `006_add_item_type_size_color_variant.js` | Add item_type, size, color, variant columns to items |
| `007_add_subcategories.js` | Create `product_subcategories` table, add `subcategory_id` to items |
| `008_recreate_transfer_orders.js` | Drop/recreate `transfer_orders` + `transfer_order_items` tables |
| `009_create_transfer_order_allocations.js` | Create `transfer_order_allocations` for stock movement tracking |
| `010_add_serial_numbers_to_bin_allocations.js` | Serial numbers on bin allocations |
| `011_add_premium_and_incentive_to_items.js` | Premium/incentive fields on items |
| `012_add_pos_session_id_to_invoices.js` | Link invoices to POS sessions |
| `013_create_item_batches.js` | Batch tracking system (`item_batches`, `batch_deductions`) |
| `014_create_stock_counts.js` | Stock count management tables |
| `015_create_damage_reports.js` | Damage reporting system |
| `016_create_putaway_tasks.js` | Putaway/placement task system |
| `021_add_mobile_user_role.js` | Mobile user role support |
| `025_create_placement_transfer_schedules.js` | Automated placement/transfer schedules |
| `027_create_audit_logs.js` | System-wide audit logging |
| `028_create_exchange_items.js` | Exchange items table |
| `029_create_buildline_assembly.js` | **Buildline assembly system** (journeys, stages, checklists) |
| `030_add_auto_generated_to_stock_counts.js` | Auto-generated stock count flag |
| `031_add_pin_to_users.js` | PIN authentication for mobile users |
| `032_add_item_details_to_assembly_journeys.js` | item_name, item_color, item_size on assembly journeys |
| `033_fix_technician_queue_item_details.js` | Fix technician queue RPC for item details |
| `034_add_item_details_to_kanban_view.js` | Item details in buildline kanban view |
| `035_create_item_sizes_colors.js` | Item sizes and colors lookup tables |
| `036_create_pos_codes.js` | POS barcode/code system |
| `037_add_gst_compliance.js` | GST tax compliance fields and settings |
| `038_add_denomination_to_pos_sessions.js` | Cash denomination tracking for POS sessions |
| `039_org_settings_and_multi_tenant.js` | Organization settings and multi-tenant support |
| `040_credit_notes_and_pricelists.js` | Credit notes and pricelist system |
| `041_add_closed_by_to_sessions.js` | Add `closed_by` column to pos_sessions |
| `042_add_org_code_and_device_number.js` | Add `org_code` to org_settings, `device_number` to registers |

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
│   ├── buildline/          # Supervisor dashboard, technician dashboard, assembly, kanban
│   └── modules/            # ERP, Logistics, CARE, CRM
├── contexts/               # Auth, DateFilter contexts
├── hooks/
├── pages/                  # 54 page components
├── services/               # 41 API service files (incl. api.client.ts)
├── types/
└── utils/
    ├── csvParser.ts
    ├── itemImportTemplate.ts
    ├── invoiceImportTemplate.ts
    └── pdfGenerators/
```

### POS Desktop App — Electron + React + SQLite (Offline-First)

```
pos-app/
├── electron/
│   ├── main.ts              # Electron main process entry
│   ├── preload.ts           # contextBridge API (window.electronAPI)
│   ├── db/
│   │   ├── database.ts      # better-sqlite3 singleton
│   │   └── schema.ts        # SQLite CREATE TABLE + seed data
│   ├── ipc/                 # IPC handlers (invoices, sessions, sync, etc.)
│   └── sync/
│       ├── api-client.ts    # Axios client using stored cloud_token
│       ├── sync-engine.ts   # pullFromCloud, pushToCloud, registerDevice
│       └── sync-queue.ts    # Outbox pattern for offline changes
├── src/                     # React renderer (mirrors frontend/src patterns)
│   ├── services/
│   │   ├── ipc-client.ts    # Type-safe wrapper for window.electronAPI
│   │   └── sync.service.ts  # Renderer-side sync API
│   ├── components/
│   │   ├── pos/             # POS UI components
│   │   ├── setup/           # Setup wizard (Step1-Step4)
│   │   └── settings/        # Settings page
│   └── pages/
```

**Data flow:** React renderer → `ipc-client.ts` → `window.electronAPI` (preload) → IPC handlers → SQLite (local) or sync-engine → cloud API

**Sync architecture:** Offline-first outbox pattern. Local changes queue in `_sync_queue` table, pushed to cloud periodically. Cloud data pulled into local SQLite.

**Adding new IPC methods:** Update all 4 layers:
1. `electron/ipc/*.ts` — add handler with `ipcMain.handle('channel:method', ...)`
2. `electron/preload.ts` — expose via `ipcRenderer.invoke`
3. `src/services/ipc-client.ts` — add to `ElectronAPI` interface
4. `src/services/*.service.ts` — add renderer-side wrapper

### Invoice/Session Number Prefixes (Device-Specific)

Each POS device gets a unique prefix to prevent collisions during sync:
- `org_settings.org_code` — short org identifier (e.g. `BCH`)
- `registers.device_number` — auto-incrementing per org
- Resulting prefixes: `BCH-POS1-INV-0001`, `BCH-POS2-S001`, etc.
- Web POS uses `org_settings.invoice_prefix` directly (no device suffix)
- POS app calls `POST /registers/register-device` during setup to get assigned a `device_number`

## Authentication

Custom JWT auth (NOT Supabase Auth):
- `POST /api/auth/login` — bcrypt compare → JWT
- `POST /api/auth/technician-login` — phone + PIN auth for buildline technicians
- `GET /api/auth/verify` — validate JWT, return user
- `POST /api/auth/register` — create user (**⚠️ CURRENTLY PUBLIC — NO auth middleware. Should be admin-only. SECURITY FIX PENDING.**)
- `POST /api/auth/change-password` — requires Bearer token (self-service)
- `GET /api/auth/users` — list all users (**⚠️ NO auth middleware — anyone can list users**)
- `PUT /api/auth/users/:id` — update user (**⚠️ NO auth middleware**)
- `DELETE /api/auth/users/:id` — delete user (**⚠️ NO auth middleware — HARD DELETE**)

Mobile auth (`/api/mobile-auth`):
- `POST /api/mobile-auth/login` — mobile login (public, as expected)
- `GET /api/mobile-auth/verify` — verify mobile token (public, as expected)
- `GET /api/mobile-auth/users` — list mobile users (**⚠️ PUBLIC — no auth**)
- `POST /api/mobile-auth/users` — create mobile user (**⚠️ PUBLIC — no auth**)
- `PUT /api/mobile-auth/users/:id/pin` — update PIN (**⚠️ PUBLIC — no auth**)
- `DELETE /api/mobile-auth/users/:id` — delete mobile user (**⚠️ PUBLIC — no auth**)

**Auth middleware chain** (server.ts order matters):
1. Lines 141-143: `/api/auth/*` registered (PUBLIC — no authMiddleware)
2. Lines 146-147: `/api/mobile-auth/*` registered (PUBLIC — no authMiddleware)
3. Line 150: `app.use('/api', authMiddleware)` — everything after this is protected
4. Lines 153-198: All other routes (PROTECTED by JWT)

**Middleware available** (`backend/src/middleware/`):
- `auth.middleware.ts` — JWT validation + `requireRole(...roles)` + `requireBuildlineRole(...roles)` + brute-force rate limiting
- `readOnly.middleware.ts` — blocks POST/PUT/PATCH/DELETE when `READ_ONLY_MODE=true` (allows auth endpoints)
- `upload.middleware.ts` — file upload handling

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

### `org_settings` table
| Column | Type | Notes |
|--------|------|-------|
| `organization_id` | UUID | FK → organizations |
| `company_name` | TEXT NOT NULL | |
| `org_code` | VARCHAR(10) | Short code for prefixes (e.g. `BCH`) — migration 042 |
| `invoice_prefix` | TEXT | Default: `INV-` |
| `session_prefix` | TEXT | Default: `SE1-` |
| `gstin`, `pan` | TEXT | Indian tax IDs |
| `address_line1`, `city`, `state`, `postal_code` | TEXT | Company address |
| `bank_name`, `bank_account_number`, `bank_ifsc` | TEXT | Bank details |
| `theme_color`, `accent_color` | TEXT | UI theming |

### `registers` table
| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID PK | |
| `organization_id` | UUID | |
| `name` | TEXT NOT NULL | Device/register name |
| `device_number` | INTEGER | Auto-incrementing per org — migration 042 |
| `is_active` | BOOLEAN | |
| `description` | TEXT | |

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
- **origin**: https://github.com/2xggrowth-art/2xg.erp.git (Ibrahim's org — legacy, kept for sync)
- **mirror**: https://github.com/arsalan507/2xg.ERP.git (**Coolify deploys from HERE as of Mar 4, 2026**)
- **Auto-deploy**: Coolify watches `mirror/main` (arsalan507) and auto-deploys on push
- **Dev branches** (on mirror/arsalan507 only): `zaheer`, `sandeep` — devs push to their named branch, Arsalan reviews and merges to main
- **Branch protection**: main branch requires PR review. Devs cannot push directly to main.

### Dev Workflow ("Your Branch, My Deploy")
```
Dev: git checkout zaheer → work → git push origin zaheer → WhatsApp Arsalan
Arsalan: review → merge to main → Coolify auto-deploys from arsalan507/main
```

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
All 46 API route prefixes are consumed by the deployed frontend. Renaming `/api/items` to `/api/inventory` will break the frontend immediately. Add new routes alongside existing ones if needed.

### 12. NEVER push directly to main without building first
`main` branch auto-deploys via Coolify. Always verify before pushing:
```bash
cd backend && npm run build
cd frontend && npm run build
cd pos-app && npx tsc --noEmit   # if pos-app was modified
```
If backend or frontend build fails, the deploy will fail and production goes down.

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
| `backend/src/services/assembly.service.ts` | Buildline assembly journeys, stages, checklists |
| `backend/src/services/batches.service.ts` | Batch tracking, FIFO deduction |
| `backend/src/services/stockCounts.service.ts` | Stock count management |
| `backend/src/services/damageReports.service.ts` | Damage reporting |
| `backend/src/services/exchanges.service.ts` | Exchange items |
| `backend/src/services/scheduleChecker.service.ts` | Auto stock count generation (hourly) |
| `backend/src/utils/database-schema.sql` | Base DB schema |
| `backend/migrations/` | SQL migration files (005-042) |
| `frontend/.env.production` | API URL (overridden by Coolify env) |
| `frontend/src/services/api.client.ts` | Axios base config with auth interceptor |
| `frontend/src/App.tsx` | All frontend routes |
| `frontend/src/components/shared/CategoryPicker.tsx` | Category/subcategory picker (double-click expand) |
| `frontend/src/components/shared/CreatableSelect.tsx` | Dropdown with create-new option |
| `pos-app/electron/db/schema.ts` | SQLite schema + seed data |
| `pos-app/electron/sync/sync-engine.ts` | Cloud sync (pull/push/registerDevice) |
| `pos-app/electron/preload.ts` | Electron ↔ renderer API bridge |
| `pos-app/src/services/ipc-client.ts` | Type-safe IPC client for renderer |
