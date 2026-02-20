# Vendor Ledger System — Implementation Plan for 2XG ERP

> **Purpose**: This document explains what a Vendor Ledger is, why your current system is broken,
> and gives you a step-by-step plan to fix it. No code — just concepts and architecture.

---

## Part 1: What Is a Vendor Ledger?

A **Vendor Ledger** is a per-vendor transaction log that records every financial event between
you and that vendor. It answers one question:

> **"How much do I owe this vendor right now, and why?"**

Every row in the ledger is one of three things:

| Event Type       | Effect on Balance | Example                        |
|------------------|-------------------|--------------------------------|
| **Purchase Bill** | Balance goes UP (+) | You received goods worth ₹10,000 |
| **Payment Made**  | Balance goes DOWN (−) | You paid ₹4,000 cash           |
| **Vendor Credit** | Balance goes DOWN (−) | Vendor gave you ₹1,000 credit for damaged goods |

**Running Balance** = Total Bills − Total Payments − Total Credits Applied

---

## Part 2: Your Current System (What's Broken)

Your database already has the right **tables and columns**, but the **connections between them
are broken**. Here's what happens today:

### When you create a Bill:
- ✅ `bills` row created with `total_amount = 10000`
- ✅ `bills.amount_paid = 0`, `bills.balance_due = 10000`
- ❌ `suppliers.current_balance` is NOT updated (stays at 0)

### When you create a Payment:
- ✅ `payments_made` row created with `amount = 4000`
- ✅ `payment_allocations` rows created linking payment → bill
- ❌ `bills.amount_paid` is NOT updated (stays at 0)
- ❌ `bills.balance_due` is NOT updated (stays at 10000)
- ❌ `bills.payment_status` is NOT updated (stays 'unpaid')
- ❌ `suppliers.current_balance` is NOT updated (stays at 0)

### When you apply a Vendor Credit:
- ✅ `vendor_credits.amount_used` is updated
- ❌ `bills.amount_paid` is NOT updated
- ❌ `suppliers.current_balance` is NOT updated

**Result**: Your bills always look unpaid. Your vendor balances are always zero.
The data is there but nothing talks to each other.

> **Fun fact**: Your **customer/invoice side** (`payments-received.service.ts`) already
> does this correctly — it updates `invoices.amount_paid`, `balance_due`, and `status`
> when a payment is received. The vendor side just needs the same treatment.

---

## Part 3: The Fix — 5 Phases

### Phase 1: Make Payments Actually Update Bills

**The Core Fix.** When a payment is created, update the bills it's allocated to.

#### What happens when a Payment is created:

```
1. Insert `payments_made` row
2. For each allocation in the payment:
   a. Insert `payment_allocations` row (bill_id, amount_allocated)
   b. UPDATE the bill:
      - bills.amount_paid += amount_allocated
      - bills.balance_due = bills.total_amount - bills.amount_paid
   c. UPDATE the bill's payment_status:
      - If amount_paid = 0         → 'unpaid'
      - If amount_paid < total     → 'partial'
      - If amount_paid >= total    → 'paid'
   d. UPDATE the bill's status:
      - If fully paid              → 'paid'
3. UPDATE the vendor's current_balance:
   - Recalculate from all their unpaid bills
```

#### What happens when a Payment is deleted/cancelled:

```
1. For each allocation in the payment:
   a. REVERSE the bill update:
      - bills.amount_paid -= amount_allocated
      - bills.balance_due = bills.total_amount - bills.amount_paid
   b. Recalculate payment_status
2. DELETE the payment_allocations rows
3. DELETE or mark cancelled the payments_made row
4. Recalculate vendor's current_balance
```

**Files to modify:**
- `backend/src/services/payments.service.ts` → `createPayment()` and add `deletePayment()`
- Mirror the logic from `backend/src/services/payments-received.service.ts`

---

### Phase 2: Make Vendor Credits Update Bills

**New linking table needed**: `vendor_credit_bill_applications`

```
vendor_credit_bill_applications
├── id (UUID PK)
├── vendor_credit_id (FK → vendor_credits)
├── bill_id (FK → bills)
├── amount_applied (DECIMAL)
├── applied_date (TIMESTAMP)
```

#### What happens when a Credit is applied to a Bill:

```
1. Insert into vendor_credit_bill_applications
2. UPDATE vendor_credits:
   - amount_used += amount_applied
   - balance = total_amount - amount_used
   - If balance = 0 → status = 'closed'
3. UPDATE bills:
   - amount_paid += amount_applied
   - balance_due = total_amount - amount_paid
   - Recalculate payment_status
4. Recalculate vendor's current_balance
```

**Files to modify:**
- New migration for `vendor_credit_bill_applications` table
- `backend/src/services/vendor-credits.service.ts` → fix `applyCreditToBill()`

---

### Phase 3: Auto-Calculate Vendor Balance

The `suppliers.current_balance` should always reflect reality. Two approaches:

#### Option A: Update on every transaction (Recommended)
After every bill/payment/credit event, recalculate:

```
vendor.current_balance =
    SUM(bills.balance_due WHERE vendor_id = X AND status != 'cancelled')
  - SUM(vendor_credits.balance WHERE vendor_id = X AND status != 'cancelled')
```

Create a reusable function: `recalculateVendorBalance(vendorId)`

Call it from:
- `createBill()`, `updateBill()`, `deleteBill()`
- `createPayment()`, `deletePayment()`
- `applyCreditToBill()`

#### Option B: Calculate on-the-fly (simpler but slower)
Don't store `current_balance` at all. Calculate it every time the vendor detail page loads.

**Recommendation**: Option A. Store it for fast list views, but always recalculate from
source data to prevent drift.

---

### Phase 4: Build the Vendor Ledger API & Page

#### New API Endpoint: `GET /api/vendors/:id/ledger`

Query params: `?startDate=&endDate=&page=&limit=`

Returns a chronological list of all transactions for one vendor:

```json
{
  "vendor": { "id": "...", "supplier_name": "ABC Corp", "current_balance": 6000 },
  "ledger": [
    {
      "date": "2026-01-15",
      "type": "bill",
      "reference": "BILL-0042",
      "description": "Purchase of raw materials",
      "debit": 10000,
      "credit": 0,
      "running_balance": 10000
    },
    {
      "date": "2026-01-20",
      "type": "payment",
      "reference": "PAY-0018",
      "description": "Cash payment",
      "debit": 0,
      "credit": 4000,
      "running_balance": 6000
    },
    {
      "date": "2026-02-01",
      "type": "vendor_credit",
      "reference": "VC-0003",
      "description": "Credit for damaged goods",
      "debit": 0,
      "credit": 1000,
      "running_balance": 5000
    }
  ],
  "summary": {
    "total_bills": 10000,
    "total_payments": 4000,
    "total_credits": 1000,
    "closing_balance": 5000
  }
}
```

#### How to build the ledger query:

```
SELECT date, type, reference, debit, credit FROM (
  -- All bills for this vendor
  SELECT bill_date AS date, 'bill' AS type, bill_number AS reference,
         total_amount AS debit, 0 AS credit
  FROM bills WHERE vendor_id = :vendorId AND status != 'cancelled'

  UNION ALL

  -- All payments for this vendor
  SELECT payment_date AS date, 'payment' AS type, payment_number AS reference,
         0 AS debit, amount AS credit
  FROM payments_made WHERE vendor_id = :vendorId AND status = 'completed'

  UNION ALL

  -- All vendor credits applied
  SELECT credit_date AS date, 'vendor_credit' AS type, credit_note_number AS reference,
         0 AS debit, total_amount AS credit
  FROM vendor_credits WHERE vendor_id = :vendorId AND status != 'cancelled'
)
ORDER BY date ASC
```

Then calculate `running_balance` in the application layer (cumulative sum).

#### Frontend: Vendor Ledger Page

Add a "Ledger" or "Transactions" tab to `VendorDetailPage.tsx`:

```
┌─────────────────────────────────────────────────────────┐
│  ABC Corp — Vendor Ledger                               │
│                                                         │
│  Date Range: [Jan 2026 ▼] to [Feb 2026 ▼]  [Filter]   │
│                                                         │
│  ┌─────────┬──────────┬─────────┬────────┬─────────┐   │
│  │  Date   │   Type   │   Ref   │ Debit  │ Credit  │   │
│  │         │          │         │  (↑)   │  (↓)    │   │
│  ├─────────┼──────────┼─────────┼────────┼─────────┤   │
│  │ Jan 15  │ Bill     │ BILL-42 │ 10,000 │    —    │   │
│  │ Jan 20  │ Payment  │ PAY-18  │    —   │  4,000  │   │
│  │ Feb 01  │ Credit   │ VC-03   │    —   │  1,000  │   │
│  └─────────┴──────────┴─────────┴────────┴─────────┘   │
│                                                         │
│  Opening Balance: ₹0    Closing Balance: ₹5,000        │
└─────────────────────────────────────────────────────────┘
```

---

### Phase 5: Fix Existing Data (Migration)

Your database likely has bills that were paid but still show `amount_paid = 0`.
You need a one-time data fix migration.

#### Migration script logic:

```
For each bill:
  1. SUM all payment_allocations.amount_allocated for this bill
  2. SUM all vendor_credit_bill_applications.amount_applied for this bill
  3. SET bills.amount_paid = sum_payments + sum_credits
  4. SET bills.balance_due = bills.total_amount - bills.amount_paid
  5. SET bills.payment_status = based on amount_paid vs total_amount

For each vendor:
  6. SUM all bills.balance_due for this vendor (non-cancelled)
  7. SUBTRACT all unapplied vendor_credits.balance
  8. SET suppliers.current_balance = result
```

---

## Part 4: Data Model Summary

Here's how all the tables connect after implementation:

```
┌──────────────┐
│  suppliers   │
│              │
│ current_     │◄────── Recalculated after every transaction
│ balance      │
└──────┬───────┘
       │ vendor_id
       │
       ├───────────────────┬─────────────────────┐
       ▼                   ▼                     ▼
┌──────────────┐   ┌──────────────┐   ┌──────────────────┐
│    bills     │   │ payments_made│   │  vendor_credits  │
│              │   │              │   │                  │
│ total_amount │   │ amount       │   │ total_amount     │
│ amount_paid  │◄──│              │   │ amount_used      │
│ balance_due  │   │              │   │ balance          │
│ payment_     │   │              │   │                  │
│ status       │   │              │   │                  │
└──────┬───────┘   └──────┬───────┘   └────────┬─────────┘
       │                  │                     │
       │           ┌──────┴───────┐   ┌────────┴──────────────┐
       │           │  payment_    │   │ vendor_credit_bill_   │
       │           │ allocations  │   │ applications (NEW)    │
       │           │              │   │                       │
       └───────────│ bill_id      │   │ bill_id               │
                   │ amount_      │   │ amount_applied        │
                   │ allocated    │   │                       │
                   └──────────────┘   └───────────────────────┘
```

**Data flow for every transaction:**

```
Bill Created    → bills.balance_due = total    → vendor.current_balance ↑
Payment Made    → bills.amount_paid ↑          → vendor.current_balance ↓
                  bills.balance_due ↓
Credit Applied  → bills.amount_paid ↑          → vendor.current_balance ↓
                  bills.balance_due ↓
                  vendor_credits.amount_used ↑
```

---

## Part 5: Implementation Order (What to Build First)

```
Priority 1 (Critical - Without this, accounting is broken)
├── 1.1  Fix payments.service.ts createPayment() to update bills
├── 1.2  Add deletePayment() with bill reversal logic
└── 1.3  Add recalculateVendorBalance() utility function

Priority 2 (Important - Completes the credit note flow)
├── 2.1  Create vendor_credit_bill_applications table (migration)
├── 2.2  Fix applyCreditToBill() to update bills
└── 2.3  Call recalculateVendorBalance() from credit service

Priority 3 (Visibility - Users can see what's happening)
├── 3.1  Create GET /api/vendors/:id/ledger endpoint
├── 3.2  Build Ledger tab in VendorDetailPage.tsx
└── 3.3  Fix Bill detail page to show payment history

Priority 4 (Data Fix - Correct historical data)
├── 4.1  Write migration to recalculate all bill balances
└── 4.2  Write migration to recalculate all vendor balances

Priority 5 (Reports - Business insights)
├── 5.1  Vendor aging report (30/60/90 days overdue)
├── 5.2  Payables summary dashboard
└── 5.3  Vendor statement PDF generation
```

---

## Part 6: Accounting Terms Cheat Sheet

| Term | Meaning in Your ERP |
|------|---------------------|
| **Debit** (vendor ledger) | You owe MORE money (a bill was created) |
| **Credit** (vendor ledger) | You owe LESS money (a payment was made or credit received) |
| **Accounts Payable** | Total money you owe to all vendors combined |
| **Vendor Balance** | Money you owe to ONE specific vendor |
| **Aging** | How long a bill has been unpaid (30/60/90 days) |
| **Advance Payment** | Payment made without linking to a specific bill |
| **Vendor Credit / Debit Note** | Vendor gives you a discount/refund (reduces what you owe) |
| **Reconciliation** | Verifying that calculated balances match actual transaction history |
| **Payment Allocation** | Splitting one payment across multiple bills |

---

## Part 7: Quick Reference — What Updates What

| Action | Updates `bills` | Updates `suppliers` | Updates `vendor_credits` |
|--------|----------------|--------------------|-----------------------|
| Create Bill | amount_paid=0, balance_due=total | current_balance ↑ | — |
| Delete Bill | — (row deleted) | current_balance ↓ | — |
| Create Payment (with allocations) | amount_paid ↑, balance_due ↓, payment_status | current_balance ↓ | — |
| Delete Payment | amount_paid ↓, balance_due ↑, payment_status | current_balance ↑ | — |
| Apply Vendor Credit to Bill | amount_paid ↑, balance_due ↓ | current_balance ↓ | amount_used ↑, balance ↓ |
| Cancel Vendor Credit | — | current_balance ↑ | status = cancelled |

---

> **Next Step**: Once you understand this plan, tell Claude Code to implement Phase 1
> (fix payment tracking). It's the foundation everything else builds on.
