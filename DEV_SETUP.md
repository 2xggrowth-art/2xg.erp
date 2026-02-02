# Developer Setup Guide

## Prerequisites

- Node.js 18+
- npm 9+
- Git access to this repo

## 1. Clone and install

```bash
git clone https://github.com/2xggrowth-art/2xg.erp.git
cd 2xg.erp

cd backend && npm install
cd ../frontend && npm install
```

## 2. Backend environment

Copy the example and fill in the values provided by the project admin:

```bash
cd backend
cp .env.example .env
```

Edit `.env` and set:

| Variable | Value | Source |
|----------|-------|--------|
| `SUPABASE_URL` | Production Supabase Kong URL | Ask admin |
| `SUPABASE_SERVICE_ROLE_KEY` | Production service role JWT | Ask admin |
| `JWT_SECRET` | Production JWT secret | Ask admin |
| `READ_ONLY_MODE` | `true` | **Keep this as `true`** |

> **READ_ONLY_MODE=true** blocks all write operations (POST/PUT/PATCH/DELETE) at the API level. You can view all production data but cannot create, update, or delete anything. Only the admin can grant write access.

## 3. Frontend environment

The frontend `.env.example` already points to `http://localhost:5000/api`. No changes needed unless your backend runs on a different port.

```bash
cd frontend
cp .env.example .env
```

## 4. Run locally

```bash
# Terminal 1 — Backend
cd backend
npm run dev

# Terminal 2 — Frontend
cd frontend
npm run dev
```

- Frontend: http://localhost:3000
- Backend: http://localhost:5000
- Health check: http://localhost:5000/api/health

## 5. Login

Use your existing production credentials. The login endpoint is allowed even in read-only mode.

## What you CAN do in read-only mode

- View all pages (items, expenses, vendors, customers, etc.)
- Search and filter data
- Generate and view reports
- Log in and out

## What you CANNOT do in read-only mode

- Create, edit, or delete any records
- The API will return a `403` error with `readOnlyMode: true`

## Need write access?

Contact the project admin to temporarily set `READ_ONLY_MODE=false` in your local `.env`. Only do this after getting explicit approval.
