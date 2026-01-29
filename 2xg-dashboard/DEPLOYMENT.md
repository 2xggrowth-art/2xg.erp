# Deployment Guide for 2XG ERP Dashboard

## Current Status
- ✅ Frontend: Deployed on Vercel at `https://2xg-erp.vercel.app`
- ❌ Backend: Needs to be deployed

## Problem
Your frontend is trying to connect to `http://localhost:5002` which doesn't work in production because:
1. Localhost only works on your computer
2. CORS blocks requests from public domains to localhost

## Solution: Deploy Backend

### Option 1: Render (Recommended - Free Tier)

1. **Go to [Render.com](https://render.com)** and sign up/login

2. **Create a New Web Service:**
   - Click "New +" → "Web Service"
   - Connect your GitHub repository: `https://github.com/Zaheer7779/2xg.ERP.git`
   - Configure:
     - **Name**: `2xg-erp-backend`
     - **Region**: Choose closest to you
     - **Branch**: `main`
     - **Root Directory**: `backend`
     - **Runtime**: `Node`
     - **Build Command**: `npm install && npm run build`
     - **Start Command**: `npm start`

3. **Set Environment Variables:**
   Click "Environment" tab and add:
   ```
   NODE_ENV=production
   PORT=5000
   FRONTEND_URL=https://2xg-erp.vercel.app
   SUPABASE_URL=<your_supabase_url>
   SUPABASE_SERVICE_ROLE_KEY=<your_supabase_key>
   ```

4. **Deploy**: Click "Create Web Service"

5. **Get your backend URL**: After deployment, you'll get a URL like:
   `https://2xg-erp-backend.onrender.com`

---

### Option 2: Railway (Alternative)

1. **Go to [Railway.app](https://railway.app)** and sign up/login

2. **Create New Project:**
   - Click "New Project" → "Deploy from GitHub repo"
   - Select your repository
   - Choose the `backend` folder as root

3. **Configure:**
   - Railway will auto-detect Node.js
   - Add environment variables in Settings → Variables:
     ```
     NODE_ENV=production
     FRONTEND_URL=https://2xg-erp.vercel.app
     SUPABASE_URL=<your_supabase_url>
     SUPABASE_SERVICE_ROLE_KEY=<your_supabase_key>
     ```

4. **Deploy**: Railway will automatically deploy

5. **Get your backend URL**: Copy the generated URL from Railway

---

### Option 3: Vercel (Same Platform as Frontend)

1. **Go to Vercel Dashboard**

2. **Import Project:**
   - Click "Add New..." → "Project"
   - Import your GitHub repository again
   - Configure:
     - **Root Directory**: `backend`
     - **Framework Preset**: Other
     - **Build Command**: `npm run build`
     - **Output Directory**: `dist`
     - **Install Command**: `npm install`

3. **Environment Variables:**
   Add in project settings:
   ```
   NODE_ENV=production
   FRONTEND_URL=https://2xg-erp.vercel.app
   SUPABASE_URL=<your_supabase_url>
   SUPABASE_SERVICE_ROLE_KEY=<your_supabase_key>
   ```

4. **Deploy**

---

## Step 2: Update Frontend Environment Variable

After deploying backend, you'll get a URL like:
- Render: `https://2xg-erp-backend.onrender.com`
- Railway: `https://your-project.up.railway.app`
- Vercel: `https://your-backend.vercel.app`

### Update Vercel Frontend:

1. **Go to Vercel Dashboard** → Your frontend project
2. **Settings** → **Environment Variables**
3. **Add/Update:**
   ```
   VITE_API_URL=https://YOUR_BACKEND_URL/api
   ```
   Replace `YOUR_BACKEND_URL` with your actual backend URL

4. **Redeploy**: Go to Deployments → Click "..." → Redeploy

---

## Quick Fix (Temporary - Not Recommended for Production)

If you want to test quickly while keeping backend on your computer:

1. **Make your localhost accessible** using ngrok:
   ```bash
   # Install ngrok: https://ngrok.com/download
   ngrok http 5002
   ```

2. **Copy the ngrok URL** (e.g., `https://abc123.ngrok.io`)

3. **Update Vercel environment variable:**
   ```
   VITE_API_URL=https://abc123.ngrok.io/api
   ```

⚠️ **Note**: This only works while ngrok is running on your computer. Not suitable for production.

---

## Verify Deployment

After both frontend and backend are deployed:

1. Visit `https://2xg-erp.vercel.app`
2. Open browser console (F12)
3. Check for errors - should see successful API calls
4. Test creating/viewing items

---

## Environment Variables Summary

### Backend (.env):
```
NODE_ENV=production
PORT=5000
FRONTEND_URL=https://2xg-erp.vercel.app
SUPABASE_URL=<your_supabase_url>
SUPABASE_SERVICE_ROLE_KEY=<your_supabase_key>
```

### Frontend (.env):
```
VITE_API_URL=https://YOUR_BACKEND_URL/api
```

---

## Troubleshooting

### Still seeing CORS errors?
- Verify backend environment variable `FRONTEND_URL` matches your Vercel domain exactly
- Check backend logs for CORS rejections
- Ensure backend is running and accessible

### API calls failing?
- Verify `VITE_API_URL` is correct
- Check backend logs for errors
- Verify Supabase credentials are correct

### Build failing?
- Check Node.js version (should be 18+)
- Verify all dependencies are in package.json
- Check build logs for specific errors
