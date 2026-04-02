const express = require("express");
const router = express.Router();
const Room = require("../models/room");

// Get all rooms
router.get("/", async (req, res, next) => {
    try {
        const rooms = await Room.find();
        res.json(rooms.map(room => ({
            ...room.toObject(),
            available: room.status === "available"
        })));
    } catch (error) {
        next(error);
    }
});

// Add room
router.post("/", async (req, res, next) => {
    try {
        const newRoom = new Room(req.body);
        await newRoom.save();
        res.status(201).json(newRoom);
    } catch (error) {
        console.error("Room creation failed:", error.message);
        if (error.code === 11000) {
            return res.status(400).json({ message: "Room number already exists." });
        }
        next(error);
    }
});

// Update room fields
router.put("/:id", async (req, res, next) => {
    try {
        const updatedRoom = await Room.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!updatedRoom) return res.status(404).json({ message: "Room not found" });
        res.json(updatedRoom);
    } catch (error) {
        next(error);
    }
});

// Delete room
router.delete("/:id", async (req, res, next) => {
    try {
        const removed = await Room.findByIdAndDelete(req.params.id);
        if (!removed) return res.status(404).json({ message: "Room not found" });
        res.json({ message: "Room removed" });
    } catch (error) {
        next(error);
    }
});

module.exports = router;