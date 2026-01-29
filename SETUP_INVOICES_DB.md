# Invoice Database Setup Guide

## Overview
This guide will help you set up the invoices and invoice_items tables in your Supabase database.

## Prerequisites
- Supabase project with admin access
- Database connection established

## Setup Instructions

### Option 1: Using Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor** in the left sidebar
3. Click **New Query**
4. Copy and paste the contents of `backend/src/utils/create-invoices-tables.sql`
5. Click **Run** to execute the SQL

### Option 2: Using psql Command Line

```bash
psql -h <your-supabase-host> -U postgres -d postgres -f backend/src/utils/create-invoices-tables.sql
```

## Verification

After running the SQL script, verify the tables were created:

1. In Supabase Dashboard, go to **Table Editor**
2. You should see two new tables:
   - `invoices` - Main invoices table
   - `invoice_items` - Invoice line items table

## Table Structure

### invoices Table
Contains main invoice information including:
- Customer details
- Invoice number and dates
- Payment terms and status
- Financial calculations (subtotal, tax, discount, total)
- TDS/TCS tax information
- Shipping and adjustments

### invoice_items Table
Contains individual line items for each invoice:
- Item details (name, description)
- Quantity and unit of measurement
- Rate and amount
- Links to the parent invoice

## Required Fields

When creating an invoice, you must provide:
- `customer_name` - Customer name
- `invoice_number` - Unique invoice identifier
- `invoice_date` - Date of invoice
- `subtotal` - Subtotal before tax and discounts
- `total_amount` - Final total amount
- `items` - Array of invoice items

## Default Values

The following fields have default values:
- `status` = 'Draft'
- `payment_status` = 'Unpaid'
- `organization_id` = Will need to be set based on your organization
- `balance_due` = Same as total_amount initially

## Next Steps

After creating the tables:
1. Test the invoice creation API: `POST /api/invoices`
2. Verify data is being stored correctly
3. Check that foreign key relationships are working

## Troubleshooting

If you encounter errors:
1. Check that the Supabase connection credentials are correct in `.env`
2. Ensure you have proper permissions on the database
3. Verify that the `customers` and `items` tables exist (optional foreign keys)
4. Check the backend logs for specific error messages
