// SahiSupply AI — Shipments & Route Analytics Routes
const express = require("express");
const router = express.Router();
const Store = require("../models/store");

// GET /api/shipments/kpis
router.get("/kpis", (req, res) => {
  try {
    const { region } = req.query;
    let shipments = Store.getShipments();
    if (region && region !== "All") {
      shipments = shipments.filter(s => s.destinationRegion === region || s.sourceRegion === region);
    }

    const total = shipments.length;
    const pending = shipments.filter(s => s.status === "Pending" || s.status === "Approved").length;
    const dispatched = shipments.filter(s => s.status === "Dispatched").length;
    const inTransit = shipments.filter(s => s.status === "In Transit").length;
    const delivered = shipments.filter(s => s.status === "Delivered").length;
    const delayed = shipments.filter(s => s.status === "Delayed").length;
    const coldChain = shipments.filter(s => s.isColdChain).length;
    const totalFreightCost = shipments.reduce((s, shp) => s + (shp.estimatedTransportationCostINR || 0), 0);

    res.json({
      success: true,
      data: {
        total,
        pending,
        dispatched,
        inTransit,
        delivered,
        delayed,
        coldChain,
        totalFreightCost
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/shipments
router.get("/", (req, res) => {
  try {
    let list = Store.getShipments();
    const { status, category, isColdChain, warehouseId, search, region } = req.query;

    if (region && region !== "All") {
      list = list.filter(s => s.destinationRegion === region || s.sourceRegion === region);
    }

    if (status) list = list.filter(s => s.status === status);
    if (category) list = list.filter(s => s.category === category);
    if (warehouseId) list = list.filter(s => s.sourceWarehouseId === warehouseId);
    if (isColdChain !== undefined) {
      const isCC = isColdChain === "true";
      list = list.filter(s => s.isColdChain === isCC);
    }
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(s =>
        s.id.toLowerCase().includes(q) ||
        s.productName.toLowerCase().includes(q) ||
        s.sourceWarehouseName.toLowerCase().includes(q) ||
        s.destinationName.toLowerCase().includes(q) ||
        (s.batchNumber && s.batchNumber.toLowerCase().includes(q))
      );
    }

    res.json({ success: true, count: list.length, data: list });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/shipments — manual creation
router.post("/", (req, res) => {
  try {
    const { sourceWarehouseId, destinationId, productId, quantity } = req.body;
    if (!sourceWarehouseId || !destinationId || !productId || !quantity) {
      return res.status(400).json({ success: false, error: "Missing required fields" });
    }

    const wh = Store.getWarehouseById(sourceWarehouseId);
    const dest = Store.getDestinationById(destinationId);
    const prod = Store.getProductById(productId);

    if (!wh || !dest || !prod) {
      return res.status(400).json({ success: false, error: "Invalid warehouse, destination, or product" });
    }

    const shipment = Store.createShipment({
      sourceWarehouseId: wh.id,
      sourceWarehouseName: wh.name,
      destinationId: dest.id,
      destinationName: dest.name,
      destinationType: dest.type,
      region: dest.region,
      productId: prod.id,
      productName: prod.name,
      category: prod.category,
      batchNumber: req.body.batchNumber || "MANUAL-DISP-01",
      quantity: parseInt(quantity, 10),
      transportMode: prod.isColdChainRequired ? "Refrigerated Reefer Van" : "Express Cargo Van",
      isColdChain: prod.isColdChainRequired,
      vehicleId: req.body.vehicleId || "MH-14-TR-9901",
      dispatchDate: new Date().toISOString(),
      expectedDeliveryDate: req.body.expectedDeliveryDate || new Date(Date.now() + 86400000).toISOString().split("T")[0],
      estimatedTransportationCostINR: Math.round(parseInt(quantity, 10) * 18),
      status: "Dispatched",
      currentProgressPercent: 15,
      currentLocationDesc: `Departed ${wh.name}`,
      notes: req.body.notes || "Manual dispatcher entry"
    });

    res.status(201).json({ success: true, data: shipment });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PATCH /api/shipments/:id/status — Status workflow: Pending -> Approved -> Dispatched -> In Transit -> Delivered
router.patch("/:id/status", (req, res) => {
  try {
    const { status, notes } = req.body;
    const validStatuses = ["Pending", "Approved", "Dispatched", "In Transit", "Delivered", "Delayed", "Cancelled"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, error: `Invalid status. Valid: ${validStatuses.join(", ")}` });
    }

    const updated = Store.updateShipmentStatus(req.params.id, status, notes);
    if (!updated) return res.status(404).json({ success: false, error: "Shipment not found" });

    res.json({ success: true, message: `Shipment updated to ${status}`, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/shipments/routes-analytics
router.get("/routes-analytics", (req, res) => {
  try {
    const routes = Store.getRoutes();
    const shipments = Store.getShipments();

    // Map shipment volume and spend to routes
    const routeSummary = routes.slice(0, 15).map(r => {
      const routeShipments = shipments.filter(s => s.sourceWarehouseId === r.sourceWarehouseId && s.destinationId === r.destinationId);
      const shippedUnits = routeShipments.reduce((sum, s) => sum + s.quantity, 0);
      const totalFreight = routeShipments.reduce((sum, s) => sum + (s.estimatedTransportationCostINR || 0), 0);
      const avgCostPerUnit = shippedUnits > 0 ? Math.round(totalFreight / shippedUnits) : r.standardCostPerUnitINR;

      return {
        routeId: r.id,
        source: r.sourceWarehouseName,
        destination: r.destinationName,
        region: r.destinationRegion,
        distanceKm: r.distanceKm,
        leadTimeHours: r.leadTimeHours,
        standardCostPerUnit: r.standardCostPerUnitINR,
        coldChainCostPerUnit: r.coldChainCostPerUnitINR,
        shippedUnits,
        totalFreightINR: totalFreight,
        avgCostPerUnitINR: avgCostPerUnit,
        shipmentCount: routeShipments.length
      };
    });

    res.json({ success: true, data: routeSummary });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
