const express = require("express");
const router = express.Router();
const Booking = require("../models/booking");
const Room = require("../models/room");

// Create booking
router.post("/", async (req, res) => {
    const booking = new Booking(req.body);
    await booking.save();

    // update room status
    await Room.updateOne(
        { number: req.body.roomNumber },
        { status: "booked" }
    );

    res.json({ message: "Booking successful" });
});

// Get bookings
router.get("/", async (req, res) => {
    const bookings = await Booking.find();
    res.json(bookings);
});

module.exports = router;