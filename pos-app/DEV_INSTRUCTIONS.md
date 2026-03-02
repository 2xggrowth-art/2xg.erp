# 2XG POS Desktop App — Developer Instructions

> **Read `POS_DESKTOP_SYNC_AUDIT.md` first** — it contains the full feature gap analysis and priority list.

---

## Quick Start

```bash
cd pos-app

# Install dependencies
npm install

# Rebuild native modules for Electron
npx @electron/rebuild -f -w better-sqlite3

# Build and run (production mode — recommended for testing)
rm -rf dist-electron && npx vite build && npx electron .

# OR run in dev mode (requires Vite dev server)
npm run dev
```

### First Run

On first launch, the app creates a local SQLite database at:
- **macOS**: `~/Library/Application Support/2xg-pos/pos-data.db`
- **Windows**: `%APPDATA%/2xg-pos/pos-data.db`

The setup wizard will appear. You can either:
1. Enter the cloud ERP URL (`https://api.erp.2xg.in/api`) to sync data
2. Choose "Skip" for offline-only mode

**Demo POS code**: `1234` (operator: DEMO OPERATOR)

---

## IMPORTANT RULES

### 1. NEVER hardcode client-specific data

The POS app is a **generic product** used by any 2XG ERP client. All client data (company name, items, customers, bins, POS codes) must come from either:
- Cloud sync (pulled from the ERP API on first run)
- The setup wizard (user-entered)

**DO NOT** put any of the following in code:
- Company names, addresses, phone numbers, GSTIN, PAN
- Product catalogs (items, SKUs, prices, barcodes)
- Customer names, addresses, phone numbers
- Employee names or POS codes
- Any data that belongs to a specific business

The seed data in `electron/db/schema.ts` contains only:
- Generic org_settings defaults (overwritten on first sync)
- Walk-in Customer placeholder
- Demo POS code (for testing only)
- App settings defaults

### 2. All master data comes from sync

```
Cloud ERP → sync:pull → Local SQLite
   Items, Customers, Bin Locations, Org Settings, POS Codes
```

The sync engine at `electron/sync/sync-engine.ts` has the pull implementation. The IPC handler at `electron/ipc/sync.ts` needs to be connected to it (currently returns stubs).

### 3. Transactions push to cloud

```
Local SQLite → _sync_queue → sync:push → Cloud ERP API
   Invoices, Sessions, Customers (new), Payments
```

Every create/update operation already logs to `_sync_queue` with `status='pending'`. The push logic exists in `sync-engine.ts` but is not wired up.

---

## Architecture

```
pos-app/
├── electron/                      # Electron main process
│   ├── main.ts                    # Entry point, window creation, IPC registration
│   ├── preload.ts                 # contextBridge — exposes IPC to renderer
│   ├── db/
│   │   ├── database.ts            # SQLite init (better-sqlite3, WAL mode)
│   │   └── schema.ts              # CREATE TABLE + generic seed data
│   ├── ipc/                       # IPC handlers (one file per domain)
│   │   ├── invoices.ts            # invoices:create, getAll, getById, getBySession
│   │   ├── sessions.ts            # sessions:start, close, getActive, updateSales, cashMovement
│   │   ├── customers.ts           # customers:create, getAll, getById
│   │   ├── items.ts               # items:getAll, getById, search
│   │   ├── bins.ts                # bins:getForItem, getAll
│   │   ├── org-settings.ts        # orgSettings:get
│   │   ├── pos-codes.ts           # posCodes:verify
│   │   ├── app-settings.ts        # appSettings:get, set
│   │   ├── sync.ts                # sync:pull, push, getStatus (STUBS — see task list)
│   │   └── printer.ts             # printer:printReceipt, openCashDrawer, checkConnection
│   └── sync/                      # Sync infrastructure
│       ├── sync-engine.ts         # Pull/push logic (IMPLEMENTED but not called from IPC)
│       ├── sync-queue.ts          # Outbox queue operations
│       └── api-client.ts          # Axios client factory (reads cloud_url from settings)
├── src/                           # React renderer
│   ├── pages/
│   │   ├── PosCreate.tsx          # Main POS billing interface
│   │   └── PosPage.tsx            # POS landing page
│   ├── components/pos/            # POS UI components
│   │   ├── PosModals.tsx          # All modals (customer, payment, discount, etc.)
│   │   ├── CartPanel.tsx          # Right sidebar
│   │   ├── CartItemsList.tsx      # Cart display
│   │   ├── ProductSearch.tsx      # Item search
│   │   ├── HeldCartsTabs.tsx      # Tab navigation
│   │   ├── SessionBar.tsx         # Active session bar
│   │   ├── SessionsView.tsx       # Sessions list
│   │   ├── SessionTab.tsx         # Session detail + reconciliation
│   │   ├── InvoicesTab.tsx        # Invoice list
│   │   ├── ReturnTab.tsx          # Returns (currently display-only — needs credit note creation)
│   │   ├── PosBinPicker.tsx       # Multi-bin allocation modal
│   │   ├── SyncStatusIndicator.tsx # Sync status badge
│   │   └── SplitPaymentModal.tsx  # Split payment
│   └── services/                  # IPC wrappers
│       ├── ipc-client.ts          # Type-safe IPC bridge
│       └── [domain].service.ts    # One service per domain
```

---

## Known Issues to Fix (Priority Order)

### MUST FIX — Sync will break without these

#### 1. Wire up sync engine to IPC handlers
**File**: `electron/ipc/sync.ts`
**Problem**: `sync:pull` and `sync:push` handlers return stub responses
**Fix**: Import and call `pullFromCloud()` and `pushToCloud()` from `electron/sync/sync-engine.ts`

#### 2. Terminal-prefixed invoice/session numbers
**Problem**: Desktop generates `INV-{timestamp}` but cloud uses `INV-0001` sequential. Will collide.
**Fix**:
- Add `terminal_id` to `app_settings` (assigned during setup)
- Invoice format: `{prefix}-{terminal_id}-{sequence}` (e.g., `INV-T01-0001`)
- Session format: `{session_prefix}-{terminal_id}-{sequence}` (e.g., `SE1-T01-001`)
- This is set in both `PosCreate.tsx` (frontend `buildInvoiceData`) and `electron/ipc/invoices.ts` (backend number generation)

#### 3. Add `payments_received` creation after invoice
**Problem**: Web ERP creates a payment record after each invoice. Desktop does not.
**Fix**:
- Create `electron/ipc/payments.ts` handler for `payments:create`
- Add `payments_received` INSERT after invoice creation in `PosCreate.tsx` `handleProcessPayment()`
- Add to `_sync_queue` for push

#### 4. Fix `sub_total` field name
**File**: `pos-app/src/pages/PosCreate.tsx` line ~785
**Problem**: `buildInvoiceData()` sends `sub_total` but schema/cloud expects `subtotal`
**Fix**: Rename `sub_total` to `subtotal` in `buildInvoiceData()`

### SHOULD FIX — Data will be incomplete

#### 5. Add delivery challan form
**Problem**: Web ERP has full `NewDeliveryChallanForm` that creates challan records. Desktop just toggles a label.
**Fix**: Port the delivery challan modal from `frontend/src/components/delivery-challans/` and create an IPC handler.

#### 6. Add credit note creation for returns
**Problem**: `ReturnTab.tsx` processes returns visually but saves nothing.
**Fix**: Create IPC handler for credit notes, add `credit_notes` + `credit_note_items` tables to schema, update ReturnTab to call it.

#### 7. Customer de-duplication on server
**Problem**: Same customer created on desktop and web = duplicates in cloud.
**Fix**: Server-side merge logic when receiving customer push (check phone/email).

### NICE TO HAVE

#### 8. Exchange items support
#### 9. Delta sync (modified_since parameter)
#### 10. WebSocket real-time sync trigger
#### 11. Shared TypeScript types between web and desktop

---

## Sync Queue — How It Works

Every mutation logs to `_sync_queue`:

```sql
-- Created automatically by IPC handlers:
INSERT INTO _sync_queue (table_name, record_id, operation, status, created_at)
VALUES ('invoices', 'uuid-here', 'INSERT', 'pending', '2026-03-02T...');
```

The sync engine reads pending entries and pushes them:

```
Status flow: pending → synced (success) or pending → failed → ... → dead (after 5 retries)
```

**Files**:
- Queue ops: `electron/sync/sync-queue.ts`
- Push/pull: `electron/sync/sync-engine.ts`
- API client: `electron/sync/api-client.ts` (reads `cloud_url` from `app_settings`)

---

## Build & Package

```bash
# macOS
npm run build:mac

# Windows
npm run build:win

# Both
npm run build
```

Uses `electron-builder` — config in `electron-builder.yml`.

---

## Testing Checklist

Before any release, verify:

- [ ] App launches and shows setup wizard on fresh install
- [ ] POS lock screen appears after setup
- [ ] Demo POS code `1234` unlocks the POS
- [ ] Session can be started with opening balance
- [ ] Items can be searched and added to cart
- [ ] Bin picker appears for items with multiple bin locations
- [ ] Customer can be selected or created inline
- [ ] Cash payment completes and shows success
- [ ] Receipt prints correctly (thermal printer or PDF)
- [ ] Session can be closed with denomination counting
- [ ] Held carts work (hold, recall, delete)
- [ ] Sync pulls data from cloud (when connected)
- [ ] Sync pushes invoices/sessions to cloud
- [ ] No hardcoded client data in receipts, UI, or database
- [ ] App works fully offline (no internet)

---

## Reference: Web ERP POS (for feature comparison)

The web ERP POS lives at:
- Frontend: `/frontend/src/pages/PosCreate.tsx` + `/frontend/src/components/pos/`
- Backend: `/backend/src/services/invoices.service.ts`, `pos-sessions.service.ts`
- API: `https://api.erp.2xg.in/api`

When adding features to the desktop POS, always check the web version first to maintain compatibility with the cloud data structures.
