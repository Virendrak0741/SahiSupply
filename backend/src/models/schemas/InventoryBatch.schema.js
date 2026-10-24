// SahiSupply AI — Mongoose Schema: InventoryBatch (FEFO & Batch Traceability)
const mongoose = require("mongoose");

const InventoryBatchSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    batchNumber: { type: String, required: true, index: true },
    productId: { type: String, required: true, ref: "Product", index: true },
    productName: { type: String, required: true },
    category: { type: String, required: true, index: true },
    sku: { type: String, required: true, index: true },
    warehouseId: { type: String, required: true, ref: "Warehouse", index: true },
    warehouseName: { type: String, required: true },
    manufacturingDate: { type: String, required: true },
    expiryDate: { type: String, required: true, index: true },
    daysUntilExpiry: { type: Number, required: true, index: true },
    availableQuantity: { type: Number, required: true, min: 0 },
    reservedQuantity: { type: Number, default: 0, min: 0 },
    totalQuantity: { type: Number, required: true, min: 0 },
    safetyStock: { type: Number, default: 100 },
    minStock: { type: Number, default: 40 },
    avgDailyDemand: { type: Number, default: 25 },
    daysOfInventoryRemaining: { type: Number, default: 30 },
    inventoryStatus: {
      type: String,
      required: true,
      enum: ["Healthy", "Low Stock", "Critical", "Excess Stock", "Near Expiry", "Expired", "Quarantined"],
      index: true
    },
    isEligibleForDistribution: { type: Boolean, default: true, index: true },
    rejectionReason: { type: String, default: null },
    isPharma: { type: Boolean, default: false, index: true },
    isColdChainRequired: { type: Boolean, default: false, index: true },
    storageTempRange: { type: String },
    handlingRequirements: { type: String },
    traceabilityHash: { type: String },
    costValueINR: { type: Number, default: 0 }
  },
  { timestamps: true }
);

// Compound index for optimal FEFO querying by warehouse and product
InventoryBatchSchema.index({ warehouseId: 1, productId: 1, expiryDate: 1 });

module.exports = mongoose.models.InventoryBatch || mongoose.model("InventoryBatch", InventoryBatchSchema);
