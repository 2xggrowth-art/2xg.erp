# Step-by-Step: Deploy Backend to Vercel

## ✅ Prerequisites Done
- Backend is configured with `vercel.json`
- CORS is configured to allow your frontend domain
- All changes are pushed to GitHub
- Build tested successfully

---

## 📋 Step-by-Step Instructions

### Step 1: Go to Vercel Dashboard
1. Open your browser and go to: **https://vercel.com/dashboard**
2. You should already be logged in (since you deployed the frontend)

---

### Step 2: Import Backend Project
1. Click the **"Add New..."** button (top right)
2. Select **"Project"**
3. You'll see your GitHub repositories
4. Find and click on: **`Zaheer7779/2xg.ERP`** (same repository)
5. Click **"Import"**

---

### Step 3: Configure Project Settings

On the configuration screen, set the following:

#### **Project Name:**
```
2xg-erp-backend
```
(or any name you prefer)

#### **Framework Preset:**
- Select: **"Other"**

#### **Root Directory:**
- Click **"Edit"**
- Enter: **`backend`**
- Click **"Continue"**

#### **Build & Development Settings:**
Leave as default or verify:
- **Build Command**: `npm run vercel-build` (auto-detected)
- **Output Directory**: Leave empty
- **Install Command**: `npm install` (auto-detected)

---

### Step 4: Add Environment Variables

Click on **"Environment Variables"** section and add these:

#### Variable 1:
- **Name**: `NODE_ENV`
- **Value**: `production`
- **Environments**: Select all (Production, Preview, Development)

#### Variable 2:
- **Name**: `FRONTEND_URL`
- **Value**: `https://2xg-erp.vercel.app`
- **Environments**: Select all

#### Variable 3:
- **Name**: `SUPABASE_URL`
- **Value**: `[YOUR SUPABASE PROJECT URL]`
  - Get this from: https://app.supabase.com/project/_/settings/api
  - Copy "Project URL"
- **Environments**: Select all

#### Variable 4:
- **Name**: `SUPABASE_SERVICE_ROLE_KEY`
- **Value**: `[YOUR SUPABASE SERVICE ROLE KEY]`
  - Get this from: https://app.supabase.com/project/_/settings/api
  - Copy "service_role" secret key (NOT the anon key)
  - ⚠️ **Important**: Use the SERVICE ROLE key, not the ANON key
- **Environments**: Select all

---

### Step 5: Deploy
1. Review all settings
2. Click the blue **"Deploy"** button
3. Wait for deployment (usually 1-3 minutes)
4. Watch the build logs to ensure no errors

---

### Step 6: Get Your Backend URL
After successful deployment:
1. You'll see a success screen
2. Copy the deployment URL (something like):
   ```
   https://2xg-erp-backend.vercel.app
   ```
   or
   ```
   https://your-backend-name.vercel.app
   ```
3. **Save this URL** - you'll need it in the next step!

---

### Step 7: Update Frontend Environment Variable

Now update your frontend to use the new backend:

1. Go back to Vercel Dashboard
2. Click on your **frontend project** (2xg-erp)
3. Go to **Settings** → **Environment Variables**
4. Find `VITE_API_URL` or add it if it doesn't exist:
   - **Name**: `VITE_API_URL`
   - **Value**: `https://YOUR-BACKEND-URL/api`
     - Example: `https://2xg-erp-backend.vercel.app/api`
     - ⚠️ **Don't forget** the `/api` at the end!
   - **Environments**: Select all
5. Click **"Save"**

---

### Step 8: Redeploy Frontend

After adding the environment variable:

1. Still in your frontend project settings
2. Go to **"Deployments"** tab (top menu)
3. Find the latest deployment
4. Click the **"..."** (three dots) menu
5. Click **"Redeploy"**
6. Confirm by clicking **"Redeploy"** again
7. Wait for redeployment (1-2 minutes)

---

### Step 9: Test Your Application

1. Open your frontend: **https://2xg-erp.vercel.app**
2. Open browser console (Press F12)
3. Navigate to Items, Customers, or any other page
4. Check the console - you should see successful API calls
5. No more CORS errors! 🎉

---

## 🔍 Troubleshooting

### If deployment fails:
- Check the build logs in Vercel
- Ensure all environment variables are set correctly
- Verify `SUPABASE_SERVICE_ROLE_KEY` is the service role key, not anon key

### If you still see CORS errors:
1. Check backend logs in Vercel dashboard
2. Verify `FRONTEND_URL` environment variable matches exactly: `https://2xg-erp.vercel.app`
3. Verify frontend `VITE_API_URL` ends with `/api`

### If API calls fail (404 errors):
1. Ensure `VITE_API_URL` ends with `/api`
2. Test the health endpoint: `https://YOUR-BACKEND-URL/health`
3. Check Vercel function logs for errors

### If you see "Function not found":
1. Verify `vercel.json` is in the backend folder
2. Check that build completed successfully
3. Look for TypeScript compilation errors in build logs

---

## ✅ Expected Result

After completing all steps:
- ✅ Backend deployed at: `https://YOUR-BACKEND-URL.vercel.app`
- ✅ Frontend deployed at: `https://2xg-erp.vercel.app`
- ✅ Frontend successfully calls backend API
- ✅ No CORS errors
- ✅ All data loading correctly

---

## 📞 Need Help?

If you encounter any issues during deployment:
1. Check the Vercel build logs (very detailed)
2. Check browser console for specific errors
3. Test the health endpoint: `https://YOUR-BACKEND-URL/health` - should return JSON

---

## 🎉 After Successful Deployment

Once everything is working:
1. You can make changes locally
2. Push to GitHub
3. Vercel will automatically redeploy both frontend and backend
4. No manual deployment needed!

---

**Good luck with your deployment! 🚀**
