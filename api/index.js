// api/index.js - Simple Vercel serverless function
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();

// Allow all origins for now
app.use(cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
}));
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
app.post("/auth/login", async (req, res) => {
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
app.post("/auth/init", async (req, res) => {
    try {
        // For now, just return success
        res.json({
            success: true,
            message: "Admin initialized (simplified version)"
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Init error",
            error: error.message
        });
    }
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
