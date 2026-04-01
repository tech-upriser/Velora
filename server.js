require("dotenv").config();
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");

const connectDB = require("./config/db");
const startNotificationJob = require("./jobs/notificationJob");

const app = express();

// ✅ Middleware
app.use(express.json());
app.use(morgan("dev"));
app.use(cors({ origin: "http://localhost:5173" }));

// ✅ DB connection
connectDB();

// ✅ Jobs
startNotificationJob();

// ✅ Routes
const authRoutes         = require("./routes/authRoutes");
const tripRoutes         = require("./routes/tripRoutes");
const placeRoutes        = require("./routes/placeRoutes");
const routeRoutes        = require("./routes/routeRoutes");
const analyticsRoutes    = require("./routes/analyticRoutes");
const reviewRoutes       = require("./routes/reviewRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const alertRoutes        = require("./routes/alertRoutes");
const sosRoutes          = require("./routes/sosRoutes");

// Mount routes
app.use("/api", authRoutes);
app.use("/api", tripRoutes);
app.use("/api", placeRoutes);
app.use("/api", routeRoutes);
app.use("/api", analyticsRoutes);
app.use("/api", reviewRoutes);
app.use("/api", notificationRoutes);
app.use("/api", alertRoutes);
app.use("/api", sosRoutes);

// Root route
app.get("/", (req, res) => {
  res.json({ message: "Velora backend running" });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
