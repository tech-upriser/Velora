const { getDistanceMatrix } = require("../services/googleApi");
const { nearestNeighborMatrix, nearestNeighbor, totalRouteDistance } = require("../utils/tsp");
 
exports.optimizeRoute = async (req, res) => {
    try {
        const { places } = req.body;
 
        if (!places || places.length < 2) {
            return res.status(400).json({ error: "At least 2 places required" });
        }
 
        const taggedPlaces = places.map((p, i) => ({ ...p, _originalIndex: i }));
 
        let optimizedRoute;
        let distanceKm;
        let usedRealData = false;
 
        const distanceData = await getDistanceMatrix(places);
 
        if (distanceData && distanceData.matrix) {
            optimizedRoute = nearestNeighborMatrix(taggedPlaces, distanceData.matrix);
            distanceKm = totalRouteDistance(optimizedRoute, distanceData.matrix);
            usedRealData = true;
        } else {
            optimizedRoute = nearestNeighbor(taggedPlaces);
            distanceKm = totalRouteDistance(optimizedRoute, null);
        }
 
        res.json({
            optimizedRoute,
            summary: {
                totalDistanceKm: parseFloat(distanceKm),
                dataSource: usedRealData ? "Google Distance Matrix" : "Haversine (fallback)"
            }
        });
 
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}