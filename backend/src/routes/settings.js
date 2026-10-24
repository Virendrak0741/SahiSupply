// SahiSupply AI — Settings & Assumptions Routes
const express = require("express");
const router = express.Router();
const Store = require("../models/store");

// GET /api/settings
router.get("/", (req, res) => {
  try {
    const settings = Store.getSettings();
    const auditLogs = Store.getAuditLogs().slice(-20);
    res.json({ success: true, settings, auditLogs });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/settings
router.put("/", (req, res) => {
  try {
    const updated = Store.updateSettings(req.body);
    res.json({ success: true, message: "Settings updated successfully", settings: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/settings/reset
router.post("/reset", (req, res) => {
  try {
    Store.resetDatabase();
    res.json({ success: true, message: "Database reseeded successfully with realistic demo dataset." });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
