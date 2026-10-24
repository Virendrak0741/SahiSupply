// SahiSupply AI — Inventory & Warehouse Management Routes
const express = require("express");
const router = express.Router();
const Store = require("../models/store");

// GET /api/inventory/overview — KPI cards
router.get("/overview", (req, res) => {
  try {
    const region = req.query.region;
    const products = Store.getProducts();
    const batches = Store.getBatches(region);

    const totalSKUs = products.length;
    let totalUnits = 0;
    let availableUnits = 0;
    let reservedUnits = 0;
    let lowStockCount = 0;
    let excessStockCount = 0;
    let nearExpiryBatches = 0;
    let expiredBatches = 0;
    let pharmaAttentionCount = 0;

    batches.forEach(b => {
      totalUnits += b.totalQuantity;
      availableUnits += b.availableQuantity;
      reservedUnits += b.reservedQuantity;

      if (b.inventoryStatus === "Low Stock" || b.inventoryStatus === "Critical") lowStockCount++;
      if (b.inventoryStatus === "Excess Stock") excessStockCount++;
      if (b.inventoryStatus === "Near Expiry") nearExpiryBatches++;
      if (b.inventoryStatus === "Expired" || b.inventoryStatus === "Quarantined") expiredBatches++;
      if (b.isPharma && (b.inventoryStatus !== "Healthy" || b.daysUntilExpiry < 90)) {
        pharmaAttentionCount++;
      }
    });

    res.json({
      success: true,
      data: {
        totalSKUs,
        totalUnits,
        availableUnits,
        reservedUnits,
        lowStockCount,
        excessStockCount,
        nearExpiryBatches,
        expiredBatches,
        pharmaAttentionCount
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/inventory/products
router.get("/products", (req, res) => {
  try {
    const products = Store.getProducts();
    res.json({ success: true, data: products });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/inventory/products
router.post("/products", (req, res) => {
  try {
    const { name, category, sku, packagingSize, basePriceINR, standardShelfLifeDays } = req.body;
    if (!name || !category || !sku) {
      return res.status(400).json({ success: false, error: "Name, category, and SKU are required." });
    }
    const newProduct = Store.createProduct(req.body);
    res.status(201).json({ success: true, data: newProduct });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/inventory/products/:id
router.put("/products/:id", (req, res) => {
  try {
    const updated = Store.updateProduct(req.params.id, req.body);
    if (!updated) return res.status(404).json({ success: false, error: "Product not found" });
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/inventory/batches — filterable batches table
router.get("/batches", (req, res) => {
  try {
    const { category, warehouseId, status, search, isPharma, expiryFilter, region } = req.query;
    let list = Store.getBatches(region);

    if (category) list = list.filter(b => b.category === category);
    if (warehouseId) list = list.filter(b => b.warehouseId === warehouseId);
    if (status) list = list.filter(b => b.inventoryStatus === status);
    if (isPharma !== undefined) {
      const isP = isPharma === "true";
      list = list.filter(b => b.isPharma === isP);
    }
    if (expiryFilter) {
      if (expiryFilter === "7days") list = list.filter(b => b.daysUntilExpiry > 0 && b.daysUntilExpiry <= 7);
      else if (expiryFilter === "15days") list = list.filter(b => b.daysUntilExpiry > 0 && b.daysUntilExpiry <= 15);
      else if (expiryFilter === "30days") list = list.filter(b => b.daysUntilExpiry > 0 && b.daysUntilExpiry <= 30);
      else if (expiryFilter === "expired") list = list.filter(b => b.daysUntilExpiry <= 0 || b.inventoryStatus === "Expired" || b.inventoryStatus === "Quarantined");
      else if (expiryFilter === "healthy") list = list.filter(b => b.daysUntilExpiry > 30 && b.inventoryStatus === "Healthy");
    }
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(b =>
        b.productName.toLowerCase().includes(q) ||
        b.batchNumber.toLowerCase().includes(q) ||
        b.sku.toLowerCase().includes(q) ||
        b.warehouseName.toLowerCase().includes(q)
      );
    }

    res.json({ success: true, count: list.length, data: list });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/inventory/batches
router.post("/batches", (req, res) => {
  try {
    const { productId, warehouseId, batchNumber, quantity, expiryDate } = req.body;
    if (!productId || !warehouseId || !batchNumber || !quantity || !expiryDate) {
      return res.status(400).json({ success: false, error: "Missing required batch parameters" });
    }

    const prod = Store.getProductById(productId);
    const wh = Store.getWarehouseById(warehouseId);
    if (!prod || !wh) {
      return res.status(400).json({ success: false, error: "Invalid product or warehouse reference" });
    }

    const expDate = new Date(expiryDate);
    const now = new Date("2026-10-24T00:00:00Z");
    const diffDays = Math.round((expDate - now) / (1000 * 60 * 60 * 24));

    const newBatch = Store.createBatch({
      batchNumber,
      productId: prod.id,
      productName: prod.name,
      category: prod.category,
      sku: prod.sku,
      warehouseId: wh.id,
      warehouseName: wh.name,
      manufacturingDate: req.body.manufacturingDate || "2026-10-01",
      expiryDate,
      daysUntilExpiry: diffDays,
      availableQuantity: parseInt(quantity, 10),
      reservedQuantity: 0,
      totalQuantity: parseInt(quantity, 10),
      safetyStock: 100,
      minStock: 40,
      avgDailyDemand: 25,
      daysOfInventoryRemaining: Math.round(quantity / 25),
      inventoryStatus: diffDays <= 0 ? "Expired" : (diffDays < 15 ? "Near Expiry" : "Healthy"),
      isEligibleForDistribution: diffDays > prod.minShelfLifeDaysDelivery,
      isPharma: prod.isPharma,
      isColdChainRequired: prod.isColdChainRequired,
      storageTempRange: prod.tempRangeCelsius,
      handlingRequirements: prod.handlingNotes
    });

    res.status(201).json({ success: true, data: newBatch });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/inventory/batches/:id
router.put("/batches/:id", (req, res) => {
  try {
    const updated = Store.updateBatch(req.params.id, req.body);
    if (!updated) return res.status(404).json({ success: false, error: "Batch not found" });
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/inventory/transfer
router.post("/transfer", (req, res) => {
  try {
    const { batchId, targetWarehouseId, quantity } = req.body;
    if (!batchId || !targetWarehouseId || !quantity) {
      return res.status(400).json({ success: false, error: "batchId, targetWarehouseId, and quantity are required" });
    }
    const result = Store.transferBatch(batchId, targetWarehouseId, parseInt(quantity, 10));
    res.json({ success: true, data: result, message: "Inventory successfully transferred" });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// GET /api/inventory/export-csv
router.get("/export-csv", (req, res) => {
  try {
    const batches = Store.getBatches();
    const headers = [
      "Batch ID", "Product Name", "Category", "SKU", "Warehouse", "Batch Number",
      "Available Qty", "Reserved Qty", "Total Qty", "Days to Expiry", "Expiry Date", "Status", "Pharma"
    ];

    const rows = batches.map(b => [
      `"${b.id}"`,
      `"${b.productName.replace(/"/g, '""')}"`,
      `"${b.category}"`,
      `"${b.sku}"`,
      `"${b.warehouseName}"`,
      `"${b.batchNumber}"`,
      b.availableQuantity,
      b.reservedQuantity,
      b.totalQuantity,
      b.daysUntilExpiry,
      `"${b.expiryDate}"`,
      `"${b.inventoryStatus}"`,
      b.isPharma ? "Yes" : "No"
    ]);

    const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=sahisupply_inventory.csv");
    res.send(csvContent);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
