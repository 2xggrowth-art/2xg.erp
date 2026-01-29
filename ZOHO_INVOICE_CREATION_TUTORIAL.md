# Zoho Inventory: New Invoice Creation Tutorial

**Role**: ERP Implementation Specialist
**System**: Zoho Inventory
**Module**: Sales - Invoices
**Version**: Current (2026)

---

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Phase 1: Header and Primary Information](#phase-1-header-and-primary-information)
4. [Phase 2: Salesperson and Communication Setup](#phase-2-salesperson-and-communication-setup)
5. [Phase 3: Itemization and Stock Validation](#phase-3-itemization-and-stock-validation)
6. [Phase 4: Validation and Error Handling](#phase-4-validation-and-error-handling)
7. [Phase 5: Finalization and Sending](#phase-5-finalization-and-sending)
8. [Best Practices](#best-practices)
9. [Troubleshooting](#troubleshooting)

---

## Overview

This tutorial provides a comprehensive, step-by-step guide for creating and sending customer invoices in Zoho Inventory. The invoice creation process encompasses customer selection, salesperson assignment, item management with stock validation, and error handling for out-of-stock scenarios.

### Invoice Creation Workflow

```
Navigate to Sales → Select Invoices → New Invoice → Enter Details →
Validate Stock → Handle Errors → Save and Send
```

---

## Prerequisites

Before creating an invoice, ensure you have:

- ✓ Active Zoho Inventory account with appropriate permissions
- ✓ Customer database populated with valid customer records
- ✓ Inventory items configured with pricing and stock levels
- ✓ Salesperson records created (if assigning sales representatives)
- ✓ Tax settings configured (TDS/TCS as applicable)
- ✓ Payment terms defined (Net 15, Due on Receipt, etc.)

---

## Phase 1: Header and Primary Information

### Step 1.1: Navigate to Invoice Module

**Action**: Access the invoice creation interface

1. From the Zoho Inventory dashboard, click on the **Sales** module in the left navigation menu
2. Select **Invoices** from the submenu options
3. Click the **+ New** button (typically blue button in the top-right corner)

**Expected Result**: The "New Invoice" creation screen opens

---

### Step 1.2: Customer Selection

**Action**: Select or create a customer for the invoice

**Field**: Customer Name (Required)

1. Click on the **Customer Name** dropdown field (marked with red asterisk *)
2. Begin typing the customer name to search existing customers
3. Select the appropriate customer from the dropdown list
   - **Example**: `Mr. Mohammad Zaheer`

**Alternative - New Customer**:
- If the customer doesn't exist, click **+ New Customer**
- Fill in required customer details and save
- Return to invoice creation

**Validation**:
- Customer field must be populated before proceeding
- Selected customer's billing and shipping addresses will auto-populate

---

### Step 1.3: Invoice Number Configuration

**Field**: Invoice# (Auto-generated)

**Action**: Review and confirm the invoice number

- Zoho Inventory automatically generates sequential invoice numbers
- **Example Format**: `INV-000001`, `INV-000002`, etc.
- Click the settings icon (⚙️) next to the invoice number to customize the prefix or sequence if needed

**Note**: Invoice numbers cannot be duplicated and follow your organization's configured sequence pattern.

---

### Step 1.4: Order Number Reference

**Field**: Order Number (Optional but recommended)

**Action**: Enter the reference order number

1. Click in the **Order Number** field
2. Enter the corresponding sales order or reference number
   - **Example**: `35467`

**Purpose**: Links the invoice to the original sales order for tracking and audit purposes

---

### Step 1.5: Location Selection

**Field**: Location (Required for multi-location setups)

**Action**: Select the inventory location

1. Click the **Location** dropdown
2. Select the appropriate warehouse or office location
   - **Example**: `Head Office`

**Note**: This determines which location's inventory will be affected by the invoice

---

### Step 1.6: Terms and Dates Configuration

**Fields**: Payment Terms, Invoice Date, Due Date

**Action**: Configure payment terms

1. **Payment Terms**: Select from dropdown
   - Options: `Due on Receipt`, `Net 15`, `Net 30`, `Net 45`, etc.
   - **Example**: `Due on Receipt`
2. **Invoice Date**: Auto-populated with current date (can be modified)
3. **Due Date**: Auto-calculated based on payment terms (can be manually adjusted)

---

## Phase 2: Salesperson and Communication Setup

### Step 2.1: Assign Salesperson

**Field**: Salesperson (Optional but recommended for tracking)

**Action**: Assign a sales representative to the invoice

1. Click the **Salesperson** dropdown field
2. Select the appropriate salesperson from the list
3. If the required salesperson is not available, proceed to Step 2.2

**Purpose**: Tracks sales performance and assigns accountability

---

### Step 2.2: Add New Salesperson (If Required)

**Trigger**: Required salesperson missing from the list

**Action**: Create a new salesperson record

1. Click **Manage Salespersons** link (typically near the salesperson field)
2. In the Salespersons management screen, click **+ New Salesperson**
3. Fill in the required details:
   - **Name**: Enter full name (e.g., `John Smith` or `ssss`)
   - **Email**: Enter valid email address (e.g., `john.smith@company.com` or `sss@gmail.com`)
   - **Optional Fields**: Phone number, employee ID, commission rate
4. Click **Save**
5. Return to the invoice creation screen
6. Select the newly created salesperson from the dropdown

**Validation**: Email address must be in valid format (xxx@xxx.xxx)

---

### Step 2.3: Subject Line Configuration

**Field**: Subject (Email subject for customer communication)

**Action**: Enter a descriptive subject line

1. Locate the **Subject** field (typically below customer information)
2. Enter a clear, concise subject that describes the invoice
   - **Example**: `Invoice for Order #35467 - January 2026`
   - **Example**: `Monthly Service Invoice - December 2025`
   - From the screenshot: `tuyil`

**Best Practice**: Use descriptive subjects that help customers identify the invoice purpose:
- Include order numbers, project names, or service periods
- Avoid generic subjects like "Invoice" or "Payment Due"

---

## Phase 3: Itemization and Stock Validation

### Step 3.1: Adding Items to Invoice

**Section**: Item Table

**Action**: Add products or services to the invoice

1. Locate the **Item Details** section in the invoice form
2. Click in the first row of the item table or click **+ Add Item**
3. Select or search for the item:
   - Begin typing the item name
   - Select from the dropdown suggestions
   - **Examples from screenshots**: `hsl`, `white`

---

### Step 3.2: Item Configuration

**Action**: Configure item details for each line

For each item added, verify/enter:

1. **Item Name/Description**:
   - Select from inventory or type description for non-inventory items
   - Must be valid inventory item or properly formatted description

2. **Quantity**:
   - Enter the number of units to invoice
   - **Example**: `5`, `10.5`, `100`

3. **Rate**:
   - Unit price auto-populated from item master data
   - Can be modified if necessary
   - **Example**: `₹1,000.00`, `₹500.50`

4. **Account** (if applicable):
   - Select the appropriate accounting category
   - Usually auto-filled based on item configuration

5. **Tax**:
   - Select applicable tax rate (GST, VAT, etc.)
   - Multiple tax options available based on configuration

---

### Step 3.3: Stock Availability Check

**Critical Validation**: Real-time stock verification

**Visual Indicators**:
- **Stock on Hand**: Displayed next to each item
  - **Example from screenshot**: `0.00 cm` (out of stock)
  - **Example**: `150 units` (sufficient stock)

**Interpretation**:
- ✓ **Green/Sufficient**: Stock available, proceed normally
- ⚠️ **Yellow/Low**: Stock below reorder level, warning may appear
- ✗ **Red/Zero**: Out of stock, warning will appear during save

**Action**:
- Review stock levels for each item
- Note any items showing zero or low stock
- Prepare for stock validation warnings in Phase 4

---

### Step 3.4: Financial Calculations

**Section**: Financial Summary (typically right side or bottom)

**Automatic Calculations**: The system calculates:

1. **Sub Total**: Sum of all line items (Quantity × Rate)
   - Auto-calculated as items are added

2. **Discount**:
   - Can be applied as percentage or fixed amount
   - Options: Line-item discount or invoice-level discount
   - **Example**: `10%` or `₹500`

3. **Tax Treatment**:
   - **TDS (Tax Deducted at Source)**: If applicable to the transaction
   - **TCS (Tax Collected at Source)**: If applicable
   - Select appropriate tax type from dropdown

4. **Tax Amount**:
   - Calculated based on tax rates applied to line items
   - Displayed separately in summary

5. **Total Amount**:
   - Final invoice amount after discounts and taxes
   - **Example from screenshot**: `₹ 0.00` (no items added yet)

**Verification**: Always review the total amount before saving

---

## Phase 4: Validation and Error Handling

### Step 4.1: Initiate Save Process

**Action**: Attempt to save and send the invoice

1. Review all entered information for accuracy
2. Click the **Save and Send** button (primary blue button)

**System Response**: Zoho Inventory performs real-time validation checks

---

### Step 4.2: Mandatory Field Validation

**Error Type**: Missing or Invalid Required Fields

**Common Error Message**:
```
"Enter the valid item name or description."
```

**Trigger Conditions**:
- Item field left blank
- Invalid item name entered
- Item description not properly formatted
- Incomplete line items in the table

**Resolution Steps**:

1. **Identify the Error**:
   - Error message appears at the top of the screen (typically in red/orange banner)
   - Problematic fields may be highlighted in red

2. **Correct the Issue**:
   - For blank item fields: Delete the empty row or add a valid item
   - For invalid items: Select from the inventory dropdown or enter proper description
   - For incomplete data: Fill in all required fields (Quantity, Rate)

3. **Re-validate**:
   - Click **Save and Send** again after corrections
   - Ensure all errors are resolved

**Prevention**:
- Remove empty rows before saving
- Always select items from dropdown rather than typing manually
- Complete all fields before moving to the next line

---

### Step 4.3: Stock Availability Warning

**Error Type**: Inventory Stock Alert

**Warning Message**:
```
"The following items will go out of stock...
Are you sure about this?"
```

**Trigger Condition**:
- One or more items have insufficient stock to fulfill the invoice
- Current stock on hand is zero or less than requested quantity

**Items Affected** (Examples from analysis):
- Items showing "0.00 cm" stock
- Items where Quantity requested > Stock on Hand

---

### Step 4.4: Stock Warning Resolution Options

**Decision Point**: System presents three action options

#### Option 1: Proceed (Create Invoice Despite Stock Issue)

**Button**: "Proceed" or "Yes, Continue"

**Action**: Creates invoice even with insufficient stock

**Consequences**:
- Invoice is created and inventory goes negative
- Stock on hand shows negative balance
- May trigger backorder or stockout alerts
- Purchasing team notified to replenish stock

**When to Use**:
- Drop-shipping arrangements (stock not held physically)
- Stock incoming with confirmed delivery
- Customer agreed to wait for stock
- Made-to-order or custom items

---

#### Option 2: Remove and Save (Remove Out-of-Stock Items)

**Button**: "Remove and Save" or "Remove Items"

**Action**: Automatically removes out-of-stock items and saves invoice

**Process**:
1. System identifies all items with insufficient stock
2. Removes those items from the invoice
3. Recalculates totals without the removed items
4. Saves the invoice with remaining items only

**Consequences**:
- Invoice created with partial order
- Customer receives incomplete order
- Removed items must be invoiced separately later

**When to Use**:
- Partial fulfillment is acceptable
- Customer agreed to receive available items first
- Remaining items to be supplied later via separate invoice

---

#### Option 3: Cancel (Return to Editing)

**Button**: "Cancel" or "Go Back"

**Action**: Returns to invoice editing screen without saving

**Process**:
1. Warning dialog closes
2. Returns to invoice form with all data intact
3. Allows editing of quantities or items

**When to Use**:
- Need to adjust quantities to match available stock
- Want to substitute with alternative items
- Need to consult with customer before proceeding
- Checking stock in other locations

**Recommended Actions After Canceling**:
- Reduce quantities to match available stock
- Replace out-of-stock items with alternatives
- Split order across multiple invoices
- Coordinate with warehouse for stock availability

---

### Step 4.5: Post-Validation Actions

**After Successful Validation**:

1. **Invoice Saved**:
   - System assigns final invoice number
   - Invoice status set to "Draft" or "Sent" (depending on action)

2. **Email Preparation**:
   - If "Save and Send" selected, email compose window appears
   - Subject line pre-populated from invoice subject
   - Customer email auto-filled from customer record
   - Invoice PDF attached automatically

3. **Inventory Update**:
   - Stock levels decreased by invoiced quantities
   - Transaction recorded in inventory movement log

4. **Accounting Entry**:
   - Accounts receivable entry created
   - Sales revenue recorded
   - Tax liability recorded (if applicable)

---

## Phase 5: Finalization and Sending

### Step 5.1: Email Customization (If Sending Immediately)

**Screen**: Email Invoice Window

**Action**: Customize the email before sending

1. **To**: Customer email (pre-filled, can add additional recipients)
2. **CC/BCC**: Add additional recipients if needed
3. **Subject**: Review and modify if necessary
4. **Email Body**:
   - Default template loads automatically
   - Customize message as needed
   - Add personal notes or payment instructions

5. **Attachments**:
   - Invoice PDF attached by default
   - Add additional documents if required

---

### Step 5.2: Send or Save as Draft

**Options**:

**Option A: Send Immediately**
- Click **Send** button
- Email sent to customer instantly
- Invoice status changes to "Sent"
- Confirmation message appears

**Option B: Save as Draft**
- Click **Save as Draft** instead of "Save and Send"
- Invoice saved but not sent
- Status remains "Draft"
- Can be edited and sent later from invoice list

---

### Step 5.3: Post-Send Verification

**Recommended Checks**:

1. **Confirmation Message**:
   - Verify success notification appears
   - Note the invoice number assigned

2. **Invoice List**:
   - Navigate to Invoices list
   - Verify new invoice appears with correct status

3. **Email Verification**:
   - Check sent items for email confirmation
   - Verify customer received the email (if possible)

4. **Inventory Check**:
   - Review stock levels updated correctly
   - Verify negative stock alerts if applicable

---

## Best Practices

### Data Entry Best Practices

1. **Double-Check Customer Information**:
   - Verify correct customer selected
   - Confirm billing/shipping addresses are current
   - Update customer records if information changed

2. **Accurate Item Selection**:
   - Always use item search/dropdown rather than typing
   - Verify item codes match physical products
   - Check pricing against current rate cards

3. **Stock Awareness**:
   - Review stock levels before invoicing
   - Coordinate with warehouse for large orders
   - Set up low-stock alerts to prevent overselling

4. **Clear Communication**:
   - Use descriptive subject lines
   - Add notes or special instructions in invoice notes section
   - Include payment terms and due dates clearly

---

### Workflow Optimization

1. **Template Usage**:
   - Create invoice templates for recurring customers
   - Use recurring invoice feature for subscriptions
   - Save common item bundles for quick selection

2. **Bulk Operations**:
   - Create multiple invoices from sales orders in batch
   - Use import features for high-volume invoicing
   - Leverage automation for routine invoices

3. **Integration**:
   - Link invoices to sales orders for traceability
   - Connect with payment gateways for online payments
   - Integrate with accounting software for seamless posting

---

### Compliance and Accuracy

1. **Tax Compliance**:
   - Verify correct tax rates applied
   - Ensure TDS/TCS correctly configured
   - Maintain tax exemption certificates where applicable

2. **Audit Trail**:
   - Always link invoices to source documents (orders, contracts)
   - Maintain notes for non-standard pricing or discounts
   - Document reasons for negative stock approvals

3. **Data Validation**:
   - Implement approval workflows for high-value invoices
   - Set up alerts for unusual discounts or pricing
   - Regular reconciliation of invoices vs. inventory movements

---

## Troubleshooting

### Common Issues and Solutions

#### Issue 1: "Customer Name Required" Error

**Problem**: Unable to save invoice without customer selection

**Solution**:
- Ensure a customer is selected from the dropdown
- If customer doesn't exist, create new customer record first
- Check if customer is marked as active (inactive customers may not appear)

---

#### Issue 2: Items Not Appearing in Search

**Problem**: Cannot find items when searching in item field

**Solution**:
- Verify items are marked as "Active" in item master
- Check if items have sales information configured
- Ensure items are assigned to the correct organization/location
- Try searching by item code instead of name

---

#### Issue 3: Incorrect Stock Levels Displayed

**Problem**: Stock on hand shows incorrect quantities

**Solution**:
- Refresh the page to get latest stock data
- Check if other users have pending transactions
- Verify stock adjustments have been properly posted
- Review inventory movements for the item
- Ensure correct location selected in invoice

---

#### Issue 4: Tax Not Calculating Correctly

**Problem**: Tax amount showing as zero or incorrect

**Solution**:
- Verify tax rates configured for the customer's location
- Check if items have correct tax preferences assigned
- Confirm customer tax treatment settings
- Review TDS/TCS applicability and thresholds
- Ensure tax effective dates are current

---

#### Issue 5: Cannot Send Email

**Problem**: Email fails to send after invoice creation

**Solution**:
- Check customer email address format is valid
- Verify email integration settings in Zoho Inventory
- Check if daily email limit has been reached
- Test SMTP settings if using custom email server
- Save as draft and send manually if integration fails

---

#### Issue 6: Invoice Number Sequence Broken

**Problem**: Invoice numbers skipping or duplicating

**Solution**:
- Check invoice number settings in preferences
- Verify no manual overrides causing conflicts
- Review deleted invoices (numbers may be reserved)
- Contact Zoho support if sequence cannot be fixed
- Document gap with explanation for auditors

---

#### Issue 7: Negative Stock Not Allowed

**Problem**: System prevents saving invoice when stock insufficient (stricter settings)

**Solution**:
- Adjust inventory settings to allow negative stock (if appropriate)
- Reduce invoice quantities to match available stock
- Transfer stock from other locations first
- Create stock adjustment to reflect incoming stock
- Save as draft and complete after stock replenishment

---

#### Issue 8: Discount Not Applying

**Problem**: Discount entered but not reflecting in total

**Solution**:
- Verify discount field accepts the format entered (% vs. fixed amount)
- Check if discount exceeds maximum allowed discount limits
- Ensure discount approval workflow isn't blocking the transaction
- Apply discount at line level instead of invoice level (or vice versa)
- Refresh calculation by editing and re-entering discount

---

## Summary Checklist

Before clicking "Save and Send", verify:

- ☐ Correct customer selected
- ☐ Invoice number confirmed
- ☐ Order reference number entered (if applicable)
- ☐ Appropriate location selected
- ☐ Payment terms configured
- ☐ Salesperson assigned (if required)
- ☐ Subject line descriptive and clear
- ☐ All items properly selected from inventory
- ☐ Quantities accurate
- ☐ Rates/prices correct
- ☐ Stock availability verified
- ☐ Discounts applied correctly
- ☐ Tax treatment selected (TDS/TCS)
- ☐ Total amount reviewed and approved
- ☐ Customer email address verified
- ☐ Ready to handle stock warnings if they appear

---

## Appendix: Field Reference

### Required Fields (Cannot save without these)

| Field | Description | Example |
|-------|-------------|---------|
| Customer Name | Customer receiving the invoice | Mr. Mohammad Zaheer |
| Invoice Date | Date of invoice issuance | 14-01-2026 |
| Item Name/Description | Products or services being invoiced | hsl, white |
| Quantity | Number of units | 5, 10.5 |
| Rate | Price per unit | ₹1,000.00 |

### Optional But Recommended Fields

| Field | Description | Example |
|-------|-------------|---------|
| Order Number | Reference to sales order | 35467 |
| Salesperson | Sales representative | John Smith |
| Subject | Email subject line | Invoice for Order #35467 |
| Payment Terms | When payment is due | Due on Receipt, Net 15 |
| Notes | Additional information | Thank you for your business |

---

## Document Control

**Document Version**: 1.0
**Last Updated**: 2026-01-14
**Author**: ERP Implementation Specialist
**Review Cycle**: Quarterly
**Next Review**: 2026-04-14

---

## Additional Resources

- Zoho Inventory Official Documentation: https://www.zoho.com/inventory/help/
- Zoho Support Portal: https://help.zoho.com/portal/en/community/zoho-inventory
- Video Tutorials: Available in Zoho Inventory Help Center
- Training Webinars: Check Zoho website for scheduled sessions

---

*End of Tutorial*
