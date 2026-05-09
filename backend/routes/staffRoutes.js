const express = require("express");
const router = express.Router();
const Staff = require("../models/staff");

// Get all staff
router.get("/", async (req, res, next) => {
    try {
        const staffList = await Staff.find().sort({ createdAt: -1 });
        res.json(staffList);
    } catch (error) {
        next(error);
    }
});

// Get staff by ID
router.get("/:id", async (req, res, next) => {
    try {
        const staff = await Staff.findById(req.params.id);
        if (!staff) return res.status(404).json({ message: "Staff not found" });
        res.json(staff);
    } catch (error) {
        next(error);
    }
});

// Add staff
router.post("/", async (req, res, next) => {
    try {
        const newStaff = new Staff(req.body);
        await newStaff.save();
        res.status(201).json(newStaff);
    } catch (error) {
        next(error);
    }
});

// Remove staff
router.delete("/:id", async (req, res, next) => {
    try {
        const removed = await Staff.findByIdAndDelete(req.params.id);
        if (!removed) return res.status(404).json({ message: "Staff not found" });
        res.json({ message: "Staff removed" });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
