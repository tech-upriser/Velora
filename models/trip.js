const mongoose = require("mongoose");
 
const TripSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    city: String,
    places: Array,
    totalDistanceKm: Number
}, { timestamps: true });
 
module.exports = mongoose.model("Trip", TripSchema);