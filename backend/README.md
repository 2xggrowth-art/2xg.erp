# 2XG Dashboard - Backend API

Express + TypeScript backend for the 2XG Custom Dashboard.

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Configuration

Create a `.env` file in the backend directory:

```bash
cp .env.example .env
```

Then edit `.env` and add your Supabase credentials:

```
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 3. Database Setup

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy the contents of `src/utils/database-schema.sql`
4. Execute the SQL to create all tables

### 4. Seed Database with Mock Data

```bash
npm run seed
```

This will populate your database with 6 months of realistic mock data.

### 5. Start Development Server

```bash
npm run dev
```

The API will be available at `http://localhost:5000`

## API Routes

### ERP Module
- `GET /api/erp/sales/total` - Total sales value
- `GET /api/erp/sales/by-category` - Sales by category
- `GET /api/erp/sales/overdue` - Overdue amounts
- `GET /api/erp/inventory/hot-selling` - Hot selling items
- `GET /api/erp/inventory/low-stock` - Low stock items

### Logistics Module
- `GET /api/logistics/shipments/summary` - Shipment summary
- `GET /api/logistics/deliveries/summary` - Delivery summary
- `GET /api/logistics/deliveries/list` - Delivery list

### CARE Module
- `GET /api/care/tickets/total` - Total tickets
- `GET /api/care/tickets/by-category` - Tickets by category
- `GET /api/care/tickets/trends` - Ticket trends

### CRM Module
- `GET /api/crm/leads/reporting` - Lead reporting metrics
- `GET /api/crm/customers/list` - Customer list
- `GET /api/crm/leads/by-status` - Leads by status

### Query Parameters
All routes accept optional date range parameters:
- `startDate` - ISO date (YYYY-MM-DD)
- `endDate` - ISO date (YYYY-MM-DD)

Example: `/api/erp/sales/total?startDate=2024-01-01&endDate=2024-01-31`

## Project Structure

```
backend/
├── src/
│   ├── config/         # Supabase configuration
│   ├── controllers/    # Route controllers
│   ├── routes/         # Express routes
│   ├── services/       # Business logic
│   ├── types/          # TypeScript types
│   ├── utils/          # Utilities & seed data
│   └── server.ts       # Express app entry
├── package.json
└── tsconfig.json
```

## Build for Production

```bash
npm run build
npm start
```

## Health Check

```bash
curl http://localhost:5000/api/health
```
