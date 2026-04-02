const express = require("express");
const router = express.Router();
const Booking = require("../models/booking");
const Room = require("../models/room");

// Create booking
router.post("/", async (req, res, next) => {
    try {
        const room = await Room.findOne({ number: req.body.roomNumber });
        if (!room) {
            return res.status(404).json({ message: "Room not found" });
        }

        if (room.status === "booked") {
            return res.status(400).json({ message: "Room is already booked" });
        }

        const booking = new Booking(req.body);
        await booking.save();

        room.status = "booked";
        await room.save();

        res.status(201).json({ message: "Booking successful", booking });
    } catch (error) {
        next(error);
    }
});

// Get bookings
router.get("/", async (req, res, next) => {
    try {
        const bookings = await Booking.find();
        res.json(bookings);
    } catch (error) {
        next(error);
    }
});

// Get booking by id
router.get("/:id", async (req, res, next) => {
    try {
        const booking = await Booking.findById(req.params.id);
        if (!booking) return res.status(404).json({ message: "Booking not found" });
        res.json(booking);
    } catch (error) {
        next(error);
    }
});

router.put("/:id/checkin", async (req, res, next) => {
    try {
        const booking = await Booking.findById(req.params.id);
        if (!booking) return res.status(404).json({ message: "Booking not found" });
        if (booking.status !== "Booked") return res.status(400).json({ message: "Only booked rooms can check in." });

        booking.status = "Checked-In";
        booking.checkInTime = req.body.time ? new Date(req.body.time) : new Date();
        await booking.save();
        res.json(booking);
    } catch (error) {
        next(error);
    }
});

router.put("/:id/checkout", async (req, res, next) => {
    try {
        const booking = await Booking.findById(req.params.id);
        if (!booking) return res.status(404).json({ message: "Booking not found" });
        if (booking.status !== "Checked-In") return res.status(400).json({ message: "Only checked-in rooms can check out." });

        booking.status = "Checked-Out";
        booking.checkOutTime = req.body.time ? new Date(req.body.time) : new Date();
        await booking.save();

        const room = await Room.findOne({ number: booking.roomNumber });
        if (room) {
            room.status = "available";
            await room.save();
        }

        res.json(booking);
    } catch (error) {
        next(error);
    }
});

module.exports = router;