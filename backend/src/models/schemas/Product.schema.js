// SahiSupply AI — Mongoose Schema: Product
const mongoose = require("mongoose");

const ProductSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true, trim: true },
    category: {
      type: String,
      required: true,
      enum: [
        "Dairy Products",
        "Packaged Foods",
        "Beverages",
        "Personal Care",
        "Household Cleaning",
        "Snacks & Confectionery",
        "Pharmaceuticals"
      ],
      index: true
    },
    sku: { type: String, required: true, unique: true, uppercase: true, index: true },
    packagingSize: { type: String, required: true },
    unitOfMeasure: { type: String, default: "Units" },
    basePriceINR: { type: Number, required: true, min: 0 },
    standardShelfLifeDays: { type: Number, required: true, min: 1 },
    minShelfLifeDaysDelivery: { type: Number, required: true, min: 1 },
    isColdChainRequired: { type: Boolean, default: false, index: true },
    tempRangeCelsius: { type: String, default: "Ambient" },
    isPharma: { type: Boolean, default: false, index: true },
    weightKgPerUnit: { type: Number, default: 1.0 },
    volumeCubicMeters: { type: Number, default: 0.001 },
    handlingNotes: { type: String, default: "" }
  },
  { timestamps: true }
);

module.exports = mongoose.models.Product || mongoose.model("Product", ProductSchema);
