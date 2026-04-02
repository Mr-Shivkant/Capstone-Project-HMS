// api/index.js - Vercel serverless function entry point
require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dns = require("dns");

dns.setServers(["1.1.1.1", "8.8.8.8"]);

const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://admin:1234@cluster1.cqfmraj.mongodb.net/hms";
const CLIENT_URL = process.env.CLIENT_URL || "*";

console.log("Environment check:");
console.log("MONGO_URI exists:", !!process.env.MONGO_URI);
console.log("CLIENT_URL:", process.env.CLIENT_URL);

const app = express();

// ✅ Middleware - Allow all origins for debugging
const corsOptions = {
    origin: "*",  // Allow all origins temporarily
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true
};
app.use(cors(corsOptions));
app.use(express.json());

// ✅ MongoDB Connection
let mongoConnected = false;
mongoose.connect(MONGO_URI, {
    serverSelectionTimeoutMS: 5000,
    retryWrites: false
})
    .then(() => {
        mongoConnected = true;
        console.log("✅ MongoDB Connected");
    })
    .catch(err => {
        console.error("❌ MongoDB Error:", err.message);
        mongoConnected = false;
    });

// ✅ Health Check
app.get("/health", (req, res) => {
    res.json({
        status: "running",
        mongo: mongoConnected ? "connected" : "disconnected",
        env: process.env.NODE_ENV || "development",
        timestamp: new Date().toISOString()
    });
});

// ✅ Import Routes
const authRoutes = require("../backend/routes/authRoutes");
const roomRoutes = require("../backend/routes/roomRoutes");
const bookingRoutes = require("../backend/routes/bookingRoutes");
const staffRoutes = require("../backend/routes/staffRoutes");

// Use shorter paths for API
app.use("/auth", authRoutes);
app.use("/rooms", roomRoutes);
app.use("/bookings", bookingRoutes);
app.use("/staff", staffRoutes);

// ✅ Dashboard Route
const Room = require("../backend/models/room");
const Booking = require("../backend/models/booking");

app.get("/dashboard", async (req, res) => {
    try {
        const totalRooms = await Room.countDocuments();
        const bookedRooms = await Room.countDocuments({ status: "booked" });
        const availableRooms = totalRooms - bookedRooms;
        const totalBookings = await Booking.countDocuments();

        const recentBookings = await Booking.find()
            .sort({ createdAt: -1 })
            .limit(5)
            .lean();

        const enrichedBookings = await Promise.all(recentBookings.map(async booking => {
            const room = await Room.findOne({ number: booking.roomNumber }).lean();
            return {
                ...booking,
                cleaningStatus: room?.cleaningStatus || "Unknown"
            };
        }));

        res.json({
            totalRooms,
            bookedRooms,
            availableRooms,
            totalBookings,
            recentBookings: enrichedBookings
        });
    } catch (error) {
        console.error("Dashboard error:", error);
        res.status(500).json({ error: error.message });
    }
});

// Error handler
app.use((err, req, res, next) => {
    console.error("API Error:", err);
    res.status(500).json({ error: err.message });
});

// Export for Vercel
module.exports = app;
