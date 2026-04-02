// Simple Vercel API function
export default function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const { pathname } = new URL(req.url, `http://${req.headers.host}`);

  // Health check
  if (pathname === '/api/health' && req.method === 'GET') {
    res.status(200).json({
      status: "API is working",
      timestamp: new Date().toISOString(),
      env: process.env.NODE_ENV || "development"
    });
    return;
  }

  // Test endpoint
  if (pathname === '/api/test' && req.method === 'GET') {
    res.status(200).json({
      message: "API test successful",
      timestamp: new Date().toISOString()
    });
    return;
  }

  // Login endpoint
  if (pathname === '/api/auth/login' && req.method === 'POST') {
    try {
      const { username, password } = req.body;

      if (username === "admin" && password === "admin123") {
        res.status(200).json({
          success: true,
          message: "Login successful",
          user: { username: "admin", role: "admin" }
        });
      } else {
        res.status(200).json({
          success: false,
          message: "Invalid credentials"
        });
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Server error",
        error: error.message
      });
    }
    return;
  }

  // Dashboard endpoint
  if (pathname === '/api/dashboard' && req.method === 'GET') {
    res.status(200).json({
      totalRooms: 10,
      bookedRooms: 3,
      availableRooms: 7,
      totalBookings: 5,
      recentBookings: []
    });
    return;
  }

  // Rooms endpoint
  if (pathname === '/api/rooms' && req.method === 'GET') {
    res.status(200).json({
      success: true,
      rooms: [
        { number: 101, status: "available", type: "Single" },
        { number: 102, status: "booked", type: "Double" }
      ]
    });
    return;
  }

  // 404 for unknown routes
  res.status(404).json({ error: "API endpoint not found" });
}