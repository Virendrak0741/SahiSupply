// SahiSupply AI — Mongoose Schema: Shipment
const mongoose = require("mongoose");

const ShipmentSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    distributionPlanId: { type: String, ref: "DistributionPlan", index: true },
    sourceWarehouseId: { type: String, required: true, ref: "Warehouse", index: true },
    sourceWarehouseName: { type: String, required: true },
    destinationId: { type: String, required: true, ref: "Destination", index: true },
    destinationName: { type: String, required: true },
    destinationType: { type: String, required: true },
    region: { type: String, required: true },
    productId: { type: String, required: true, ref: "Product", index: true },
    productName: { type: String, required: true },
    category: { type: String, required: true },
    batchNumber: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    transportMode: { type: String, required: true },
    isColdChain: { type: Boolean, default: false, index: true },
    vehicleId: { type: String, required: true },
    dispatchDate: { type: String, required: true },
    expectedDeliveryDate: { type: String, required: true },
    actualDeliveryDate: { type: String, default: null },
    estimatedTransportationCostINR: { type: Number, required: true },
    status: {
      type: String,
      required: true,
      enum: ["Pending", "Approved", "Dispatched", "In Transit", "Delivered", "Delayed", "Cancelled"],
      default: "Pending",
      index: true
    },
    currentProgressPercent: { type: Number, default: 0 },
    currentLocationDesc: { type: String, default: "" },
    notes: { type: String, default: "" }
  },
  { timestamps: true }
);

module.exports = mongoose.models.Shipment || mongoose.model("Shipment", ShipmentSchema);
