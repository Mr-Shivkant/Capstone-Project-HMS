// 🔧 HMS Vercel Debug Script
// Run this in your browser console (F12) on your Vercel deployed site

console.log("🚀 HMS Vercel Debug Script");
console.log("Current URL:", window.location.origin);
console.log("API_BASE:", window.API_BASE || "Not set");

// Step 1: Test Health Check
console.log("\n📊 Step 1: Testing Health Check...");
fetch('/api/health')
  .then(r => r.json())
  .then(d => {
    console.log("✅ Health Check Response:", d);
    if (d.mongo !== "connected") {
      console.error("❌ MongoDB not connected! Check environment variables.");
    }
  })
  .catch(e => console.error("❌ Health Check Failed:", e));

// Step 2: Initialize Admin User
console.log("\n👤 Step 2: Initializing Admin User...");
fetch('/api/auth/init', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' }
})
  .then(r => r.json())
  .then(d => {
    console.log("✅ Admin Init Response:", d);
    if (d.success) {
      console.log("🎉 Admin user created! Username: admin, Password: admin123");
    } else {
      console.log("ℹ️ Admin user already exists or error:", d.message);
    }
  })
  .catch(e => console.error("❌ Admin Init Failed:", e));

// Step 3: Test Login
console.log("\n🔐 Step 3: Testing Login...");
setTimeout(() => {
  fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'admin', password: 'admin123' })
  })
    .then(r => r.json())
    .then(d => {
      console.log("✅ Login Response:", d);
      if (d.success) {
        console.log("🎉 Login successful! You can now access dashboard.");
        // Auto redirect after successful login
        setTimeout(() => {
          window.location.href = 'dashboard.html';
        }, 1000);
      } else {
        console.error("❌ Login failed:", d.message);
      }
    })
    .catch(e => console.error("❌ Login Request Failed:", e));
}, 2000);

// Step 4: Test Dashboard Data
console.log("\n📈 Step 4: Testing Dashboard Data...");
setTimeout(() => {
  fetch('/api/dashboard')
    .then(r => r.json())
    .then(d => {
      console.log("✅ Dashboard Response:", d);
    })
    .catch(e => console.error("❌ Dashboard Request Failed:", e));
}, 3000);

// Step 5: Test Rooms Data
console.log("\n🏨 Step 5: Testing Rooms Data...");
setTimeout(() => {
  fetch('/api/rooms')
    .then(r => r.json())
    .then(d => {
      console.log("✅ Rooms Response:", d);
    })
    .catch(e => console.error("❌ Rooms Request Failed:", e));
}, 4000);

console.log("\n⏳ Running tests... Check results above in a few seconds.");
console.log("If you see errors, share the exact error messages with me.");