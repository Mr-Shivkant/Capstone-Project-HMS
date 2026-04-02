# Vercel Deployment Guide - HMS (Hotel Management System)

## Prerequisites
- GitHub account with your repo
- Vercel account (free at vercel.com)
- MongoDB cluster (already have: `mongodb+srv://admin:1234@cluster1.cqfmraj.mongodb.net/hms`)

## Step 1: Push to GitHub

```powershell
cd "d:\Project\Capstone Project HMS"
git init
git add .
git commit -m "Initial HMS deployment"
git remote add origin https://github.com/YOUR_USERNAME/capstone-hms.git
git branch -M main
git push -u origin main
```

Replace `YOUR_USERNAME` with your GitHub username.

## Step 2: Deploy to Vercel

1. Go to [vercel.com/new](https://vercel.com/new)
2. Connect your GitHub account
3. Select your `capstone-hms` repository
4. **Important:** In "Environment Variables", add:
   
   ```
   MONGO_URI = mongodb+srv://admin:1234@cluster1.cqfmraj.mongodb.net/hms
   CLIENT_URL = https://your-vercel-url.vercel.app
   ```
   
   (Replace `your-vercel-url` with what Vercel gives you)

5. Click "Deploy"

## Step 3: Initialize Admin User

Once deployed, visit your Vercel URL and:

1. Open browser Developer Console (F12)
2. Paste this command:

```javascript
fetch('/api/auth/init', { 
  method: 'POST',
  headers: { 'Content-Type': 'application/json' }
})
.then(r => r.json())
.then(d => console.log(d))
```

You should see: `"Admin created: username=admin, password=admin123"`

## Step 4: Login

Go to your Vercel URL and login with:
- **Username:** `admin`
- **Password:** `admin123`

---

## Local Development

To test locally before deploying:

```powershell
cd "d:\Project\Capstone Project HMS\backend"
npm install
npm start
```

Then open http://localhost:5500 and login with the credentials above.

---

## Troubleshooting

### Login not working after deployment
- Check Vercel logs: Dashboard → Your Project → Deployments → Logs
- Ensure `MONGO_URI` environment variable is set
- Run the `/api/auth/init` command again

### API returning "Cannot find module"
- Run `npm install` in backend directory
- Redeploy to Vercel

### Dashboard shows "Backend unavailable"
- Clear browser cache (Ctrl+Shift+Del)
- Check that `/api/health` returns status in Vercel logs

---

## Environment Variables Explained

| Variable | Purpose | Example |
|----------|---------|---------|
| `MONGO_URI` | MongoDB connection string | `mongodb+srv://admin:1234@cluster1.cqfmraj.mongodb.net/hms` |
| `CLIENT_URL` | Allowed frontend origin | `https://your-app.vercel.app` |
| `PORT` | Server port (auto 3000 on Vercel) | `5000` (local) |

---

## Change Admin Password

1. MongoDB Atlas → Collections → Users → admin document
2. Edit the `password` field to a strong password
3. Login with new password
