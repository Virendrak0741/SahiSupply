// SahiSupply AI — AI Distribution Optimizer Routes
const express = require("express");
const router = express.Router();
const Store = require("../models/store");
const { runDistributionOptimization } = require("../services/optimizerService");

// POST /api/optimize/run
router.post("/run", (req, res) => {
  try {
    const {
      planningHorizonDays = 7,
      selectedCategories = [],
      selectedWarehouseIds = [],
      selectedDestinationIds = [],
      transportationBudgetINR,
      transportationWeight = 0.35,
      stockoutWeight = 0.40,
      expiryWeight = 0.25,
      minShelfLifeBufferDays = 14,
      coldChainStrict = true
    } = req.body;

    const result = runDistributionOptimization({
      planningHorizonDays: parseInt(planningHorizonDays, 10),
      selectedCategories,
      selectedWarehouseIds,
      selectedDestinationIds,
      transportationBudgetINR: transportationBudgetINR ? parseFloat(transportationBudgetINR) : null,
      transportationWeight: parseFloat(transportationWeight),
      stockoutWeight: parseFloat(stockoutWeight),
      expiryWeight: parseFloat(expiryWeight),
      minShelfLifeBufferDays: parseInt(minShelfLifeBufferDays, 10),
      coldChainStrict: coldChainStrict === true || coldChainStrict === "true"
    });

    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/optimize/plans
router.get("/plans", (req, res) => {
  try {
    const plans = Store.getDistributionPlans();
    res.json({ success: true, count: plans.length, data: plans });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/optimize/plans/:id
router.get("/plans/:id", (req, res) => {
  try {
    const plan = Store.getDistributionPlanById(req.params.id);
    if (!plan) return res.status(404).json({ success: false, error: "Distribution plan not found" });
    res.json({ success: true, data: plan });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/optimize/plans/:id/approve — Approves plan & automatically generates active shipments!
router.post("/plans/:id/approve", (req, res) => {
  try {
    const plan = Store.getDistributionPlanById(req.params.id);
    if (!plan) return res.status(404).json({ success: false, error: "Plan not found" });

    // Update plan status
    const updatedPlan = Store.updateDistributionPlan(plan.id, {
      status: "Approved",
      approvedAt: new Date().toISOString(),
      approver: req.body.approver || "Supply Chain Director"
    });

    // Auto-create shipments from approved recommendations
    const createdShipments = [];
    let shpIndex = 1;

    for (const rec of plan.recommendations.slice(0, 15)) {
      const mode = rec.isColdChain
        ? "Refrigerated Reefer Van (2-8°C)"
        : rec.recommendedQuantity > 1000
        ? "16-Ton Heavy Freight Truck"
        : "Standard Box Courier Van";

      const vehicleNum = `MH-${12 + (shpIndex % 15)}-${String.fromCharCode(65 + (shpIndex % 26))}${String.fromCharCode(66 + (shpIndex % 26))}-${1000 + shpIndex}`;

      const shipment = Store.createShipment({
        distributionPlanId: plan.id,
        sourceWarehouseId: rec.sourceWarehouseId,
        sourceWarehouseName: rec.sourceWarehouseName,
        destinationId: rec.destinationId,
        destinationName: rec.destinationName,
        destinationType: rec.destinationType,
        region: rec.destinationRegion,
        productId: rec.productId,
        productName: rec.productName,
        category: rec.category,
        batchNumber: rec.batchNumber,
        quantity: rec.recommendedQuantity,
        transportMode: mode,
        isColdChain: rec.isColdChain,
        vehicleId: vehicleNum,
        dispatchDate: new Date().toISOString(),
        expectedDeliveryDate: rec.expectedDeliveryDate,
        actualDeliveryDate: null,
        estimatedTransportationCostINR: rec.estimatedTransportationCostINR,
        status: "Approved",
        currentProgressPercent: 10,
        currentLocationDesc: `Staged at ${rec.sourceWarehouseName} Bay`,
        notes: `Generated from Approved Distribution Plan ${plan.id}`
      });

      createdShipments.push(shipment);
      shpIndex++;
    }

    res.json({
      success: true,
      message: `Plan ${plan.id} approved successfully! Generated ${createdShipments.length} trackable shipments.`,
      plan: updatedPlan,
      shipmentsCount: createdShipments.length
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/optimize/plans/:id/reject
router.post("/plans/:id/reject", (req, res) => {
  try {
    const plan = Store.getDistributionPlanById(req.params.id);
    if (!plan) return res.status(404).json({ success: false, error: "Plan not found" });

    const updatedPlan = Store.updateDistributionPlan(plan.id, {
      status: "Rejected",
      rejectedAt: new Date().toISOString(),
      rejectionReason: req.body.reason || "Manual review rejected by operational controller."
    });

    res.json({
      success: true,
      message: `Plan ${plan.id} marked as Rejected.`,
      plan: updatedPlan
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/optimize/plans/:id/edit-allocation
router.put("/plans/:id/edit-allocation", (req, res) => {
  try {
    const { recommendationId, newQuantity } = req.body;
    const plan = Store.getDistributionPlanById(req.params.id);
    if (!plan) return res.status(404).json({ success: false, error: "Plan not found" });

    const rec = plan.recommendations.find(r => r.id === recommendationId);
    if (!rec) return res.status(404).json({ success: false, error: "Recommendation not found" });

    const qty = parseInt(newQuantity, 10);
    if (isNaN(qty) || qty <= 0) {
      return res.status(400).json({ success: false, error: "Invalid quantity specified" });
    }

    // Re-check warehouse batch stock
    const batch = Store.getBatches().find(b => b.batchNumber === rec.batchNumber && b.warehouseId === rec.sourceWarehouseId);
    if (batch && qty > batch.availableQuantity) {
      return res.status(400).json({
        success: false,
        error: `Requested quantity (${qty}) exceeds available warehouse batch stock (${batch.availableQuantity})`
      });
    }

    rec.recommendedQuantity = qty;
    rec.estimatedTransportationCostINR = Math.round(qty * rec.unitFreightCostINR);
    rec.explanation = `${rec.explanation} (Manually modified to ${qty} units)`;

    // Recalculate totals
    plan.metrics.totalUnitsAllocated = plan.recommendations.reduce((s, r) => s + r.recommendedQuantity, 0);
    plan.metrics.totalTransportationCostINR = plan.recommendations.reduce((s, r) => s + r.estimatedTransportationCostINR, 0);

    Store.updateDistributionPlan(plan.id, {
      recommendations: plan.recommendations,
      metrics: plan.metrics
    });

    res.json({ success: true, message: "Allocation updated successfully", plan });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
