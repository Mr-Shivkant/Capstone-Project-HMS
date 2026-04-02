const express = require("express");
const router = express.Router();
const User = require("../models/user");

// ✅ Initialize Admin User (run once)
router.post("/init", async (req, res) => {
    try {
        const adminExists = await User.findOne({ username: "admin" });
        
        if (adminExists) {
            return res.json({ success: false, message: "Admin already exists" });
        }

        const admin = new User({
            username: "admin",
            password: "admin123"  // Change this to a strong password
        });

        await admin.save();
        res.json({ success: true, message: "Admin created: username=admin, password=admin123" });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
});

router.post("/login", async (req, res) => {
    console.log("BODY:", req.body); // DEBUG

    const { username, password } = req.body;

    const admin = await User.findOne({ username: "admin" });

    console.log("ADMIN FROM DB:", admin); // DEBUG

    if (!admin) {
        return res.json({ success: false, message: "Admin not found. Initialize with POST /api/auth/init" });
    }

    if (username === admin.username && password === admin.password) {
        res.json({ success: true, message: "Login Success" });
    } else {
        res.json({ success: false, message: "Wrong credentials" });
    }
});

module.exports = router;