# 2XG ERP -- Frontend

React 18 + TypeScript + Vite + Tailwind CSS.

## Setup

```bash
npm install
cp .env.example .env   # Default points to http://localhost:5000/api
npm run dev             # Dev server on port 3000
```

## Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Dev server (port 3000) |
| `npm run build` | Production build to `dist/` |
| `npm run build:check` | TypeScript check + build |
| `npm run preview` | Preview production build |

## Environment Variables

| Variable | Default | Notes |
|----------|---------|-------|
| `VITE_API_URL` | `http://localhost:5000/api` | Backend API base URL |

`VITE_*` vars are baked into the JS bundle at build time. Changes require a rebuild.

## Project Structure

```
src/
├── App.tsx              # All routes
├── components/
│   ├── auth/            # Login, user management
│   ├── layout/          # Sidebar, Header
│   ├── dashboard/       # MetricCard, charts
│   ├── common/          # DateRangeFilter, shared UI
│   ├── shared/          # Reusable components (CreatableSelect, etc.)
│   ├── items/           # Inventory CRUD
│   ├── vendors/         # Vendor management
│   ├── customers/       # Customer management
│   ├── invoices/        # Invoice generation
│   ├── expenses/        # Expense management
│   ├── bills/           # Bill management
│   ├── purchase-orders/ # PO management
│   ├── sales-orders/    # SO management
│   ├── delivery-challans/
│   ├── transfer-orders/
│   ├── vendor-credits/
│   ├── payments/        # Payments made
│   ├── payments-received/
│   ├── pos/             # Point of sale
│   └── modules/         # ERP, Logistics, CARE, CRM dashboards
├── contexts/            # Auth, DateFilter contexts
├── pages/               # 42+ page components
├── services/            # 21+ API service files
├── types/
└── utils/               # CSV parser, PDF generators
```

## Tech Stack

- **React 18** with TypeScript
- **Vite** -- build tool and dev server
- **Tailwind CSS** -- utility-first styling
- **Recharts** -- charts and data visualization
- **Lucide React** -- icons
- **Axios** -- HTTP client

## Auth

Custom JWT auth (not Supabase Auth). The `AuthContext` manages login state and token storage.

## Deployment

Deployed via Coolify on OVH. Nixpacks builds `dist/` from the `/frontend` base directory. See [CLAUDE.md](../CLAUDE.md) for full deployment details.
