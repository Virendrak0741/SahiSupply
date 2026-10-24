// SahiSupply AI — MongoDB Database Seeder Script
const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const {
  Product,
  Warehouse,
  Destination,
  InventoryBatch,
  Route,
  Shipment,
  DemandRecord,
  DistributionPlan
} = require("../models/schemas");

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/sahisupply_ai";
const DB_FILE = path.join(__dirname, "../../data/sahisupply_db.json");

async function seedMongo() {
  console.log("=================================================");
  console.log("🌱 SahiSupply AI — MongoDB Seeder Initializing");
  console.log(`📡 Connecting to: ${MONGODB_URI}`);
  console.log("=================================================\n");

  try {
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000
    });
    console.log("✅ MongoDB Connection Established Successfully!\n");

    if (!fs.existsSync(DB_FILE)) {
      console.error(`❌ Source database file not found at ${DB_FILE}`);
      process.exit(1);
    }

    console.log("📂 Reading source dataset...");
    const db = JSON.parse(fs.readFileSync(DB_FILE, "utf8"));

    // 1. Products
    console.log(`📦 Seeding Products (${db.products.length} records)...`);
    await Product.deleteMany({});
    await Product.insertMany(db.products);

    // 2. Warehouses
    console.log(`🏬 Seeding Warehouses (${db.warehouses.length} records)...`);
    await Warehouse.deleteMany({});
    await Warehouse.insertMany(db.warehouses);

    // 3. Destinations
    console.log(`📍 Seeding Destinations (${db.destinations.length} records)...`);
    await Destination.deleteMany({});
    await Destination.insertMany(db.destinations);

    // 4. Inventory Batches
    console.log(`🏷️ Seeding Inventory Batches (${db.inventoryBatches.length} records)...`);
    await InventoryBatch.deleteMany({});
    await InventoryBatch.insertMany(db.inventoryBatches);

    // 5. Routes
    console.log(`🛣️ Seeding Routes (${db.routes.length} records)...`);
    await Route.deleteMany({});
    await Route.insertMany(db.routes);

    // 6. Shipments
    console.log(`🚚 Seeding Shipments (${db.shipments.length} records)...`);
    await Shipment.deleteMany({});
    await Shipment.insertMany(db.shipments);

    // 7. Distribution Plans
    if (db.distributionPlans && db.distributionPlans.length > 0) {
      console.log(`📑 Seeding Distribution Plans (${db.distributionPlans.length} records)...`);
      await DistributionPlan.deleteMany({});
      await DistributionPlan.insertMany(db.distributionPlans);
    }

    // 8. Demand History (Insert first 10,000 for speed or batch)
    if (db.demandHistory && db.demandHistory.length > 0) {
      const sampleSize = Math.min(db.demandHistory.length, 5000);
      console.log(`📈 Seeding Demand Records (${sampleSize} observations)...`);
      await DemandRecord.deleteMany({});
      await DemandRecord.insertMany(db.demandHistory.slice(0, sampleSize));
    }

    console.log("\n=================================================");
    console.log("🎉 MongoDB Seeding Completed Successfully!");
    console.log("=================================================");
    process.exit(0);
  } catch (err) {
    console.error("❌ MongoDB Seeding Error:", err.message);
    console.log("\n💡 Note: If MongoDB server is not running locally, SahiSupply AI seamlessly uses the zero-dependency JSON persistence layer in backend/data/sahisupply_db.json.\n");
    process.exit(1);
  }
}

seedMongo();
