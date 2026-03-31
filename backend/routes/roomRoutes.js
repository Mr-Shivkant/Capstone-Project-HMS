const express = require("express");
const router = express.Router();
const Room = require("../models/room");

// Get all rooms
router.get("/", async (req, res) => {
    const rooms = await Room.find();
    res.json(rooms.map(room => ({
        ...room.toObject(),
        available: room.status === "available"
    })));
});

// Add room
router.post("/", async (req, res) => {
    try {
        const newRoom = new Room(req.body);
        await newRoom.save();
        res.json(newRoom);
    } catch (error) {
        console.error("Room creation failed:", error.message);
        if (error.code === 11000) {
            return res.status(400).json({ message: "Room number already exists." });
        }
        res.status(400).json({ message: error.message || "Unable to create room." });
    }
});

// Update room fields
router.put("/:id", async (req, res) => {
    const updatedRoom = await Room.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updatedRoom);
});

// Delete room
router.delete("/:id", async (req, res) => {
    await Room.findByIdAndDelete(req.params.id);
    res.json({ message: "Room removed" });
});

module.exports = router;