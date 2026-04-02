# 🔧 Vercel Login Issues - Fix Checklist

## Step 1: Check if Admin User Exists
Open your Vercel deployed URL and open **Developer Console (F12)**. Paste this:

```javascript
fetch('/api/health').then(r => r.json()).then(d => console.log(d))
```

**Expected:** Should return `{ status: "running", mongo: "connected" }`

If mongo says "disconnected", then MongoDB connection is failing.

---

## Step 2: Initialize Admin User on Vercel

In the same browser console, paste:

```javascript
fetch('/api/auth/init', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' }
}).then(r => r.json()).then(d => console.log(d))
```

**Expected:** `{ success: true, message: "Admin created..." }`

If you get "Admin already exists", that's OK - move to Step 3.

---

## Step 3: Try Login with Debug Info

1. Open browser console (F12)
2. Go to your Vercel app and try to login
3. Check console for the error message
4. Look for these hints:

| Error | Cause | Fix |
|-------|-------|-----|
| `Cannot find module 'mongoose'` | Missing dependencies | Redeploy or run npm install |
| `MONGO_URI not set` | Environment variables missing | Add to Vercel dashboard |
| `Wrong credentials` | Admin user password wrong | Check MongoDB manually |
| `network error` | API not responding | Check vercel.json routes |

---

## Step 4: Verify Vercel Environment Variables

Go to **Vercel Dashboard** → Your Project → **Settings** → **Environment Variables**

Make sure these are set:
- ✅ `MONGO_URI` = `mongodb+srv://admin:1234@cluster1.cqfmraj.mongodb.net/hms`
- ✅ `CLIENT_URL` = Your Vercel URL (e.g., `https://your-app.vercel.app`)

---

## Step 5: Check Vercel Build Logs

1. Go to your Vercel project
2. Click **Deployments**
3. Click the latest deployment
4. Click **Logs** → Look for any build errors
5. Check for "MongoDB Connection" message

---

## Step 6: Redeploy if Needed

If you made changes locally:

```powershell
cd "d:\Project\Capstone Project HMS"
git add .
git commit -m "Fix Vercel deployment"
git push origin main
```

Vercel will auto-redeploy.

---

## Common Issues & Solutions

### Issue: "Admin not found" on Vercel
**Solution:** Run `/api/auth/init` in browser console (see Step 2 above)

### Issue: MongoDB connection fails
**Solution:** 
- Check IP whitelist in MongoDB Atlas
- Add `0.0.0.0/0` to allow all IPs
- Verify `MONGO_URI` environment variable

### Issue: 404 on `/api/auth/login`
**Solution:** Check `vercel.json` routes - should have `/api/*` → `/api/index.js`

### Issue: CORS errors in console
**Solution:** Make sure `CLIENT_URL` environment variable is set correctly on Vercel

---

## Test Endpoints

Once admin is initialized, test these in browser console:

```javascript
// Test login
fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ username: 'admin', password: 'admin123' })
}).then(r => r.json()).then(d => console.log(d))

// Get dashboard data
fetch('/api/dashboard').then(r => r.json()).then(d => console.log(d))

// Get rooms
fetch('/api/rooms').then(r => r.json()).then(d => console.log(d))
```

---

## Still Not Working?

1. Share the **exact error message** from browser console
2. Check Vercel logs for backend errors
3. Verify environment variables are actually set (not just added, but saved)
4. Try a fresh redeploy
