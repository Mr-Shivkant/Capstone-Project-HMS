require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const app = express();
const dns = require("dns");

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
    console.error("Missing MONGO_URI environment variable");
    process.exit(1);
}
const CLIENT_URL = process.env.CLIENT_URL || "*";

// Optional public DNS fallbacks (if network-level lookup is needed)
// dns.setServers(["1.1.1.1", "8.8.8.8"]);

const authRoutes = require("./routes/authRoutes");
const roomRoutes = require("./routes/roomRoutes");
const bookingRoutes = require("./routes/bookingRoutes");
const staffRoutes = require("./routes/staffRoutes");
const Room = require("./models/room");
const Booking = require("./models/booking");

// ✅ Middleware
const corsOptions = {
    origin: CLIENT_URL === "*" ? "*" : CLIENT_URL,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
};
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/auth", authRoutes);
app.use("/api/rooms", roomRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/staff", staffRoutes);

app.get("/api/dashboard", async (req, res) => {
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
});

// ✅ MongoDB Connection
mongoose.connect(MONGO_URI)
.then(() => console.log("MongoDB Connected ✅"))
.catch(err => console.log(err));

// ✅ Test Route
app.get("/", (req, res) => {
    res.send("HMS Backend Running 🚀");
});

// 404 handling
app.use((req, res) => {
    res.status(404).json({ success: false, message: "Endpoint not found" });
});

// Error handler
app.use((err, req, res, next) => {
    console.error("Unhandled error:", err);
    res.status(500).json({ success: false, message: "Internal Server Error" });
});

// ✅ Start Server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

process.on("unhandledRejection", (reason, promise) => {
    console.error("Unhandled Rejection at:", promise, "reason:", reason);
});

process.on("uncaughtException", (error) => {
    console.error("Uncaught Exception:", error);
    process.exit(1);
});

module.exports = app;