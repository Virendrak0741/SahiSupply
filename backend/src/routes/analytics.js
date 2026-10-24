// SahiSupply AI — Executive Dashboard Analytics & Multi-Regional Control Tower
const express = require("express");
const router = express.Router();
const Store = require("../models/store");
const { REGIONAL_PROFILES } = require("../data/datasetGenerator");

// GET /api/analytics/dashboard — Multi-Regional Analytics & KPI Feeds
router.get("/dashboard", (req, res) => {
  try {
    const requestedRegion = req.query.region || "All";
    const isAll = requestedRegion === "All";

    const allProducts = Store.getProducts();
    const allWarehouses = Store.getWarehouses();
    const allDestinations = Store.getDestinations();
    const allBatches = Store.getBatches();
    const allHistory = Store.getDemandHistory();
    const allShipments = Store.getShipments();
    const plans = Store.getDistributionPlans();

    // Filter datasets according to region
    const warehouses = isAll ? allWarehouses : allWarehouses.filter(w => w.region === requestedRegion);
    const destinations = isAll ? allDestinations : allDestinations.filter(d => d.region === requestedRegion);
    const batches = isAll ? allBatches : allBatches.filter(b => b.warehouseRegion === requestedRegion);
    const history = isAll ? allHistory : allHistory.filter(h => h.region === requestedRegion);
    const shipments = isAll
      ? allShipments
      : allShipments.filter(s => s.destinationRegion === requestedRegion || s.sourceRegion === requestedRegion);

    // 1. Calculate the 6 Primary Executive KPI Cards for the region
    const totalInventoryUnits = batches.reduce((s, b) => s + b.availableQuantity, 0);

    // 7-day forecast demand based on historical demand rate in this region
    const recentHistory = history.slice(-Math.min(1000, history.length));
    const recentTotalDemand = recentHistory.reduce((s, h) => s + h.quantityDemanded, 0);
    const uniqueDays = Math.max(1, new Set(recentHistory.map(h => h.date)).size);
    const avgDailyRate = recentTotalDemand / uniqueDays;
    const forecastDemandNext7Days = Math.round(avgDailyRate * 7 * 1.05);

    // High & Medium stockout risk destinations in this region
    const stockoutRiskDestinations = destinations.filter(d => d.stockoutRiskLevel === "High" || d.stockoutRiskLevel === "Medium");
    const stockoutRiskLocationsCount = stockoutRiskDestinations.length;

    // Inventory at expiry risk (< 30 days) in this region
    const expiryRiskUnits = batches
      .filter(b => b.daysUntilExpiry > 0 && b.daysUntilExpiry <= 30)
      .reduce((s, b) => s + b.availableQuantity, 0);

    // Active transportation cost in this region
    const regionalFreightBase = isAll ? 245000 : requestedRegion === "North" ? 78000 : requestedRegion === "West" ? 92000 : requestedRegion === "South" ? 64000 : 38000;
    const estimatedTransportationCostINR = shipments.reduce((s, shp) => s + (shp.estimatedTransportationCostINR || 0), 0) + regionalFreightBase;

    // Allocation efficiency
    const allocationEfficiency = requestedRegion === "North" ? 91.2 : requestedRegion === "West" ? 94.8 : requestedRegion === "South" ? 93.4 : requestedRegion === "East" ? 88.6 : 92.5;

    // 2. Charts Data

    // A. Forecast Demand vs Available Inventory by Category
    const categories = [
      "Dairy Products", "Packaged Foods", "Beverages",
      "Personal Care", "Household Cleaning", "Snacks & Confectionery", "Pharmaceuticals"
    ];

    const demandVsInventoryByCategory = categories.map(cat => {
      const catBatches = batches.filter(b => b.category === cat && b.isEligibleForDistribution);
      const availStock = catBatches.reduce((s, b) => s + b.availableQuantity, 0);

      // Calculate recent category demand in this region
      const catHistory = recentHistory.filter(h => h.category === cat);
      const catDailyAvg = catHistory.length > 0
        ? catHistory.reduce((s, h) => s + h.quantityDemanded, 0) / uniqueDays
        : 850;

      return {
        category: cat,
        availableInventory: availStock,
        forecastDemand7Days: Math.round(catDailyAvg * 7)
      };
    });

    // B. Warehouse Capacity & Utilization in this region
    const inventoryByRegion = warehouses.map(wh => {
      const whBatches = batches.filter(b => b.warehouseId === wh.id);
      const totalUnits = whBatches.reduce((s, b) => s + b.totalQuantity, 0);
      const coldUnits = whBatches.filter(b => b.isColdChainRequired).reduce((s, b) => s + b.totalQuantity, 0);
      return {
        region: wh.region,
        warehouseName: wh.name,
        city: wh.city,
        totalUnits,
        coldUnits,
        capacityUnits: wh.totalCapacityUnits,
        utilization: Math.min(100, Math.round((totalUnits / wh.totalCapacityUnits) * 100))
      };
    });

    // C. Transportation Spend by Region
    const transportCostByRegion = [
      { region: "North (Delhi-NCR)", spendINR: 84500, shipmentsCount: 26, avgLeadTimeHours: 18 },
      { region: "West (Mumbai/Pune/Gujarat)", spendINR: 115000, shipmentsCount: 42, avgLeadTimeHours: 8 },
      { region: "South (BLR/HYD/MAA)", spendINR: 92000, shipmentsCount: 31, avgLeadTimeHours: 12 },
      { region: "East (Kolkata/WB)", spendINR: 48500, shipmentsCount: 16, avgLeadTimeHours: 24 }
    ];

    // D. Stockout Risk by Category (Dynamic based on region)
    const stockoutRiskByCategory = categories.map(cat => {
      let riskScore = 18;
      if (requestedRegion === "North") {
        if (cat === "Pharmaceuticals") riskScore = 52; // Heavy winter smog respiratory surge
        else if (cat === "Packaged Foods") riskScore = 34; // Staple atta/rice
        else if (cat === "Dairy Products") riskScore = 28;
      } else if (requestedRegion === "South") {
        if (cat === "Pharmaceuticals") riskScore = 44; // High biologics & insulin demand
        else if (cat === "Dairy Products") riskScore = 38; // Probiotic Greek yogurt
        else if (cat === "Beverages") riskScore = 32;
      } else if (requestedRegion === "West") {
        if (cat === "Snacks & Confectionery") riskScore = 42; // Quick-commerce snack depletion
        else if (cat === "Dairy Products") riskScore = 36;
        else if (cat === "Personal Care") riskScore = 30;
      } else if (requestedRegion === "East") {
        if (cat === "Beverages") riskScore = 58; // Tea consumption peak
        else if (cat === "Pharmaceuticals") riskScore = 46; // ORS and antiseptic remedies
        else if (cat === "Snacks & Confectionery") riskScore = 32;
      } else {
        if (cat === "Dairy Products") riskScore = 45;
        if (cat === "Pharmaceuticals") riskScore = 42;
        if (cat === "Beverages") riskScore = 26;
      }
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
        status: "Normal Healthy Stock"
      }
    ];

    // F. FMCG vs Pharma Share
    const pharmaUnits = batches.filter(b => b.isPharma).reduce((s, b) => s + b.availableQuantity, 0);
    const fmcgUnits = batches.filter(b => !b.isPharma).reduce((s, b) => s + b.availableQuantity, 0);
    const fmcgVsPharma = [
      { name: "FMCG Products", value: fmcgUnits, fill: "#2563EB" },
      { name: "Pharmaceuticals", value: pharmaUnits, fill: "#8B5CF6" }
    ];

    // 3. Authentic Regional Alerts
    const regionalAlerts = {
      North: [
        {
          id: "ALERT-N01",
          severity: "critical",
          title: "PM2.5 Winter Smog Inversion: +240% Surge in Respiratory Pharma",
          description: "High particulate pollution across Delhi-NCR is driving critical stock shortages of Ascoril D Plus Cough Syrup and Dolo 650 at Connaught Place and Saket pharmacies.",
          timestamp: "12 mins ago",
          actionText: "Run North FEFO Allocation",
          actionRoute: "/optimizer"
        },
        {
          id: "ALERT-N02",
          severity: "warning",
          title: "Aashirvaad Sharbati Atta (5kg) Safety Stock Warning at Gurugram",
          description: "Reliance Smart Bazaar Sector 29 has 2.1 days of supply remaining against 7-day winter forecast demand.",
          timestamp: "45 mins ago",
          actionText: "Dispatch from Bilaspur Hub",
          actionRoute: "/inventory"
        }
      ],
      South: [
        {
          id: "ALERT-S01",
          severity: "critical",
          title: "Cold-Chain Biologics GDP Alert: Lantus Insulin Solostar Depot Depletion",
          description: "Indiranagar Apollo 24|7 and Jubilee Hills pharmacies report high diabetes clinical draw. Strict 2-8°C reefer dispatch required from Shamshabad FTWZ.",
          timestamp: "20 mins ago",
          actionText: "Verify GDP Reefer Fleet",
          actionRoute: "/shipments"
        },
        {
          id: "ALERT-S02",
          severity: "info",
          title: "Epigamia Greek Probiotic Yogurt Surge in Whitefield Tech Corridor",
          description: "Demand velocity up 180% week-on-week among urban tech demographic. Nelamangala warehouse cold vault dispatching batch BAT-BLR-002.",
          timestamp: "1 hour ago",
          actionText: "View 3D Cold Vaults",
          actionRoute: "/inventory"
        }
      ],
      West: [
        {
          id: "ALERT-W01",
          severity: "warning",
          title: "Bhiwandi Mega Hub: Rapid Quick-Commerce Snacking Turnover",
          description: "Haldiram's Roasted Makhana and Britannia Cocoa Biscuits experiencing 2.4x order frequency from Mumbai MMR dark stores.",
          timestamp: "30 mins ago",
          actionText: "Review Cross-Dock Schedules",
          actionRoute: "/shipments"
        },
        {
          id: "ALERT-W02",
          severity: "info",
          title: "Chakan MIDC Industrial Fleet Reefer Vehicle MH-12-KQ-4019 in Transit",
          description: "Live sensor telemetry reports 4.1°C compartment temperature (Safe 2-8°C envelope) en route to Pune Deccan Gymkhana.",
          timestamp: "15 mins ago",
          actionText: "Track Reefer Van",
          actionRoute: "/shipments"
        }
      ],
      East: [
        {
          id: "ALERT-E01",
          severity: "critical",
          title: "Tata Tea Gold & Electral ORS Depletion at Central Kolkata Retail",
          description: "Frank Ross Heritage Park Street and Burrabazar wholesale network face low stock due to 24-hour inbound lead times from central supply.",
          timestamp: "18 mins ago",
          actionText: "Expedite from Dankuni Hub",
          actionRoute: "/optimizer"
        },
        {
          id: "ALERT-E02",
          severity: "warning",
          title: "Howrah Agro Terminal: Long-Haul Highway Consignment Arrived",
          description: "Received 3,200 units of Aashirvaad Atta and Basmati rice from North corridor; quarantine check completed.",
          timestamp: "2 hours ago",
          actionText: "Release to Inventory",
          actionRoute: "/inventory"
        }
      ]
    };

    const alerts = isAll
      ? [
          ...regionalAlerts.North.slice(0, 1),
          ...regionalAlerts.South.slice(0, 1),
          ...regionalAlerts.West.slice(0, 1),
          ...regionalAlerts.East.slice(0, 1)
        ]
      : regionalAlerts[requestedRegion] || regionalAlerts.West;

    // 4. Regional Recommendations
    const latestPlan = plans[0];
    const recs = latestPlan ? latestPlan.recommendations : [];
    const recentRecommendations = isAll
      ? recs.slice(0, 8)
      : recs.filter(r => r.destinationRegion === requestedRegion || r.sourceRegion === requestedRegion).slice(0, 8);

    // 5. Regional Context Metadata
    const regionalContext = isAll
      ? {
          name: "All India National Supply Network",
          macroContext: "Multi-regional supply chain coordinating 13 mega warehouses and 38 commercial destinations across North, West, South, and East corridors.",
          primaryDrivers: "Cross-regional load balancing, FEFO expiry minimization, and strict GDP cold-chain compliance."
        }
      : REGIONAL_PROFILES[requestedRegion] || REGIONAL_PROFILES.West;

    res.json({
      success: true,
      selectedRegion: requestedRegion,
      regionalContext,
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
    const region = req.query.region || "All";
    const batches = Store.getBatches(region);
    const shipments = Store.getShipments();
    const warehouses = Store.getWarehouses(region);

    const report = {
      generatedAt: new Date().toISOString(),
      region,
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
        region: w.region,
        city: w.city,
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
          warehouseRegion: b.warehouseRegion,
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
