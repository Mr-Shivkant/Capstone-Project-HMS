const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema({
    roomNumber: {
        type: Number,
        required: true
    },
    customers: [
        {
            name: String,
            age: Number,
            gender: String,
            address: String,
            idType: String,
            idNumber: String
        }
    ],
    status: {
        type: String,
        enum: ["Booked", "Checked-In", "Checked-Out"],
        default: "Booked"
    },
    checkInTime: Date,
    checkOutTime: Date
}, { timestamps: true });

module.exports = mongoose.model("Booking", bookingSchema);