# 2XG Dashboard - Quick Start Guide

Get your dashboard running in 5 minutes!

## Step 1: Install Backend Dependencies

```bash
cd backend
npm install
```

## Step 2: Configure Backend

Create `.env` file in the `backend` directory:

```
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

SUPABASE_URL=your_supabase_url_here
SUPABASE_SERVICE_ROLE_KEY=your_service_key_here
```

**Get Supabase Credentials:**
1. Go to [supabase.com](https://supabase.com) and create a free account
2. Create a new project
3. Go to Project Settings > API
4. Copy "Project URL" → paste as `SUPABASE_URL`
5. Copy "service_role" key (not anon key!) → paste as `SUPABASE_SERVICE_ROLE_KEY`

## Step 3: Setup Database

1. In Supabase dashboard, go to SQL Editor
2. Open `backend/src/utils/database-schema.sql` from this project
3. Copy all the SQL code
4. Paste into Supabase SQL Editor
5. Click "Run" to create all tables

## Step 4: Seed Mock Data

```bash
npm run seed
```

You should see:
```
✅ Created 150 sales transactions
✅ Created 10 inventory items
✅ Created 40 shipments
✅ Created 60 deliveries
✅ Created 80 service tickets
✅ Created 100 CRM leads
```

## Step 5: Start Backend Server

```bash
npm run dev
```

You should see:
```
🚀 2XG Dashboard API running on port 5000
```

## Step 6: Install Frontend Dependencies

Open a **new terminal** window:

```bash
cd frontend
npm install
```

## Step 7: Configure Frontend

Create `.env` file in the `frontend` directory:

```
VITE_API_URL=http://localhost:5000/api
```

## Step 8: Start Frontend

```bash
npm run dev
```

Your browser should open automatically at `http://localhost:3000`

## You're Done! 🎉

You should now see the 2XG Dashboard with:
- ERP Section (sales, inventory)
- 2XG Logistics (shipments, deliveries)
- 2XG CARE (service tickets)
- Sales Pipeline (CRM leads)

## Next Steps

- Try clicking the date range filters (Today, This Week, This Month)
- Navigate between modules using the sidebar
- Explore the data tables and charts

## Troubleshooting

### "Cannot connect to database"
- Check your Supabase URL and key are correct
- Make sure you ran the SQL schema in Supabase SQL Editor

### "CORS error"
- Make sure `FRONTEND_URL` in backend `.env` is `http://localhost:3000`

### "Port 5000 already in use"
- Change `PORT=5001` in backend `.env`
- Update frontend `.env` to `VITE_API_URL=http://localhost:5001/api`

### Backend won't start
- Make sure you're in the `backend` directory
- Run `npm install` again
- Check that `.env` file exists and has valid Supabase credentials

### Frontend shows empty data
- Make sure backend is running (check terminal)
- Make sure you ran `npm run seed` in the backend
- Check browser console for errors (F12)

## Need Help?

Check the main [README.md](README.md) for detailed documentation.
