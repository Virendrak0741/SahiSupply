// SahiSupply AI — Mongoose Schema: Route
const mongoose = require("mongoose");

const RouteSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    sourceWarehouseId: { type: String, required: true, ref: "Warehouse", index: true },
    sourceWarehouseName: { type: String, required: true },
    destinationId: { type: String, required: true, ref: "Destination", index: true },
    destinationName: { type: String, required: true },
    destinationType: { type: String, required: true },
    destinationRegion: { type: String, required: true },
    distanceKm: { type: Number, required: true },
    leadTimeHours: { type: Number, required: true },
    leadTimeDays: { type: Number, required: true },
    standardCostPerUnitINR: { type: Number, required: true },
    coldChainCostPerUnitINR: { type: Number, required: true },
    routeCapacityUnits: { type: Number, required: true },
    isEligibleColdChain: { type: Boolean, default: false },
    isEligiblePharma: { type: Boolean, default: false }
  },
  { timestamps: true }
);

RouteSchema.index({ sourceWarehouseId: 1, destinationId: 1 }, { unique: true });

module.exports = mongoose.models.Route || mongoose.model("Route", RouteSchema);
