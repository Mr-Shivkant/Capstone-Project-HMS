require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const app = express();
const dns = require("dns");

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://admin:1234@cluster1.cqfmraj.mongodb.net/hms";
const CLIENT_URL = process.env.CLIENT_URL || "*";

dns.setServers(["1.1.1.1", "8.8.8.8"]);

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

// ✅ Start Server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

module.exports = app;