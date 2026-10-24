// SahiSupply AI — Database Schema & Collection Explorer Routes
const express = require("express");
const router = express.Router();
const fs = require("fs");
const path = require("path");
const Store = require("../models/store");

const DB_COLLECTIONS_DIR = path.join(__dirname, "../../../database/collections");
const SCHEMA_FILE = path.join(__dirname, "../../../database/schema.sql");

// GET /api/database/summary — Returns collection statistics
router.get("/summary", (req, res) => {
  try {
    const products = Store.getProducts();
    const warehouses = Store.getWarehouses();
    const destinations = Store.getDestinations();
    const batches = Store.getBatches();
    const routes = Store.getRoutes();
    const shipments = Store.getShipments();
    const plans = Store.getDistributionPlans();

    res.json({
      success: true,
      collections: [
        { name: "products", label: "Commercial Products (SKUs)", count: products.length, icon: "Package" },
        { name: "warehouses", label: "Origin Mega Warehouses", count: warehouses.length, icon: "Warehouse" },
        { name: "destinations", label: "Destination Stores & Pharmacies", count: destinations.length, icon: "MapPin" },
        { name: "inventoryBatches", label: "Inventory Batches (FEFO)", count: batches.length, icon: "Boxes" },
        { name: "routes", label: "Logistics Corridors & Freight Rates", count: routes.length, icon: "GitCommit" },
        { name: "shipments", label: "Active & Historic Shipments", count: shipments.length, icon: "Truck" },
        { name: "distributionPlans", label: "AI Distribution Optimization Plans", count: plans.length, icon: "Cpu" }
      ]
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/database/collections/:name — Returns records for specific collection
router.get("/collections/:name", (req, res) => {
  try {
    const { name } = req.params;
    let data = [];

    switch (name) {
      case "products":
        data = Store.getProducts();
        break;
      case "warehouses":
        data = Store.getWarehouses();
        break;
      case "destinations":
        data = Store.getDestinations();
        break;
      case "inventoryBatches":
        data = Store.getBatches();
        break;
      case "routes":
        data = Store.getRoutes();
        break;
      case "shipments":
        data = Store.getShipments();
        break;
      case "distributionPlans":
        data = Store.getDistributionPlans();
        break;
      default:
        return res.status(404).json({ success: false, error: "Collection not found" });
    }

    res.json({ success: true, count: data.length, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/database/schema — Returns SQL DDL script
router.get("/schema", (req, res) => {
  try {
    if (fs.existsSync(SCHEMA_FILE)) {
      const sql = fs.readFileSync(SCHEMA_FILE, "utf8");
      res.json({ success: true, sql });
    } else {
      res.status(404).json({ success: false, error: "schema.sql not found" });
    }
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
