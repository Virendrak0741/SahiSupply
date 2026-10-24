// SahiSupply AI — Authentic Multi-Regional Dataset Generator
// Generates realistic demand, inventory batches, and transportation routes with distinct characteristics across:
// North (Delhi-NCR), West (Mumbai/Pune/Gujarat), South (Bengaluru/Hyderabad/Chennai), East (Kolkata)

const { PRODUCTS, WAREHOUSES, DISTRIBUTORS, RETAIL_AND_PHARMACIES } = require("./seedData");

// Base operational reference date: October 24, 2026
const CURRENT_DATE_STR = "2026-10-24";
const CURRENT_DATE = new Date("2026-10-24T00:00:00.000Z");

function addDays(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function formatDate(date) {
  return date.toISOString().split("T")[0];
}

// Haversine formula for genuine geographic distance calculation (in Kilometers)
function calculateHaversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const straightLine = R * c;
  // Highway tortuosity factor (~1.25x for Indian national highways)
  return Math.max(15, Math.round(straightLine * 1.25));
}

// Distinct Regional Demand & Consumption Profiles
const REGIONAL_PROFILES = {
  North: {
    macroContext: "Winter onset with severe PM2.5 atmospheric smog inversion in Delhi-NCR",
    primaryDrivers: "Heavy surge in respiratory & fever pharma, staple wheat atta, desi ghee, and winter immunity items",
    categoryMultipliers: {
      "Pharmaceuticals": 2.3, // Surge in cough syrups, antipyretics, inhalers
      "Packaged Foods": 1.7, // Heavy staple wheat atta & basmati rice
      "Dairy Products": 1.35, // Full-cream dairy & desi ghee
      "Beverages": 0.8, // Reduced cold juice consumption; hot tea spikes
      "Snacks & Confectionery": 1.1,
      "Personal Care": 0.9,
      "Household Cleaning": 1.05
    },
    productMultipliers: {
      "PROD-PHARMA-004": 3.4, // Ascoril Cough Syrup (+240%)
      "PROD-PHARMA-001": 2.5, // Dolo 650 Tablets (+150%)
      "PROD-PHARMA-005": 2.7, // Becozinc Multivitamin + Zinc (+170%)
      "PROD-FOOD-001": 2.3, // Aashirvaad Sharbati Atta 5kg (+130%)
      "PROD-DAIRY-003": 2.0, // Amul Cow Desi Ghee 1L (+100%)
      "PROD-BEV-002": 1.9 // Tata Tea Gold (+90%)
    },
    stockoutRiskIndex: 38.5,
    freightPerKmINR: 2.10
  },
  West: {
    macroContext: "Year-round coastal commercial hub with massive quick-commerce (Blinkit/Zepto) order density",
    primaryDrivers: "Rapid turnover of packaged snacks, namkeen, premium personal care serums, and ready dairy",
    categoryMultipliers: {
      "Snacks & Confectionery": 2.4, // Massive snack and namkeen consumption
      "Personal Care": 1.9, // Skincare, hyaluronic serums, shampoos
      "Household Cleaning": 1.75, // Detergents and surface cleaners
      "Dairy Products": 1.5, // High daily milk & fresh curd turnover
      "Beverages": 1.45, // Year-round cold juices and sparkling water
      "Packaged Foods": 1.3,
      "Pharmaceuticals": 1.15
    },
    productMultipliers: {
      "PROD-SNACK-002": 2.7, // Haldiram's Roasted Pink Salt Makhana (+170%)
      "PROD-SNACK-001": 2.3, // Britannia Dark Cocoa Cookies (+130%)
      "PROD-CARE-001": 2.5, // The Derma Co Hyaluronic Serum (+150%)
      "PROD-CLEAN-001": 2.1, // Surf Excel Matic Liquid Detergent (+110%)
      "PROD-BEV-001": 2.2 // Raw Pressery Orange Juice (+120%)
    },
    stockoutRiskIndex: 22.0,
    freightPerKmINR: 1.85
  },
  South: {
    macroContext: "Tech corridor & biotechnology healthcare hub with fitness, wellness, and cold-chain clinical demand",
    primaryDrivers: "Highest demand for cold-chain biologics (Insulin pens, live probiotics) and premium organic wellness",
    categoryMultipliers: {
      "Pharmaceuticals": 1.85, // Biologics, diabetes, specialized medicines
      "Dairy Products": 1.4, // Artisanal Greek probiotic yogurt
      "Beverages": 1.6, // Cold-pressed juices and sparkling water
      "Snacks & Confectionery": 1.5, // Protein granola & superfoods
      "Personal Care": 1.8, // Dermatological care & clean beauty
      "Packaged Foods": 1.35, // Oats, breakfast cereals
      "Household Cleaning": 1.2
    },
    productMultipliers: {
      "PROD-PHARMA-007": 3.9, // Lantus Solostar Insulin Glargine Pen (+290%)
      "PROD-PHARMA-008": 3.3, // Darolac Multi-Strain Live Probiotics (+230%)
      "PROD-DAIRY-002": 3.0, // Epigamia Greek Probiotic Yogurt (+200%)
      "PROD-SNACK-003": 2.8, // Kellogg's Protein Superfood Granola (+180%)
      "PROD-BEV-001": 2.5 // Raw Pressery Valencia Orange Juice (+150%)
    },
    stockoutRiskIndex: 29.4,
    freightPerKmINR: 1.95
  },
  East: {
    macroContext: "Subtropical Gangetic delta with vibrant tea-drinking heritage and neighborhood pharmacy reliance",
    primaryDrivers: "Extreme tea consumption, oral rehydration electrolytes, antiseptic remedies, and tea-time biscuits",
    categoryMultipliers: {
      "Beverages": 2.8, // Extreme tea consumption (Tata Tea Gold)
      "Pharmaceuticals": 1.6, // Gastrointestinal, antiseptic, and fever remedies
      "Snacks & Confectionery": 1.7, // Tea-time biscuits & confectioneries
      "Packaged Foods": 1.25,
      "Personal Care": 1.1,
      "Household Cleaning": 1.1,
      "Dairy Products": 1.05
    },
    productMultipliers: {
      "PROD-BEV-002": 4.5, // Tata Tea Gold Assam CTC & Leaf (+350%)
      "PROD-PHARMA-003": 3.0, // Electral ORS WHO Formula (+200%)
      "PROD-PHARMA-006": 2.8, // Cipladine Antiseptic Solution (+180%)
      "PROD-SNACK-001": 2.4, // Britannia Dark Cocoa Cookies (+140%)
      "PROD-PHARMA-001": 2.1 // Dolo 650 Tablets (+110%)
    },
    stockoutRiskIndex: 34.2,
    freightPerKmINR: 2.25
  }
};

// Generate realistic routes between Warehouses and Destinations across all regions
function generateRoutes() {
  const allDestinations = [...DISTRIBUTORS, ...RETAIL_AND_PHARMACIES];
  const routes = [];

  for (const wh of WAREHOUSES) {
    for (const dest of allDestinations) {
      // Calculate genuine highway distance using coordinates
      const distanceKm = calculateHaversineKm(
        wh.coordinates.lat,
        wh.coordinates.lng,
        dest.coordinates.lat,
        dest.coordinates.lng
      );

      // Same region indicates local / intra-regional link
      const isSameRegion = wh.region === dest.region;

      // Realistic transit lead times:
      // Local intra-regional (speed ~ 35 km/h + 2h dock loading)
      // Long-haul interstate (speed ~ 45 km/h + 6h highway toll & dock handling)
      const leadTimeHours = isSameRegion
        ? Math.max(3, Math.round(distanceKm / 35 + 2))
        : Math.round(distanceKm / 45 + 6);
      const leadTimeDays = Math.ceil(leadTimeHours / 24);

      // Freight rate calculation:
      // Intra-regional rate: ₹1.8 - ₹2.2 / km / unit
      // Long-haul interstate: volume rebate
      const baseFreightRate = (REGIONAL_PROFILES[wh.region] || REGIONAL_PROFILES.West).freightPerKmINR;
      const baseCostPerUnit = isSameRegion
        ? Math.max(12, Math.round(14 + distanceKm * 0.16 * baseFreightRate))
        : Math.max(45, Math.round(35 + distanceKm * 0.11 * baseFreightRate));

      // 65% premium for temperature-controlled reefer freight
      const coldChainCostPerUnit = Math.round(baseCostPerUnit * 1.65);

      // Max truck capacity
      const maxTruckCapacityUnits = distanceKm > 500 ? 15000 : 9000;

      routes.push({
        id: `ROUTE-${wh.id}-${dest.id}`,
        sourceWarehouseId: wh.id,
        sourceWarehouseName: wh.name,
        sourceRegion: wh.region,
        destinationId: dest.id,
        destinationName: dest.name,
        destinationType: dest.type,
        destinationRegion: dest.region,
        destinationCity: dest.city,
        destinationState: dest.state,
        distanceKm,
        isSameRegion,
        leadTimeHours,
        leadTimeDays,
        standardCostPerUnitINR: baseCostPerUnit,
        coldChainCostPerUnitINR: coldChainCostPerUnit,
        routeCapacityUnits: maxTruckCapacityUnits,
        isEligibleColdChain: wh.coldStorageAvailable && dest.hasColdChain,
        isEligiblePharma:
          wh.handlingCapabilities.includes("Pharmaceutical GDP") &&
          (dest.hasPharmaLicense || dest.type === "Distributor" || !dest.type.includes("Pharmacy"))
      });
    }
  }

  return routes;
}

// Generate realistic multi-warehouse batches with distinct regional stock dynamics
function generateInventoryBatches() {
  const batches = [];
  let batchCounter = 1000;

  for (const wh of WAREHOUSES) {
    const regProfile = REGIONAL_PROFILES[wh.region] || REGIONAL_PROFILES.West;

    for (const prod of PRODUCTS) {
      // Determine regional stock weighting:
      // Warehouses hold higher stock of categories prioritized in their region
      const catMult = regProfile.categoryMultipliers[prod.category] || 1.0;
      const prodMult = regProfile.productMultipliers[prod.id] || 1.0;
      const demandMultiplier = catMult * prodMult;

      // Number of batches per SKU (2 to 4 batches representing different manufacturing dates)
      const numBatches = prod.isColdChainRequired ? 2 : 3;

      for (let bIdx = 0; bIdx < numBatches; bIdx++) {
        batchCounter++;
        const batchNum = `BAT-${wh.id.replace("WH-", "")}-${prod.id.replace("PROD-", "")}-${2026100 + batchCounter}`;

        // Manufacturing & Expiry dates calculation
        let mfgDaysAgo;
        let daysUntilExpiry;

        if (bIdx === 0) {
          // Batch 0: Fresh arrival (long remaining shelf life)
          mfgDaysAgo = Math.round(5 + Math.random() * 15);
          daysUntilExpiry = prod.standardShelfLifeDays - mfgDaysAgo;
        } else if (bIdx === 1) {
          // Batch 1: Mid-cycle stock
          mfgDaysAgo = Math.round(prod.standardShelfLifeDays * 0.45);
          daysUntilExpiry = Math.max(18, prod.standardShelfLifeDays - mfgDaysAgo);
        } else {
          // Batch 2: Near-expiry FEFO trigger batch (simulating urgent distribution need)
          mfgDaysAgo = Math.round(prod.standardShelfLifeDays * 0.88);
          daysUntilExpiry = Math.max(6, prod.standardShelfLifeDays - mfgDaysAgo);
        }

        const mfgDate = formatDate(addDays(CURRENT_DATE, -mfgDaysAgo));
        const expDate = formatDate(addDays(CURRENT_DATE, daysUntilExpiry));

        // Quarantine simulation (~2.5% of batches in regulatory QA hold)
        const isQuarantined = prod.isPharma && batchCounter % 37 === 0;
        const qaStatus = isQuarantined ? "Quarantined" : "Passed";

        // Regional stock quantity:
        // High capacity mega-hubs (Bilaspur, Bhiwandi, Nelamangala) hold larger batch sizes
        const hubScale = wh.totalCapacityUnits > 200000 ? 1.4 : 1.0;
        const baseQty = Math.round(
          (prod.isPharma ? 550 : 1600) * demandMultiplier * hubScale * (0.8 + Math.random() * 0.4)
        );

        const reservedQty = Math.round(baseQty * (0.05 + Math.random() * 0.1));
        const availableQty = Math.max(0, baseQty - reservedQty);

        // Daily demand draw estimate
        const avgDailyDraw = Math.max(10, Math.round((baseQty * demandMultiplier) / 25));
        const daysOfSupply = Math.round(availableQty / avgDailyDraw);

        // Determine operational inventory status badge
        let status = "Healthy";
        if (isQuarantined) {
          status = "Quarantined";
        } else if (daysUntilExpiry <= 0) {
          status = "Expired";
        } else if (daysUntilExpiry <= 14 && prod.standardShelfLifeDays <= 45) {
          status = "Near Expiry";
        } else if (daysUntilExpiry <= 30 && prod.isColdChainRequired) {
          status = "Near Expiry";
        } else if (availableQty < 160) {
          status = "Critical";
        } else if (availableQty < 420) {
          status = "Low Stock";
        } else if (availableQty > 2800) {
          status = "Excess Stock";
        }

        batches.push({
          id: `BATCH-${batchCounter}`,
          batchNumber: batchNum,
          productId: prod.id,
          productName: prod.name,
          category: prod.category,
          sku: prod.sku,
          warehouseId: wh.id,
          warehouseName: wh.name,
          warehouseRegion: wh.region,
          warehouseCity: wh.city,
          warehouseState: wh.state,
          manufacturingDate: mfgDate,
          expiryDate: expDate,
          daysUntilExpiry,
          availableQuantity: availableQty,
          reservedQuantity: reservedQty,
          totalQuantity: availableQty + reservedQty,
          safetyStock: Math.round(avgDailyDraw * 5),
          minStock: Math.round(avgDailyDraw * 2),
          avgDailyDemand: avgDailyDraw,
          daysOfInventoryRemaining: daysOfSupply,
          inventoryStatus: status,
          isEligibleForDistribution: !isQuarantined && daysUntilExpiry > prod.minShelfLifeDaysDelivery,
          rejectionReason: isQuarantined
            ? `Batch Quarantined: Locked by Regulatory QA Laboratory Protocol`
            : daysUntilExpiry <= prod.minShelfLifeDaysDelivery
            ? `Remaining shelf life (${daysUntilExpiry}d) below minimum threshold (${prod.minShelfLifeDaysDelivery}d)`
            : null,
          isPharma: prod.isPharma,
          isColdChainRequired: prod.isColdChainRequired,
          storageTempRange: prod.tempRangeCelsius,
          handlingRequirements: prod.handlingNotes,
          traceabilityHash: `SHA256-${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
          costValueINR: Math.round(availableQty * prod.basePriceINR)
        });
      }
    }
  }

  return batches;
}

// Generate 60-day Historical Demand Records (Aug 25, 2026 to Oct 24, 2026)
// Incorporates authentic regional demand factors, weekend surges, and distinct stockout risks
function generateDemandHistory() {
  const history = [];
  const allDestinations = [...DISTRIBUTORS, ...RETAIL_AND_PHARMACIES];
  const totalDays = 60;

  for (let d = totalDays; d >= 1; d--) {
    const recordDate = addDays(CURRENT_DATE, -d);
    const dateStr = formatDate(recordDate);
    const dayOfWeek = recordDate.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    for (const prod of PRODUCTS) {
      for (const dest of allDestinations) {
        const regProfile = REGIONAL_PROFILES[dest.region] || REGIONAL_PROFILES.West;
        const catMult = regProfile.categoryMultipliers[prod.category] || 1.0;
        const prodMult = regProfile.productMultipliers[prod.id] || 1.0;

        // Base daily demand
        let baseDemand = prod.isPharma ? 28 : 70;
        baseDemand *= catMult * prodMult;

        // Wholesale Distributors and Hypermarkets order in larger batches
        if (dest.type === "Distributor") {
          baseDemand *= 3.0;
        } else if (dest.type === "Hypermarket") {
          baseDemand *= 2.2;
        }

        // Weekend surge for groceries, snacks, and dairy (30-45% increase)
        if (isWeekend && (prod.category === "Snacks & Confectionery" || prod.category === "Dairy Products" || prod.category === "Packaged Foods")) {
          baseDemand *= 1.35;
        }

        // Random gaussian-like fluctuation
        const noise = (Math.random() + Math.random() + Math.random() - 1.5) * 0.3;
        const actualSales = Math.max(0, Math.round(baseDemand * (1 + noise)));

        // Unmet demand (stockout occurrence based on destination stockout risk)
        const riskRate = dest.stockoutRiskLevel === "High" ? 0.08 : 0.03;
        const hadStockout = Math.random() < riskRate;
        const lostSales = hadStockout ? Math.round(actualSales * 0.35) : 0;

        history.push({
          date: dateStr,
          dayIndex: 61 - d,
          productId: prod.id,
          productName: prod.name,
          category: prod.category,
          sku: prod.sku,
          destinationId: dest.id,
          destinationName: dest.name,
          destinationType: dest.type,
          region: dest.region,
          city: dest.city,
          state: dest.state,
          quantityDemanded: actualSales + lostSales,
          quantityFulfilled: actualSales,
          unmetDemand: lostSales,
          stockoutRecorded: hadStockout,
          revenueINR: actualSales * prod.basePriceINR
        });
      }
    }
  }

  return history;
}

// Initial live in-transit shipments across North, West, South, and East
function generateInitialShipments(routes) {
  const shipments = [
    // North In-Transit Reefer Shipment
    {
      id: "SHP-2026-N01",
      shipmentNumber: "TRK-DL-4019",
      sourceWarehouseId: "WH-DEL-01",
      sourceWarehouseName: "Amazon & Flipkart Mega Fulfillment Hub Bilaspur",
      sourceRegion: "North",
      destinationId: "DEST-DEL-05",
      destinationName: "Fortis Escorts Hospital Central Chemist Wing Saket",
      destinationRegion: "North",
      destinationCity: "South Delhi",
      productName: "Ascoril D Plus Expectorant Cough Syrup (100ml)",
      category: "Pharmaceuticals",
      quantityShipped: 1200,
      dispatchTimestamp: new Date(Date.now() - 2.5 * 3600000).toISOString(),
      estimatedDeliveryTimestamp: new Date(Date.now() + 1.5 * 3600000).toISOString(),
      status: "In Transit",
      vehicleNumber: "HR-26-CB-4019",
      vehicleType: "Refrigerated Reefer Van (2-8°C)",
      driverName: "Harpal Singh",
      driverPhone: "+91-98112-90124",
      currentTemperatureCelsius: 4.2,
      temperatureStatus: "Normal (Safe 2-8°C)",
      estimatedTransportationCostINR: 4200
    },
    // West In-Transit Heavy Freight
    {
      id: "SHP-2026-W01",
      shipmentNumber: "TRK-MH-8821",
      sourceWarehouseId: "WH-MUM-01",
      sourceWarehouseName: "Bhiwandi National Mega Logistics Corridor",
      sourceRegion: "West",
      destinationId: "DEST-MUM-01",
      destinationName: "DMart Hypermarket Kandivali West",
      destinationRegion: "West",
      destinationCity: "Mumbai",
      productName: "Surf Excel Matic Front Load Liquid Detergent (2L)",
      category: "Household Cleaning",
      quantityShipped: 2400,
      dispatchTimestamp: new Date(Date.now() - 3.0 * 3600000).toISOString(),
      estimatedDeliveryTimestamp: new Date(Date.now() + 1.0 * 3600000).toISOString(),
      status: "In Transit",
      vehicleNumber: "MH-04-AZ-8821",
      vehicleType: "16-Ton Multi-Axle Freight Truck",
      driverName: "Dnyaneshwar Pawar",
      driverPhone: "+91-98204-77192",
      currentTemperatureCelsius: null,
      temperatureStatus: "Ambient Dry Transport",
      estimatedTransportationCostINR: 6800
    },
    // South In-Transit Critical Cold Biologics
    {
      id: "SHP-2026-S01",
      shipmentNumber: "TRK-KA-5510",
      sourceWarehouseId: "WH-BLR-01",
      sourceWarehouseName: "Nelamangala National Logistics Corridor",
      sourceRegion: "South",
      destinationId: "DEST-BLR-03",
      destinationName: "Apollo 24|7 Pharmacy 100ft Road Indiranagar",
      destinationRegion: "South",
      destinationCity: "Bengaluru",
      productName: "Lantus Solostar Insulin Glargine Recombinant Pen (5x3ml)",
      category: "Pharmaceuticals",
      quantityShipped: 650,
      dispatchTimestamp: new Date(Date.now() - 1.5 * 3600000).toISOString(),
      estimatedDeliveryTimestamp: new Date(Date.now() + 1.0 * 3600000).toISOString(),
      status: "In Transit",
      vehicleNumber: "KA-03-MG-5510",
      vehicleType: "GDP Reefer Van (Strict 2-8°C)",
      driverName: "R. Suresh Kumar",
      driverPhone: "+91-98451-22910",
      currentTemperatureCelsius: 3.8,
      temperatureStatus: "Normal (Safe 2-8°C)",
      estimatedTransportationCostINR: 3950
    },
    // East In-Transit Tea & ORS Express
    {
      id: "SHP-2026-E01",
      shipmentNumber: "TRK-WB-2294",
      sourceWarehouseId: "WH-CCU-01",
      sourceWarehouseName: "Dankuni Industrial Supply Chain Hub",
      sourceRegion: "East",
      destinationId: "DEST-CCU-03",
      destinationName: "Frank Ross Pharmacy Heritage Flagship Park Street",
      destinationRegion: "East",
      destinationCity: "Central Kolkata",
      productName: "Electral ORS WHO Formula Pro-Electrolyte (50 Sachets)",
      category: "Pharmaceuticals",
      quantityShipped: 950,
      dispatchTimestamp: new Date(Date.now() - 2.0 * 3600000).toISOString(),
      estimatedDeliveryTimestamp: new Date(Date.now() + 1.2 * 3600000).toISOString(),
      status: "In Transit",
      vehicleNumber: "WB-02-AK-2294",
      vehicleType: "Standard Box Courier Van",
      driverName: "Biswajit Roy",
      driverPhone: "+91-98302-11849",
      currentTemperatureCelsius: null,
      temperatureStatus: "Ambient Dry Transport",
      estimatedTransportationCostINR: 3400
    }
  ];

  return shipments;
}

const DEFAULT_SETTINGS = {
  general: {
    systemName: "SahiSupply AI",
    deploymentMode: "Enterprise Cloud Multi-Region",
    defaultPlanningHorizonDays: 7,
    autoApproveOptimizedPlans: false,
    requireTwoPersonSignoffPharma: true
  },
  optimization: {
    transportationCostWeight: 0.35,
    stockoutPenaltyWeight: 0.40,
    expiryPenaltyWeight: 0.25,
    minShelfLifeBufferDays: 14,
    enforceColdChainStrict: true,
    maxDistanceRadiusKm: 1800
  },
  regionalDemandFactors: REGIONAL_PROFILES
};

module.exports = {
  CURRENT_DATE_STR,
  CURRENT_DATE,
  REGIONAL_PROFILES,
  calculateHaversineKm,
  generateRoutes,
  generateInventoryBatches,
  generateDemandHistory,
  generateInitialShipments,
  DEFAULT_SETTINGS
};
