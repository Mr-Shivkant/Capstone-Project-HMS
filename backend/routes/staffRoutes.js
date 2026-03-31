const express = require("express");
const router = express.Router();
const Staff = require("../models/staff");

// Get all staff
router.get("/", async (req, res) => {
    const staffList = await Staff.find().sort({ createdAt: -1 });
    res.json(staffList);
});

// Add staff
router.post("/", async (req, res) => {
    const newStaff = new Staff(req.body);
    await newStaff.save();
    res.json(newStaff);
});

// Remove staff
router.delete("/:id", async (req, res) => {
    await Staff.findByIdAndDelete(req.params.id);
    res.json({ message: "Staff removed" });
});

module.exports = router;
