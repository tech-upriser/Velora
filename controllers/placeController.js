// ─────────────────────────────────────────────────────────────────────────────
// placesController.js
// Handles:
//   GET  /api/places/:city         → top tourist places via Google Places API
//   GET  /api/weather/:city        → 5-step forecast via OpenWeatherMap API
//   POST /api/route/optimize       → optimized route via Google Distance Matrix
// ─────────────────────────────────────────────────────────────────────────────

const { getTouristPlaces, getDistanceMatrix } = require("../services/googleApi");
const { getWeather } = require("../services/weatherApi");

// ─────────────────────────────────────
// GET /api/places/:city
// Returns top tourist attractions from Google Places API
// Response: [{ name, rating, lat, lng }, ...]
// ─────────────────────────────────────
exports.getPlaces = async (req, res) => {
    try {
        const { city } = req.params;

        if (!city || !city.trim()) {
            return res.status(400).json({ error: "City name is required" });
        }

        // Calls googleApi.js → getTouristPlaces
        const places = await getTouristPlaces(city.trim());

        if (!places || places.length === 0) {
            return res.status(404).json({ error: "No places found for this city" });
        }

        // Returns array: [{ name, rating, lat, lng }, ...]
        res.json(places);

    } catch (err) {
        console.error("getPlaces error:", err.message);
        res.status(500).json({ error: err.message });
    }
};

// ─────────────────────────────────────
// GET /api/weather/:city
// Returns 5-step weather forecast from OpenWeatherMap
// Response: { city, country, forecasts: [{ time, temp, feels_like, condition, description, humidity }] }
// ─────────────────────────────────────
exports.getWeatherForecast = async (req, res) => {
    try {
        const { city } = req.params;

        if (!city || !city.trim()) {
            return res.status(400).json({ error: "City name is required" });
        }

        // Calls weatherApi.js → getWeather
        const weather = await getWeather(city.trim());

        if (!weather) {
            return res.status(404).json({ error: "Weather data not available for this city" });
        }

        // Returns: { city, country, forecasts: [...] }
        res.json(weather);

    } catch (err) {
        console.error("getWeatherForecast error:", err.message);
        res.status(500).json({ error: err.message });
    }
};

// ─────────────────────────────────────
// POST /api/route/optimize
// Body: { locations: [{ name, rating, lat, lng }, ...] }
// Uses Google Distance Matrix to find optimal visiting order (nearest neighbour)
// Response: {
//   route: ["Place A", "Place B", ...],            ← ordered place names
//   details: [{ name, distToNext, timeToNext }, ...]← distance in m, time in s
// }
// ─────────────────────────────────────
exports.optimizeRoute = async (req, res) => {
    try {
        const { locations } = req.body;

        // ── Validate ──
        if (!locations || !Array.isArray(locations) || locations.length < 2) {
            return res.status(400).json({ error: "At least 2 locations with lat/lng are required" });
        }

        // Check all locations have coordinates (from Google Places)
        const hasCoords = locations.every(l => l.lat != null && l.lng != null);

        if (!hasCoords) {
            // Fallback: return locations in given order with no distance details
            return res.json({
                route: locations.map(l => l.name),
                details: null,
            });
        }

        // ── Call Distance Matrix API ──
        const matrixResult = await getDistanceMatrix(locations);

        if (!matrixResult) {
            // Distance Matrix failed — return input order as fallback
            return res.json({
                route: locations.map(l => l.name),
                details: null,
            });
        }

        const { matrix, durationMatrix } = matrixResult;

        // ── Nearest Neighbour TSP (greedy) ──
        // Finds a reasonably short route without solving full TSP
        const n = locations.length;
        const visited = new Array(n).fill(false);
        const order = [];
        let current = 0; // start from first place

        visited[0] = true;
        order.push(0);

        for (let step = 1; step < n; step++) {
            let nearestIdx = -1;
            let nearestDist = Infinity;

            for (let j = 0; j < n; j++) {
                if (!visited[j] && matrix[current][j] < nearestDist) {
                    nearestDist = matrix[current][j];
                    nearestIdx = j;
                }
            }

            if (nearestIdx === -1) break; // all visited
            visited[nearestIdx] = true;
            order.push(nearestIdx);
            current = nearestIdx;
        }

        // ── Build response ──
        const route = order.map(i => locations[i].name);

        // details[i] = { name, distToNext (metres), timeToNext (seconds) }
        // Last element has distToNext = 0 / timeToNext = 0
        const details = order.map((locIdx, i) => {
            const nextLocIdx = order[i + 1];
            if (nextLocIdx === undefined) {
                return { name: locations[locIdx].name, distToNext: 0, timeToNext: 0 };
            }
            return {
                name: locations[locIdx].name,
                distToNext: matrix[locIdx][nextLocIdx],
                timeToNext: durationMatrix[locIdx][nextLocIdx],
            };
        });

        res.json({ route, details });

    } catch (err) {
        console.error("optimizeRoute error:", err.message);
        res.status(500).json({ error: err.message });
    }
};