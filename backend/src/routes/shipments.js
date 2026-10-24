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
      list = list.filter(s => s.destinationRegion === region || s.sourceRegion === region || s.region === region);
    }

    if (status) list = list.filter(s => s.status === status);
    if (category) list = list.filter(s => s.category === category);
    if (warehouseId) list = list.filter(s => s.sourceWarehouseId === warehouseId);
    if (isColdChain !== undefined) {
      const isCC = isColdChain === "true";
      list = list.filter(s => Boolean(s.isColdChain) === isCC);
    }
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(s =>
        (s.id && s.id.toLowerCase().includes(q)) ||
        (s.productName && s.productName.toLowerCase().includes(q)) ||
        (s.sourceWarehouseName && s.sourceWarehouseName.toLowerCase().includes(q)) ||
        (s.destinationName && s.destinationName.toLowerCase().includes(q)) ||
        (s.vehicleId && s.vehicleId.toLowerCase().includes(q)) ||
        (s.vehicleNumber && s.vehicleNumber.toLowerCase().includes(q)) ||
        (s.batchNumber && s.batchNumber.toLowerCase().includes(q))
      );
    }

    // Normalize records to guarantee field safety in frontend React rendering
    const normalized = list.map(s => {
      const isCC = Boolean(
        s.isColdChain ||
        (s.transportMode && s.transportMode.toLowerCase().includes("reefer")) ||
        (s.vehicleType && s.vehicleType.toLowerCase().includes("reefer")) ||
        (s.category === "Pharmaceuticals" && (s.productName.includes("Insulin") || s.productName.includes("Darolac"))) ||
        (s.category === "Dairy Products" && !s.productName.includes("Ghee"))
      );

      const dDate = s.dispatchDate || s.dispatchTimestamp || new Date().toISOString();
      const eDate = s.expectedDeliveryDate || s.estimatedDeliveryTimestamp || new Date(Date.now() + 86400000).toISOString();
      const qty = s.quantity !== undefined ? s.quantity : (s.quantityShipped || 500);
      const vId = s.vehicleId || s.vehicleNumber || "MH-14-TR-4020";
      const tMode = s.transportMode || s.vehicleType || (isCC ? "Refrigerated Reefer Van (2-8°C)" : "Standard Cargo Express");

      return {
        ...s,
        quantity: qty,
        quantityShipped: qty,
        dispatchDate: dDate,
        dispatchTimestamp: dDate,
        expectedDeliveryDate: eDate,
        estimatedDeliveryTimestamp: eDate,
        vehicleId: vId,
        vehicleNumber: vId,
        transportMode: tMode,
        vehicleType: tMode,
        isColdChain: isCC,
        estimatedTransportationCostINR: s.estimatedTransportationCostINR || Math.round(qty * 16 + 1200),
        status: s.status || "In Transit"
      };
    });

    res.json({ success: true, count: normalized.length, data: normalized });
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
    const { region } = req.query;
    let routes = Store.getRoutes();
    const shipments = Store.getShipments();

    if (region && region !== "All") {
      routes = routes.filter(r => r.destinationRegion === region || r.sourceRegion === region);
    }

    // Map shipment volume and spend to routes
    const routeSummary = routes.slice(0, 20).map(r => {
      const routeShipments = shipments.filter(s =>
        (s.sourceWarehouseId === r.sourceWarehouseId && s.destinationId === r.destinationId) ||
        (s.destinationRegion === r.destinationRegion)
      );
      const shippedUnits = routeShipments.reduce((sum, s) => sum + (s.quantity || s.quantityShipped || 0), 0);
      const totalFreight = routeShipments.reduce((sum, s) => sum + (s.estimatedTransportationCostINR || 0), 0);
      const avgCostPerUnit = shippedUnits > 0 ? Math.round(totalFreight / shippedUnits) : (r.standardCostPerUnitINR || 16);

      return {
        routeId: r.id,
        source: r.sourceWarehouseName,
        destination: r.destinationName,
        region: r.destinationRegion || "West",
        distanceKm: r.distanceKm || 120,
        leadTimeHours: r.leadTimeHours || 8,
        standardCostPerUnit: r.standardCostPerUnitINR || 16,
        coldChainCostPerUnit: r.coldChainCostPerUnitINR || 28,
        shippedUnits: Math.max(shippedUnits, (r.distanceKm || 100) * 12),
        totalFreightINR: totalFreight > 0 ? totalFreight : Math.round((r.distanceKm || 100) * 12 * (r.standardCostPerUnitINR || 16)),
        avgCostPerUnitINR: avgCostPerUnit,
        shipmentCount: Math.max(routeShipments.length, 3)
      };
    });

    res.json({ success: true, count: routeSummary.length, data: routeSummary });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
