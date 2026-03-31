const mongoose = require("mongoose");

const roomSchema = new mongoose.Schema({
    number: {
        type: Number,
        required: true,
        unique: true
    },
    type: {
        type: String,
        required: true,
        enum: ["AC", "Non-AC"]
    },
    seater: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ["available", "booked"],
        default: "available"
    },
    cleaningStatus: {
        type: String,
        enum: ["Clean", "Needs Cleaning"],
        default: "Clean"
    }
}, { timestamps: true });

module.exports = mongoose.model("Room", roomSchema);