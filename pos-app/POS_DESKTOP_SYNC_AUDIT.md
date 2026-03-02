# 2XG POS Desktop App — Sync Audit & Feature Parity Report

**Date**: March 2, 2026
**Prepared by**: Arsalan (via Claude Code analysis)
**Purpose**: Complete audit of the POS Desktop App (Electron) vs Web ERP POS to identify all gaps that must be resolved before enabling cloud sync.

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Current Sync Status](#2-current-sync-status)
3. [Feature Parity — Critical Gaps](#3-feature-parity--critical-gaps)
4. [Data Structure Mismatches](#4-data-structure-mismatches)
5. [Invoice Number Collision Problem](#5-invoice-number-collision-problem)
6. [Missing IPC Handlers & Services](#6-missing-ipc-handlers--services)
7. [Desktop-Only Features (Advantages)](#7-desktop-only-features-advantages)
8. [Industry Best Practices](#8-industry-best-practices)
9. [Recommended Fix Priority](#9-recommended-fix-priority)
10. [File Reference Map](#10-file-reference-map)

---

## 1. Architecture Overview

### Web ERP POS
```
React Frontend → Express API (41 services) → Supabase (PostgreSQL)
   /frontend/       /backend/                  Cloud DB
```
- Deployed at: https://erp.2xg.in
- API at: https://api.erp.2xg.in
- All business logic runs on the Express backend
- Data persisted in cloud Supabase/PostgreSQL

### Desktop POS App
```
React Renderer → Electron IPC → better-sqlite3 (SQLite)
   /pos-app/src/    /pos-app/electron/ipc/     Local DB file
```
- Standalone Electron desktop app
- Local SQLite database at: `~/Library/Application Support/2xg-pos/pos-data.db`
- Schema mirrors the cloud ERP tables (adapted for SQLite)
- Designed for offline-first billing

### How They Should Connect
```
Desktop POS (SQLite) ←—sync—→ Express API ←→ Supabase (Cloud)
        ↑                           ↑
   _sync_queue                 /api/* endpoints
   (outbox pattern)
```

---

## 2. Current Sync Status

### What IS Built

| Component | File | Status |
|-----------|------|--------|
| Sync queue table (`_sync_queue`) | `electron/db/schema.ts` | WORKING — logs every INSERT/UPDATE |
| Queue enqueue logic | `electron/sync/sync-queue.ts` | WORKING — all transactions are queued |
| Sync engine (pull + push) | `electron/sync/sync-engine.ts` | CODE EXISTS — real implementation with API calls |
| API client (axios) | `electron/sync/api-client.ts` | CODE EXISTS — reads `cloud_url` from settings |
| IPC handlers (sync:pull, sync:push) | `electron/ipc/sync.ts` | STUB ONLY — returns "not yet implemented" |
| Sync UI (settings panel) | `src/components/settings/SyncSettings.tsx` | WORKING — shows pending count, manual sync button |
| Setup wizard (cloud URL entry) | `src/components/setup/Step1Welcome.tsx` | WORKING — user can enter API URL and test connection |

### What is NOT Connected

The IPC handlers in `electron/ipc/sync.ts` return stub responses instead of calling the actual sync engine:

```typescript
// Current code (STUB):
ipcMain.handle('sync:push', async () => {
  return { success: true, message: 'Push not yet implemented' };
});

// Should call:
// import { pushToCloud } from '../sync/sync-engine';
// const result = await pushToCloud();
```

### What Gets Queued (but never pushed)

Every transaction the desktop app creates is logged to `_sync_queue`:

| Table | Operations Queued | File |
|-------|-------------------|------|
| `invoices` | INSERT | `electron/ipc/invoices.ts:230` |
| `pos_sessions` | INSERT, UPDATE | `electron/ipc/sessions.ts:86,147` |
| `customers` | INSERT | `electron/ipc/customers.ts:111` |

These queue entries accumulate with `status='pending'` but are never actually sent to the cloud.

---

## 3. Feature Parity — Critical Gaps

### Features in Web ERP POS that are MISSING from Desktop

#### GAP 1: Delivery Challan Form (CRITICAL)
- **Web ERP**: When user selects "Delivery" as delivery option, a full `NewDeliveryChallanForm` modal opens. User fills delivery address, vehicle details, etc. After invoice creation, `deliveryChallansService.createDeliveryChallanFromPOS()` creates a challan record in the cloud database.
- **Desktop POS**: Clicking "Delivery" only toggles a label. There is NO form, NO data collection, and NO challan record is created anywhere.
- **Impact**: Deliveries made from desktop POS will have no challan record in the cloud. Delivery tracking will be broken.
- **Files involved**:
  - Web: `frontend/src/components/pos/PosModals.tsx` (imports `NewDeliveryChallanForm`)
  - Web: `frontend/src/pages/PosCreate.tsx` (calls `createDeliveryChallanFromPOS()`)
  - Desktop: `pos-app/src/components/pos/PosModals.tsx` (no delivery form)

#### GAP 2: Payment Received Records (CRITICAL)
- **Web ERP**: After creating an invoice, the web POS immediately creates a `payments_received` record via `paymentsReceivedService.createPaymentReceived()`. This links the payment to the invoice and customer.
- **Desktop POS**: Only creates the invoice. NO payment record is created.
- **Impact**: Cloud will have invoices with no associated payment records. Payment reports, customer balance tracking, and accounting will be incomplete.
- **Files involved**:
  - Web: `frontend/src/pages/PosCreate.tsx` (creates payment after invoice)
  - Desktop: `pos-app/src/pages/PosCreate.tsx` (only creates invoice)
  - Desktop IPC: No `payments:create` handler exists

#### GAP 3: Credit Notes / Returns (CRITICAL)
- **Web ERP**: Returns tab processes returns and creates a credit note via `creditNotesService.create()`. The credit note is a full database record with items, amounts, and reference to the original invoice.
- **Desktop POS**: Returns tab shows a UI and calculates refund amount but saves NOTHING. The return is display-only with no persistent record.
- **Impact**: Returns processed on desktop will be invisible to the cloud. Inventory won't be adjusted. Customer credits won't be tracked.
- **Files involved**:
  - Web: `frontend/src/components/pos/ReturnTab.tsx` (calls creditNotesService)
  - Desktop: `pos-app/src/components/pos/ReturnTab.tsx` (display-only)

#### GAP 4: Exchange Items (MODERATE)
- **Web ERP**: Full exchange workflow — modal to search exchange items, select them, add to cart with negative amount, mark as "sold" after invoice creation via `exchangesService.updateStatus()`.
- **Desktop POS**: Shows `alert('Exchange items not available in this version')` when user presses F10.
- **Impact**: Exchange transactions cannot be processed on desktop at all.
- **Files involved**:
  - Web: `frontend/src/pages/PosCreate.tsx` (exchange modal, exchangesService)
  - Desktop: `pos-app/src/pages/PosCreate.tsx` (alert only)

#### GAP 5: Invoice Number Generation (CRITICAL for Sync)
- **Web ERP**: Server-generated sequential numbers via `invoicesService.generateInvoiceNumber()` — produces `INV-0001`, `INV-0002`, etc.
- **Desktop POS**: Client-side timestamp-based — produces `INV-1709371200000` (milliseconds since epoch).
- **Impact**: Numbers are completely incompatible. If both systems run simultaneously, the cloud will have a mix of sequential and timestamp numbers. No collisions, but no order either. When sync is enabled, the invoice list will be a mess.
- **Files involved**:
  - Web: `frontend/src/pages/PosCreate.tsx:815` (`invoicesService.generateInvoiceNumber()`)
  - Desktop: `pos-app/src/pages/PosCreate.tsx:815` (`` `INV-${Date.now()}` ``)
  - Desktop IPC: `pos-app/electron/ipc/invoices.ts` (generates number server-side using prefix, but frontend overrides with timestamp)

---

## 4. Data Structure Mismatches

These field name mismatches will cause sync failures or data loss:

| Area | Web ERP Expects | Desktop Sends | Fix Required |
|------|----------------|---------------|--------------|
| Invoice subtotal | `subtotal` | `sub_total` (in `buildInvoiceData` line 785) | Rename field in desktop frontend |
| Customer name | `customer_name` | `display_name` (from create form) | FIXED — handler now maps fields |
| Customer phone | `phone` | `mobile` (from create form) | FIXED — handler now maps fields |
| Bin location ID | `bin_id` in frontend | `id` returned by SQL query | FIXED — SQL now aliases as `bin_id` |
| Sync queue ID | `INTEGER AUTOINCREMENT` | Was inserting UUID strings | FIXED — removed ID from INSERT |

### Still Unfixed

- `sub_total` vs `subtotal` in `PosCreate.tsx` `buildInvoiceData()` — the frontend sends `sub_total` but the IPC handler and cloud schema expect `subtotal`

---

## 5. Invoice Number Collision Problem

### Current Situation
```
Web ERP:     INV-0001, INV-0002, INV-0003 (sequential)
Desktop:     INV-1709371200000, INV-1709371260000 (timestamps)
```

### The Problem
- If sync pushes desktop invoices to cloud, the cloud gets a mix of formats
- If two desktops run offline, they could generate `INV-{same_timestamp}` in edge cases
- Sequential numbering on desktop conflicts with sequential numbering on web (both claim INV-0001)

### Recommended Solution: Terminal-Prefixed Numbers

Industry standard (used by Square, DealPOS, Shopify):

```
Web ERP:          INV-WEB-0001,  INV-WEB-0002
Desktop Terminal 1: INV-T01-0001,  INV-T01-0002
Desktop Terminal 2: INV-T02-0001,  INV-T02-0002
```

Same for sessions:
```
Web ERP:          SE1-WEB-001
Desktop Terminal 1: SE1-T01-001
```

Implementation:
- Add `terminal_id` field to `org_settings` or `app_settings`
- Assign during setup wizard (auto-generated or user-entered)
- Modify invoice/session number generation to include terminal ID
- `org_settings.invoice_prefix` already exists — extend the format

---

## 6. Missing IPC Handlers & Services

### IPC Handlers That Don't Exist in Desktop (but are needed for feature parity)

| Handler | Purpose | Web ERP Equivalent |
|---------|---------|-------------------|
| `payments:create` | Create payment received record after invoice | `POST /api/payments-received` |
| `creditNotes:create` | Create credit note for returns | `POST /api/credit-notes` (if exists) |
| `deliveryChallans:create` | Create delivery challan | `POST /api/delivery-challans` |
| `exchanges:getAll` | List available exchange items | `GET /api/exchanges` |
| `exchanges:updateStatus` | Mark exchange item as sold | `PUT /api/exchanges/:id/status` |

### Services That Don't Exist in Desktop

| Service | Purpose |
|---------|---------|
| `payments-received.service.ts` | Frontend wrapper for payments IPC |
| `credit-notes.service.ts` | Frontend wrapper for credit notes IPC |
| `delivery-challans.service.ts` | Frontend wrapper for delivery challans IPC |
| `exchanges.service.ts` | Frontend wrapper for exchanges IPC |

### Schema Tables That May Need Adding

| Table | Purpose | Exists in Schema? |
|-------|---------|-------------------|
| `payments_received` | Payment records | YES (in schema.ts) |
| `credit_notes` | Return/refund records | NO — needs adding |
| `credit_note_items` | Line items for credit notes | NO — needs adding |
| `delivery_challans` | Delivery tracking | NO — needs adding |
| `exchange_items` | Exchange item tracking | NO — needs adding |

---

## 7. Desktop-Only Features (Advantages)

These features exist in Desktop but NOT in Web ERP:

| Feature | Description | Value |
|---------|-------------|-------|
| **POS Lock Screen** | Code-based lock (e.g., 1234) with 10-min inactivity auto-lock | Security for unattended terminals |
| **Bin Picker Modal** | Auto-popup when item has multiple bin locations — cleaner UX than dropdown | Better stock allocation workflow |
| **Dark Mode** | Full dark theme via Tailwind `dark:` classes on all components | Better for low-light retail environments |
| **Named Hold Carts** | Dedicated modal for naming held carts + recall with list view | Better hold/recall workflow |
| **Native Thermal Printing** | Direct printer access via Electron IPC — no browser print dialog | Faster receipt printing |
| **Bidirectional Sync UI** | Push/pull status indicator with pending count | Cloud sync visibility |
| **Offline-First Architecture** | Full SQLite local DB — works without internet | Essential for unreliable networks |

---

## 8. Industry Best Practices

### Architecture Decision (Confirmed Correct)

| Decision | Our Choice | Industry Standard | Verdict |
|----------|------------|-------------------|---------|
| Separate POS vs ERP codebases | Yes | Square, Shopify, Toast all use separate codebases | CORRECT |
| SQLite for local storage | Yes | Most offline POS systems use SQLite | CORRECT |
| Outbox/queue sync pattern | Yes | Square, Shopify use same pattern | CORRECT |
| Sync through Express API (not direct Supabase) | Yes | Never expose DB credentials in desktop binaries | CORRECT |
| Pull master data, push transactions | Yes | Standard for all offline-first POS | CORRECT |

### Sync Strategy Recommendations

| Data Type | Direction | Frequency |
|-----------|-----------|-----------|
| Items/Products | Cloud → Local | Every 10 min + on app startup |
| Customers | Cloud → Local | Every 10 min + on app startup |
| Bin Locations/Stock | Cloud → Local | Every 10 min + on app startup |
| Org Settings | Cloud → Local | On app startup only |
| POS Codes | Cloud → Local | On app startup only |
| Invoices | Local → Cloud | Immediately after creation |
| Sessions | Local → Cloud | Immediately on start/close |
| Payments Received | Local → Cloud | Immediately after creation |
| Price/Stock Changes | Cloud → Local | Consider WebSocket notification |

### Conflict Resolution

- **Items, org settings, POS codes**: Cloud is master. Desktop never modifies. Pull-only.
- **Customers**: Desktop can create new. On push, server should de-duplicate by phone/email.
- **Invoices**: Terminal-prefixed numbers prevent conflicts. Append-only (no edit conflicts).
- **Sessions**: Terminal-specific. No conflicts possible.

---

## 9. Recommended Fix Priority

### Phase 1: MUST FIX (Sync will break without these)

| # | Task | Effort | Files to Change |
|---|------|--------|----------------|
| 1 | **Terminal-prefixed invoice numbers** — Assign terminal ID during setup, modify number generation | Medium | `electron/ipc/invoices.ts`, `electron/ipc/sessions.ts`, setup wizard |
| 2 | **Add `payments_received` creation** after invoice in desktop payment flow | Medium | `pos-app/src/pages/PosCreate.tsx`, new IPC handler `electron/ipc/payments.ts` |
| 3 | **Fix `sub_total` → `subtotal`** field name in `buildInvoiceData` | Small | `pos-app/src/pages/PosCreate.tsx` |
| 4 | **Wire up sync engine** — Connect IPC sync handlers to actual `pullFromCloud()`/`pushToCloud()` | Small | `electron/ipc/sync.ts` (replace stubs with real calls) |

### Phase 2: SHOULD FIX (Data will be incomplete)

| # | Task | Effort | Files to Change |
|---|------|--------|----------------|
| 5 | **Add delivery challan form + creation** for "delivery" orders | Large | New component, new IPC handler, schema update |
| 6 | **Add credit note creation** for returns | Large | `ReturnTab.tsx`, new IPC handler, schema update |
| 7 | **Customer de-duplication** on server during sync push | Medium | `backend/src/services/customers.service.ts` |
| 8 | **Delta sync** — Pull only records modified since last sync | Medium | `electron/sync/sync-engine.ts`, backend endpoints |

### Phase 3: NICE TO HAVE

| # | Task | Effort |
|---|------|--------|
| 9 | Exchange items support | Large |
| 10 | Real-time sync trigger via WebSocket | Medium |
| 11 | Shared TypeScript types package between web and desktop | Medium |
| 12 | Sync status dashboard with detailed queue view | Small |

---

## 10. File Reference Map

### Desktop POS App (`/pos-app/`)

```
pos-app/
├── electron/
│   ├── main.ts                    # Electron entry point, IPC registration
│   ├── preload.ts                 # IPC bridge (contextBridge)
│   ├── db/
│   │   ├── database.ts            # SQLite init (better-sqlite3)
│   │   └── schema.ts              # All CREATE TABLE + seed data
│   ├── ipc/
│   │   ├── invoices.ts            # invoices:create, invoices:getAll, etc.
│   │   ├── sessions.ts            # sessions:start, sessions:close, etc.
│   │   ├── customers.ts           # customers:create, customers:getAll, etc.
│   │   ├── items.ts               # items:getAll, items:getById
│   │   ├── bins.ts                # bins:getForItem, bins:getAll
│   │   ├── org-settings.ts        # orgSettings:get
│   │   ├── pos-codes.ts           # posCodes:verify
│   │   ├── app-settings.ts        # appSettings:get, appSettings:set
│   │   ├── sync.ts                # sync:pull, sync:push (STUBS)
│   │   └── printer.ts             # printer:printReceipt, printer:openDrawer
│   └── sync/
│       ├── sync-engine.ts         # Real pull/push logic (NOT CONNECTED)
│       ├── sync-queue.ts          # Queue operations (enqueue, dequeue, mark)
│       └── api-client.ts          # Axios client factory
├── src/
│   ├── pages/
│   │   ├── PosCreate.tsx          # Main POS billing page
│   │   └── PosPage.tsx            # POS landing/transaction history
│   ├── components/pos/
│   │   ├── PosModals.tsx          # All POS modals
│   │   ├── CartPanel.tsx          # Right sidebar (customer, payment)
│   │   ├── CartItemsList.tsx      # Cart items display
│   │   ├── ProductSearch.tsx      # Item search bar
│   │   ├── HeldCartsTabs.tsx      # Tabs: Sales, Held, Sessions, Invoices, Returns
│   │   ├── SessionBar.tsx         # Active session status bar
│   │   ├── SessionsView.tsx       # All sessions list
│   │   ├── SessionTab.tsx         # Session detail + reconciliation
│   │   ├── InvoicesTab.tsx        # Invoices list
│   │   ├── ReturnTab.tsx          # Returns (display-only, no credit note)
│   │   ├── PosBinPicker.tsx       # Bin allocation modal (desktop-only)
│   │   ├── SyncStatusIndicator.tsx # Sync status badge (desktop-only)
│   │   └── SplitPaymentModal.tsx  # Split payment
│   └── services/
│       ├── ipc-client.ts          # IPC bridge wrapper
│       ├── invoices.service.ts    # Invoice operations
│       ├── pos-sessions.service.ts # Session operations
│       ├── customers.service.ts   # Customer operations
│       ├── items.service.ts       # Item operations
│       ├── bin-locations.service.ts # Bin operations
│       ├── pos-codes.service.ts   # POS code verification
│       ├── org-settings.service.ts # Org settings
│       ├── sync.service.ts        # Sync operations
│       └── printer.service.ts     # Printing
```

### Web ERP POS (relevant files only)

```
frontend/src/
├── pages/PosCreate.tsx            # Main POS page (compare with desktop version)
├── components/pos/
│   ├── PosModals.tsx              # Has exchange + delivery challan modals
│   ├── ReturnTab.tsx              # Creates credit notes on server
│   └── [same components as desktop, minus dark mode]
├── services/
│   ├── invoices.service.ts        # API calls to /api/invoices
│   ├── pos-sessions.service.ts    # API calls to /api/pos-sessions
│   ├── payments-received.service.ts # API calls to /api/payments-received
│   ├── delivery-challans.service.ts # API calls to /api/delivery-challans
│   ├── credit-notes.service.ts    # API calls to /api/credit-notes (if exists)
│   └── exchanges.service.ts       # API calls to /api/exchanges

backend/src/
├── services/
│   ├── invoices.service.ts        # Invoice CRUD + number generation
│   ├── pos-sessions.service.ts    # Session management
│   ├── customers.service.ts       # Customer CRUD
│   └── items.service.ts           # Item CRUD + stock
├── routes/
│   ├── invoices.routes.ts
│   ├── pos-sessions.routes.ts
│   └── [39 total route files]
```

---

## Summary

The Desktop POS app is **architecturally sound** and follows industry best practices (offline-first, outbox pattern, SQLite, separate codebase). However, it has **4 critical feature gaps** (payment records, delivery challans, credit notes, invoice numbering) that must be resolved before enabling sync with the cloud ERP.

The sync infrastructure is 80% built — the queue works, the engine code exists, the API client is ready. The remaining 20% is wiring the IPC handlers to the sync engine and filling the data gaps.

**Estimated effort to reach sync-ready state**: Phase 1 (must-fix) ~3–5 days. Phase 2 (should-fix) ~5–7 days.

---

*This document was generated by analyzing every file in both `/pos-app/` and `/frontend/` + `/backend/` codebases.*
