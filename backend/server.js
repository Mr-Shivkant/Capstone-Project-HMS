const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const app = express();
const dns = require("dns");
dns.setServers(['1.1.1.1', '8.8.8.8']);

const authRoutes = require("./routes/authRoutes");
const roomRoutes = require("./routes/roomRoutes");
const bookingRoutes = require("./routes/bookingRoutes");

// ✅ Middleware
app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/rooms", roomRoutes);
app.use("/api/bookings", bookingRoutes);

// ✅ MongoDB Connection
mongoose.connect("mongodb+srv://admin:1234@cluster1.cqfmraj.mongodb.net/hms")
.then(() => console.log("MongoDB Connected ✅"))
.catch(err => console.log(err));

// ✅ Test Route
app.get("/", (req, res) => {
    res.send("HMS Backend Running 🚀");
});



// ✅ Start Server
app.listen(5000, () => {
    console.log("Server running on port 5000");
});