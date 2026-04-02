// api/index.js - Vercel serverless function entry point
require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dns = require("dns");

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://admin:1234@cluster1.cqfmraj.mongodb.net/hms";
const CLIENT_URL = process.env.CLIENT_URL || "*";

dns.setServers(["1.1.1.1", "8.8.8.8"]);

const app = express();

// ✅ Middleware
const corsOptions = {
    origin: CLIENT_URL === "*" ? "*" : CLIENT_URL,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
};
app.use(cors(corsOptions));
app.use(express.json());

// ✅ Import Routes
const authRoutes = require("../backend/routes/authRoutes");
const roomRoutes = require("../backend/routes/roomRoutes");
const bookingRoutes = require("../backend/routes/bookingRoutes");
const staffRoutes = require("../backend/routes/staffRoutes");

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
        res.status(500).json({ error: error.message });
    }
});

// ✅ Health Check
app.get("/health", (req, res) => {
    res.json({ status: "HMS Backend Running 🚀" });
});

// ✅ MongoDB Connection
mongoose.connect(MONGO_URI)
    .then(() => console.log("MongoDB Connected ✅"))
    .catch(err => {
        console.error("MongoDB Connection Error:", err.message);
        // Don't exit process - Vercel needs it running
    });

// ✅ Export for Vercel
module.exports = app;
