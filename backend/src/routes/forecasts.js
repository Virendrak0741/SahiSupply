// SahiSupply AI — Demand Forecasting Routes
const express = require("express");
const router = express.Router();
const Store = require("../models/store");
const { generateDemandForecast } = require("../services/forecastingService");

// POST /api/forecast/generate
router.post("/generate", (req, res) => {
  try {
    const {
      productId,
      category,
      region,
      destinationId,
      horizonDays = 7,
      model = "Exponential Smoothing",
      historicalDaysWindow = 60
    } = req.body;

    const forecast = generateDemandForecast({
      productId,
      category,
      region,
      destinationId,
      horizonDays: parseInt(horizonDays, 10),
      model,
      historicalDaysWindow: parseInt(historicalDaysWindow, 10)
    });

    res.json({ success: true, data: forecast });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/forecast/history
router.get("/history", (req, res) => {
  try {
    const forecasts = Store.getForecasts();
    res.json({ success: true, data: forecasts });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/forecast/destinations
router.get("/destinations", (req, res) => {
  try {
    const region = req.query.region;
    const destinations = Store.getDestinations(region);
    res.json({ success: true, data: destinations });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
