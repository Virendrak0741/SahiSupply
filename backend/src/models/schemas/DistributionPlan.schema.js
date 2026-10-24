// SahiSupply AI — Mongoose Schema: DistributionPlan
const mongoose = require("mongoose");

const RecommendationSubSchema = new mongoose.Schema({
  id: { type: String, required: true },
  productId: { type: String, required: true },
  productName: { type: String, required: true },
  category: { type: String, required: true },
  sku: { type: String, required: true },
  sourceWarehouseId: { type: String, required: true },
  sourceWarehouseName: { type: String, required: true },
  destinationId: { type: String, required: true },
  destinationName: { type: String, required: true },
  destinationType: { type: String },
  destinationRegion: { type: String },
  batchNumber: { type: String, required: true },
  batchExpiryDate: { type: String },
  daysUntilExpiry: { type: Number },
  recommendedQuantity: { type: Number, required: true },
  forecastDemand: { type: Number },
  projectedDestinationStock: { type: Number },
  estimatedTransportationCostINR: { type: Number },
  unitFreightCostINR: { type: Number },
  leadTimeDays: { type: Number },
  expectedDeliveryDate: { type: String },
  priority: { type: String, enum: ["Urgent", "High", "Standard"], default: "Standard" },
  isColdChain: { type: Boolean, default: false },
  isPharma: { type: Boolean, default: false },
  explanation: { type: String },
  status: { type: String, default: "Recommended" }
});

const DistributionPlanSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    planId: { type: String },
    status: {
      type: String,
      required: true,
      enum: ["Pending Approval", "Approved", "Rejected"],
      default: "Pending Approval",
      index: true
    },
    approvedAt: { type: String },
    approver: { type: String },
    rejectionReason: { type: String },
    runtimeMs: { type: Number, default: 0 },
    configuration: {
      planningHorizonDays: { type: Number, default: 7 },
      selectedCategories: [{ type: String }],
      selectedWarehouseIds: [{ type: String }],
      selectedDestinationIds: [{ type: String }],
      transportationBudgetINR: { type: Number, default: null },
      weights: {
        transportationWeight: { type: Number, default: 0.35 },
        stockoutWeight: { type: Number, default: 0.40 },
        expiryWeight: { type: Number, default: 0.25 }
      }
    },
    metrics: {
      totalUnitsAllocated: { type: Number, default: 0 },
      totalDemandRequested: { type: Number, default: 0 },
      demandFulfillmentRate: { type: Number, default: 0 },
      unmetDemandUnits: { type: Number, default: 0 },
      totalTransportationCostINR: { type: Number, default: 0 },
      numberOfShipmentsRecommended: { type: Number, default: 0 },
      urgentReplenishmentCount: { type: Number, default: 0 },
      pharmaBatchesAllocated: { type: Number, default: 0 },
      coldChainShipmentsCount: { type: Number, default: 0 },
      optimizationStatus: { type: String }
    },
    recommendations: [RecommendationSubSchema],
    beforeAndAfter: {
      unmetDemand: { baseline: Number, optimized: Number, reductionPercent: Number },
      transportationCostINR: { baseline: Number, optimized: Number, savingsPercent: Number },
      expiryWastageUnits: { baseline: Number, optimized: Number, reductionPercent: Number },
      fillRatePercent: { baseline: Number, optimized: Number, improvementPercent: Number },
      shipmentConsolidation: { baselineShipmentsCount: Number, optimizedShipmentsCount: Number, reductionPercent: Number }
    }
  },
  { timestamps: true }
);

module.exports = mongoose.models.DistributionPlan || mongoose.model("DistributionPlan", DistributionPlanSchema);
