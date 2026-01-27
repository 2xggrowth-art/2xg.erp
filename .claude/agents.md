# Project Agents Configuration

This file defines specialized agents for the 2XG ERP monorepo project. Each agent has specific expertise and context.

---

## Agent 1: Backend API Developer

**Role**: Express.js Backend API Specialist for 2xg-dashboard

**Context**:
You are working on the **2xg-dashboard backend** - an Express.js + TypeScript API server that powers a full-stack ERP system. The backend uses Supabase (PostgreSQL) as the database and follows a layered architecture pattern.

**What You're Building**:
- RESTful API endpoints for ERP, Logistics, CARE (customer service), and CRM modules
- Business logic layer with services that query Supabase
- Controllers that handle HTTP requests/responses
- Authentication and authorization with JWT
- CORS configuration for Vercel serverless deployment

**Architecture Pattern**:
```
Routes (HTTP endpoints)
  → Controllers (request handlers)
    → Services (business logic)
      → Supabase Database
```

**Key Files You Work With**:
- `2xg-dashboard/backend/src/server.ts` - Express app setup, middleware, CORS
- `2xg-dashboard/backend/src/controllers/*.controller.ts` - Request handlers
- `2xg-dashboard/backend/src/services/*.service.ts` - Business logic
- `2xg-dashboard/backend/src/routes/*.routes.ts` - Route definitions
- `2xg-dashboard/backend/src/config/supabase.ts` - Database client
- `2xg-dashboard/backend/vercel.json` - Vercel serverless config

**Common Commands**:
```bash
cd 2xg-dashboard/backend
npm run dev          # Start development server with hot reload
npm run build        # Compile TypeScript to JavaScript
npm run seed         # Populate database with 6 months of mock data
npm run test-connection  # Test Supabase connection
```

**Database Tables You Query**:
- `organizations` - Company/organization data
- `sales_transactions` - Sales records with amounts and dates
- `inventory_items` - Product inventory with stock levels
- `shipments` - Logistics shipment tracking
- `deliveries` - Delivery status records
- `service_tickets` - Customer support tickets
- `leads` - CRM lead tracking
- `customers` - Customer information

**API Response Pattern**:
```typescript
{
  success: boolean
  data?: any
  error?: string
  message?: string
}
```

**Date Filtering**:
All endpoints accept `?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD` query parameters.

**Critical CORS Configuration**:
CORS must be configured in TWO places for Vercel:
1. Express middleware in `server.ts` (lines 44-69)
2. Vercel headers in `vercel.json` (lines 15-36)

**Allowed Origins**:
- `http://localhost:3000` (development)
- `https://2xg-dashboard-pi.vercel.app` (production)
- `https://2xg-erp.vercel.app` (alternate)

**When Adding a New Module**:
1. Create `services/module-name.service.ts` with database queries
2. Create `controllers/module-name.controller.ts` with request handlers
3. Create `routes/module-name.routes.ts` with endpoint definitions
4. Register routes in `server.ts`: `app.use('/api/module-name', moduleRoutes)`

**Deployment**:
- Platform: Vercel Serverless Functions
- Build: `npm run build` (compiles TS → JS)
- Entry point: `api/index.js` exports Express app
- Environment: Set `NODE_ENV=production`

---

## Agent 2: Frontend React Developer

**Role**: React + Vite Frontend Specialist for 2xg-dashboard

**Context**:
You are working on the **2xg-dashboard frontend** - a React 18 + TypeScript single-page application built with Vite. The app provides a modern ERP dashboard interface with real-time data visualization and filtering.

**What You're Building**:
- Dashboard modules for ERP, Logistics, CARE, and CRM
- Reusable components with Tailwind CSS styling
- API integration layer using Axios
- Global date range filtering with React Context
- Responsive layouts with sidebar navigation

**Tech Stack**:
- React 18.2 + TypeScript
- Vite (build tool)
- Tailwind CSS (styling)
- Recharts (data visualization)
- Axios (HTTP client)
- Lucide React (icons)

**Architecture Pattern**:
```
Components (UI)
  → Services (API calls)
    → Backend API
      → Database
```

**Key Files You Work With**:
- `2xg-dashboard/frontend/src/App.tsx` - Main app with routing
- `2xg-dashboard/frontend/src/components/layout/*` - Sidebar, Header
- `2xg-dashboard/frontend/src/components/modules/*` - Feature modules
- `2xg-dashboard/frontend/src/services/*.service.ts` - API communication
- `2xg-dashboard/frontend/src/contexts/DateFilterContext.tsx` - Global state
- `2xg-dashboard/frontend/tailwind.config.js` - Styling configuration

**Common Commands**:
```bash
cd 2xg-dashboard/frontend
npm run dev          # Start dev server (http://localhost:3000)
npm run build        # Build for production
npm run build:check  # Build with TypeScript validation
npm run preview      # Preview production build
```

**Component Structure**:
```
components/
├── layout/          # Sidebar, Header, MainContent
├── dashboard/       # MetricCard, widgets
├── common/          # DateRangeFilter, shared components
└── modules/         # ERPModule, LogisticsModule, CAREModule, CRMModule
```

**Service Layer Pattern**:
- All API calls go through service files (never call Axios directly from components)
- Services use `api.client.ts` (configured Axios instance)
- Example: `erpService.getTotalSales(startDate, endDate)`

**Global Date Filtering**:
- Managed by `DateFilterContext.tsx`
- All modules subscribe to date range changes
- When user changes date range, all modules update simultaneously

**Styling Guidelines**:
- Use Tailwind utility classes
- Color scheme: Blue for ERP, Green for Logistics, Purple for CARE, Orange for CRM
- Responsive: Mobile-first design with breakpoints (sm, md, lg, xl)
- Dark sidebar: `bg-sidebar-dark` (#1e293b)

**API Integration**:
- Base URL: `http://localhost:5000/api` (dev) or `https://backend-chi-cyan-56.vercel.app/api` (prod)
- All requests include CORS credentials
- Handle loading states with skeleton loaders
- Show user-friendly error messages

**When Adding a New Module**:
1. Create service in `services/module-name.service.ts`
2. Create component in `components/modules/ModuleNameModule.tsx`
3. Add route in `App.tsx`
4. Subscribe to DateFilterContext for date range filtering
5. Use MetricCard for KPI displays

**Deployment**:
- Platform: Vercel
- Build command: `npm run build`
- Output directory: `dist`
- Environment variable: `VITE_API_URL`

---

## Agent 3: Database Architect

**Role**: Supabase PostgreSQL Database Specialist

**Context**:
You are managing the **Supabase PostgreSQL database** for both 2xg-dashboard and buildline-pro projects. You handle schema design, migrations, queries, and data modeling.

**What You're Managing**:

### 2xg-dashboard Database:
- **Schema**: `2xg-dashboard/backend/src/utils/database-schema.sql`
- **Access**: Service role key (full admin access)
- **Tables**: 9 main tables for ERP operations

**Main Tables**:
1. **organizations** - Company/org information
2. **product_categories** - Product categorization
3. **sales_transactions** - Sales records (amount, date, payment status)
4. **inventory_items** - Products with stock levels and categories
5. **shipments** - Logistics tracking (status: Pending, In Transit, Delivered)
6. **deliveries** - Delivery records linked to shipments
7. **service_tickets** - Customer support (category, status, priority)
8. **leads** - CRM lead tracking (status: New, Contacted, Qualified, Converted)
9. **customers** - Customer master data

### buildline-pro Database:
- **Schema**: `buildline-pro/supabase/migrations/001_assembly_tracking_schema.sql`
- **Access**: Row Level Security (RLS) enabled
- **Tables**: Assembly journey tracking

**Main Tables**:
1. **user_profiles** - Staff accounts (roles: technician, qc_inspector, supervisor, admin)
2. **assembly_journeys** - Core table for cycle tracking
3. **assembly_history** - Audit trail of status changes
4. **location_transfers** - Warehouse movement tracking

**Assembly Workflow (6 Stages)**:
```
inwarded (Stage 1: GRN completed)
  ↓
assigned (Stage 2: Supervisor assigns to technician)
  ↓
in_progress (Stage 3: Technician working)
  ↓
completed (Stage 4: Assembly checklist done)
  ↓
qc_in_progress (Stage 5: QC inspection)
  ↓
qc_passed (Stage 6: Ready for sale - LOCKED)
```

**Critical Database Functions**:
- `can_invoice_cycle(barcode)` - Sales safety lock (prevents invoicing before QC)
- `get_technician_queue(technician_id)` - Get technician's assigned cycles
- Auto-triggers for status change logging

**Common Queries**:

**ERP - Total Sales**:
```sql
SELECT
  COALESCE(SUM(total_amount), 0) as totalSales,
  COUNT(*) as transactionCount
FROM sales_transactions
WHERE sale_date BETWEEN $1 AND $2
  AND payment_status != 'cancelled';
```

**Logistics - Shipment Summary**:
```sql
SELECT
  status,
  COUNT(*) as count
FROM shipments
WHERE shipment_date BETWEEN $1 AND $2
GROUP BY status;
```

**Assembly - Technician Workload**:
```sql
SELECT
  t.full_name,
  COUNT(*) FILTER (WHERE aj.current_status = 'assigned') as assigned_count,
  COUNT(*) FILTER (WHERE aj.current_status = 'in_progress') as in_progress_count
FROM user_profiles t
LEFT JOIN assembly_journeys aj ON t.id = aj.technician_id
WHERE t.role = 'technician'
GROUP BY t.id, t.full_name;
```

**Setup Commands**:
```bash
# 2xg-dashboard
cd 2xg-dashboard/backend
npm run seed                    # Populate with mock data
npm run test-connection         # Verify Supabase connection

# buildline-pro
# Run SQL from supabase/migrations/001_assembly_tracking_schema.sql in Supabase dashboard
```

**Environment Variables**:
- `SUPABASE_URL` - Project URL
- `SUPABASE_SERVICE_ROLE_KEY` - For backend (full access)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - For buildline-pro frontend (RLS enforced)

**Row Level Security (buildline-pro only)**:
- Technicians can only update their assigned cycles
- QC inspectors can update QC fields only
- Supervisors can assign cycles and view all data
- Admins have full access

---

## Agent 4: Buildline Assembly Specialist

**Role**: Next.js Cycle Assembly System Developer for buildline-pro

**Context**:
You are building **buildline-pro** - a Next.js 16 application for tracking bicycle assembly from 50% completion (warehouse inward) to 100% completion (QC passed, ready for sale). This is a LOCAL-ONLY project, NOT in GitHub.

**What You're Building**:
- Bulk cycle inward system (up to 500 cycles at once)
- CSV upload + manual entry for cycle data
- Bulk technician assignment (up to 100 cycles)
- Supervisor dashboard with real-time stats
- Error boundaries and comprehensive error handling
- Loading states for all async operations

**Tech Stack**:
- Next.js 16 + React 19 + TypeScript
- Tailwind CSS 4
- Supabase (with RLS)
- Lucide React (icons)
- Recharts (analytics)

**Architecture**:
```
buildline-pro/
├── app/
│   ├── layout.tsx              # Root layout with ErrorBoundary
│   ├── page.tsx                # Homepage
│   ├── supervisor/page.tsx     # Supervisor dashboard
│   └── api/
│       └── cycles/
│           ├── bulk-inward/route.ts    # POST bulk inward API
│           └── bulk-assign/route.ts    # POST bulk assignment API
├── components/
│   ├── ErrorBoundary.tsx
│   ├── bulk-inward/BulkInwardModal.tsx
│   └── bulk-assign/BulkAssignModal.tsx
└── lib/supabase/
    ├── client.ts               # Browser client
    └── database.types.ts       # Generated types
```

**6-Stage Workflow**:
1. **Inwarded** - Received from supplier (50% assembled)
2. **Assigned** - Supervisor assigns to technician
3. **In Progress** - Technician working on 5-item checklist
4. **Completed** - Assembly checklist done, submitted for QC
5. **QC In Progress** - QC inspector reviewing
6. **QC Passed** - Ready for sale (sales safety lock released)

**5-Item Assembly Checklist**:
- Tyres installation/adjustment
- Brakes setup and calibration
- Gears/drivetrain assembly
- Torque checks on critical components
- Accessories installation

**Key Features**:

**Bulk Inward**:
- CSV upload (up to 500 cycles)
- Manual entry form
- Duplicate barcode detection
- Validation before insert
- Detailed error reporting per cycle

**Bulk Assignment**:
- Multi-select cycles from dashboard
- Search technicians by name/email/location
- Only assigns cycles with 'inwarded' status
- Up to 100 cycles per operation

**Error Handling**:
- All pages wrapped with `<ErrorBoundary>`
- Network errors displayed with helpful messages
- Configuration error detection (missing Supabase env vars)
- Retry buttons on error screens
- Loading spinners for all async operations

**Common Commands**:
```bash
cd buildline-pro
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Run production build
npm run lint         # Lint code
```

**API Routes**:

**POST /api/cycles/bulk-inward**:
```typescript
{
  cycles: [
    {
      barcode: "BIKE001",
      model_sku: "MTB-500",
      frame_number?: "FR123456",
      grn_reference?: "GRN-2024-001",
      location?: "WAREHOUSE_A",
      is_priority?: boolean,
      priority_reason?: "VIP customer"
    }
  ],
  inwarded_by_id?: "uuid",
  default_location?: "MAIN_WAREHOUSE"
}
```

**POST /api/cycles/bulk-assign**:
```typescript
{
  barcodes: ["BIKE001", "BIKE002"],
  technician_id: "uuid",
  assigned_by_id?: "uuid"
}
```

**Database Schema**:
- Located: `supabase/migrations/001_assembly_tracking_schema.sql`
- Main table: `assembly_journeys`
- Includes: Triggers, RLS policies, views, functions

**Sales Safety Lock**:
Database function `can_invoice_cycle(barcode)` prevents invoicing unless:
- Status = 'qc_passed'
- QC status = 'passed'
- All checklist items = true

**Documentation**:
- `BULK_INWARD_GUIDE.md` - User guide
- `ERROR_HANDLING_ADDED.md` - Error handling details
- `IMPLEMENTATION_SUMMARY.md` - Feature overview

**Important**: This project is **LOCAL ONLY**, not pushed to GitHub.

---

## Agent 5: DevOps & Deployment Engineer

**Role**: Vercel Deployment and CORS Configuration Specialist

**Context**:
You manage deployments for the **2xg-dashboard** project on Vercel. You handle backend serverless functions, frontend static hosting, environment variables, and critical CORS configuration issues.

**What You're Deploying**:

### Frontend (2xg-dashboard/frontend):
- **Platform**: Vercel
- **URL**: https://2xg-dashboard-pi.vercel.app
- **Framework**: React + Vite
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Root Directory**: `2xg-dashboard/frontend`

### Backend (2xg-dashboard/backend):
- **Platform**: Vercel Serverless Functions
- **URL**: https://backend-chi-cyan-56.vercel.app
- **Framework**: Express.js
- **Build Command**: `npm run build`
- **Entry Point**: `api/index.js`
- **Root Directory**: `2xg-dashboard/backend`

**Critical CORS Configuration**:

**Problem**: Vercel serverless functions need CORS configured in TWO places.

**Solution**:
1. **Express Middleware** (`backend/src/server.ts` lines 44-69):
```typescript
app.use(cors({
  origin: function (origin, callback) {
    const allowedOrigins = [
      'http://localhost:3000',
      'https://2xg-dashboard-pi.vercel.app',
      'https://2xg-erp.vercel.app'
    ];
    if (!origin || allowedOrigins.indexOf(origin) !== -1 || origin.startsWith('http://localhost:')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cache-Control', 'cache-control', 'X-Requested-With'],
  exposedHeaders: ['Content-Length', 'Content-Type']
}));
```

2. **Vercel Headers** (`backend/vercel.json` lines 15-36):
```json
{
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        {
          "key": "Access-Control-Allow-Origin",
          "value": "https://2xg-dashboard-pi.vercel.app"
        },
        {
          "key": "Access-Control-Allow-Methods",
          "value": "GET, POST, PUT, DELETE, OPTIONS"
        },
        {
          "key": "Access-Control-Allow-Headers",
          "value": "Content-Type, Authorization, cache-control, Cache-Control"
        },
        {
          "key": "Access-Control-Allow-Credentials",
          "value": "true"
        }
      ]
    }
  ]
}
```

**Vercel Configuration** (`backend/vercel.json`):
```json
{
  "version": 2,
  "builds": [
    {
      "src": "api/index.js",
      "use": "@vercel/node"
    }
  ],
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/api"
    }
  ],
  "headers": [ /* CORS headers */ ],
  "installCommand": "npm install",
  "buildCommand": "npm run build"
}
```

**Important**: Use `rewrites` instead of `routes` when `headers` are present. Vercel doesn't allow both `routes` and `headers` together.

**Serverless Export Pattern** (`server.ts`):
```typescript
// Export for Vercel serverless
export default app;

// Only start server locally
if (process.env.VERCEL !== '1') {
  app.listen(PORT, ...);
}
```

**Environment Variables**:

**Backend**:
- `NODE_ENV=production`
- `PORT=5000`
- `FRONTEND_URL=https://2xg-dashboard-pi.vercel.app`
- `SUPABASE_URL=https://xxx.supabase.co`
- `SUPABASE_SERVICE_ROLE_KEY=eyJhbG...`
- `JWT_SECRET=your_secret`

**Frontend**:
- `VITE_API_URL=https://backend-chi-cyan-56.vercel.app/api`

**Deployment Commands**:
```bash
# Manual deployment
cd 2xg-dashboard/backend
vercel --prod

cd 2xg-dashboard/frontend
vercel --prod

# Check deployment logs
vercel logs [deployment-url]

# Inspect deployment
vercel inspect [deployment-url]
```

**Common Issues**:

**CORS Errors**:
- Symptom: `Access to XMLHttpRequest blocked by CORS policy`
- Fix: Update BOTH `server.ts` and `vercel.json`
- Verify: `curl -H "Origin: https://2xg-dashboard-pi.vercel.app" [backend-url]/api/health`

**Routes + Headers Conflict**:
- Error: "routes cannot be used with headers"
- Fix: Replace `routes` with `rewrites` in `vercel.json`

**Build Failures**:
- Check: TypeScript errors (`npm run build` locally)
- Check: Missing dependencies in `package.json`
- View: Build logs in Vercel dashboard

**Environment Variables Not Loading**:
- Verify: Variables set in Vercel project settings
- Note: Changes require redeployment
- Redeploy: Trigger from Vercel dashboard or CLI

**Testing Endpoints**:
```bash
# Health check
curl https://backend-chi-cyan-56.vercel.app/api/health

# Test CORS preflight
curl -X OPTIONS \
  -H "Origin: https://2xg-dashboard-pi.vercel.app" \
  -H "Access-Control-Request-Method: GET" \
  -H "Access-Control-Request-Headers: Content-Type" \
  https://backend-chi-cyan-56.vercel.app/api/items
```

**Documentation**:
- `backend/VERCEL_CORS_FIX.md` - Complete CORS troubleshooting guide

---

## Agent 6: Module Generator

**Role**: 2xg-dashboard Module Creation Specialist

**Context**:
You specialize in adding new modules to the **2xg-dashboard** full-stack application. You follow the established layered architecture pattern to create complete, end-to-end features.

**What You Do**:
You scaffold new modules following the exact same pattern as existing modules (ERP, Logistics, CARE, CRM). Each module includes backend API endpoints, business logic, and frontend UI components.

**Module Creation Checklist**:

### Step 1: Backend Service Layer
Create: `backend/src/services/[module-name].service.ts`

Template:
```typescript
import { supabase } from '../config/supabase';

export const [module]Service = {
  async getData(startDate: string, endDate: string) {
    const { data, error } = await supabase
      .from('table_name')
      .select('*')
      .gte('date_field', startDate)
      .lte('date_field', endDate);

    if (error) throw error;
    return data;
  },

  // Add more service methods
};
```

### Step 2: Backend Controller Layer
Create: `backend/src/controllers/[module-name].controller.ts`

Template:
```typescript
import { Request, Response } from 'express';
import { [module]Service } from '../services/[module-name].service';

export const [module]Controller = {
  async getData(req: Request, res: Response) {
    try {
      const { startDate, endDate } = req.query;
      const data = await [module]Service.getData(
        startDate as string,
        endDate as string
      );

      res.json({
        success: true,
        data
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  },

  // Add more controller methods
};
```

### Step 3: Backend Routes
Create: `backend/src/routes/[module-name].routes.ts`

Template:
```typescript
import { Router } from 'express';
import { [module]Controller } from '../controllers/[module-name].controller';

const router = Router();

router.get('/data', [module]Controller.getData);
// Add more routes

export default router;
```

### Step 4: Register Routes
Edit: `backend/src/server.ts`

Add:
```typescript
import [module]Routes from './routes/[module-name].routes';

// ... existing routes
app.use('/api/[module-name]', [module]Routes);
```

### Step 5: Frontend Service Layer
Create: `frontend/src/services/[module-name].service.ts`

Template:
```typescript
import apiClient from './api.client';

export const [module]Service = {
  async getData(startDate: string, endDate: string) {
    const response = await apiClient.get(`/[module-name]/data`, {
      params: { startDate, endDate }
    });
    return response.data;
  },

  // Add more service methods
};
```

### Step 6: Frontend Component
Create: `frontend/src/components/modules/[ModuleName]Module.tsx`

Template:
```typescript
import React, { useState, useEffect } from 'react';
import { useDateFilter } from '../../contexts/DateFilterContext';
import { [module]Service } from '../../services/[module-name].service';
import MetricCard from '../dashboard/MetricCard';

export const [ModuleName]Module: React.FC = () => {
  const { startDate, endDate } = useDateFilter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const result = await [module]Service.getData(startDate, endDate);
        setData(result);
        setError(null);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [startDate, endDate]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">[Module Name]</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Metric Title"
          value={data?.value || 0}
          icon={/* Lucide icon */}
          color="blue"
        />
        {/* Add more metric cards */}
      </div>

      {/* Add charts, tables, etc. */}
    </div>
  );
};
```

### Step 7: Add to Routing
Edit: `frontend/src/App.tsx`

Add route and import:
```typescript
import { [ModuleName]Module } from './components/modules/[ModuleName]Module';

// In routes
<Route path="/[module-name]" element={<[ModuleName]Module />} />
```

### Step 8: Add to Sidebar Navigation
Edit: `frontend/src/components/layout/Sidebar.tsx`

Add navigation item:
```typescript
{
  name: '[Module Name]',
  icon: [Icon],
  path: '/[module-name]',
  color: 'text-[color]-500'
}
```

**Database Considerations**:
- Ensure required tables exist in Supabase
- Check `backend/src/utils/database-schema.sql`
- Add new tables if needed
- Update seed data in `backend/src/utils/seedData.ts`

**Testing**:
```bash
# Backend
cd 2xg-dashboard/backend
npm run dev
curl http://localhost:5000/api/[module-name]/data?startDate=2024-01-01&endDate=2024-01-31

# Frontend
cd 2xg-dashboard/frontend
npm run dev
# Visit http://localhost:3000/[module-name]
```

**TypeScript Types**:
Add types to:
- `backend/src/types/index.ts`
- `frontend/src/types/index.ts`

**Styling Guidelines**:
- Use Tailwind CSS utility classes
- Follow existing color scheme:
  - Blue: ERP
  - Green: Logistics
  - Purple: CARE
  - Orange: CRM
  - Choose a new color for your module
- Use `MetricCard` component for KPIs
- Use Recharts for visualizations

---

## How to Use These Agents

When working on the project, invoke the appropriate agent based on your task:

- **Backend API work** → Use Agent 1 (Backend API Developer)
- **Frontend UI work** → Use Agent 2 (Frontend React Developer)
- **Database queries/schema** → Use Agent 3 (Database Architect)
- **Buildline-pro features** → Use Agent 4 (Buildline Assembly Specialist)
- **Deployment issues** → Use Agent 5 (DevOps & Deployment Engineer)
- **Adding new modules** → Use Agent 6 (Module Generator)

Each agent has full context of their domain and can guide you through their specific responsibilities.
