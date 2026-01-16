# Supabase Setup Guide for 2XG Dashboard

This guide will walk you through connecting your 2XG Dashboard to Supabase.

## Step 1: Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Sign in or create a new account
3. Click **"New Project"**
4. Fill in the project details:
   - **Name**: `2xg-dashboard` (or your preferred name)
   - **Database Password**: Create a strong password (save this!)
   - **Region**: Choose the closest region to your users
   - **Pricing Plan**: Select Free tier to start
5. Click **"Create new project"**
6. Wait 2-3 minutes for your project to be provisioned

## Step 2: Get Your Supabase Credentials

Once your project is ready:

1. Go to **Settings** (gear icon in the left sidebar)
2. Navigate to **API** section
3. You'll need two values:
   - **Project URL**: Copy this (looks like `https://xxxxxxxxxxxxx.supabase.co`)
   - **Service Role Key**: Copy the `service_role` key (NOT the `anon` key)
     - ⚠️ **Warning**: Keep this secret! Never commit it to Git

## Step 3: Configure Backend Environment Variables

1. Open `backend/.env` file in your project
2. Replace the placeholder values:

```env
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# Supabase Configuration
SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-actual-service-role-key-here
```

3. Save the file

## Step 4: Create Database Schema

1. In your Supabase dashboard, click on **SQL Editor** in the left sidebar
2. Click **"New query"**
3. Copy the entire contents of `backend/src/utils/database-schema.sql`
4. Paste it into the SQL editor
5. Click **"Run"** or press `Ctrl+Enter` (Windows) or `Cmd+Enter` (Mac)
6. You should see a success message

### Verify Tables Created

1. Click on **Table Editor** in the left sidebar
2. You should see these tables:
   - ✓ organizations
   - ✓ product_categories
   - ✓ sales_transactions
   - ✓ inventory_items
   - ✓ shipments
   - ✓ deliveries
   - ✓ service_tickets
   - ✓ crm_leads

## Step 5: Test the Connection

### Backend Test

1. Make sure you have dependencies installed:
```bash
cd backend
npm install
```

2. Start the backend server:
```bash
npm run dev
```

3. You should see:
```
🚀 2XG Dashboard API running on port 5000
📊 Environment: development
🔗 Health check: http://localhost:5000/api/health
```

4. Test the API endpoint in your browser or using curl:
```bash
curl http://localhost:5000/api/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2026-01-07T...",
  "service": "2XG Dashboard API"
}
```

### Test Supabase Connection

Create a test file to verify the connection:

```bash
cd backend
npm run test-connection
```

Or manually test by accessing any API endpoint, for example:
```bash
curl http://localhost:5000/api/erp/sales/total
```

## Step 6: Start Frontend

1. Configure frontend environment:
```bash
cd frontend
```

2. Check `frontend/.env` file contains:
```env
VITE_API_URL=http://localhost:5000/api
```

3. Install dependencies and start:
```bash
npm install
npm run dev
```

4. Open your browser to `http://localhost:3000`

## Troubleshooting

### "Missing Supabase environment variables" Error

- Verify `backend/.env` file exists and contains correct values
- Make sure there are no extra spaces in the `.env` file
- Restart your backend server after updating `.env`

### "Connection failed" or Database Errors

- Check your internet connection
- Verify the Supabase URL is correct (no trailing slash)
- Ensure the service role key is correct (it's very long, ~250 characters)
- Check that the database schema was created successfully

### Tables Not Showing Up

- Re-run the SQL schema from `backend/src/utils/database-schema.sql`
- Check for any SQL errors in the Supabase SQL Editor

### CORS Errors

- Verify `FRONTEND_URL` in `backend/.env` matches your frontend URL
- Restart the backend server

## Optional: Seed Sample Data

To populate your database with sample data for testing:

```bash
cd backend
npm run seed
```

This will create sample:
- Sales transactions
- Inventory items
- Service tickets
- CRM leads
- And more...

## Next Steps

Once connected:

1. ✅ Your backend API is now connected to Supabase
2. ✅ All data will be stored in your Supabase PostgreSQL database
3. ✅ You can view/edit data in the Supabase dashboard
4. ✅ Your frontend will fetch data through the backend API

## Database Schema Overview

Your database includes 8 main tables:

1. **organizations** - Your company info
2. **product_categories** - Product categorization
3. **sales_transactions** - Sales and invoice data
4. **inventory_items** - Stock management
5. **shipments** - Incoming shipments tracking
6. **deliveries** - Outgoing deliveries
7. **service_tickets** - Customer support tickets
8. **crm_leads** - Sales leads and opportunities

## Security Notes

⚠️ **Important Security Reminders:**

1. **Never commit `.env` files** to Git (already in `.gitignore`)
2. **Service Role Key** bypasses Row Level Security - keep it secret
3. **Use environment variables** in production (Vercel, Heroku, etc.)
4. Consider enabling Row Level Security (RLS) policies for production
5. Regularly rotate your service role key

## Production Deployment

When deploying to production:

1. Set environment variables in your hosting platform:
   - Vercel: Project Settings → Environment Variables
   - Heroku: Settings → Config Vars
   - Railway: Variables tab

2. Update `FRONTEND_URL` to your production frontend URL

3. Consider setting up:
   - Database backups (Supabase Pro)
   - Monitoring and alerts
   - Rate limiting
   - RLS policies

## Support

- Supabase Docs: [https://supabase.com/docs](https://supabase.com/docs)
- Supabase Discord: [https://discord.supabase.com](https://discord.supabase.com)

---

**Your 2XG Dashboard is now connected to Supabase!** 🎉
