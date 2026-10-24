// SahiSupply AI — Mongoose Schemas & Models Export
const Product = require("./Product.schema");
const Warehouse = require("./Warehouse.schema");
const Destination = require("./Destination.schema");
const InventoryBatch = require("./InventoryBatch.schema");
const Route = require("./Route.schema");
const Shipment = require("./Shipment.schema");
const DemandRecord = require("./DemandRecord.schema");
const DistributionPlan = require("./DistributionPlan.schema");

module.exports = {
  Product,
  Warehouse,
  Destination,
  InventoryBatch,
  Route,
  Shipment,
  DemandRecord,
  DistributionPlan
};
