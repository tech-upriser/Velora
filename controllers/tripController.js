const Trip = require("../models/trip");
const Notification = require("../models/Notification");
const { getWeather } = require("../services/weatherApi");
 
// ✅ SAVE TRIP
exports.saveTrip = async (req, res) => {
    try {
        const { city, places } = req.body;
 
        if (!city || !places || places.length === 0) {
            return res.status(400).json({ error: "Invalid trip data" });
        }
 
        const trip = new Trip({ city, places, userId: req.userId });
        await trip.save();
 
        // ✅ Notify user on save
        await Notification.create({
            userId: req.userId,
            type: "trip_saved",
            message: `Your trip to ${city} has been saved!`
        });
 
        res.json(trip);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
 
// ✅ GET TRIPS with search + filter
exports.getTrips = async (req, res) => {
    try {
        const { city, from, to } = req.query;
 
        const query = { userId: req.userId };
 
        // ✅ Filter by city (case-insensitive)
        if (city) {
            query.city = { $regex: city, $options: "i" };
        }
 
        // ✅ Filter by date range
        if (from || to) {
            query.createdAt = {};
            if (from) query.createdAt.$gte = new Date(from);
            if (to)   query.createdAt.$lte = new Date(to);
        }
 
        const trips = await Trip.find(query).sort({ createdAt: -1 });
        res.json(trips);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
 
// ✅ GET SINGLE TRIP with weather
exports.getTrip = async (req, res) => {
    try {
        const trip = await Trip.findOne({
            _id: req.params.id,
            userId: req.userId
        });
 
        if (!trip) return res.status(404).json({ error: "Trip not found" });
 
        // ✅ Fetch live weather for the trip city
        const weather = await getWeather(trip.city);
 
        res.json({ trip, weather });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
 
// ✅ DELETE TRIP
exports.deleteTrip = async (req, res) => {
    try {
        const trip = await Trip.findOneAndDelete({
            _id: req.params.id,
            userId: req.userId
        });
 
        if (!trip) return res.status(404).json({ error: "Trip not found" });
 
        res.json({ message: "Trip deleted successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
 
// ✅ UPDATE TRIP
exports.updateTrip = async (req, res) => {
    try {
        const { city, places } = req.body;
 
        if (!city || !places || places.length === 0) {
            return res.status(400).json({ error: "Invalid trip data" });
        }
 
        const trip = await Trip.findOneAndUpdate(
            { _id: req.params.id, userId: req.userId },
            { city, places },
            { new: true }
        );
 
        if (!trip) return res.status(404).json({ error: "Trip not found" });
 
        res.json(trip);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
 
// ✅ DUPLICATE TRIP
exports.duplicateTrip = async (req, res) => {
    try {
        const original = await Trip.findOne({
            _id: req.params.id,
            userId: req.userId
        });
 
        if (!original) return res.status(404).json({ error: "Trip not found" });
 
        const duplicate = new Trip({
            city: original.city,
            places: original.places,
            totalDistanceKm: original.totalDistanceKm,
            userId: req.userId
        });
 
        await duplicate.save();
        res.json(duplicate);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};