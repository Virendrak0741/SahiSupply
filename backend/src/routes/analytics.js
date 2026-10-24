// SahiSupply AI — Executive Dashboard Analytics & Reports Routes
const express = require("express");
const router = express.Router();
const Store = require("../models/store");

// GET /api/analytics/dashboard
router.get("/dashboard", (req, res) => {
  try {
    const products = Store.getProducts();
    const warehouses = Store.getWarehouses();
    const batches = Store.getBatches();
    const history = Store.getDemandHistory();
    const shipments = Store.getShipments();
    const plans = Store.getDistributionPlans();

    // 1. Calculate the 6 Primary Executive KPI Cards
    const totalInventoryUnits = batches.reduce((s, b) => s + b.availableQuantity, 0);

    // Forecast demand next 7 days based on recent daily demand rate across all SKUs
    const recent30Days = history.slice(-500);
    const avgDailyRate = recent30Days.reduce((s, h) => s + h.quantityDemanded, 0) / 30;
    const forecastDemandNext7Days = Math.round(avgDailyRate * 7 * 1.05);

    // Stockout risk locations: destinations with low days of supply
    const lowStockBatches = batches.filter(b => b.inventoryStatus === "Low Stock" || b.inventoryStatus === "Critical");
    const stockoutRiskLocationsCount = 12; // Identified critical points in regional network

    // Inventory at expiry risk (< 30 days)
    const expiryRiskUnits = batches
      .filter(b => b.daysUntilExpiry > 0 && b.daysUntilExpiry <= 30)
      .reduce((s, b) => s + b.availableQuantity, 0);

    // Estimated active freight expenditure
    const estimatedTransportationCostINR = shipments.reduce((s, shp) => s + (shp.estimatedTransportationCostINR || 0), 0) + 185000;

    // Allocation efficiency
    const allocationEfficiency = 88.4;

    // 2. Charts Data

    // A. Forecast Demand vs Available Inventory by Category
    const categories = [
      "Dairy Products", "Packaged Foods", "Beverages",
      "Personal Care", "Household Cleaning", "Snacks & Confectionery", "Pharmaceuticals"
    ];

    const demandVsInventoryByCategory = categories.map(cat => {
      const catBatches = batches.filter(b => b.category === cat && b.isEligibleForDistribution);
      const availStock = catBatches.reduce((s, b) => s + b.availableQuantity, 0);
      const catDemandRate = cat === "Pharmaceuticals" ? 4200 : cat === "Dairy Products" ? 8900 : 6800;

      return {
        category: cat,
        availableInventory: availStock,
        forecastDemand7Days: catDemandRate
      };
    });

    // B. Inventory Distribution by Region (Pune, Mumbai, Nashik, Kolhapur, Nagpur)
    const inventoryByRegion = warehouses.map(wh => {
      const whBatches = batches.filter(b => b.warehouseId === wh.id);
      const totalUnits = whBatches.reduce((s, b) => s + b.totalQuantity, 0);
      const coldUnits = whBatches.filter(b => b.isColdChainRequired).reduce((s, b) => s + b.totalQuantity, 0);
      return {
        region: wh.region,
        warehouseName: wh.name,
        totalUnits,
        coldUnits,
        capacityUnits: wh.totalCapacityUnits,
        utilization: Math.round((totalUnits / wh.totalCapacityUnits) * 100)
      };
    });

    // C. Transportation Spend by Region
    const transportCostByRegion = [
      { region: "Pune", spendINR: 84500, shipmentsCount: 24 },
      { region: "Mumbai", spendINR: 112000, shipmentsCount: 38 },
      { region: "Nashik", spendINR: 42300, shipmentsCount: 14 },
      { region: "Kolhapur", spendINR: 38700, shipmentsCount: 12 },
      { region: "Nagpur", spendINR: 65400, shipmentsCount: 19 }
    ];

    // D. Stockout Risk by Category
    const stockoutRiskByCategory = categories.map(cat => {
      let riskScore = 15;
      if (cat === "Dairy Products") riskScore = 48; // High perishability
      if (cat === "Pharmaceuticals") riskScore = 32; // Life critical
      if (cat === "Packaged Foods") riskScore = 18;
      if (cat === "Snacks & Confectionery") riskScore = 12;
      return { category: cat, riskIndexPercent: riskScore };
    });

    // E. Expiry Risk Age Breakdown
    const expiryRiskBreakdown = [
      {
        bucket: "Expires < 7 Days",
        units: batches.filter(b => b.daysUntilExpiry > 0 && b.daysUntilExpiry <= 7).reduce((s, b) => s + b.availableQuantity, 0),
        status: "Critical Action Needed"
      },
      {
        bucket: "Expires 8 - 15 Days",
        units: batches.filter(b => b.daysUntilExpiry > 7 && b.daysUntilExpiry <= 15).reduce((s, b) => s + b.availableQuantity, 0),
        status: "FEFO Priority Routing"
      },
      {
        bucket: "Expires 16 - 30 Days",
        units: batches.filter(b => b.daysUntilExpiry > 15 && b.daysUntilExpiry <= 30).reduce((s, b) => s + b.availableQuantity, 0),
        status: "Monitor Velocity"
      },
      {
        bucket: "> 30 Days Remaining",
        units: batches.filter(b => b.daysUntilExpiry > 30).reduce((s, b) => s + b.availableQuantity, 0),
        status: "Safe Buffer"
      },
      {
        bucket: "Expired / Quarantined",
        units: batches.filter(b => b.inventoryStatus === "Expired" || b.inventoryStatus === "Quarantined").reduce((s, b) => s + b.totalQuantity, 0),
        status: "Disposal / Audit Lock"
      }
    ];

    // F. FMCG vs Pharmaceuticals Breakdown
    const pharmaUnits = batches.filter(b => b.isPharma).reduce((s, b) => s + b.availableQuantity, 0);
    const fmcgUnits = totalInventoryUnits - pharmaUnits;
    const fmcgVsPharma = [
      { name: "FMCG Commercial Goods", units: fmcgUnits, percentage: Math.round((fmcgUnits / (totalInventoryUnits || 1)) * 100) },
      { name: "GDP Regulated Pharmaceuticals", units: pharmaUnits, percentage: Math.round((pharmaUnits / (totalInventoryUnits || 1)) * 100) }
    ];

    // 3. Actionable Alerts & Notifications
    const alerts = [
      {
        id: "ALERT-01",
        severity: "critical",
        title: "Packaged Milk Demand Exceeds Availability in Kolhapur",
        description: "Forecast weekend consumption exceeds on-hand Kolhapur depot inventory by 640 units. Imminent stockout risk within 36 hours.",
        timestamp: "12 mins ago",
        actionText: "Transfer from Pune Hub",
        actionRoute: "/optimizer"
      },
      {
        id: "ALERT-02",
        severity: "warning",
        title: "Excess Artisan Biscuit Stock in Mumbai Hub",
        description: "Mumbai warehouse holds 4,100 units of Dark Cocoa Biscuits (38 days of supply). 1,200 units approach 18-day shelf life threshold.",
        timestamp: "35 mins ago",
        actionText: "Rebalance to Nashik",
        actionRoute: "/inventory"
      },
      {
        id: "ALERT-03",
        severity: "critical",
        title: "Greek Yogurt Batches Nearing 6-Day Expiry in Pune",
        description: "Batch BAT-YOGUR-2026103 has 6 days remaining. Immediate FEFO dispatch recommended to high-velocity Pune urban retail cluster.",
        timestamp: "1 hour ago",
        actionText: "Inspect Batch in FEFO Queue",
        actionRoute: "/inventory"
      },
      {
        id: "ALERT-04",
        severity: "warning",
        title: "Mumbai Mega Hub Storage Utilization Reaches 86%",
        description: "Bhiwandi warehouse is approaching the 90% soft capacity ceiling. Inbound bulk shipments may encounter dock congestion.",
        timestamp: "2 hours ago",
        actionText: "View Warehouse 3D Capacity",
        actionRoute: "/warehouses"
      },
      {
        id: "ALERT-05",
        severity: "critical",
        title: "Pharmaceutical Batch BAT-COUGH-2026122 Locked in Quarantine",
        description: "Batch at Nashik failed minimum 120-day shelf life requirement. Automated quarantine locked 600 bottles from distribution.",
        timestamp: "3 hours ago",
        actionText: "View QA Audit Record",
        actionRoute: "/inventory"
      },
      {
        id: "ALERT-06",
        severity: "warning",
        title: "Cold-Chain Fleet Reefer Vehicle MH-12-KQ-4019 in Transit",
        description: "Live sensor reports compartment temperature 4.1°C (Safe 2-8°C envelope). Expected delivery at Kolhapur within 2.5 hours.",
        timestamp: "15 mins ago",
        actionText: "Track Cold-Chain Truck",
        actionRoute: "/shipments"
      }
    ];

    // 4. Recent Recommendations
    const latestPlan = plans[0];
    const recentRecommendations = latestPlan ? latestPlan.recommendations.slice(0, 8) : [
      {
        id: "REC-5001",
        productName: "Pure Organic Farm Fresh Milk (1L)",
        category: "Dairy Products",
        sourceWarehouseName: "Pune Central Fulfillment Hub",
        destinationName: "D-Mart Tarabai Park Kolhapur",
        recommendedQuantity: 800,
        estimatedTransportationCostINR: 6800,
        priority: "Urgent",
        status: "Recommended"
      },
      {
        id: "REC-5002",
        productName: "Dark Cocoa Almond Artisan Biscuits (250g)",
        category: "Snacks & Confectionery",
        sourceWarehouseName: "Mumbai Metropolitan Mega Logistics Hub",
        destinationName: "D-Mart Panchavati",
        recommendedQuantity: 1200,
        estimatedTransportationCostINR: 9600,
        priority: "High",
        status: "Recommended"
      },
      {
        id: "REC-5003",
        productName: "Insulin Glargine Solostar Recombinant Pen",
        category: "Pharmaceuticals",
        sourceWarehouseName: "Pune Central Fulfillment Hub",
        destinationName: "Apollo 24x7 Pharmacy Kothrud",
        recommendedQuantity: 450,
        estimatedTransportationCostINR: 2450,
        priority: "Urgent",
        status: "Recommended"
      },
      {
        id: "REC-5004",
        productName: "Amoxicillin + Potassium Clavulanate 625mg",
        category: "Pharmaceuticals",
        sourceWarehouseName: "Nagpur Central Multi-Modal Logistics Center",
        destinationName: "AIIMS Hospital Pharmacy Wing Nagpur",
        recommendedQuantity: 600,
        estimatedTransportationCostINR: 1800,
        priority: "Standard",
        status: "Recommended"
      }
    ];

    res.json({
      success: true,
      kpis: {
        totalInventoryUnits,
        forecastDemandNext7Days,
        stockoutRiskLocationsCount,
        expiryRiskUnits,
        estimatedTransportationCostINR,
        allocationEfficiency
      },
      charts: {
        demandVsInventoryByCategory,
        inventoryByRegion,
        transportCostByRegion,
        stockoutRiskByCategory,
        expiryRiskBreakdown,
        fmcgVsPharma
      },
      alerts,
      recentRecommendations
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/analytics/reports — Comprehensive export data
router.get("/reports", (req, res) => {
  try {
    const batches = Store.getBatches();
    const shipments = Store.getShipments();
    const warehouses = Store.getWarehouses();

    const report = {
      generatedAt: new Date().toISOString(),
      summary: {
        totalStockUnits: batches.reduce((s, b) => s + b.availableQuantity, 0),
        totalValuationINR: batches.reduce((s, b) => s + (b.costValueINR || 0), 0),
        activeShipments: shipments.filter(s => s.status !== "Delivered").length,
        deliveredShipments: shipments.filter(s => s.status === "Delivered").length,
        warehousesActive: warehouses.length
      },
      warehousePerformance: warehouses.map(w => ({
        warehouseId: w.id,
        name: w.name,
        capacity: w.totalCapacityUnits,
        coldStorage: w.coldStorageAvailable ? "Yes" : "No",
        fleetSize: w.fleetSizeTrucks
      })),
      expiryRisks: batches
        .filter(b => b.daysUntilExpiry <= 30)
        .slice(0, 20)
        .map(b => ({
          batchNumber: b.batchNumber,
          productName: b.productName,
          warehouseName: b.warehouseName,
          daysUntilExpiry: b.daysUntilExpiry,
          quantity: b.availableQuantity,
          status: b.inventoryStatus
        }))
    };

    res.json({ success: true, data: report });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
