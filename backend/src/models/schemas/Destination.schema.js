// SahiSupply AI — Mongoose Schema: Destination
const mongoose = require("mongoose");

const DestinationSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    type: {
      type: String,
      required: true,
      enum: ["Pharmacy", "Retail Store", "Distributor", "Hypermarket"],
      index: true
    },
    region: {
      type: String,
      required: true,
      enum: ["Pune", "Mumbai", "Nashik", "Kolhapur", "Nagpur"],
      index: true
    },
    coordinates: {
      x: { type: Number, required: true },
      z: { type: Number, required: true }
    },
    capacityUnits: { type: Number, required: true },
    hasColdChain: { type: Boolean, default: false, index: true },
    hasPharmaLicense: { type: Boolean, default: false, index: true }
  },
  { timestamps: true }
);

module.exports = mongoose.models.Destination || mongoose.model("Destination", DestinationSchema);
