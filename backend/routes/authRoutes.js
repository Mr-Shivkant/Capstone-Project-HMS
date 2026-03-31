const express = require("express");
const router = express.Router();
const User = require("../models/user");

router.post("/login", async (req, res) => {
    console.log("BODY:", req.body); // DEBUG

    const { username, password } = req.body;

    const admin = await User.findOne({ username: "admin" });

    console.log("ADMIN FROM DB:", admin); // DEBUG

    if (!admin) {
        return res.json({ success: false, message: "Admin not found" });
    }

    if (username === admin.username && password === admin.password) {
        res.json({ success: true, message: "Login Success" });
    } else {
        res.json({ success: false, message: "Wrong credentials" });
    }
});

module.exports = router;