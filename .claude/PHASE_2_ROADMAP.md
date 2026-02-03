# Phase 2 Roadmap — 2XG ERP System

> Generated: Feb 2026 | Based on: Phase 1 audit of 28 backend services, 42+ frontend pages, 10 agents

---

## Phase 1 Summary (Current State)

### Completed
- 15+ fully implemented CRUD modules (Items, Vendors, Customers, Expenses, Bills, Sales Orders, Invoices, Purchase Orders, Payments Made/Received, Vendor Credits, Delivery Challans, Transfer Orders, POS, Reports, Tasks, Search, AI Insights)
- Custom JWT authentication system
- Self-hosted Coolify deployment pipeline (auto-deploy on main push)
- Self-hosted Supabase (PostgreSQL + PostgREST + Kong)
- 10 specialized Claude Code agents with orchestration

### Gaps Identified
- CARE, CRM, Logistics modules are stubs
- No automated testing (unit, integration, e2e)
- No audit logging or activity trail
- No RLS (Row-Level Security) — everything uses service role key
- No notifications (email, in-app)
- No role-based access control on frontend routes
- No data export/import beyond items CSV
- No recurring transactions (expenses, invoices)
- POS module is basic (no offline, no receipt printing)
- Reports limited to dashboard widgets

---

## Phase 2 Scope

### P2.1 — Complete Stub Modules

#### 1. CARE Module (Customer Service & Support)
**Backend**: `backend/src/services/care.service.ts` (currently basic)
- Service ticket CRUD with status workflow: `open → in_progress → waiting → resolved → closed`
- Ticket categories: billing, shipping, product, return, general
- SLA tracking: response time, resolution time
- Ticket assignment to support staff
- Customer communication log (notes per ticket)
- Ticket priority: low, medium, high, urgent
- Dashboard: open tickets count, avg resolution time, SLA breaches

**Database tables needed**:
```sql
service_tickets (id, ticket_number, customer_id, category, priority, status, subject, description, assigned_to, sla_response_due, sla_resolution_due, resolved_at, created_at, updated_at)
ticket_comments (id, ticket_id, user_id, comment, is_internal, created_at)
ticket_attachments (id, ticket_id, file_url, file_name, created_at)
```

**Frontend pages**:
- `/care` — Dashboard with ticket metrics
- `/care/tickets` — Ticket list with filters (status, priority, assignee)
- `/care/tickets/new` — Create ticket
- `/care/tickets/:id` — Ticket detail with comment thread
- `/care/sla-report` — SLA compliance report

#### 2. CRM Module (Customer Relationship Management)
**Backend**: `backend/src/services/crm.service.ts` (currently basic reporting only)
- Lead CRUD with pipeline stages: `new → contacted → qualified → proposal → negotiation → won → lost`
- Lead source tracking: website, referral, cold-call, social, event
- Activity logging: calls, emails, meetings, notes
- Deal/opportunity tracking with expected revenue
- Pipeline dashboard with stage conversion rates
- Lead assignment to sales reps

**Database tables needed**:
```sql
leads (id, lead_name, company_name, email, phone, source, stage, assigned_to, expected_value, expected_close_date, notes, created_at, updated_at)
lead_activities (id, lead_id, user_id, activity_type, subject, description, activity_date, created_at)
deals (id, lead_id, deal_name, value, stage, probability, expected_close_date, closed_date, closed_reason, created_at, updated_at)
```

**Frontend pages**:
- `/crm` — Pipeline dashboard (Kanban board view)
- `/crm/leads` — Lead list with stage filters
- `/crm/leads/new` — Create lead
- `/crm/leads/:id` — Lead detail with activity timeline
- `/crm/deals` — Deals list with revenue forecast
- `/crm/reports` — Conversion funnel, revenue forecast

#### 3. Logistics Module (Shipping & Delivery)
**Backend**: `backend/src/services/logistics.service.ts` (currently basic)
- Shipment tracking with carrier integration fields
- Route planning (origin, destination, waypoints)
- Delivery status updates with timestamps
- Driver/carrier management
- Shipping cost tracking
- Warehouse management (multiple locations)

**Database tables needed**:
```sql
shipments (id, shipment_number, delivery_challan_id, carrier_name, tracking_number, origin, destination, status, estimated_delivery, actual_delivery, shipping_cost, created_at, updated_at)
carriers (id, carrier_name, contact_person, phone, email, service_type, is_active, created_at)
warehouses (id, warehouse_name, address, city, state, manager_id, is_active, created_at)
warehouse_stock (id, warehouse_id, item_id, quantity, bin_location, created_at, updated_at)
```

**Frontend pages**:
- `/logistics` — Shipment dashboard with map view
- `/logistics/shipments` — Shipment list with status filters
- `/logistics/shipments/:id` — Shipment detail with tracking timeline
- `/logistics/carriers` — Carrier management
- `/logistics/warehouses` — Warehouse management with stock levels

---

### P2.2 — Role-Based Access Control (RBAC)

#### Backend
- Define roles: `admin`, `manager`, `accountant`, `sales`, `warehouse`, `support`, `viewer`
- Create `roles` and `role_permissions` tables
- Add auth middleware that checks permissions per route
- Each API endpoint tagged with required permission

```sql
roles (id, role_name, description, created_at)
role_permissions (id, role_id, resource, action, created_at)
-- resource: 'items', 'expenses', 'sales-orders', etc.
-- action: 'read', 'create', 'update', 'delete', 'approve'
```

#### Frontend
- Route-level guards based on user role
- Component-level visibility (hide edit/delete buttons for viewers)
- Navigation filtered by role permissions
- Settings page for admin to manage roles

#### Implementation approach
1. Add `role_id` FK to `users` table
2. Create permission checking middleware: `requirePermission('items', 'create')`
3. Wrap existing routes with permission middleware
4. Frontend: Add `usePermission('items', 'create')` hook
5. Filter sidebar navigation based on permissions

---

### P2.3 — Audit Logging & Activity Trail

Track all data mutations for compliance and debugging.

```sql
audit_logs (
  id UUID PRIMARY KEY,
  user_id UUID,
  user_email TEXT,
  action TEXT,           -- 'create', 'update', 'delete', 'login', 'logout'
  resource_type TEXT,    -- 'item', 'expense', 'invoice', etc.
  resource_id UUID,
  old_data JSONB,        -- Previous state (for updates/deletes)
  new_data JSONB,        -- New state (for creates/updates)
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
)
```

**Backend**:
- Create audit middleware that auto-logs service operations
- Wrap each service method with audit decorator
- Log auth events (login, logout, failed attempts)

**Frontend**:
- `/settings/audit-log` — Searchable audit log for admins
- Filter by user, resource type, action, date range
- Activity timeline on entity detail pages

---

### P2.4 — Notifications System

#### In-App Notifications
```sql
notifications (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  message TEXT,
  type TEXT,             -- 'info', 'warning', 'success', 'error'
  resource_type TEXT,
  resource_id UUID,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
)
```

**Trigger events**:
- Low stock alerts (item.current_stock <= item.reorder_point)
- Expense pending approval
- New CARE ticket assigned
- Invoice payment received
- PO delivered
- SLA breach warning

**Frontend**:
- Bell icon in header with unread count badge
- Notification dropdown panel
- Notification preferences page
- Mark as read / dismiss functionality

#### Email Notifications (Phase 2 stretch)
- Use Supabase Edge Functions or external SMTP
- Configurable per-user email preferences
- Invoice PDF email to customers
- Daily summary digest for managers

---

### P2.5 — Enhanced Reporting & Analytics

#### New Report Types
1. **Profit & Loss Statement** — Revenue vs expenses over period
2. **Balance Sheet Snapshot** — Assets, liabilities, equity
3. **Cash Flow Report** — Money in vs money out
4. **Accounts Receivable Aging** — Overdue invoices by 30/60/90+ days
5. **Accounts Payable Aging** — Overdue bills by 30/60/90+ days
6. **Inventory Valuation** — Stock value by cost/selling price
7. **Sales by Customer** — Revenue breakdown per customer
8. **Purchase by Vendor** — Spend breakdown per vendor
9. **Tax Summary** — GST/tax collected and paid
10. **Employee Performance** — Tasks completed, tickets resolved

#### Implementation
- Create `backend/src/services/reports.service.ts` with aggregation queries
- Add report generation endpoints
- Frontend: `/reports/:reportType` with date range, grouping filters
- PDF export for each report (extend existing pdfGenerators)
- Chart visualizations using Recharts

---

### P2.6 — Data Import/Export

#### Import
- CSV import for: customers, vendors, expenses, invoices, bills
- Template download for each entity
- Validation preview before import
- Error report for failed rows

#### Export
- CSV export for all list views
- PDF export for detail pages and reports
- Excel export (using xlsx library) for financial reports
- Bulk PDF generation for invoices

---

### P2.7 — Recurring Transactions

#### Recurring Expenses
```sql
recurring_expenses (
  id UUID PRIMARY KEY,
  expense_template JSONB,   -- Template data for generating expense
  frequency TEXT,            -- 'daily', 'weekly', 'monthly', 'quarterly', 'yearly'
  next_occurrence DATE,
  end_date DATE,
  is_active BOOLEAN DEFAULT TRUE,
  last_generated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
)
```

#### Recurring Invoices
```sql
recurring_invoices (
  id UUID PRIMARY KEY,
  invoice_template JSONB,
  frequency TEXT,
  next_occurrence DATE,
  end_date DATE,
  customer_id UUID,
  is_active BOOLEAN DEFAULT TRUE,
  last_generated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
)
```

- Cron job or Supabase Edge Function to generate transactions on schedule
- Dashboard widget showing upcoming recurring items
- Manage page to view/edit/pause/cancel recurring rules

---

### P2.8 — POS Enhancements

Current POS is basic. Phase 2 additions:
- **Receipt printing** — Thermal printer support via browser print API
- **Barcode scanning** — Camera-based or USB scanner input
- **Customer lookup** — Quick search during checkout
- **Discount management** — Percentage or fixed amount discounts
- **Tax calculation** — GST/tax auto-calculation
- **Payment methods** — Cash, card, UPI, split payment
- **Offline mode** — Service worker for offline capability, sync on reconnect
- **Shift management** — Open/close shifts with cash reconciliation
- **Daily sales summary** — Auto-generated end-of-day report

---

### P2.9 — Automated Testing

#### Backend Testing
- **Framework**: Jest + Supertest
- **Scope**: Unit tests for services, integration tests for API endpoints
- **Coverage target**: 70% for services, 50% for controllers

```
backend/
├── src/
└── tests/
    ├── unit/
    │   ├── services/
    │   │   ├── items.service.test.ts
    │   │   ├── expenses.service.test.ts
    │   │   └── ...
    │   └── utils/
    └── integration/
        ├── items.api.test.ts
        ├── auth.api.test.ts
        └── ...
```

#### Frontend Testing
- **Framework**: Vitest + React Testing Library
- **Scope**: Component rendering, form submission, API integration
- **Coverage target**: 60% for components

```
frontend/
├── src/
└── tests/
    ├── components/
    │   ├── items/ItemsList.test.tsx
    │   └── ...
    └── services/
        └── items.service.test.ts
```

#### E2E Testing (Phase 2 stretch)
- **Framework**: Playwright
- **Critical paths**: Login → Create item → Create invoice → Record payment

---

### P2.10 — Performance & Infrastructure

#### Database Indexes
Add indexes for commonly filtered columns:
```sql
CREATE INDEX idx_expenses_date ON expenses(expense_date);
CREATE INDEX idx_expenses_status ON expenses(status);
CREATE INDEX idx_items_sku ON items(sku);
CREATE INDEX idx_items_active ON items(is_active);
CREATE INDEX idx_invoices_customer ON invoices(customer_id);
CREATE INDEX idx_invoices_date ON invoices(invoice_date);
CREATE INDEX idx_sales_orders_status ON sales_orders(status);
```

#### API Response Caching
- Add Redis or in-memory cache for read-heavy endpoints (dashboard metrics, reports)
- Cache invalidation on data mutations

#### Frontend Performance
- Code splitting per route (React.lazy + Suspense)
- Image optimization pipeline
- Service worker for asset caching
- Bundle size analysis and optimization

---

## Priority Matrix

| Item | Impact | Effort | Priority |
|------|--------|--------|----------|
| P2.1 Complete CARE module | High | Medium | 1 |
| P2.1 Complete CRM module | High | Medium | 2 |
| P2.2 RBAC | Critical | High | 3 |
| P2.3 Audit logging | High | Medium | 4 |
| P2.4 In-app notifications | High | Medium | 5 |
| P2.5 Enhanced reporting | High | High | 6 |
| P2.1 Complete Logistics module | Medium | Medium | 7 |
| P2.9 Backend testing | High | High | 8 |
| P2.6 Data import/export | Medium | Medium | 9 |
| P2.8 POS enhancements | Medium | High | 10 |
| P2.7 Recurring transactions | Medium | Medium | 11 |
| P2.10 Performance optimization | Medium | Medium | 12 |
| P2.9 Frontend testing | Medium | High | 13 |
| P2.4 Email notifications | Low | High | 14 |
| P2.9 E2E testing | Low | High | 15 |

---

## Implementation Order (Recommended)

### Sprint 1: Foundation
1. CARE module (complete stub → full implementation)
2. CRM module (complete stub → full pipeline)
3. RBAC backend middleware + roles table

### Sprint 2: Security & Compliance
4. RBAC frontend integration (route guards, permission hooks)
5. Audit logging middleware + UI
6. In-app notifications system

### Sprint 3: Business Intelligence
7. Enhanced reporting (P&L, aging, inventory valuation)
8. Data export (CSV, PDF for all modules)
9. Data import (CSV for customers, vendors, expenses)

### Sprint 4: Operations
10. Logistics module (complete stub)
11. Recurring transactions (expenses + invoices)
12. POS enhancements (receipts, barcode, discounts)

### Sprint 5: Quality & Performance
13. Backend test suite (Jest + Supertest)
14. Frontend test suite (Vitest + RTL)
15. Performance optimization (indexes, caching, code splitting)

---

## Agent Assignments for Phase 2

| Task | Primary Agent | Support Agents |
|------|--------------|----------------|
| CARE/CRM/Logistics modules | Module Generator | Backend Dev, Frontend Dev, Database Architect |
| RBAC system | Backend Dev | Database Architect, Frontend Dev |
| Audit logging | Backend Dev | Database Architect |
| Notifications | Backend Dev + Frontend Dev | Database Architect |
| Enhanced reporting | Backend Dev | Database Architect, Frontend Dev |
| Import/Export | Backend Dev + Frontend Dev | — |
| POS enhancements | Frontend Dev | Backend Dev |
| Testing | Backend Dev + Frontend Dev | — |
| Performance | DevOps Engineer | Backend Dev, Frontend Dev |
| PR Review | PR Review Agent | All agents (gatekeeper) |

---

## Database Schema Additions Summary

Phase 2 adds approximately 12 new tables:
```
service_tickets, ticket_comments, ticket_attachments
leads, lead_activities, deals
carriers, warehouses, warehouse_stock
roles, role_permissions, audit_logs
notifications
recurring_expenses, recurring_invoices
```

All DDL changes must:
1. Be documented in `backend/src/utils/database-schema.sql`
2. End with `NOTIFY pgrst, 'reload schema'`
3. Include rollback SQL
4. Be reviewed by Database Architect agent before execution

---

## Success Metrics for Phase 2

| Metric | Target |
|--------|--------|
| Module coverage | 100% (all stubs completed) |
| RBAC implemented | All 24 API routes protected |
| Audit log coverage | 100% of data mutations logged |
| Test coverage (backend) | 70% services, 50% controllers |
| Report types | 10+ report types available |
| Notification events | 8+ trigger types active |
| Build time | < 60s for both backend and frontend |
| API response time (p95) | < 500ms for list endpoints |
