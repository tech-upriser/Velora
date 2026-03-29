// ─────────────────────────────────────────────────────────────────────────────
// routes/placeRoutes.js
// Wire up the three endpoints consumed by Trips.jsx
// ─────────────────────────────────────────────────────────────────────────────

const express = require("express");
const router  = express.Router();

const {
    getPlaces,
    getWeatherForecast,
    optimizeRoute,
} = require("../controllers/placeController");

// ── Google Places ──────────────────────────────────────────────────────────
// GET /api/places/:city
// Trips.jsx: fetch(`${BASE_URL}/places/${encodeURIComponent(searchCity)}`)
router.get("/places/:city", getPlaces);

// ── OpenWeatherMap ─────────────────────────────────────────────────────────
// GET /api/weather/:city
// Trips.jsx: fetch(`${BASE_URL}/weather/${encodeURIComponent(searchCity)}`)
router.get("/weather/:city", getWeatherForecast);

// ── Route Optimizer (Google Distance Matrix) ───────────────────────────────
// POST /api/route/optimize
// Body: { locations: [{ name, rating, lat, lng }, ...] }
// Trips.jsx: fetch(`${BASE_URL}/route/optimize`, { method: "POST", body: ... })
router.post("/route/optimize", optimizeRoute);

module.exports = router;