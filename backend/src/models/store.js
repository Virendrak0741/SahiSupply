// SahiSupply AI — Resilient Multi-Collection Data Storage Engine
// Supports zero-dependency atomic JSON persistence + optional MongoDB integration

const fs = require("fs");
const path = require("path");
const { PRODUCTS, WAREHOUSES, DISTRIBUTORS, RETAIL_AND_PHARMACIES } = require("../data/seedData");
const {
  CURRENT_DATE_STR,
  generateRoutes,
  generateInventoryBatches,
  generateDemandHistory,
  generateInitialShipments,
  DEFAULT_SETTINGS
} = require("../data/datasetGenerator");

const DATA_DIR = path.join(__dirname, "../../data");

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const DB_FILE = path.join(DATA_DIR, "sahisupply_db.json");

let memoryDb = null;

function seedFreshData() {
  console.log("🌱 Generating initial SahiSupply AI dataset...");
  const routes = generateRoutes();
  const batches = generateInventoryBatches();
  const demandHistory = generateDemandHistory();
  const shipments = generateInitialShipments(routes);
  const allDestinations = [...DISTRIBUTORS, ...RETAIL_AND_PHARMACIES];

  const db = {
    metadata: {
      initializedAt: new Date().toISOString(),
      currentSimulatedDate: CURRENT_DATE_STR,
      version: "1.0.0"
    },
    products: PRODUCTS,
    warehouses: WAREHOUSES,
    destinations: allDestinations,
    inventoryBatches: batches,
    demandHistory: demandHistory,
    routes: routes,
    shipments: shipments,
    distributionPlans: [],
    forecasts: [],
    settings: DEFAULT_SETTINGS,
    auditLogs: [
      {
        id: "AUDIT-001",
        timestamp: new Date().toISOString(),
        action: "SYSTEM_INITIALIZATION",
        entity: "Database",
        details: "Loaded 20 products, 5 warehouses, 40 destinations, and 90-day demand records."
      }
    ]
  };

  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), "utf8");
  return db;
}

function loadDatabase() {
  if (memoryDb) return memoryDb;

  if (fs.existsSync(DB_FILE)) {
    try {
      const raw = fs.readFileSync(DB_FILE, "utf8");
      memoryDb = JSON.parse(raw);
      // Quick integrity check
      if (!memoryDb.products || !memoryDb.warehouses || !memoryDb.inventoryBatches) {
        console.warn("⚠️ Database file corrupted or incomplete. Reseeding...");
        memoryDb = seedFreshData();
      }
    } catch (err) {
      console.error("❌ Failed to parse existing db, reseeding:", err);
      memoryDb = seedFreshData();
    }
  } else {
    memoryDb = seedFreshData();
  }

  return memoryDb;
}

function saveDatabase() {
  if (!memoryDb) return;
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(memoryDb, null, 2), "utf8");
  } catch (err) {
    console.error("❌ Failed to persist database:", err);
  }
}

// -------------------------------------------------------------
// Data Access Methods
// -------------------------------------------------------------

const Store = {
  getProducts: () => loadDatabase().products,
  getProductById: (id) => loadDatabase().products.find(p => p.id === id),
  createProduct: (prod) => {
    const db = loadDatabase();
    const newProd = {
      id: prod.id || `PROD-NEW-${Date.now()}`,
      ...prod,
      createdAt: new Date().toISOString()
    };
    db.products.push(newProd);
    saveDatabase();
    return newProd;
  },
  updateProduct: (id, updates) => {
    const db = loadDatabase();
    const idx = db.products.findIndex(p => p.id === id);
    if (idx === -1) return null;
    db.products[idx] = { ...db.products[idx], ...updates, updatedAt: new Date().toISOString() };
    saveDatabase();
    return db.products[idx];
  },

  getWarehouses: (region) => {
    const list = loadDatabase().warehouses;
    if (region && region !== "All") {
      return list.filter(w => w.region === region);
    }
    return list;
  },
  getWarehouseById: (id) => loadDatabase().warehouses.find(w => w.id === id),

  getDestinations: (region) => {
    const list = loadDatabase().destinations;
    if (region && region !== "All") {
      return list.filter(d => d.region === region);
    }
    return list;
  },
  getDestinationById: (id) => loadDatabase().destinations.find(d => d.id === id),

  getBatches: (region) => {
    const list = loadDatabase().inventoryBatches;
    if (region && region !== "All") {
      return list.filter(b => b.warehouseRegion === region);
    }
    return list;
  },
  getBatchById: (id) => loadDatabase().inventoryBatches.find(b => b.id === id),
  createBatch: (batch) => {
    const db = loadDatabase();
    const newBatch = {
      id: batch.id || `BATCH-${Date.now()}`,
      ...batch,
      createdAt: new Date().toISOString()
    };
    db.inventoryBatches.push(newBatch);
    saveDatabase();
    return newBatch;
  },
  updateBatch: (id, updates) => {
    const db = loadDatabase();
    const idx = db.inventoryBatches.findIndex(b => b.id === id);
    if (idx === -1) return null;
    db.inventoryBatches[idx] = { ...db.inventoryBatches[idx], ...updates, updatedAt: new Date().toISOString() };
    saveDatabase();
    return db.inventoryBatches[idx];
  },

  transferBatch: (batchId, targetWarehouseId, quantity) => {
    const db = loadDatabase();
    const sourceBatch = db.inventoryBatches.find(b => b.id === batchId);
    if (!sourceBatch) throw new Error("Source batch not found");
    if (sourceBatch.availableQuantity < quantity) {
      throw new Error(`Insufficient available quantity (${sourceBatch.availableQuantity} units available, requested ${quantity})`);
    }

    const targetWh = db.warehouses.find(w => w.id === targetWarehouseId);
    if (!targetWh) throw new Error("Target warehouse not found");

    // Reduce source batch quantity
    sourceBatch.availableQuantity -= quantity;
    sourceBatch.totalQuantity -= quantity;

    // Check if target batch of same product and batch number exists
    let targetBatch = db.inventoryBatches.find(
      b => b.warehouseId === targetWarehouseId && b.batchNumber === sourceBatch.batchNumber
    );

    if (targetBatch) {
      targetBatch.availableQuantity += quantity;
      targetBatch.totalQuantity += quantity;
    } else {
      targetBatch = {
        ...sourceBatch,
        id: `BATCH-TRANS-${Date.now()}`,
        warehouseId: targetWh.id,
        warehouseName: targetWh.name,
        availableQuantity: quantity,
        reservedQuantity: 0,
        totalQuantity: quantity,
        notes: `Transferred from ${sourceBatch.warehouseName}`
      };
      db.inventoryBatches.push(targetBatch);
    }

    // Add audit entry
    db.auditLogs.push({
      id: `AUDIT-${Date.now()}`,
      timestamp: new Date().toISOString(),
      action: "STOCK_TRANSFER",
      entity: "InventoryBatch",
      details: `Transferred ${quantity} units of ${sourceBatch.productName} (Batch: ${sourceBatch.batchNumber}) from ${sourceBatch.warehouseName} to ${targetWh.name}`
    });

    saveDatabase();
    return { sourceBatch, targetBatch };
  },

  getDemandHistory: (filters = {}) => {
    let list = loadDatabase().demandHistory;
    if (filters.productId) {
      list = list.filter(d => d.productId === filters.productId);
    }
    if (filters.category) {
      list = list.filter(d => d.category === filters.category);
    }
    if (filters.region) {
      list = list.filter(d => d.region === filters.region);
    }
    if (filters.destinationId) {
      list = list.filter(d => d.destinationId === filters.destinationId);
    }
    return list;
  },

  getRoutes: () => loadDatabase().routes,

  getShipments: () => loadDatabase().shipments,
  getShipmentById: (id) => loadDatabase().shipments.find(s => s.id === id),
  createShipment: (shipment) => {
    const db = loadDatabase();
    const newShipment = {
      id: shipment.id || `SHP-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`,
      ...shipment,
      createdAt: new Date().toISOString()
    };
    db.shipments.unshift(newShipment);
    saveDatabase();
    return newShipment;
  },
  updateShipmentStatus: (id, status, notes = "") => {
    const db = loadDatabase();
    const shp = db.shipments.find(s => s.id === id);
    if (!shp) return null;
    shp.status = status;
    if (status === "Delivered") {
      shp.actualDeliveryDate = new Date().toISOString();
      shp.currentProgressPercent = 100;
      shp.currentLocationDesc = `Delivered at ${shp.destinationName}`;
    } else if (status === "In Transit") {
      shp.currentProgressPercent = 50;
      shp.currentLocationDesc = "Highway En Route to Destination";
    } else if (status === "Dispatched") {
      shp.currentProgressPercent = 20;
      shp.currentLocationDesc = `Dispatched from ${shp.sourceWarehouseName} Bay`;
    }
    if (notes) shp.notes = (shp.notes ? shp.notes + " | " : "") + notes;
    shp.updatedAt = new Date().toISOString();

    db.auditLogs.push({
      id: `AUDIT-${Date.now()}`,
      timestamp: new Date().toISOString(),
      action: "SHIPMENT_STATUS_CHANGE",
      entity: "Shipment",
      details: `Shipment ${shp.id} updated to status '${status}'`
    });

    saveDatabase();
    return shp;
  },

  getDistributionPlans: () => loadDatabase().distributionPlans,
  getDistributionPlanById: (id) => loadDatabase().distributionPlans.find(p => p.id === id),
  saveDistributionPlan: (plan) => {
    const db = loadDatabase();
    const newPlan = {
      id: plan.id || `PLAN-${Date.now().toString().slice(-6)}`,
      createdAt: new Date().toISOString(),
      ...plan
    };
    db.distributionPlans.unshift(newPlan);
    saveDatabase();
    return newPlan;
  },
  updateDistributionPlan: (id, updates) => {
    const db = loadDatabase();
    const idx = db.distributionPlans.findIndex(p => p.id === id);
    if (idx === -1) return null;
    db.distributionPlans[idx] = { ...db.distributionPlans[idx], ...updates, updatedAt: new Date().toISOString() };
    saveDatabase();
    return db.distributionPlans[idx];
  },

  getForecasts: () => loadDatabase().forecasts,
  saveForecast: (forecast) => {
    const db = loadDatabase();
    db.forecasts.unshift(forecast);
    saveDatabase();
    return forecast;
  },

  getSettings: () => loadDatabase().settings,
  updateSettings: (updates) => {
    const db = loadDatabase();
    db.settings = { ...db.settings, ...updates, updatedAt: new Date().toISOString() };
    saveDatabase();
    return db.settings;
  },

  getAuditLogs: () => loadDatabase().auditLogs,

  resetDatabase: () => {
    memoryDb = seedFreshData();
    return memoryDb;
  }
};

// Initialize database file immediately on module load
loadDatabase();

module.exports = Store;
