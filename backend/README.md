# 2XG ERP -- Backend API

Express + TypeScript backend with Supabase (self-hosted).

## Setup

```bash
npm install
cp .env.example .env   # Fill in credentials from admin
npm run dev             # Dev server with nodemon
```

## Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Dev server with hot reload (port 5000) |
| `npm run build` | Compile TypeScript |
| `npm start` | Run compiled JS |
| `npm run seed` | Seed database with mock data |
| `npm run test-connection` | Test Supabase connectivity |

## Environment Variables

See `.env.example` for all required variables. Key ones:

- `SUPABASE_URL` -- Self-hosted Supabase Kong URL (base URL only, no `/rest/v1`)
- `SUPABASE_SERVICE_ROLE_KEY` -- Service role JWT (bypasses RLS)
- `JWT_SECRET` -- Secret for signing auth tokens
- `READ_ONLY_MODE` -- Set `true` to block all write operations (for dev)

## API Routes (24 prefixes)

`/api/auth`, `/api/erp`, `/api/logistics`, `/api/care`, `/api/crm`, `/api/items`, `/api/purchases`, `/api/vendors`, `/api/purchase-orders`, `/api/bills`, `/api/sales`, `/api/expenses`, `/api/tasks`, `/api/reports`, `/api/search`, `/api/ai`, `/api/payments`, `/api/vendor-credits`, `/api/transfer-orders`, `/api/invoices`, `/api/customers`, `/api/sales-orders`, `/api/payments-received`, `/api/delivery-challans`

All routes accept optional `?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD` query parameters.

## Project Structure

```
src/
├── server.ts          # Express app, CORS, route registration
├── config/            # Supabase admin client
├── middleware/         # Auth, upload, read-only guard
├── routes/            # 24 route files
├── controllers/       # Request handlers
├── services/          # Business logic + Supabase queries
├── types/
└── utils/             # DB schema SQL, seed data
```

## Health Check

```bash
curl http://localhost:5000/api/health
```
