// SahiSupply AI — Warehouses & 3D Layout Routes
const express = require("express");
const router = express.Router();
const Store = require("../models/store");

// GET /api/warehouses
router.get("/", (req, res) => {
  try {
    const region = req.query.region;
    const warehouses = Store.getWarehouses(region);
    const batches = Store.getBatches(region);
    const shipments = Store.getShipments();

    const data = warehouses.map(wh => {
      const whBatches = batches.filter(b => b.warehouseId === wh.id);
      const usedCapacityUnits = whBatches.reduce((s, b) => s + b.totalQuantity, 0);
      const availableCapacityUnits = Math.max(0, wh.totalCapacityUnits - usedCapacityUnits);
      const utilizationPercent = Math.round((usedCapacityUnits / wh.totalCapacityUnits) * 100);

      const uniqueSKUs = new Set(whBatches.map(b => b.productId)).size;
      const nearExpiryUnits = whBatches.filter(b => b.daysUntilExpiry <= 14).reduce((s, b) => s + b.availableQuantity, 0);
      const coldChainUnits = whBatches.filter(b => b.isColdChainRequired).reduce((s, b) => s + b.totalQuantity, 0);

      const inboundCount = shipments.filter(s => s.destinationId === wh.id && s.status !== "Delivered").length;
      const outboundCount = shipments.filter(s => s.sourceWarehouseId === wh.id && s.status !== "Delivered").length;

      return {
        ...wh,
        usedCapacityUnits,
        availableCapacityUnits,
        utilizationPercent,
        uniqueSKUs,
        totalInventoryUnits: usedCapacityUnits,
        nearExpiryUnits,
        coldChainUnits,
        activeInboundShipments: wh.activeInboundShipments + inboundCount,
        activeOutboundShipments: wh.activeOutboundShipments + outboundCount
      };
    });

    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/warehouses/:id — Detail with 3D Racks and Zones
router.get("/:id", (req, res) => {
  try {
    const wh = Store.getWarehouseById(req.params.id);
    if (!wh) return res.status(404).json({ success: false, error: "Warehouse not found" });

    const batches = Store.getBatches().filter(b => b.warehouseId === wh.id);
    const usedCapacityUnits = batches.reduce((s, b) => s + b.totalQuantity, 0);

    // Realistic warehouse zones for 3D rack visualization
    const zones = [
      {
        id: "ZONE-A",
        name: "Zone A: Ambient FMCG & Snacks",
        tempRange: "Ambient (20-25°C)",
        capacityUnits: Math.round(wh.totalCapacityUnits * 0.35),
        utilizationPercent: 78,
        colorHex: "#3B82F6",
        racks: [
          { rackId: "RACK-A1", row: 1, col: 1, levels: 4, category: "Snacks & Confectionery", status: "Normal", itemCount: 2450 },
          { rackId: "RACK-A2", row: 1, col: 2, levels: 4, category: "Packaged Foods", status: "Excess Stock", itemCount: 4100 },
          { rackId: "RACK-A3", row: 1, col: 3, levels: 4, category: "Household Cleaning", status: "Normal", itemCount: 1800 }
        ]
      },
      {
        id: "ZONE-B",
        name: "Zone B: Dry Beverages & Staples",
        tempRange: "Ambient (18-24°C)",
        capacityUnits: Math.round(wh.totalCapacityUnits * 0.30),
        utilizationPercent: 64,
        colorHex: "#0D9488",
        racks: [
          { rackId: "RACK-B1", row: 2, col: 1, levels: 4, category: "Beverages", status: "Normal", itemCount: 3200 },
          { rackId: "RACK-B2", row: 2, col: 2, levels: 4, category: "Packaged Foods", status: "Normal", itemCount: 2900 }
        ]
      },
      {
        id: "ZONE-C",
        name: "Zone C: Active Cold-Storage Reefer Vault",
        tempRange: "Strict 2°C to 8°C (Monitored)",
        capacityUnits: wh.coldStorageCapacityUnits,
        utilizationPercent: 84,
        colorHex: "#06B6D4",
        isColdChain: true,
        racks: [
          { rackId: "RACK-C1", row: 3, col: 1, levels: 3, category: "Dairy Products", status: "Near Expiry Risk", itemCount: 1950 },
          { rackId: "RACK-C2", row: 3, col: 2, levels: 3, category: "Pharmaceuticals (Cold)", status: "Critical Care", itemCount: 1420 }
        ]
      },
      {
        id: "ZONE-D",
        name: "Zone D: GDP Pharmaceutical Regulated Lockup",
        tempRange: "Controlled 15°C to 25°C (Humidity < 60%)",
        capacityUnits: Math.round(wh.totalCapacityUnits * 0.15),
        utilizationPercent: 59,
        colorHex: "#8B5CF6",
        isPharmaSecured: true,
        racks: [
          { rackId: "RACK-D1", row: 4, col: 1, levels: 3, category: "Pharmaceuticals", status: "Healthy / GDP Verified", itemCount: 2800 },
          { rackId: "RACK-D2", row: 4, col: 2, levels: 3, category: "Pharmaceuticals", status: "QA Quarantined", itemCount: 600 }
        ]
      }
    ];

    res.json({
      success: true,
      data: {
        ...wh,
        usedCapacityUnits,
        utilizationPercent: Math.round((usedCapacityUnits / wh.totalCapacityUnits) * 100),
        batches,
        zones
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
