// api/index.js - Simple Vercel serverless function
const express = require("express");

const app = express();

// Allow all origins for now
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        res.sendStatus(200);
    } else {
        next();
    }
});
app.use(express.json());

// Simple health check
app.get("/health", (req, res) => {
    res.json({
        status: "API is working",
        timestamp: new Date().toISOString(),
        env: process.env.NODE_ENV || "development"
    });
});

// Simple test endpoint
app.get("/test", (req, res) => {
    res.json({
        message: "API test successful",
        timestamp: new Date().toISOString()
    });
});

// Login endpoint
app.post("/auth/login", (req, res) => {
    try {
        const { username, password } = req.body;

        // Simple hardcoded login for testing
        if (username === "admin" && password === "admin123") {
            res.json({
                success: true,
                message: "Login successful",
                user: { username: "admin", role: "admin" }
            });
        } else {
            res.json({
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
});

// Initialize admin endpoint
app.post("/auth/init", (req, res) => {
    res.json({
        success: true,
        message: "Admin initialized (simplified version)"
    });
});

// Dashboard endpoint
app.get("/dashboard", (req, res) => {
    res.json({
        totalRooms: 10,
        bookedRooms: 3,
        availableRooms: 7,
        totalBookings: 5,
        recentBookings: []
    });
});

// Rooms endpoint
app.get("/rooms", (req, res) => {
    res.json({
        success: true,
        rooms: [
            { number: 101, status: "available", type: "Single" },
            { number: 102, status: "booked", type: "Double" }
        ]
    });
});

// Export for Vercel
module.exports = app;
});

// Error handler
app.use((err, req, res, next) => {
    console.error("API Error:", err);
    res.status(500).json({ error: err.message });
});

// Export for Vercel
module.exports = app;
