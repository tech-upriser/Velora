const express = require("express");
const router = express.Router();
const { optimizeRoute } = require("../controllers/routeController");

router.post("/optimize-route", optimizeRoute);

module.exports = router;