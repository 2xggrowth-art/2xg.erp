# 2XG ERP — Vendor Ledger & Purchase Order Integration

## Complete Implementation Guide

> **Date**: February 2026
> **System**: 2XG ERP (Self-hosted, Coolify + Supabase)
> **Author**: Generated for 2XG Growth team
> **Purpose**: Blueprint to add Vendor Ledger accounting to the Purchase Order module

---

# SECTION A: YOUR CURRENT PURCHASE ORDER MODULE

## A.1 — The Complete File Map

```
BACKEND (Express + TypeScript + Supabase)
─────────────────────────────────────────
backend/src/routes/purchase-orders.routes.ts        → 7 endpoints
backend/src/controllers/purchase-orders.controller.ts → 7 controller functions
backend/src/services/purchase-orders.service.ts     → PurchaseOrdersService class (389 lines)
backend/src/services/bills.service.ts               → BillsService class (526 lines)
backend/src/services/payments.service.ts            → PaymentsService class (285 lines)
backend/src/services/vendor-credits.service.ts      → VendorCreditsService class (374 lines)
backend/src/services/vendors.service.ts             → VendorsService class (194 lines)

FRONTEND (React + Vite + TypeScript)
─────────────────────────────────────
frontend/src/services/purchase-orders.service.ts    → purchaseOrdersService (149 lines)
frontend/src/components/purchase-orders/
  └── NewPurchaseOrderForm.tsx                      → Create/Edit form (1091 lines)
frontend/src/pages/
  ├── PurchaseOrderPage.tsx                         → PO list page (436 lines)
  ├── PurchaseOrderDetailPage.tsx                   → PO detail page (776 lines)
  └── PurchasesPage.tsx                             → Placeholder (23 lines)
```

## A.2 — Your 7 API Endpoints

```
GET    /api/purchase-orders                  → List all POs (filters: status, vendorId, dateFrom, dateTo)
GET    /api/purchase-orders/summary          → Aggregate stats (total, draft, sent, received counts)
GET    /api/purchase-orders/generate-po-number → Auto-generate "PO-00001", "PO-00002", etc.
GET    /api/purchase-orders/:id              → Single PO with items
POST   /api/purchase-orders                  → Create new PO
PUT    /api/purchase-orders/:id              → Update PO
DELETE /api/purchase-orders/:id              → Delete PO
```

## A.3 — Your Database Tables (Current State)

### Table: `purchase_orders`

```
┌────────────────────────┬──────────────┬──────────────────────────────────────┐
│ Column                 │ Type         │ Notes                                │
├────────────────────────┼──────────────┼──────────────────────────────────────┤
│ id                     │ UUID PK      │ Auto-generated                       │
│ organization_id        │ UUID         │ Multi-tenant                         │
│ po_number              │ TEXT         │ e.g. "PO-00001"                      │
│ purchase_order_number  │ TEXT         │ Duplicate of po_number               │
│ vendor_id              │ UUID FK      │ → suppliers(id), nullable            │
│ vendor_name            │ TEXT         │ Required (denormalized)              │
│ supplier_id            │ UUID         │ Mirror of vendor_id                  │
│ supplier_name          │ TEXT         │ Mirror of vendor_name                │
│ order_date             │ DATE         │                                      │
│ expected_delivery_date │ DATE         │                                      │
│ status                 │ TEXT         │ draft/sent/confirmed/received/billed │
│ subtotal               │ DECIMAL      │ Sum of item totals                   │
│ discount_type          │ TEXT         │ 'percentage' or 'amount'             │
│ discount_value         │ DECIMAL      │                                      │
│ cgst_rate/amount       │ DECIMAL      │ Central GST                          │
│ sgst_rate/amount       │ DECIMAL      │ State GST                            │
│ igst_rate/amount       │ DECIMAL      │ Integrated GST                       │
│ tax_amount             │ DECIMAL      │ Total tax                            │
│ tds_tcs_type/rate/amt  │ DECIMAL      │ Tax deduction/collection             │
│ adjustment             │ DECIMAL      │ Manual adjustment                    │
│ total_amount           │ DECIMAL      │ Final total                          │
│ payment_terms          │ TEXT         │                                      │
│ terms_and_conditions   │ TEXT         │                                      │
│ created_by             │ TEXT         │                                      │
└────────────────────────┴──────────────┴──────────────────────────────────────┘
```

### Table: `purchase_order_items`

```
┌────────────────────────┬──────────────┬──────────────────────────────────────┐
│ Column                 │ Type         │ Notes                                │
├────────────────────────┼──────────────┼──────────────────────────────────────┤
│ id                     │ UUID PK      │                                      │
│ purchase_order_id      │ UUID FK      │ → purchase_orders(id)                │
│ item_id                │ UUID         │ → items(id), nullable                │
│ item_name              │ TEXT         │ Required                             │
│ description            │ TEXT         │                                      │
│ account                │ TEXT         │ Default: 'Cost of Goods Sold'        │
│ quantity               │ DECIMAL      │                                      │
│ unit_price             │ DECIMAL      │                                      │
│ unit_of_measurement    │ TEXT         │                                      │
│ tax_rate               │ DECIMAL      │                                      │
│ discount               │ DECIMAL      │                                      │
│ total                  │ DECIMAL      │                                      │
└────────────────────────┴──────────────┴──────────────────────────────────────┘
```

### Table: `bills` (linked to POs)

```
┌────────────────────────┬──────────────┬──────────────────────────────────────┐
│ Column                 │ Type         │ Notes                                │
├────────────────────────┼──────────────┼──────────────────────────────────────┤
│ id                     │ UUID PK      │                                      │
│ vendor_id              │ UUID FK      │ → suppliers(id)                      │
│ purchase_order_id      │ UUID FK      │ → purchase_orders(id) ★ THE LINK     │
│ bill_number            │ TEXT         │                                      │
│ total_amount           │ DECIMAL      │                                      │
│ amount_paid            │ DECIMAL      │ ★ NEVER UPDATED (always 0)          │
│ balance_due            │ DECIMAL      │ ★ NEVER UPDATED (always = total)    │
│ payment_status         │ TEXT         │ ★ NEVER UPDATED (always 'unpaid')   │
│ status                 │ TEXT         │ draft/open/paid/overdue/cancelled    │
└────────────────────────┴──────────────┴──────────────────────────────────────┘
```

### Table: `payments_made` (pays bills)

```
┌────────────────────────┬──────────────┬──────────────────────────────────────┐
│ Column                 │ Type         │ Notes                                │
├────────────────────────┼──────────────┼──────────────────────────────────────┤
│ id                     │ UUID PK      │                                      │
│ vendor_id              │ UUID FK      │ → suppliers(id)                      │
│ bill_id                │ UUID FK      │ → bills(id)                          │
│ payment_number         │ TEXT         │                                      │
│ amount                 │ DECIMAL      │                                      │
│ payment_mode           │ TEXT         │ Cash, Bank, UPI, etc.                │
│ status                 │ TEXT         │ completed/pending/failed/cancelled   │
└────────────────────────┴──────────────┴──────────────────────────────────────┘
```

### Table: `payment_allocations` (splits payment across bills)

```
┌────────────────────────┬──────────────┬──────────────────────────────────────┐
│ Column                 │ Type         │ Notes                                │
├────────────────────────┼──────────────┼──────────────────────────────────────┤
│ id                     │ UUID PK      │                                      │
│ payment_id             │ UUID FK      │ → payments_made(id)                  │
│ bill_id                │ UUID FK      │ → bills(id)                          │
│ bill_number            │ TEXT         │ Denormalized                         │
│ amount_allocated       │ DECIMAL      │ How much of this payment → this bill │
└────────────────────────┴──────────────┴──────────────────────────────────────┘
```

### Table: `suppliers` (vendors)

```
┌────────────────────────┬──────────────┬──────────────────────────────────────┐
│ Column                 │ Type         │ Notes                                │
├────────────────────────┼──────────────┼──────────────────────────────────────┤
│ id                     │ UUID PK      │                                      │
│ supplier_name          │ TEXT         │ Required                             │
│ current_balance        │ DECIMAL      │ ★ EXISTS BUT NEVER UPDATED (0)      │
│ credit_limit           │ DECIMAL      │                                      │
│ payment_terms          │ TEXT         │ Default: 'Due on Receipt'            │
└────────────────────────┴──────────────┴──────────────────────────────────────┘
```

## A.4 — The Purchase Order Lifecycle (Current)

```
                    YOUR CURRENT FLOW
  ┌──────────────────────────────────────────────┐
  │                                              │
  │   ① CREATE PO ──→ ② SEND TO VENDOR           │
  │        ↓                   ↓                 │
  │   ③ VENDOR CONFIRMS ──→ ④ ITEMS SHIPPED      │
  │        ↓                   ↓                 │
  │   ⑤ RECEIVE ITEMS ──→ ⑥ CREATE BILL          │
  │                            ↓                 │
  │                       ⑦ MAKE PAYMENT          │
  │                            ↓                 │
  │                       ⑧ COMPLETE              │
  │                                              │
  └──────────────────────────────────────────────┘

  ★ PROBLEM: Steps ⑥→⑦→⑧ don't talk to each other.
    Bills never get marked paid. Vendor balance stays 0.
```

## A.5 — What's Missing (Placeholder Features in Your Code)

Your frontend has buttons that don't work yet:

| Button / Feature | Location | Status |
|------------------|----------|--------|
| "Receive Items" | PO Detail → Quick Actions | Placeholder (no backend) |
| "Create Bill" from PO | PO Detail → Quick Actions | Placeholder (no backend) |
| "Record Payment" | PO Detail → Quick Actions | Placeholder (no backend) |
| "Duplicate PO" | PO Detail → More Menu | Not implemented |
| "Receiving" tab | PO Detail → Tab 2 | UI exists, no real data |
| "Timeline" tab | PO Detail → Tab 3 | Hardcoded placeholder events |

---

# SECTION B: THE VENDOR LEDGER SYSTEM

## B.1 — What Is a Vendor Ledger?

A running log of every financial transaction with each vendor.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    VENDOR LEDGER: ABC Suppliers                         │
├───────────┬──────────────┬────────────┬─────────┬─────────┬───────────┤
│   Date    │    Type      │    Ref     │  Debit  │ Credit  │  Balance  │
│           │              │            │  (owe+) │ (owe-)  │           │
├───────────┼──────────────┼────────────┼─────────┼─────────┼───────────┤
│ Jan 01    │ Opening      │    —       │    —    │    —    │      0    │
│ Jan 15    │ Bill         │ BILL-001   │ 10,000  │    —    │  10,000   │
│ Jan 20    │ Payment      │ PAY-001    │    —    │  4,000  │   6,000   │
│ Feb 01    │ Bill         │ BILL-002   │  5,000  │    —    │  11,000   │
│ Feb 05    │ Credit Note  │ VC-001     │    —    │  1,000  │  10,000   │
│ Feb 10    │ Payment      │ PAY-002    │    —    │  6,000  │   4,000   │
├───────────┼──────────────┼────────────┼─────────┼─────────┼───────────┤
│           │              │  TOTALS    │ 15,000  │ 11,000  │   4,000   │
└───────────┴──────────────┴────────────┴─────────┴─────────┴───────────┘

  ★ You still owe ABC Suppliers ₹4,000
```

### Three Transaction Types:

```
BILL (Debit)          = You OWE MORE      → Balance goes UP
PAYMENT (Credit)      = You OWE LESS      → Balance goes DOWN
VENDOR CREDIT (Credit) = You OWE LESS     → Balance goes DOWN
```

### The Formula:

```
Vendor Balance = Total Bills - Total Payments - Total Credits Applied
```

## B.2 — How PO Connects to the Ledger

Purchase Orders themselves are NOT ledger entries. They become ledger entries
only when converted to Bills.

```
   Purchase Order                    Vendor Ledger
  ┌──────────────┐                  ┌──────────────┐
  │ PO-00001     │                  │              │
  │ ₹10,000      │──── Convert ───→│ BILL-001     │ ← Debit entry
  │ Status: sent │    to Bill       │ ₹10,000      │
  └──────────────┘                  │              │
                                    │ PAY-001      │ ← Credit entry
                     Make Payment──→│ ₹4,000       │
                                    │              │
                                    │ Balance:     │
                                    │ ₹6,000 owed  │
                                    └──────────────┘

  ★ The PO is a "promise to buy"
  ★ The Bill is the "actual debt"
  ★ The Payment is the "settlement"
```

## B.3 — The Complete Purchase-to-Pay Flow (With Ledger)

```
  STEP 1: CREATE PURCHASE ORDER
  ├── Insert into purchase_orders table
  ├── Insert items into purchase_order_items
  ├── Status = 'draft'
  ├── ★ NO ledger impact (it's just a plan)
  └── ★ NO stock impact

  STEP 2: SEND PO TO VENDOR
  ├── Update purchase_orders.status = 'sent'
  └── ★ NO ledger impact

  STEP 3: RECEIVE ITEMS
  ├── Update purchase_orders.status = 'received'
  ├── Track received quantities per item
  └── ★ NO ledger impact yet (items received but not billed)

  STEP 4: CONVERT PO TO BILL  ← ★ LEDGER STARTS HERE
  ├── Create bill with purchase_order_id = PO's id
  ├── Copy items from PO to bill_items
  ├── Set bill.total_amount = calculated total
  ├── Set bill.amount_paid = 0
  ├── Set bill.balance_due = total_amount
  ├── Set bill.payment_status = 'unpaid'
  ├── ★ STOCK INCREASES (items.current_stock += quantity)
  ├── ★ VENDOR BALANCE INCREASES (suppliers.current_balance += total)
  └── ★ LEDGER: Debit entry created

  STEP 5: MAKE PAYMENT AGAINST BILL  ← ★ LEDGER UPDATED
  ├── Create payments_made record
  ├── Create payment_allocations (which bills this payment covers)
  ├── ★ UPDATE bill.amount_paid += payment amount
  ├── ★ UPDATE bill.balance_due = total - amount_paid
  ├── ★ UPDATE bill.payment_status = 'partial' or 'paid'
  ├── ★ VENDOR BALANCE DECREASES (suppliers.current_balance -= payment)
  └── ★ LEDGER: Credit entry created

  STEP 6: (OPTIONAL) APPLY VENDOR CREDIT  ← ★ LEDGER UPDATED
  ├── Link credit to bill via vendor_credit_bill_applications
  ├── ★ UPDATE bill.amount_paid += credit amount
  ├── ★ UPDATE bill.balance_due -= credit amount
  ├── ★ UPDATE vendor_credits.amount_used += amount
  ├── ★ VENDOR BALANCE DECREASES
  └── ★ LEDGER: Credit entry created
```

---

# SECTION C: WHAT NEEDS TO BE BUILT

## C.1 — New Database Table

### `vendor_credit_bill_applications` (NEW)

```sql
CREATE TABLE vendor_credit_bill_applications (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_credit_id UUID NOT NULL REFERENCES vendor_credits(id) ON DELETE CASCADE,
  bill_id          UUID NOT NULL REFERENCES bills(id) ON DELETE CASCADE,
  amount_applied   DECIMAL(15,2) NOT NULL CHECK (amount_applied > 0),
  applied_date     TIMESTAMP DEFAULT NOW(),
  created_at       TIMESTAMP DEFAULT NOW()
);
```

**Why**: Currently `applyCreditToBill()` updates the credit but never records
WHICH bill the credit was applied to. This table creates that link.

## C.2 — Backend Changes (6 Files)

### File 1: `backend/src/services/payments.service.ts`

**What to change in `createPayment()`:**

```
CURRENT (broken):
  1. Insert payments_made row
  2. Insert payment_allocations rows
  3. Done ← bills never updated!

NEEDED:
  1. Insert payments_made row
  2. For each allocation:
     a. Insert payment_allocations row
     b. UPDATE bills SET
          amount_paid = amount_paid + allocation.amount_allocated,
          balance_due = total_amount - (amount_paid + allocation.amount_allocated),
          payment_status = CASE
            WHEN (amount_paid + allocation.amount_allocated) >= total_amount THEN 'paid'
            WHEN (amount_paid + allocation.amount_allocated) > 0 THEN 'partial'
            ELSE 'unpaid'
          END,
          status = CASE
            WHEN (amount_paid + allocation.amount_allocated) >= total_amount THEN 'paid'
            ELSE status
          END
        WHERE id = allocation.bill_id
  3. Recalculate vendor balance
```

**New method to add: `deletePayment(id)`:**

```
  1. Fetch payment and its allocations
  2. For each allocation:
     - REVERSE the bill update (amount_paid -= allocated, balance_due += allocated)
     - Recalculate payment_status
  3. Delete payment_allocations
  4. Delete payments_made row
  5. Recalculate vendor balance
```

**Reference**: Your `payments-received.service.ts` already does this for invoices.
Copy that pattern.

### File 2: `backend/src/services/vendor-credits.service.ts`

**What to change in `applyCreditToBill()`:**

```
CURRENT (partially broken):
  1. Update vendor_credits.amount_used += amount
  2. Update vendor_credits.balance -= amount
  3. Done ← bill never updated!

NEEDED:
  1. Insert vendor_credit_bill_applications row (NEW)
  2. Update vendor_credits.amount_used += amount
  3. Update vendor_credits.balance -= amount
  4. Update vendor_credits.status = 'closed' if balance = 0
  5. UPDATE bills SET                               ← ADD THIS
       amount_paid = amount_paid + amount,
       balance_due = total_amount - (amount_paid + amount),
       payment_status = recalculate
     WHERE id = bill_id
  6. Recalculate vendor balance                     ← ADD THIS
```

### File 3: `backend/src/services/bills.service.ts`

**What to change in `createBill()`:**

```
CURRENT:
  1. Insert bill
  2. Insert bill_items
  3. Update items.current_stock (if applicable)
  4. Done ← vendor balance never updated!

ADD after step 4:
  5. UPDATE suppliers SET
       current_balance = current_balance + bill.total_amount
     WHERE id = bill.vendor_id
```

**What to change in `deleteBill()` (or add if missing):**

```
  1. Fetch bill
  2. Reverse stock changes
  3. UPDATE suppliers SET
       current_balance = current_balance - bill.total_amount
     WHERE id = bill.vendor_id
  4. Delete bill
```

### File 4: `backend/src/services/vendors.service.ts`

**New utility method: `recalculateVendorBalance(vendorId)`:**

```
  1. SELECT COALESCE(SUM(balance_due), 0) as total_payable
     FROM bills
     WHERE vendor_id = vendorId AND status != 'cancelled'

  2. SELECT COALESCE(SUM(balance), 0) as total_credits
     FROM vendor_credits
     WHERE vendor_id = vendorId AND status NOT IN ('cancelled', 'closed')

  3. net_balance = total_payable - total_credits

  4. UPDATE suppliers SET current_balance = net_balance WHERE id = vendorId
```

Call this from: createBill, deleteBill, createPayment, deletePayment, applyCreditToBill

### File 5: NEW — `backend/src/services/vendor-ledger.service.ts`

```
  getVendorLedger(vendorId, startDate?, endDate?)

  Query: UNION of three tables sorted by date:

  SELECT bill_date as date, 'bill' as type, bill_number as reference,
         total_amount as debit, 0 as credit
  FROM bills WHERE vendor_id = ? AND status != 'cancelled'

  UNION ALL

  SELECT payment_date as date, 'payment' as type, payment_number as reference,
         0 as debit, amount as credit
  FROM payments_made WHERE vendor_id = ? AND status = 'completed'

  UNION ALL

  SELECT credit_date as date, 'vendor_credit' as type, credit_note_number as reference,
         0 as debit, total_amount as credit
  FROM vendor_credits WHERE vendor_id = ? AND status != 'cancelled'

  ORDER BY date ASC

  Then calculate running_balance in app layer (cumulative sum)
```

### File 6: NEW — `backend/src/routes/vendor-ledger.routes.ts`

```
  GET /api/vendors/:id/ledger?startDate=&endDate=
  → Returns ledger entries + summary + running balance
```

Register in `server.ts`: `app.use('/api/vendors', vendorLedgerRoutes)`
(Or add as a sub-route under existing vendors routes)

## C.3 — Frontend Changes (3 Files)

### File 1: `frontend/src/pages/VendorDetailPage.tsx`

**Add "Ledger" tab** showing:
- Date range filter
- Transaction table (Date, Type, Reference, Debit, Credit, Running Balance)
- Summary footer (Total Bills, Total Payments, Total Credits, Closing Balance)

### File 2: `frontend/src/pages/PurchaseOrderDetailPage.tsx`

**Wire up the placeholder buttons:**
- "Create Bill" → Navigate to `/bills/new?poId={id}` (pre-fill from PO)
- "Record Payment" → Navigate to `/payments-made/new?vendorId={id}`
- "Receive Items" → Update PO status + track received quantities

### File 3: `frontend/src/pages/BillDetailPage.tsx`

**Add "Payments" tab** showing:
- All payment_allocations linked to this bill
- Each payment date, number, amount allocated
- Remaining balance_due

## C.4 — Data Fix Migration

One-time script to fix existing data:

```
  FOR EACH BILL:
    actual_paid = SUM(payment_allocations.amount_allocated WHERE bill_id = this)
    UPDATE bills SET
      amount_paid = actual_paid,
      balance_due = total_amount - actual_paid,
      payment_status = CASE ...

  FOR EACH VENDOR:
    total_owed = SUM(bills.balance_due WHERE vendor_id = this AND status != 'cancelled')
    UPDATE suppliers SET current_balance = total_owed
```

---

# SECTION D: IMPLEMENTATION PRIORITY

```
┌───────────────────────────────────────────────────────────────────────┐
│  PHASE 1: CORE FIX (Do this first — everything depends on it)       │
│                                                                       │
│  1.1  Fix payments.service.ts → createPayment() updates bills        │
│  1.2  Add recalculateVendorBalance() to vendors.service.ts           │
│  1.3  Fix bills.service.ts → createBill() updates vendor balance     │
│  1.4  Run data fix migration for existing records                    │
│                                                                       │
│  Estimated scope: 4 files modified, ~150 lines of code               │
├───────────────────────────────────────────────────────────────────────┤
│  PHASE 2: VENDOR CREDITS (Complete the credit flow)                  │
│                                                                       │
│  2.1  Create vendor_credit_bill_applications table (migration)       │
│  2.2  Fix applyCreditToBill() → update bills + vendor balance        │
│                                                                       │
│  Estimated scope: 1 migration + 1 file modified, ~50 lines           │
├───────────────────────────────────────────────────────────────────────┤
│  PHASE 3: LEDGER API (Make it visible)                               │
│                                                                       │
│  3.1  Create vendor-ledger.service.ts                                │
│  3.2  Create vendor-ledger route (or add to vendors routes)          │
│  3.3  Add Ledger tab to VendorDetailPage.tsx                         │
│                                                                       │
│  Estimated scope: 2 new backend files + 1 frontend page, ~200 lines │
├───────────────────────────────────────────────────────────────────────┤
│  PHASE 4: PO → BILL FLOW (Wire up placeholder buttons)              │
│                                                                       │
│  4.1  "Create Bill from PO" button → pre-fill bill form              │
│  4.2  "Record Payment" button → navigate to payment form             │
│  4.3  "Receive Items" → track received quantities                    │
│                                                                       │
│  Estimated scope: 2 frontend files modified, ~100 lines              │
├───────────────────────────────────────────────────────────────────────┤
│  PHASE 5: REPORTS (Business insights)                                │
│                                                                       │
│  5.1  Vendor aging report (30/60/90 days overdue)                    │
│  5.2  Accounts payable summary dashboard                             │
│  5.3  Vendor statement PDF export                                    │
│                                                                       │
│  Estimated scope: 3 new pages + 1 new service                       │
└───────────────────────────────────────────────────────────────────────┘
```

---

# SECTION E: AI PROMPTS TO IMPLEMENT EACH PHASE

Copy-paste these prompts into Claude Code to implement each phase.

---

## Prompt 1: Fix Payment → Bill Update (Phase 1.1)

```
Read my payments-received.service.ts (the customer/invoice side) and
payments.service.ts (the vendor/bill side). The payments-received service
correctly updates invoices when payments are received — it updates
amount_paid, balance_due, and status on the invoice.

Now do the EXACT same thing for the vendor side:

1. In payments.service.ts, modify createPayment() so that after creating
   payment_allocations, it also:
   - Updates bills.amount_paid += allocation.amount_allocated
   - Updates bills.balance_due = total_amount - amount_paid
   - Updates bills.payment_status to 'unpaid'/'partial'/'paid'
   - Updates bills.status to 'paid' when fully paid

2. Add a deletePayment() method that reverses these bill updates.

Mirror the exact pattern from payments-received.service.ts. Don't change
any API routes or controllers — only the service file.
```

## Prompt 2: Add Vendor Balance Recalculation (Phase 1.2)

```
In vendors.service.ts, add a new method: recalculateVendorBalance(vendorId)

It should:
1. SUM all bills.balance_due WHERE vendor_id = vendorId AND status != 'cancelled'
2. SUM all vendor_credits.balance WHERE vendor_id = vendorId AND status NOT IN ('cancelled', 'closed')
3. Set suppliers.current_balance = total_bills - total_credits
4. Return the new balance

Then call this method at the end of:
- payments.service.ts → createPayment() (after updating bills)
- payments.service.ts → deletePayment() (after reversing bills)
- bills.service.ts → createBill() (after inserting the bill)

Import vendorsService in those files and call recalculateVendorBalance().
```

## Prompt 3: Fix Bills Creating Vendor Balance (Phase 1.3)

```
In bills.service.ts, modify createBill():

After successfully inserting the bill and bill_items, if the bill has a
vendor_id, call vendorsService.recalculateVendorBalance(vendor_id) to
update the vendor's current_balance.

Also modify updateBill() and any delete logic to do the same.

Import the vendorsService at the top. Don't change the API response format.
```

## Prompt 4: Data Fix Migration (Phase 1.4)

```
Create a new migration file at backend/migrations/022_fix_bill_balances.js.

This migration should:
1. For each bill in the database:
   - Calculate actual amount_paid from SUM of payment_allocations.amount_allocated
   - Update bills.amount_paid, balance_due, and payment_status
2. For each vendor (supplier) in the database:
   - Calculate current_balance from SUM of their bills.balance_due
   - Update suppliers.current_balance

Use the pg-meta endpoint pattern from existing migrations (fetch to
SUPABASE_URL/pg/query with service role key). Include both up and down SQL.
```

## Prompt 5: Vendor Credit → Bill Link (Phase 2)

```
Create a new migration backend/migrations/023_vendor_credit_bill_applications.js
that creates the vendor_credit_bill_applications table with columns:
id (UUID PK), vendor_credit_id (FK), bill_id (FK), amount_applied (DECIMAL),
applied_date (TIMESTAMP), created_at (TIMESTAMP).

Then modify vendor-credits.service.ts applyCreditToBill() to:
1. Insert a row into vendor_credit_bill_applications
2. Update the bill's amount_paid and balance_due (like payments do)
3. Call recalculateVendorBalance()

Currently it only updates the credit note itself — make it also update the bill.
```

## Prompt 6: Vendor Ledger API (Phase 3)

```
Create a new vendor ledger endpoint. I want to see all financial transactions
for a specific vendor in chronological order.

1. Create backend/src/services/vendor-ledger.service.ts with a method
   getVendorLedger(vendorId, startDate?, endDate?) that queries:
   - All bills for this vendor (debit entries)
   - All payments_made for this vendor (credit entries)
   - All vendor_credits for this vendor (credit entries)
   Uses UNION ALL, ordered by date ascending.
   Calculate running_balance as cumulative sum in the code.

2. Add the endpoint to the existing vendors routes:
   GET /api/vendors/:id/ledger?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD

3. Return format:
   { vendor: {...}, ledger: [{date, type, reference, description, debit, credit, running_balance}], summary: {total_bills, total_payments, total_credits, closing_balance} }

Don't create new route file — add to existing vendors.routes.ts.
```

## Prompt 7: Ledger UI in Vendor Detail Page (Phase 3 Frontend)

```
In VendorDetailPage.tsx, add a "Ledger" tab (alongside the existing tabs).

The Ledger tab should:
1. Have a date range filter (start date, end date, filter button)
2. Show a table with columns: Date, Type (with colored badge), Reference
   (clickable link to bill/payment/credit), Description, Debit, Credit,
   Running Balance
3. Show a summary row at the bottom: Total Bills | Total Payments |
   Total Credits | Closing Balance
4. Call GET /api/vendors/:id/ledger with the date range

Add the API call to the frontend vendors service or create a small
vendorLedger service. Use apiClient for auth.

Style it with Tailwind to match the existing pages.
```

## Prompt 8: Wire Up PO Detail Buttons (Phase 4)

```
In PurchaseOrderDetailPage.tsx, wire up the placeholder buttons:

1. "Create Bill" button:
   - Navigate to /bills/new with query params: ?poId={po.id}
   - In the NewBillForm, if poId is in URL params, fetch the PO and
     pre-fill: vendor, items, quantities, rates, tax info

2. "Record Payment" button:
   - Navigate to /payments-made/new?vendorId={po.vendor_id}

3. Update the PO status to 'billed' when a bill is created from it.
   Check in bills.service.ts createBill(): if purchase_order_id is provided,
   update purchase_orders.status = 'billed'.

Don't implement "Receive Items" yet — just the bill and payment flow.
```

---

# SECTION F: DATA FLOW DIAGRAMS

## F.1 — Complete Purchase-to-Pay Data Flow

```
  ┌─────────────┐        ┌─────────────┐        ┌─────────────┐
  │  PURCHASE    │        │    BILL      │        │   PAYMENT   │
  │  ORDER       │───────→│              │───────→│             │
  │              │ Convert│              │  Pay   │             │
  │ PO-00001     │ to Bill│ BILL-001     │ Bill   │ PAY-001     │
  │ ₹10,000      │        │ ₹10,000      │        │ ₹4,000      │
  │              │        │              │        │             │
  │ Status:      │        │ amount_paid: │        │ Allocations:│
  │  sent → billed│       │  0 → 4,000   │        │  BILL-001:  │
  │              │        │ balance_due: │        │   ₹4,000    │
  │              │        │  10K → 6K    │        │             │
  │              │        │ payment_     │        │             │
  │              │        │ status:      │        │             │
  │              │        │  unpaid →    │        │             │
  │              │        │  partial     │        │             │
  └─────────────┘        └──────┬───────┘        └──────┬──────┘
                                │                        │
                    ┌───────────┴────────────────────────┘
                    ▼
             ┌─────────────┐
             │  SUPPLIER    │
             │ (Vendor)     │
             │              │
             │ current_     │
             │ balance:     │
             │  0 → 10K     │  ← Bill created (+10K)
             │  → 6K        │  ← Payment made (-4K)
             │              │
             └─────────────┘
```

## F.2 — Vendor Balance Update Points

```
  EVENT                        │ bills          │ suppliers
  ─────────────────────────────┼────────────────┼──────────────────
  Bill Created (₹10,000)       │ balance_due    │ current_balance
                               │ = 10,000       │ += 10,000
  ─────────────────────────────┼────────────────┼──────────────────
  Payment Made (₹4,000)        │ amount_paid    │ current_balance
                               │ += 4,000       │ -= 4,000
                               │ balance_due    │
                               │ = 6,000        │
  ─────────────────────────────┼────────────────┼──────────────────
  Credit Applied (₹1,000)      │ amount_paid    │ current_balance
                               │ += 1,000       │ -= 1,000
                               │ balance_due    │
                               │ = 5,000        │
  ─────────────────────────────┼────────────────┼──────────────────
  Payment Made (₹5,000)        │ amount_paid    │ current_balance
                               │ += 5,000       │ -= 5,000
                               │ balance_due    │
                               │ = 0            │
                               │ status = paid  │
  ─────────────────────────────┼────────────────┼──────────────────
  Bill Cancelled               │ (row deleted   │ current_balance
                               │  or cancelled) │ RECALCULATE
```

## F.3 — Table Relationships (After Implementation)

```
  ┌──────────────────┐
  │ purchase_orders  │
  │                  │
  │  vendor_id ──────────────────────────────────────┐
  │  total_amount    │                               │
  │  status          │                               │
  └────────┬─────────┘                               │
           │ purchase_order_id                       │
           ▼                                         ▼
  ┌──────────────────┐                     ┌──────────────────┐
  │     bills        │                     │    suppliers     │
  │                  │                     │                  │
  │  vendor_id ──────────────────────────→ │  current_balance │
  │  total_amount    │                     │  (recalculated)  │
  │  amount_paid  ◄──────── updated by ──┐ │                  │
  │  balance_due  ◄──────── updated by ──┤ └──────────────────┘
  │  payment_status◄─────── updated by ──┤
  └────────┬─────────┘                   │
           │ bill_id                     │
           ▼                             │
  ┌──────────────────┐                   │
  │ payment_          │                   │
  │ allocations      │───── triggers ────┘
  │                  │    bill update
  │  amount_allocated│
  └────────┬─────────┘
           │ payment_id
           ▼
  ┌──────────────────┐
  │  payments_made   │
  │                  │
  │  vendor_id       │
  │  amount          │
  │  status          │
  └──────────────────┘

  ┌──────────────────────────┐
  │ vendor_credit_bill_      │
  │ applications (NEW)       │
  │                          │
  │  vendor_credit_id  ──────────→ vendor_credits
  │  bill_id  ───────────────────→ bills
  │  amount_applied          │
  └──────────────────────────┘
```

---

# SECTION G: ACCOUNTING TERMS REFERENCE

| Term | What It Means In Your ERP |
|------|---------------------------|
| **Accounts Payable (AP)** | Total of all `suppliers.current_balance` = money you owe all vendors |
| **Vendor Balance** | One vendor's `current_balance` = money you owe that specific vendor |
| **Debit** (in vendor ledger) | A bill was created — you owe MORE |
| **Credit** (in vendor ledger) | A payment/credit was made — you owe LESS |
| **Balance Due** | `bills.balance_due` = remaining unpaid on one bill |
| **Partial Payment** | `bills.payment_status = 'partial'` — bill not fully paid |
| **Advance Payment** | Payment made without linking to a specific bill |
| **Vendor Credit / Debit Note** | Vendor gives you a discount (reduces what you owe) |
| **Aging Report** | Bills grouped by how overdue they are (30/60/90 days) |
| **Reconciliation** | Verifying calculated balances match actual transaction history |
| **Opening Balance** | Starting balance for a date range in the ledger |
| **Closing Balance** | Ending balance for a date range in the ledger |
| **FIFO** | First In, First Out — pay oldest bills first |

---

# SECTION H: CHECKLIST

Use this checklist when implementing:

```
Phase 1: Core Fix
  [ ] payments.service.ts → createPayment() updates bills
  [ ] payments.service.ts → deletePayment() reverses bill updates
  [ ] vendors.service.ts → recalculateVendorBalance() method added
  [ ] bills.service.ts → createBill() calls recalculateVendorBalance()
  [ ] Data fix migration created and run
  [ ] Verify: Create bill → vendor balance goes up
  [ ] Verify: Make payment → bill amount_paid goes up, balance_due goes down
  [ ] Verify: Full payment → bill status = 'paid'

Phase 2: Vendor Credits
  [ ] Migration: vendor_credit_bill_applications table created
  [ ] vendor-credits.service.ts → applyCreditToBill() updates bills
  [ ] vendor-credits.service.ts → applyCreditToBill() recalculates vendor balance
  [ ] Verify: Apply credit → bill balance_due decreases

Phase 3: Ledger
  [ ] vendor-ledger.service.ts created
  [ ] GET /api/vendors/:id/ledger endpoint works
  [ ] Ledger tab added to VendorDetailPage.tsx
  [ ] Date range filter works
  [ ] Running balance calculates correctly
  [ ] Verify: Ledger matches manual calculation

Phase 4: PO → Bill Flow
  [ ] "Create Bill" button navigates with PO data
  [ ] NewBillForm pre-fills from PO when poId param present
  [ ] PO status updates to 'billed' when bill is created
  [ ] "Record Payment" button navigates correctly

Phase 5: Reports
  [ ] Aging report (30/60/90 days)
  [ ] Payables summary dashboard
  [ ] Vendor statement PDF
```

---

> **How to use this document**: Read Sections A-B to understand the current state and
> the concept. Read Section C to know exactly what to build. Use Section E prompts
> to have Claude Code implement each phase. Use Section H checklist to verify.
