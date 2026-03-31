const mongoose = require("mongoose");

const staffSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    fatherName: String,
    dob: Date,
    gender: {
        type: String,
        enum: ["Male", "Female", "Other"],
        default: "Male"
    },
    staffType: {
        type: String,
        enum: [
            "Receptionist",
            "Concierge",
            "Night Auditor",
            "Doorkeeper",
            "Executive Housekeeper"
        ],
        required: true
    },
    idType: String,
    idNumber: String
}, { timestamps: true });

module.exports = mongoose.model("Staff", staffSchema);
