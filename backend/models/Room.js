const mongoose = require("mongoose");

const roomSchema = new mongoose.Schema({
    number: Number,
    type: String,
    seater: Number,
    status: {
        type: String,
        default: "available"
    }
});

module.exports = mongoose.model("Room", roomSchema);