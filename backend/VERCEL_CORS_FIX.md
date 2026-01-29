# Vercel CORS Fix Guide

## Issue
Your items are loading locally but not on Vercel due to CORS (Cross-Origin Resource Sharing) errors.

**Error Message:**
```
Access to XMLHttpRequest at 'https://backend-rhi-cyan-56.vercel.app/api/items'
from origin 'https://2xg-dashboard-pi.vercel.app' has been blocked by CORS policy
```

---

## What Changed

### 1. Updated `vercel.json`
Added explicit CORS headers for Vercel serverless functions:

```json
{
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        {
          "key": "Access-Control-Allow-Origin",
          "value": "https://2xg-dashboard-pi.vercel.app"
        },
        {
          "key": "Access-Control-Allow-Methods",
          "value": "GET, POST, PUT, DELETE, OPTIONS"
        },
        {
          "key": "Access-Control-Allow-Headers",
          "value": "Content-Type, Authorization, cache-control, Cache-Control"
        },
        {
          "key": "Access-Control-Allow-Credentials",
          "value": "true"
        }
      ]
    }
  ]
}
```

### 2. Updated `server.ts`
Added additional allowed headers including both cases of Cache-Control:

```typescript
allowedHeaders: ['Content-Type', 'Authorization', 'Cache-Control', 'cache-control', 'X-Requested-With'],
exposedHeaders: ['Content-Length', 'Content-Type']
```

---

## Deployment Steps

### Step 1: Commit and Push Changes

```bash
cd e:\2xg\2xg-dashboard\backend
git add vercel.json src/server.ts
git commit -m "Fix CORS for Vercel deployment"
git push origin main
```

### Step 2: Redeploy on Vercel

**Option A: Automatic (if connected to GitHub)**
- Vercel will automatically detect the push and redeploy

**Option B: Manual Redeploy**
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your backend project
3. Click "Deployments" tab
4. Click "Redeploy" on the latest deployment

### Step 3: Verify Environment Variables

Make sure these are set in your Vercel backend project:

1. Go to Vercel Dashboard → Your Backend Project → Settings → Environment Variables
2. Ensure these are set:
   ```
   DATABASE_URL=your_postgresql_connection_string
   JWT_SECRET=your_jwt_secret
   NODE_ENV=production
   FRONTEND_URL=https://2xg-dashboard-pi.vercel.app
   ```

### Step 4: Test the API

After deployment, test the health endpoint:

```bash
curl https://backend-rhi-cyan-56.vercel.app/api/health
```

Should return:
```json
{
  "status": "ok",
  "timestamp": "2026-01-27T...",
  "service": "2XG Dashboard API"
}
```

### Step 5: Test CORS

```bash
curl -H "Origin: https://2xg-dashboard-pi.vercel.app" \
     -H "Access-Control-Request-Method: GET" \
     -H "Access-Control-Request-Headers: Content-Type" \
     -X OPTIONS \
     --verbose \
     https://backend-rhi-cyan-56.vercel.app/api/items
```

Look for these headers in the response:
```
Access-Control-Allow-Origin: https://2xg-dashboard-pi.vercel.app
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
Access-Control-Allow-Credentials: true
```

---

## Why This Happens

### Local Development (Works)
- **Frontend:** `http://localhost:3000`
- **Backend:** `http://localhost:5000`
- CORS config allows all `localhost` origins

### Production (Was Failing)
- **Frontend:** `https://2xg-dashboard-pi.vercel.app`
- **Backend:** `https://backend-rhi-cyan-56.vercel.app`
- Different domains = CORS required
- Vercel serverless functions need explicit headers in `vercel.json`

---

## Alternative: Allow All Origins (For Testing Only)

If you want to temporarily allow all origins for testing:

**Update vercel.json:**
```json
{
  "key": "Access-Control-Allow-Origin",
  "value": "*"
}
```

**⚠️ WARNING:** This is NOT secure for production! Only use for testing.

---

## Frontend URL Changes

If your frontend URL changes, update in **3 places**:

1. **Backend `vercel.json`:**
   ```json
   "value": "https://your-new-frontend-url.vercel.app"
   ```

2. **Backend `server.ts`:**
   ```typescript
   const allowedOrigins = [
     'https://your-new-frontend-url.vercel.app',
     // ...
   ];
   ```

3. **Vercel Environment Variables:**
   ```
   FRONTEND_URL=https://your-new-frontend-url.vercel.app
   ```

Then redeploy the backend.

---

## Troubleshooting

### Issue: Still getting CORS error after deployment

**Solution 1: Clear Cache**
```bash
# Force clear Vercel cache
vercel --force
```

**Solution 2: Check Deployment Logs**
1. Go to Vercel Dashboard
2. Click on the failed deployment
3. Check "Build Logs" for errors
4. Check "Function Logs" for runtime errors

**Solution 3: Verify Headers**
Use browser DevTools:
1. Open Network tab
2. Reload page
3. Click on failed request
4. Check "Response Headers"
5. Ensure CORS headers are present

### Issue: `cache-control` vs `Cache-Control` mismatch

**Fixed:** We now accept both cases in the allowed headers.

### Issue: Preflight OPTIONS request failing

**Solution:** Ensure your API routes handle OPTIONS:

```typescript
// In your routes file
router.options('*', cors()); // Enable pre-flight for all routes
```

---

## Best Practices

### 1. Use Specific Origins
✅ **Good:**
```json
"value": "https://2xg-dashboard-pi.vercel.app"
```

❌ **Bad (Insecure):**
```json
"value": "*"
```

### 2. List All Production Domains
If you have multiple frontends:

```typescript
const allowedOrigins = [
  'https://2xg-dashboard-pi.vercel.app',
  'https://2xg-erp.vercel.app',
  'https://admin.2xg.com',
  // Add all your domains
];
```

### 3. Environment-Based Configuration
```typescript
const allowedOrigins = process.env.NODE_ENV === 'production'
  ? ['https://2xg-dashboard-pi.vercel.app']
  : ['http://localhost:3000', 'http://localhost:3001'];
```

### 4. Add Credentials Only When Needed
Only set `credentials: true` if you're using cookies or authentication headers.

---

## Verification Checklist

After deployment, verify:

- [ ] Backend deployed successfully
- [ ] Frontend can reach backend health endpoint
- [ ] Items load on frontend (no CORS error)
- [ ] Login works
- [ ] All API calls succeed
- [ ] No CORS errors in browser console
- [ ] Response headers include CORS headers

---

## Quick Test Script

Create a file `test-cors.sh`:

```bash
#!/bin/bash

BACKEND_URL="https://backend-rhi-cyan-56.vercel.app"
FRONTEND_URL="https://2xg-dashboard-pi.vercel.app"

echo "Testing CORS for $BACKEND_URL"
echo "Origin: $FRONTEND_URL"
echo ""

curl -H "Origin: $FRONTEND_URL" \
     -H "Access-Control-Request-Method: GET" \
     -H "Access-Control-Request-Headers: Content-Type" \
     -X OPTIONS \
     --verbose \
     $BACKEND_URL/api/items 2>&1 | grep -i "access-control"

echo ""
echo "If you see Access-Control-* headers, CORS is working!"
```

Run:
```bash
chmod +x test-cors.sh
./test-cors.sh
```

---

## Summary

**What was the problem?**
- Vercel serverless functions need explicit CORS headers in `vercel.json`
- Express CORS middleware alone isn't enough for Vercel

**What did we fix?**
1. ✅ Added CORS headers to `vercel.json`
2. ✅ Updated allowed headers in `server.ts`
3. ✅ Added exposed headers for better compatibility

**What to do now?**
1. Commit and push changes
2. Wait for Vercel to redeploy (or trigger manual redeploy)
3. Test your frontend - items should load!

---

## Need Help?

If issues persist:
1. Check Vercel Function Logs
2. Test CORS with curl (see above)
3. Verify environment variables
4. Clear browser cache and try again

---

**Last Updated:** 2026-01-27
**Status:** ✅ Ready to Deploy
