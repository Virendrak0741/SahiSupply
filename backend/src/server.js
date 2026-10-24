// SahiSupply AI — Enterprise Distribution Intelligence Engine Backend
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const path = require("path");

const inventoryRoutes = require("./routes/inventory");
const warehouseRoutes = require("./routes/warehouses");
const forecastRoutes = require("./routes/forecasts");
const optimizerRoutes = require("./routes/optimizer");
const shipmentRoutes = require("./routes/shipments");
const analyticsRoutes = require("./routes/analytics");
const settingsRoutes = require("./routes/settings");
const databaseRoutes = require("./routes/database");
const locationRoutes = require("./routes/locations");

const app = express();
const PORT = process.env.PORT || 5001;

// Middlewares
app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(morgan("dev"));

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    status: "healthy",
    engine: "SahiSupply AI Optimization Server",
    version: "1.0.0",
    timestamp: new Date().toISOString()
  });
});

// Mount Routes
app.use("/api/inventory", inventoryRoutes);
app.use("/api/warehouses", warehouseRoutes);
app.use("/api/forecast", forecastRoutes);
app.use("/api/optimize", optimizerRoutes);
app.use("/api/shipments", shipmentRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/database", databaseRoutes);
app.use("/api/locations", locationRoutes);

// Serve frontend static build if available
const frontendDist = path.join(__dirname, "../../frontend/dist");
app.use(express.static(frontendDist));

app.get("*", (req, res, next) => {
  if (req.path.startsWith("/api/")) return next();
  const indexPath = path.join(frontendDist, "index.html");
  res.sendFile(indexPath, (err) => {
    if (err) next();
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error("❌ Global Server Error:", err);
  res.status(500).json({
    success: false,
    error: err.message || "Internal server error occurred."
  });
});

app.listen(PORT, () => {
  console.log(`\n======================================================`);
  console.log(`🚀 SahiSupply AI Backend running on http://localhost:${PORT}`);
  console.log(`📡 Endpoints active:`);
  console.log(`   - Inventory & Batches:  http://localhost:${PORT}/api/inventory/overview`);
  console.log(`   - Warehouses:           http://localhost:${PORT}/api/warehouses`);
  console.log(`   - AI Demand Forecast:   http://localhost:${PORT}/api/forecast/generate`);
  console.log(`   - AI Optimizer:         http://localhost:${PORT}/api/optimize/run`);
  console.log(`   - Shipments Tracker:    http://localhost:${PORT}/api/shipments`);
  console.log(`   - Executive Analytics:  http://localhost:${PORT}/api/analytics/dashboard`);
  console.log(`======================================================\n`);
});
