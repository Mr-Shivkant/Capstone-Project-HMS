const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema({
    roomNumber: Number,
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
        default: "Booked"
    }
});

module.exports = mongoose.model("Booking", bookingSchema);