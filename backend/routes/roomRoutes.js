const express = require("express");
const router = express.Router();
const Room = require("../models/room");

// Get all rooms
router.get("/", async (req, res) => {
    const rooms = await Room.find();
    res.json(rooms);
});

// Add room
router.post("/", async (req, res) => {
    const newRoom = new Room(req.body);
    await newRoom.save();
    res.json(newRoom);
});

module.exports = router;