// SahiSupply AI — Mongoose Schema: Warehouse
const mongoose = require("mongoose");

const WarehouseSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    location: { type: String, required: true },
    region: {
      type: String,
      required: true,
      enum: ["Pune", "Mumbai", "Nashik", "Kolhapur", "Nagpur"],
      index: true
    },
    coordinates: {
      x: { type: Number, required: true },
      z: { type: Number, required: true },
      lat: { type: Number, required: true },
      lng: { type: Number, required: true }
    },
    totalCapacityUnits: { type: Number, required: true, min: 1000 },
    coldStorageCapacityUnits: { type: Number, default: 0 },
    handlingCapabilities: [{ type: String }],
    coldStorageAvailable: { type: Boolean, default: false, index: true },
    fleetSizeTrucks: { type: Number, default: 10 },
    activeInboundShipments: { type: Number, default: 0 },
    activeOutboundShipments: { type: Number, default: 0 },
    managerName: { type: String },
    contactPhone: { type: String }
  },
  { timestamps: true }
);

module.exports = mongoose.models.Warehouse || mongoose.model("Warehouse", WarehouseSchema);
