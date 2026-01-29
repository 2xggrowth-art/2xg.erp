# Payment Received Module - Setup Guide

## Overview
The Payment Received module has been fully implemented with backend and frontend components. Follow this guide to complete the setup.

## ✅ What's Already Completed

### Backend (100% Complete)
- ✅ Database schema created
- ✅ Service layer with business logic
- ✅ Controller for API endpoints
- ✅ Routes configured and integrated
- ✅ Auto-generated payment numbers (PAY-00001, PAY-00002, etc.)
- ✅ Full CRUD operations

### Frontend (100% Complete)
- ✅ Service for API calls
- ✅ Payments Received list page with filters
- ✅ New Payment form with Zoho-like workflow
- ✅ Routes configured in App.tsx
- ✅ Excess payment handling with modal confirmation

## 🔧 Setup Required: Create Database Table

### Step 1: Access Supabase SQL Editor

1. Go to your Supabase Dashboard: https://app.supabase.com
2. Select your project: `2xg-dashboard`
3. Navigate to **SQL Editor** in the left sidebar
4. Click **New Query**

### Step 2: Execute the SQL Script

Copy and paste the following SQL script into the SQL Editor:

```sql
-- Create payments_received table
CREATE TABLE IF NOT EXISTS public.payments_received (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    payment_number VARCHAR(50) UNIQUE NOT NULL,
    customer_id UUID,
    customer_name VARCHAR(255) NOT NULL,
    reference_number VARCHAR(100),
    payment_date DATE NOT NULL,
    payment_mode VARCHAR(50) NOT NULL,
    amount_received DECIMAL(15, 2) NOT NULL,
    bank_charges DECIMAL(15, 2) DEFAULT 0,
    deposit_to VARCHAR(255),
    location VARCHAR(255),
    invoice_id UUID,
    invoice_number VARCHAR(50),
    amount_used DECIMAL(15, 2) DEFAULT 0,
    amount_excess DECIMAL(15, 2) DEFAULT 0,
    status VARCHAR(50) DEFAULT 'recorded',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_payments_received_organization_id ON public.payments_received(organization_id);
CREATE INDEX IF NOT EXISTS idx_payments_received_customer_id ON public.payments_received(customer_id);
CREATE INDEX IF NOT EXISTS idx_payments_received_payment_number ON public.payments_received(payment_number);
CREATE INDEX IF NOT EXISTS idx_payments_received_payment_date ON public.payments_received(payment_date);
CREATE INDEX IF NOT EXISTS idx_payments_received_payment_mode ON public.payments_received(payment_mode);
CREATE INDEX IF NOT EXISTS idx_payments_received_invoice_id ON public.payments_received(invoice_id);

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_payments_received_updated_at ON public.payments_received;
CREATE TRIGGER update_payments_received_updated_at
    BEFORE UPDATE ON public.payments_received
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
```

3. Click **Run** or press `Ctrl+Enter` (Windows) / `Cmd+Enter` (Mac)
4. Verify you see "Success. No rows returned" message

### Step 3: Verify Table Creation

1. Navigate to **Table Editor** in the left sidebar
2. You should see `payments_received` in the list of tables
3. Click on it to view the table structure

## 🚀 Testing the Feature

### Phase 1: Access the Module

1. Start your backend server:
   ```bash
   cd backend
   npm run dev
   ```

2. Start your frontend server:
   ```bash
   cd frontend
   npm run dev
   ```

3. Navigate to: http://localhost:3001/sales/payment-received

### Phase 2: Record a Payment (Zoho-like Workflow)

1. Click the **"+ New Payment"** button
2. Fill in the form:
   - **Customer Name:** Mr. mohammad Zaheer (required)
   - **Payment#:** Auto-generated (PAY-00001)
   - **Payment Date:** Current date (editable)
   - **Amount Received:** 654.00 (required)
   - **Bank Charges:** 4 (optional)
   - **Payment Mode:** Select "UPI" from dropdown
   - **Deposit To:** Select "Petty Cash"
   - **Location:** Select "Head Office"
   - **Reference Number:** Optional field
   - **Notes:** Optional additional information

3. Click **"Save as Paid"**

### Phase 3: Handle Excess Payment

1. Since no invoice is selected, an "Excess Payment" modal will appear
2. The modal explains that ₹650.00 (654 - 4) will be deposited as **Unearned Revenue**
3. Click **"Continue to Save"** to confirm

### Phase 4: Verify Success

1. You should see a success message: "Payment recorded successfully!"
2. You'll be redirected to the Payments Received list page
3. Your new payment (PAY-00001) should appear at the top of the list
4. Verify the details:
   - Date: 15/01/2026
   - Payment#: PAY-00001
   - Customer: Mr. mohammad Zaheer
   - Mode: UPI badge (blue)
   - Amount: ₹654.00

## 📊 Features Implemented

### List View Features
- ✅ Payment records table with all details
- ✅ Filter by payment mode (Cash, UPI, Bank Transfer, etc.)
- ✅ Select multiple payments (checkbox)
- ✅ Action menu (View, Edit, Delete)
- ✅ Summary cards showing total payments and amounts
- ✅ Responsive design

### Form Features
- ✅ Auto-generated payment numbers
- ✅ Customer name input (manual entry)
- ✅ Payment date picker
- ✅ Amount received with validation
- ✅ Bank charges handling
- ✅ Payment mode selection (6 modes)
- ✅ Deposit account selection
- ✅ Location tracking
- ✅ Reference number field
- ✅ Notes section
- ✅ Real-time net amount calculation
- ✅ Excess payment warning and modal
- ✅ Comprehensive error handling

### API Endpoints
- ✅ `GET /api/payments-received/generate-number` - Generate payment number
- ✅ `POST /api/payments-received` - Create new payment
- ✅ `GET /api/payments-received` - List all payments with filters
- ✅ `GET /api/payments-received/:id` - Get single payment
- ✅ `PUT /api/payments-received/:id` - Update payment
- ✅ `DELETE /api/payments-received/:id` - Delete payment

## 🎯 Next Steps (Optional Enhancements)

1. **Invoice Integration:**
   - Link payments to unpaid invoices
   - Auto-calculate amount used vs. excess

2. **Customer Integration:**
   - Add customer dropdown with search
   - Auto-fill customer details

3. **PDF Receipt Generation:**
   - Generate payment receipts
   - Email receipts to customers

4. **Payment Reports:**
   - Daily/Monthly payment summaries
   - Payment mode analysis
   - Cash flow reports

## 🐛 Troubleshooting

### Issue: "Could not find table 'payments_received'"
**Solution:** Execute the SQL script in Supabase SQL Editor (Step 2 above)

### Issue: Backend not responding
**Solution:**
1. Check if backend is running on port 5002
2. Verify the route is added to `server.ts`
3. Check console for errors

### Issue: Form not submitting
**Solution:**
1. Check browser console for errors
2. Verify all required fields are filled
3. Ensure amount is greater than zero

## 📝 Database Schema Details

### Table: `payments_received`

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key, auto-generated |
| organization_id | UUID | Organization identifier |
| payment_number | VARCHAR(50) | Unique payment number (PAY-00001) |
| customer_id | UUID | Optional link to customers table |
| customer_name | VARCHAR(255) | Customer name (required) |
| reference_number | VARCHAR(100) | Optional reference |
| payment_date | DATE | Date of payment |
| payment_mode | VARCHAR(50) | Cash, UPI, Bank Transfer, etc. |
| amount_received | DECIMAL(15,2) | Total amount received |
| bank_charges | DECIMAL(15,2) | Any bank fees/charges |
| deposit_to | VARCHAR(255) | Deposit account name |
| location | VARCHAR(255) | Location where payment was received |
| invoice_id | UUID | Optional link to invoices table |
| invoice_number | VARCHAR(50) | Optional invoice reference |
| amount_used | DECIMAL(15,2) | Amount applied to invoices |
| amount_excess | DECIMAL(15,2) | Excess/unearned amount |
| status | VARCHAR(50) | Payment status |
| notes | TEXT | Additional notes |
| created_at | TIMESTAMPTZ | Record creation time |
| updated_at | TIMESTAMPTZ | Last update time |

## ✨ Summary

The Payment Received module is **fully implemented** and ready to use. Just execute the SQL script in Supabase to create the table, and you'll have a complete payment recording system matching Zoho Inventory's workflow!

All code follows the same patterns as your existing modules (Sales Orders, Invoices, etc.) for consistency and maintainability.
