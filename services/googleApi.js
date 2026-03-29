const axios = require("axios");
 
const API_KEY = process.env.GOOGLE_API_KEY;
 
// ✅ Fetch top tourist places
exports.getTouristPlaces = async (city) => {
    try {
        const url = `https://maps.googleapis.com/maps/api/place/textsearch/json`;
 
        const response = await axios.get(url, {
            params: {
                query: `tourist attractions in ${city}`,
                key: API_KEY
            }
        });
 
        let places = response.data.results.map(place => ({
            name: place.name,
            rating: place.rating || 0,
            lat: place.geometry.location.lat,
            lng: place.geometry.location.lng
        }));
 
        places.sort((a, b) => b.rating - a.rating);
        return places.slice(0, 10);
 
    } catch (error) {
        console.error("Error fetching places:", error.message);
        return [];
    }
};
 
// ✅ Distance Matrix API — returns real travel times between ordered places
exports.getDistanceMatrix = async (places) => {
    try {
        const coords = places.map(p => `${p.lat},${p.lng}`);
        const origins = coords.join("|");
        const destinations = coords.join("|");
 
        const url = `https://maps.googleapis.com/maps/api/distancematrix/json`;
 
        const response = await axios.get(url, {
            params: {
                origins,
                destinations,
                key: API_KEY,
                mode: "driving",
                units: "metric"
            }
        });
 
        const rows = response.data.rows;
 
        // Build NxN matrix of distances in metres
        const matrix = rows.map(row =>
            row.elements.map(el =>
                el.status === "OK" ? el.distance.value : Infinity
            )
        );
 
        // Also build NxN matrix of durations in seconds
        const durationMatrix = rows.map(row =>
            row.elements.map(el =>
                el.status === "OK" ? el.duration.value : Infinity
            )
        );
 
        return { matrix, durationMatrix };
 
    } catch (error) {
        console.error("Distance Matrix error:", error.message);
        return null;
    }
};