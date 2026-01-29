# 🚀 Quick Start - Connect to Supabase

Follow these steps to get your 2XG Dashboard connected to Supabase in under 10 minutes!

## Prerequisites
- Node.js installed (v16 or higher)
- A Supabase account (free at [supabase.com](https://supabase.com))

## Step-by-Step Setup

### 1️⃣ Create Supabase Project (3 minutes)

1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Click **"New Project"**
3. Enter project name: `2xg-dashboard`
4. Set a database password (save it somewhere safe!)
5. Choose your region
6. Click **"Create new project"**
7. Wait ~2 minutes for provisioning

### 2️⃣ Get Your Credentials (1 minute)

1. In Supabase dashboard, go to **Settings** → **API**
2. Copy these two values:
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **Service Role Key** (the `service_role` secret key)

### 3️⃣ Configure Backend (1 minute)

1. Open `backend/.env` in your code editor
2. Replace the placeholders with your actual values:

```env
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

3. Save the file

### 4️⃣ Create Database Tables (2 minutes)

1. In Supabase dashboard, click **SQL Editor** (left sidebar)
2. Click **"New query"**
3. Open `backend/src/utils/database-schema.sql` in your code editor
4. Copy ALL the content (Ctrl+A, Ctrl+C)
5. Paste into Supabase SQL Editor
6. Click **"Run"** (or press Ctrl+Enter)
7. You should see "Success. No rows returned"

### 5️⃣ Install & Test (3 minutes)

```bash
# Install backend dependencies
cd backend
npm install

# Test the connection
npm run test-connection
```

You should see:
```
✓ Database connection successful!
✓ All tables OK
🎉 Supabase is properly connected!
```

### 6️⃣ Start Everything

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser!

## ✅ Success Checklist

- [ ] Supabase project created
- [ ] Credentials copied to `backend/.env`
- [ ] Database schema executed in Supabase
- [ ] Connection test passed
- [ ] Backend running on port 5000
- [ ] Frontend running on port 3000
- [ ] Dashboard loads in browser

## 🆘 Troubleshooting

**"Missing Supabase environment variables" error?**
- Make sure `backend/.env` file exists and has correct values
- Restart the backend server

**Connection test fails?**
- Check your internet connection
- Verify credentials are correct (no extra spaces)
- Make sure database schema was run in Supabase

**Tables not found?**
- Re-run the SQL from `backend/src/utils/database-schema.sql`

## 📚 Need More Details?

See [SUPABASE_SETUP_GUIDE.md](./SUPABASE_SETUP_GUIDE.md) for comprehensive documentation.

## 🎉 You're Done!

Your 2XG Dashboard is now connected to Supabase and ready to use!

**Optional Next Steps:**
- Run `npm run seed` to add sample data
- Explore the Supabase dashboard to view your data
- Start building your business workflows!
