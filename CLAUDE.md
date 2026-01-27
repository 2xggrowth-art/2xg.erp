# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Structure

This is a monorepo containing two main projects:

### 1. **2xg-dashboard** (Primary - In GitHub)
Full-stack ERP dashboard with React frontend and Express backend.
- **Frontend**: React 18 + Vite + TypeScript + Tailwind CSS
- **Backend**: Express + TypeScript + Supabase (PostgreSQL)
- **Deployment**: Frontend on Vercel, Backend on Vercel Serverless

### 2. **buildline-pro** (Local Only - Not in GitHub)
Next.js cycle assembly tracking system.
- **Framework**: Next.js 16 + React 19 + TypeScript
- **Database**: Supabase
- **Features**: Bulk cycle inward, technician assignment, error boundaries

## Development Commands

### 2xg-dashboard Backend
```bash
cd 2xg-dashboard/backend

# Development with auto-reload
npm run dev

# Build for production
npm run build

# Run production build
npm start

# Seed database with mock data (6 months)
npm run seed

# Test Supabase connection
npm run test-connection
```

### 2xg-dashboard Frontend
```bash
cd 2xg-dashboard/frontend

# Development server (http://localhost:3000)
npm run dev

# Build for production
npm run build

# Build with TypeScript check
npm run build:check

# Preview production build
npm run preview
```

### buildline-pro
```bash
cd buildline-pro

# Development server
npm run dev

# Build for production
npm run build

# Run production build
npm start

# Lint code
npm run lint
```

## Architecture

### 2xg-dashboard Backend Architecture

**Layered Pattern**: Controllers → Services → Database

```
backend/src/
├── server.ts              # Express app entry, middleware setup, CORS config
├── config/
│   └── supabase.ts        # Supabase client initialization
├── controllers/           # HTTP request handlers
│   ├── erp.controller.ts
│   ├── logistics.controller.ts
│   ├── care.controller.ts
│   ├── crm.controller.ts
│   ├── items.controller.ts
│   └── [module].controller.ts
├── services/              # Business logic layer
│   ├── erp.service.ts
│   ├── logistics.service.ts
│   └── [module].service.ts
├── routes/                # API route definitions
│   ├── erp.routes.ts
│   └── [module].routes.ts
├── types/
│   └── index.ts           # TypeScript type definitions
└── utils/
    ├── database-schema.sql  # Complete database schema
    └── seedData.ts          # Mock data generation
```

**Pattern**: Each module follows the same structure:
1. **Routes** define endpoints and HTTP methods
2. **Controllers** handle requests, call services, send responses
3. **Services** contain business logic and database queries
4. All database operations use Supabase client

### 2xg-dashboard Frontend Architecture

**Component-based with service layer**:

```
frontend/src/
├── App.tsx                # Main app with routing
├── components/
│   ├── layout/           # Layout components (Sidebar, Header, etc.)
│   ├── dashboard/        # Dashboard widgets (MetricCard, etc.)
│   ├── common/           # Shared components (DateRangeFilter, etc.)
│   └── modules/          # Feature modules (ERPModule, LogisticsModule, etc.)
├── contexts/
│   └── DateFilterContext.tsx  # Global date range state
├── services/              # API communication layer
│   ├── api.client.ts     # Axios instance with base config
│   ├── erp.service.ts
│   └── [module].service.ts
└── types/
    └── index.ts          # TypeScript type definitions
```

**Pattern**:
- All API calls go through service files
- Components consume services, never call axios directly
- Global state managed via React Context
- Date filtering applies to all modules simultaneously

### buildline-pro Architecture

**Next.js App Router with API Routes**:

```
buildline-pro/
├── app/
│   ├── layout.tsx        # Root layout with ErrorBoundary
│   ├── page.tsx          # Homepage
│   ├── supervisor/
│   │   └── page.tsx      # Supervisor dashboard
│   └── api/
│       └── cycles/
│           ├── bulk-inward/route.ts   # POST bulk cycle inward
│           └── bulk-assign/route.ts   # POST bulk technician assignment
├── components/
│   ├── ErrorBoundary.tsx
│   ├── bulk-inward/
│   │   └── BulkInwardModal.tsx       # CSV upload + manual entry
│   └── bulk-assign/
│       └── BulkAssignModal.tsx       # Bulk technician assignment
└── lib/
    └── supabase/
        ├── client.ts                  # Supabase browser client
        └── database.types.ts          # Generated types
```

## Critical Patterns & Conventions

### CORS Configuration (2xg-dashboard)

**Issue**: Vercel serverless functions need explicit CORS headers in `vercel.json`

**Solution**: CORS is configured in TWO places:
1. **Express middleware** in `backend/src/server.ts` (lines 44-69)
2. **Vercel headers** in `backend/vercel.json` (lines 16-38)

**Allowed origins** (update both files when adding new frontend domains):
- `http://localhost:3000` (development)
- `https://2xg-dashboard-pi.vercel.app` (production frontend)
- `https://2xg-erp.vercel.app` (alternate domain)

### Database Patterns

**2xg-dashboard**:
- Uses Supabase service role key (full access)
- Schema in `backend/src/utils/database-schema.sql`
- Main tables: organizations, sales_transactions, inventory_items, shipments, service_tickets, leads, customers

**buildline-pro**:
- Uses Supabase with Row Level Security (RLS)
- Schema in `supabase/migrations/001_assembly_tracking_schema.sql`
- 6-stage workflow: inwarded → assigned → in_progress → completed → qc_in_progress → qc_passed
- Sales safety lock enforced at database level

### Environment Variables

**Backend (.env)**:
```env
PORT=5000
NODE_ENV=development|production
FRONTEND_URL=http://localhost:3000
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbG...
JWT_SECRET=your_jwt_secret
```

**Frontend (.env)**:
```env
VITE_API_URL=http://localhost:5000/api
```

**buildline-pro (.env.local)**:
```env
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

## Key API Patterns

### Date Range Filtering
All ERP, Logistics, CARE, and CRM endpoints accept:
```
?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
```

### Response Format
```typescript
{
  success: boolean
  data?: any
  error?: string
  message?: string
}
```

### Error Handling Pattern (buildline-pro)
- All pages wrapped with `<ErrorBoundary>`
- Network errors caught and displayed with helpful messages
- Loading states for all async operations
- Retry buttons on error screens

## Vercel Deployment

### Backend Deployment Configuration
- **Build command**: `npm run build` (compiles TypeScript)
- **Start command**: `npm start` (runs compiled JS)
- **Entry point**: `api/index.js` (imports compiled `dist/server.js`)
- **Root directory**: `2xg-dashboard/backend`

### Important: Vercel Serverless Functions
The Express app is exported for Vercel serverless in `server.ts`:
```typescript
export default app;  // For Vercel
```

Server only starts if not in Vercel environment:
```typescript
if (process.env.VERCEL !== '1') {
  app.listen(PORT, ...);
}
```

## Database Setup

### Initial Setup (2xg-dashboard)
1. Create Supabase project
2. Run SQL from `backend/src/utils/database-schema.sql`
3. Get service role key (not anon key) from Settings → API
4. Run `npm run seed` to populate with mock data

### Initial Setup (buildline-pro)
1. Use same Supabase project or create new one
2. Run SQL from `supabase/migrations/001_assembly_tracking_schema.sql`
3. Get anon key from Settings → API (for browser client)
4. Schema includes triggers, RLS policies, and functions

## Module Structure (2xg-dashboard)

When adding a new module:
1. Create service: `backend/src/services/module-name.service.ts`
2. Create controller: `backend/src/controllers/module-name.controller.ts`
3. Create routes: `backend/src/routes/module-name.routes.ts`
4. Register in `server.ts`: `app.use('/api/module-name', moduleRoutes)`
5. Create frontend service: `frontend/src/services/module-name.service.ts`
6. Create component: `frontend/src/components/modules/ModuleNameModule.tsx`
7. Add to `App.tsx` routing

## Testing

**Backend Connection Test**:
```bash
cd 2xg-dashboard/backend
npm run test-connection
```

**Test Specific Endpoints**:
```bash
# Health check
curl http://localhost:5000/api/health

# Test CORS
curl -H "Origin: http://localhost:3000" http://localhost:5000/api/erp/sales/total
```

## Important Files & Locations

### Documentation
- `2xg-dashboard/README.md` - Complete setup guide
- `2xg-dashboard/backend/VERCEL_CORS_FIX.md` - CORS troubleshooting
- `buildline-pro/BULK_INWARD_GUIDE.md` - Bulk operations guide
- `buildline-pro/ERROR_HANDLING_ADDED.md` - Error handling details
- `buildline-pro/IMPLEMENTATION_SUMMARY.md` - Feature overview

### Configuration Files
- `2xg-dashboard/backend/vercel.json` - Vercel serverless config + CORS headers
- `2xg-dashboard/frontend/tailwind.config.js` - Tailwind customization
- `2xg-dashboard/frontend/vite.config.ts` - Vite build config

### Database Schemas
- `2xg-dashboard/backend/src/utils/database-schema.sql` - Main ERP schema
- `buildline-pro/supabase/migrations/001_assembly_tracking_schema.sql` - Assembly tracking schema

## Monorepo Navigation

```bash
# Always work from project root
cd /e/2xg

# Navigate to specific project
cd 2xg-dashboard/backend    # Express API
cd 2xg-dashboard/frontend   # React app
cd buildline-pro            # Next.js app

# Common mistake: Running commands from wrong directory
# ❌ Don't: cd 2xg-dashboard && npm run dev
# ✅ Do:    cd 2xg-dashboard/backend && npm run dev
```

## Git Workflow

- **Main branch**: `main`
- **Remote**: https://github.com/Zaheer7779/2xg.ERP.git
- **Included in GitHub**: `2xg-dashboard/` only
- **Local only**: `buildline-pro/`, `Buildline/`, `Buildline-temp/`, `lead-CRM/`

When committing:
```bash
# Only add 2xg-dashboard changes
git add 2xg-dashboard/

# Don't accidentally add buildline-pro
git status  # Verify before committing
```
