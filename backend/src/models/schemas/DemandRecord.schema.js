// SahiSupply AI — Mongoose Schema: DemandRecord
const mongoose = require("mongoose");

const DemandRecordSchema = new mongoose.Schema(
  {
    date: { type: String, required: true, index: true },
    dayIndex: { type: Number, required: true },
    productId: { type: String, required: true, ref: "Product", index: true },
    productName: { type: String, required: true },
    category: { type: String, required: true, index: true },
    sku: { type: String, required: true },
    destinationId: { type: String, required: true, ref: "Destination", index: true },
    destinationName: { type: String, required: true },
    destinationType: { type: String, required: true },
    region: { type: String, required: true, index: true },
    quantityDemanded: { type: Number, required: true },
    quantityFulfilled: { type: Number, required: true },
    unmetDemand: { type: Number, default: 0 },
    stockoutRecorded: { type: Boolean, default: false },
    revenueINR: { type: Number, default: 0 }
  },
  { timestamps: true }
);

DemandRecordSchema.index({ productId: 1, destinationId: 1, date: 1 });

module.exports = mongoose.models.DemandRecord || mongoose.model("DemandRecord", DemandRecordSchema);
