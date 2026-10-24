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
    // --- NORTH REGION ---
    {
      id: "SHP-2026-N01",
      distributionPlanId: "PLAN-NORTH-01",
      shipmentNumber: "TRK-DL-4019",
      sourceWarehouseId: "WH-DEL-01",
      sourceWarehouseName: "Amazon & Flipkart Mega Fulfillment Hub Bilaspur",
      sourceRegion: "North",
      destinationId: "DEST-DEL-05",
      destinationName: "Fortis Escorts Hospital Central Chemist Wing Saket",
      destinationType: "Pharmacy",
      destinationRegion: "North",
      destinationCity: "South Delhi",
      region: "North",
      productId: "PROD-PHARMA-004",
      productName: "Ascoril D Plus Expectorant Cough Syrup (100ml)",
      category: "Pharmaceuticals",
      batchNumber: "BAT-DEL-PHARMA-2026101",
      quantity: 1200,
      quantityShipped: 1200,
      transportMode: "Refrigerated Reefer Van (2-8°C)",
      vehicleType: "Refrigerated Reefer Van (2-8°C)",
      vehicleId: "HR-26-CB-4019",
      vehicleNumber: "HR-26-CB-4019",
      isColdChain: true,
      dispatchDate: new Date(Date.now() - 2.5 * 3600000).toISOString(),
      dispatchTimestamp: new Date(Date.now() - 2.5 * 3600000).toISOString(),
      expectedDeliveryDate: new Date(Date.now() + 1.5 * 3600000).toISOString(),
      estimatedDeliveryTimestamp: new Date(Date.now() + 1.5 * 3600000).toISOString(),
      actualDeliveryDate: null,
      status: "In Transit",
      currentProgressPercent: 65,
      currentLocationDesc: "En route NH48 Gurgaon-Delhi Expressway",
      driverName: "Harpal Singh",
      driverPhone: "+91-98112-90124",
      currentTemperatureCelsius: 4.2,
      temperatureStatus: "Normal (Safe 2-8°C)",
      estimatedTransportationCostINR: 4200,
      notes: "High priority seasonal cough syrup delivery"
    },
    {
      id: "SHP-2026-N02",
      distributionPlanId: "PLAN-NORTH-01",
      shipmentNumber: "TRK-DL-8812",
      sourceWarehouseId: "WH-DEL-01",
      sourceWarehouseName: "Amazon & Flipkart Mega Fulfillment Hub Bilaspur",
      sourceRegion: "North",
      destinationId: "DEST-DEL-02",
      destinationName: "BigBasket Modern Dark Store Okhla Phase III",
      destinationType: "Distributor",
      destinationRegion: "North",
      destinationCity: "New Delhi",
      region: "North",
      productId: "PROD-FOOD-001",
      productName: "Aashirvaad Superior MP Sharbati Whole Wheat Atta (5kg)",
      category: "Packaged Foods",
      batchNumber: "BAT-DEL-FOOD-2026102",
      quantity: 2800,
      quantityShipped: 2800,
      transportMode: "16-Ton Multi-Axle Freight Truck",
      vehicleType: "16-Ton Multi-Axle Freight Truck",
      vehicleId: "DL-1L-AA-8812",
      vehicleNumber: "DL-1L-AA-8812",
      isColdChain: false,
      dispatchDate: new Date(Date.now() - 1.0 * 3600000).toISOString(),
      dispatchTimestamp: new Date(Date.now() - 1.0 * 3600000).toISOString(),
      expectedDeliveryDate: new Date(Date.now() + 2.0 * 3600000).toISOString(),
      estimatedDeliveryTimestamp: new Date(Date.now() + 2.0 * 3600000).toISOString(),
      actualDeliveryDate: null,
      status: "Dispatched",
      currentProgressPercent: 25,
      currentLocationDesc: "Departed Bilaspur Outbound Gate 3",
      driverName: "Satnam Singh",
      driverPhone: "+91-98721-33419",
      currentTemperatureCelsius: null,
      temperatureStatus: "Ambient Dry Transport",
      estimatedTransportationCostINR: 5600,
      notes: "Quick-commerce replenishment bulk pallet load"
    },
    {
      id: "SHP-2026-N03",
      distributionPlanId: "PLAN-NORTH-01",
      shipmentNumber: "TRK-HR-3104",
      sourceWarehouseId: "WH-DEL-01",
      sourceWarehouseName: "Amazon & Flipkart Mega Fulfillment Hub Bilaspur",
      sourceRegion: "North",
      destinationId: "DEST-DEL-01",
      destinationName: "Blinkit Quick-Commerce Micro-Hub Sector 29",
      destinationType: "Retail Store",
      destinationRegion: "North",
      destinationCity: "Gurgaon",
      region: "North",
      productId: "PROD-DAIRY-001",
      productName: "Amul Taaza Homogenised Toned Milk (1L Tetrapak)",
      category: "Dairy Products",
      batchNumber: "BAT-DEL-DAIRY-2026103",
      quantity: 1500,
      quantityShipped: 1500,
      transportMode: "Refrigerated Reefer Van (2-8°C)",
      vehicleType: "Refrigerated Reefer Van (2-8°C)",
      vehicleId: "HR-55-XY-3104",
      vehicleNumber: "HR-55-XY-3104",
      isColdChain: true,
      dispatchDate: new Date(Date.now() - 4.0 * 3600000).toISOString(),
      dispatchTimestamp: new Date(Date.now() - 4.0 * 3600000).toISOString(),
      expectedDeliveryDate: new Date(Date.now() - 0.5 * 3600000).toISOString(),
      estimatedDeliveryTimestamp: new Date(Date.now() - 0.5 * 3600000).toISOString(),
      actualDeliveryDate: new Date(Date.now() - 0.4 * 3600000).toISOString(),
      status: "Delivered",
      currentProgressPercent: 100,
      currentLocationDesc: "Delivered & Signed at Sector 29 Inward Dock",
      driverName: "Vipin Yadav",
      driverPhone: "+91-98188-77120",
      currentTemperatureCelsius: 3.9,
      temperatureStatus: "Normal (Safe 2-8°C)",
      estimatedTransportationCostINR: 3200,
      notes: "Daily morning grocery replenishment confirmed"
    },
    {
      id: "SHP-2026-N04",
      distributionPlanId: "PLAN-NORTH-01",
      shipmentNumber: "TRK-DL-9921",
      sourceWarehouseId: "WH-DEL-01",
      sourceWarehouseName: "Amazon & Flipkart Mega Fulfillment Hub Bilaspur",
      sourceRegion: "North",
      destinationId: "DEST-DEL-04",
      destinationName: "Apollo 24|7 Pharmacy Connaught Place Outer Circle",
      destinationType: "Pharmacy",
      destinationRegion: "North",
      destinationCity: "Central Delhi",
      region: "North",
      productId: "PROD-PHARMA-001",
      productName: "Dolo 650 Fast-Action Paracetamol Antipyretic (10x15 Tabs)",
      category: "Pharmaceuticals",
      batchNumber: "BAT-DEL-PHARMA-2026104",
      quantity: 3500,
      quantityShipped: 3500,
      transportMode: "Standard Express Van",
      vehicleType: "Standard Express Van",
      vehicleId: "DL-3C-CK-9921",
      vehicleNumber: "DL-3C-CK-9921",
      isColdChain: false,
      dispatchDate: new Date(Date.now() + 1.0 * 3600000).toISOString(),
      dispatchTimestamp: new Date(Date.now() + 1.0 * 3600000).toISOString(),
      expectedDeliveryDate: new Date(Date.now() + 5.0 * 3600000).toISOString(),
      estimatedDeliveryTimestamp: new Date(Date.now() + 5.0 * 3600000).toISOString(),
      actualDeliveryDate: null,
      status: "Approved",
      currentProgressPercent: 10,
      currentLocationDesc: "Staged at Dispatch Bay 4 for Load Verification",
      driverName: "Rajender Pal",
      driverPhone: "+91-98101-55423",
      currentTemperatureCelsius: null,
      temperatureStatus: "Ambient Dry Transport",
      estimatedTransportationCostINR: 2800,
      notes: "Scheduled evening medical replenishment batch"
    },

    // --- WEST REGION ---
    {
      id: "SHP-2026-W01",
      distributionPlanId: "PLAN-WEST-01",
      shipmentNumber: "TRK-MH-8821",
      sourceWarehouseId: "WH-MUM-01",
      sourceWarehouseName: "Bhiwandi National Mega Logistics Corridor",
      sourceRegion: "West",
      destinationId: "DEST-MUM-01",
      destinationName: "DMart Hypermarket Kandivali West",
      destinationType: "Hypermarket",
      destinationRegion: "West",
      destinationCity: "Mumbai",
      region: "West",
      productId: "PROD-CLEAN-001",
      productName: "Surf Excel Matic Front Load Concentrated Liquid Detergent (2L)",
      category: "Household Cleaning",
      batchNumber: "BAT-BHW-CLEAN-2026101",
      quantity: 2400,
      quantityShipped: 2400,
      transportMode: "16-Ton Multi-Axle Freight Truck",
      vehicleType: "16-Ton Multi-Axle Freight Truck",
      vehicleId: "MH-04-AZ-8821",
      vehicleNumber: "MH-04-AZ-8821",
      isColdChain: false,
      dispatchDate: new Date(Date.now() - 3.0 * 3600000).toISOString(),
      dispatchTimestamp: new Date(Date.now() - 3.0 * 3600000).toISOString(),
      expectedDeliveryDate: new Date(Date.now() + 1.0 * 3600000).toISOString(),
      estimatedDeliveryTimestamp: new Date(Date.now() + 1.0 * 3600000).toISOString(),
      actualDeliveryDate: null,
      status: "In Transit",
      currentProgressPercent: 70,
      currentLocationDesc: "Ghodbunder Road Thane bypass crossing",
      driverName: "Dnyaneshwar Pawar",
      driverPhone: "+91-98204-77192",
      currentTemperatureCelsius: null,
      temperatureStatus: "Ambient Dry Transport",
      estimatedTransportationCostINR: 6800,
      notes: "Heavy palletized household load"
    },
    {
      id: "SHP-2026-W02",
      distributionPlanId: "PLAN-WEST-01",
      shipmentNumber: "TRK-MH-1234",
      sourceWarehouseId: "WH-MUM-01",
      sourceWarehouseName: "Bhiwandi National Mega Logistics Corridor",
      sourceRegion: "West",
      destinationId: "DEST-MUM-04",
      destinationName: "Nature's Basket Artisanal Food Hall Bandra West",
      destinationType: "Retail Store",
      destinationRegion: "West",
      destinationCity: "Mumbai",
      region: "West",
      productId: "PROD-DAIRY-002",
      productName: "Epigamia Artisanal Greek Probiotic Yogurt Alphonso (400g)",
      category: "Dairy Products",
      batchNumber: "BAT-BHW-DAIRY-2026102",
      quantity: 800,
      quantityShipped: 800,
      transportMode: "Refrigerated Reefer Van (2-8°C)",
      vehicleType: "Refrigerated Reefer Van (2-8°C)",
      vehicleId: "MH-02-CB-1234",
      vehicleNumber: "MH-02-CB-1234",
      isColdChain: true,
      dispatchDate: new Date(Date.now() - 1.2 * 3600000).toISOString(),
      dispatchTimestamp: new Date(Date.now() - 1.2 * 3600000).toISOString(),
      expectedDeliveryDate: new Date(Date.now() + 1.8 * 3600000).toISOString(),
      estimatedDeliveryTimestamp: new Date(Date.now() + 1.8 * 3600000).toISOString(),
      actualDeliveryDate: null,
      status: "Dispatched",
      currentProgressPercent: 35,
      currentLocationDesc: "Eastern Express Highway Chembur flyover",
      driverName: "Sanjay Shinde",
      driverPhone: "+91-98211-44502",
      currentTemperatureCelsius: 3.4,
      temperatureStatus: "Normal (Safe 2-8°C)",
      estimatedTransportationCostINR: 3600,
      notes: "Active telematics logging 3.4°C"
    },
    {
      id: "SHP-2026-W03",
      distributionPlanId: "PLAN-WEST-01",
      shipmentNumber: "TRK-MH-5678",
      sourceWarehouseId: "WH-PUN-01",
      sourceWarehouseName: "Chakan Auto & Industrial Logistics Park",
      sourceRegion: "West",
      destinationId: "DEST-PUN-03",
      destinationName: "Zepto Quick Delivery Dark Store Kothrud",
      destinationType: "Retail Store",
      destinationRegion: "West",
      destinationCity: "Pune",
      region: "West",
      productId: "PROD-BEV-001",
      productName: "Raw Pressery Cold-Pressed Valencia Orange Juice (1L)",
      category: "Beverages",
      batchNumber: "BAT-CHK-BEV-2026103",
      quantity: 1100,
      quantityShipped: 1100,
      transportMode: "Refrigerated Reefer Van (2-8°C)",
      vehicleType: "Refrigerated Reefer Van (2-8°C)",
      vehicleId: "MH-12-PQ-5678",
      vehicleNumber: "MH-12-PQ-5678",
      isColdChain: true,
      dispatchDate: new Date(Date.now() - 3.5 * 3600000).toISOString(),
      dispatchTimestamp: new Date(Date.now() - 3.5 * 3600000).toISOString(),
      expectedDeliveryDate: new Date(Date.now() - 0.5 * 3600000).toISOString(),
      estimatedDeliveryTimestamp: new Date(Date.now() - 0.5 * 3600000).toISOString(),
      actualDeliveryDate: new Date(Date.now() - 0.4 * 3600000).toISOString(),
      status: "Delivered",
      currentProgressPercent: 100,
      currentLocationDesc: "Delivered at Kothrud Cold Storage Dock",
      driverName: "Nitin Kulkarni",
      driverPhone: "+91-98220-66718",
      currentTemperatureCelsius: 4.0,
      temperatureStatus: "Normal (Safe 2-8°C)",
      estimatedTransportationCostINR: 2900,
      notes: "Direct store delivery receipt verified"
    },
    {
      id: "SHP-2026-W04",
      distributionPlanId: "PLAN-WEST-01",
      shipmentNumber: "TRK-MH-9900",
      sourceWarehouseId: "WH-MUM-01",
      sourceWarehouseName: "Bhiwandi National Mega Logistics Corridor",
      sourceRegion: "West",
      destinationId: "DEST-MUM-02",
      destinationName: "Reliance Smart Superstore Viviana Mall Thane",
      destinationType: "Hypermarket",
      destinationRegion: "West",
      destinationCity: "Thane",
      region: "West",
      productId: "PROD-BEV-002",
      productName: "Tata Tea Gold Leaf & CTC Premium Assam Blend (1kg)",
      category: "Beverages",
      batchNumber: "BAT-BHW-BEV-2026104",
      quantity: 1600,
      quantityShipped: 1600,
      transportMode: "Standard Cargo Express",
      vehicleType: "Standard Cargo Express",
      vehicleId: "MH-04-EF-9900",
      vehicleNumber: "MH-04-EF-9900",
      isColdChain: false,
      dispatchDate: new Date(Date.now() - 4.5 * 3600000).toISOString(),
      dispatchTimestamp: new Date(Date.now() - 4.5 * 3600000).toISOString(),
      expectedDeliveryDate: new Date(Date.now() - 1.0 * 3600000).toISOString(),
      estimatedDeliveryTimestamp: new Date(Date.now() - 1.0 * 3600000).toISOString(),
      actualDeliveryDate: null,
      status: "Delayed",
      currentProgressPercent: 55,
      currentLocationDesc: "Heavy toll jam at Majiwada Junction Thane",
      driverName: "Anil More",
      driverPhone: "+91-98200-88410",
      currentTemperatureCelsius: null,
      temperatureStatus: "Ambient Dry Transport",
      estimatedTransportationCostINR: 3100,
      notes: "Toll plaza congestion advisory logged"
    },

    // --- SOUTH REGION ---
    {
      id: "SHP-2026-S01",
      distributionPlanId: "PLAN-SOUTH-01",
      shipmentNumber: "TRK-KA-5510",
      sourceWarehouseId: "WH-BLR-01",
      sourceWarehouseName: "Nelamangala National Logistics Corridor",
      sourceRegion: "South",
      destinationId: "DEST-BLR-03",
      destinationName: "Apollo 24|7 Pharmacy 100ft Road Indiranagar",
      destinationType: "Pharmacy",
      destinationRegion: "South",
      destinationCity: "Bengaluru",
      region: "South",
      productId: "PROD-PHARMA-007",
      productName: "Lantus Solostar Insulin Glargine Recombinant Pen (5x3ml)",
      category: "Pharmaceuticals",
      batchNumber: "BAT-BLR-PHARMA-2026101",
      quantity: 650,
      quantityShipped: 650,
      transportMode: "GDP Reefer Van (Strict 2-8°C)",
      vehicleType: "GDP Reefer Van (Strict 2-8°C)",
      vehicleId: "KA-03-MG-5510",
      vehicleNumber: "KA-03-MG-5510",
      isColdChain: true,
      dispatchDate: new Date(Date.now() - 1.5 * 3600000).toISOString(),
      dispatchTimestamp: new Date(Date.now() - 1.5 * 3600000).toISOString(),
      expectedDeliveryDate: new Date(Date.now() + 1.0 * 3600000).toISOString(),
      estimatedDeliveryTimestamp: new Date(Date.now() + 1.0 * 3600000).toISOString(),
      actualDeliveryDate: null,
      status: "In Transit",
      currentProgressPercent: 60,
      currentLocationDesc: "Outer Ring Road Hebbal Junction towards Indiranagar",
      driverName: "R. Suresh Kumar",
      driverPhone: "+91-98451-22910",
      currentTemperatureCelsius: 3.8,
      temperatureStatus: "Normal (Safe 2-8°C)",
      estimatedTransportationCostINR: 3950,
      notes: "Critical biological insulin stock with continuous GPS & temperature logging"
    },
    {
      id: "SHP-2026-S02",
      distributionPlanId: "PLAN-SOUTH-01",
      shipmentNumber: "TRK-KA-7731",
      sourceWarehouseId: "WH-BLR-01",
      sourceWarehouseName: "Nelamangala National Logistics Corridor",
      sourceRegion: "South",
      destinationId: "DEST-BLR-04",
      destinationName: "Nykaa Luxe Flagship 80ft Road Koramangala",
      destinationType: "Retail Store",
      destinationRegion: "South",
      destinationCity: "Bengaluru",
      region: "South",
      productId: "PROD-CARE-001",
      productName: "The Derma Co 2% Hyaluronic Acid Hydrating Serum (30ml)",
      category: "Personal Care",
      batchNumber: "BAT-BLR-CARE-2026102",
      quantity: 1400,
      quantityShipped: 1400,
      transportMode: "Standard Box Courier Van",
      vehicleType: "Standard Box Courier Van",
      vehicleId: "KA-04-NB-7731",
      vehicleNumber: "KA-04-NB-7731",
      isColdChain: false,
      dispatchDate: new Date(Date.now() - 0.8 * 3600000).toISOString(),
      dispatchTimestamp: new Date(Date.now() - 0.8 * 3600000).toISOString(),
      expectedDeliveryDate: new Date(Date.now() + 2.2 * 3600000).toISOString(),
      estimatedDeliveryTimestamp: new Date(Date.now() + 2.2 * 3600000).toISOString(),
      actualDeliveryDate: null,
      status: "Dispatched",
      currentProgressPercent: 30,
      currentLocationDesc: "Yeshwanthpur flyover transit corridor",
      driverName: "G. Venkatesh",
      driverPhone: "+91-98440-11234",
      currentTemperatureCelsius: null,
      temperatureStatus: "Ambient Dry Transport",
      estimatedTransportationCostINR: 2600,
      notes: "Fast moving premium skincare replenishment"
    },
    {
      id: "SHP-2026-S03",
      distributionPlanId: "PLAN-SOUTH-01",
      shipmentNumber: "TRK-KA-2200",
      sourceWarehouseId: "WH-BLR-01",
      sourceWarehouseName: "Nelamangala National Logistics Corridor",
      sourceRegion: "South",
      destinationId: "DEST-BLR-05",
      destinationName: "Manipal Hospital Central Pharmacy Whitefield",
      destinationType: "Pharmacy",
      destinationRegion: "South",
      destinationCity: "Bengaluru",
      region: "South",
      productId: "PROD-PHARMA-002",
      productName: "Augmentin 625 Duo Amoxicillin + Clavulanate (Box of 100)",
      category: "Pharmaceuticals",
      batchNumber: "BAT-BLR-PHARMA-2026103",
      quantity: 2000,
      quantityShipped: 2000,
      transportMode: "Express Cargo Van",
      vehicleType: "Express Cargo Van",
      vehicleId: "KA-51-MD-2200",
      vehicleNumber: "KA-51-MD-2200",
      isColdChain: false,
      dispatchDate: new Date(Date.now() - 5.0 * 3600000).toISOString(),
      dispatchTimestamp: new Date(Date.now() - 5.0 * 3600000).toISOString(),
      expectedDeliveryDate: new Date(Date.now() - 1.0 * 3600000).toISOString(),
      estimatedDeliveryTimestamp: new Date(Date.now() - 1.0 * 3600000).toISOString(),
      actualDeliveryDate: new Date(Date.now() - 0.8 * 3600000).toISOString(),
      status: "Delivered",
      currentProgressPercent: 100,
      currentLocationDesc: "Delivered & Stored at Hospital Basement Dispensary",
      driverName: "Prashanth Shetty",
      driverPhone: "+91-98800-44912",
      currentTemperatureCelsius: null,
      temperatureStatus: "Ambient Dry Transport",
      estimatedTransportationCostINR: 3100,
      notes: "Hospital inpatient priority anti-infective batch"
    },
    {
      id: "SHP-2026-S04",
      distributionPlanId: "PLAN-SOUTH-01",
      shipmentNumber: "TRK-TS-8844",
      sourceWarehouseId: "WH-HYD-01",
      sourceWarehouseName: "Shamshabad Free Trade Warehousing Zone",
      sourceRegion: "South",
      destinationId: "DEST-HYD-03",
      destinationName: "Apollo Pharmacy Road No 36 Jubilee Hills",
      destinationType: "Pharmacy",
      destinationRegion: "South",
      destinationCity: "Hyderabad",
      region: "South",
      productId: "PROD-PHARMA-003",
      productName: "Electral ORS WHO Formula Pro-Electrolyte (50 Sachets)",
      category: "Pharmaceuticals",
      batchNumber: "BAT-HYD-PHARMA-2026104",
      quantity: 3200,
      quantityShipped: 3200,
      transportMode: "Standard Express Van",
      vehicleType: "Standard Express Van",
      vehicleId: "TS-09-UB-8844",
      vehicleNumber: "TS-09-UB-8844",
      isColdChain: false,
      dispatchDate: new Date(Date.now() + 1.5 * 3600000).toISOString(),
      dispatchTimestamp: new Date(Date.now() + 1.5 * 3600000).toISOString(),
      expectedDeliveryDate: new Date(Date.now() + 4.5 * 3600000).toISOString(),
      estimatedDeliveryTimestamp: new Date(Date.now() + 4.5 * 3600000).toISOString(),
      actualDeliveryDate: null,
      status: "Approved",
      currentProgressPercent: 10,
      currentLocationDesc: "Assigned loading dock Shamshabad Zone C",
      driverName: "Syed Khaja",
      driverPhone: "+91-98490-66782",
      currentTemperatureCelsius: null,
      temperatureStatus: "Ambient Dry Transport",
      estimatedTransportationCostINR: 2750,
      notes: "Dehydration & ORS seasonal dispatch"
    },

    // --- EAST REGION ---
    {
      id: "SHP-2026-E01",
      distributionPlanId: "PLAN-EAST-01",
      shipmentNumber: "TRK-WB-2294",
      sourceWarehouseId: "WH-CCU-01",
      sourceWarehouseName: "Dankuni Industrial Supply Chain Hub",
      sourceRegion: "East",
      destinationId: "DEST-CCU-03",
      destinationName: "Frank Ross Pharmacy Heritage Flagship Park Street",
      destinationType: "Pharmacy",
      destinationRegion: "East",
      destinationCity: "Central Kolkata",
      region: "East",
      productId: "PROD-PHARMA-003",
      productName: "Electral ORS WHO Formula Pro-Electrolyte (50 Sachets)",
      category: "Pharmaceuticals",
      batchNumber: "BAT-DNK-PHARMA-2026101",
      quantity: 950,
      quantityShipped: 950,
      transportMode: "Standard Box Courier Van",
      vehicleType: "Standard Box Courier Van",
      vehicleId: "WB-02-AK-2294",
      vehicleNumber: "WB-02-AK-2294",
      isColdChain: false,
      dispatchDate: new Date(Date.now() - 2.0 * 3600000).toISOString(),
      dispatchTimestamp: new Date(Date.now() - 2.0 * 3600000).toISOString(),
      expectedDeliveryDate: new Date(Date.now() + 1.2 * 3600000).toISOString(),
      estimatedDeliveryTimestamp: new Date(Date.now() + 1.2 * 3600000).toISOString(),
      actualDeliveryDate: null,
      status: "In Transit",
      currentProgressPercent: 55,
      currentLocationDesc: "Crossing Vidyasagar Setu Toll Plaza",
      driverName: "Biswajit Roy",
      driverPhone: "+91-98302-11849",
      currentTemperatureCelsius: null,
      temperatureStatus: "Ambient Dry Transport",
      estimatedTransportationCostINR: 3400,
      notes: "High demand ORS emergency supply"
    },
    {
      id: "SHP-2026-E02",
      distributionPlanId: "PLAN-EAST-01",
      shipmentNumber: "TRK-WB-4411",
      sourceWarehouseId: "WH-CCU-01",
      sourceWarehouseName: "Dankuni Industrial Supply Chain Hub",
      sourceRegion: "East",
      destinationId: "DEST-CCU-01",
      destinationName: "Spencer's Retail Hypermarket South City Mall",
      destinationType: "Hypermarket",
      destinationRegion: "East",
      destinationCity: "South Kolkata",
      region: "East",
      productId: "PROD-FOOD-002",
      productName: "India Gate Super Feast Aged Basmati Rice (5kg)",
      category: "Packaged Foods",
      batchNumber: "BAT-DNK-FOOD-2026102",
      quantity: 2200,
      quantityShipped: 2200,
      transportMode: "16-Ton Multi-Axle Freight Truck",
      vehicleType: "16-Ton Multi-Axle Freight Truck",
      vehicleId: "WB-19-TX-4411",
      vehicleNumber: "WB-19-TX-4411",
      isColdChain: false,
      dispatchDate: new Date(Date.now() - 1.5 * 3600000).toISOString(),
      dispatchTimestamp: new Date(Date.now() - 1.5 * 3600000).toISOString(),
      expectedDeliveryDate: new Date(Date.now() + 2.5 * 3600000).toISOString(),
      estimatedDeliveryTimestamp: new Date(Date.now() + 2.5 * 3600000).toISOString(),
      actualDeliveryDate: null,
      status: "Dispatched",
      currentProgressPercent: 35,
      currentLocationDesc: "En route Kona Expressway towards Kolkata",
      driverName: "Debashis Mukherjee",
      driverPhone: "+91-98311-55820",
      currentTemperatureCelsius: null,
      temperatureStatus: "Ambient Dry Transport",
      estimatedTransportationCostINR: 4800,
      notes: "Festive staple inventory replenishment"
    },
    {
      id: "SHP-2026-E03",
      distributionPlanId: "PLAN-EAST-01",
      shipmentNumber: "TRK-WB-6677",
      sourceWarehouseId: "WH-CCU-01",
      sourceWarehouseName: "Dankuni Industrial Supply Chain Hub",
      sourceRegion: "East",
      destinationId: "DEST-CCU-02",
      destinationName: "Metro Cash & Carry Wholesale Hub EM Bypass",
      destinationType: "Distributor",
      destinationRegion: "East",
      destinationCity: "East Kolkata",
      region: "East",
      productId: "PROD-BEV-002",
      productName: "Tata Tea Gold Leaf & CTC Premium Assam Blend (1kg)",
      category: "Beverages",
      batchNumber: "BAT-DNK-BEV-2026103",
      quantity: 1800,
      quantityShipped: 1800,
      transportMode: "Standard Cargo Express",
      vehicleType: "Standard Cargo Express",
      vehicleId: "WB-25-BG-6677",
      vehicleNumber: "WB-25-BG-6677",
      isColdChain: false,
      dispatchDate: new Date(Date.now() - 4.5 * 3600000).toISOString(),
      dispatchTimestamp: new Date(Date.now() - 4.5 * 3600000).toISOString(),
      expectedDeliveryDate: new Date(Date.now() - 0.5 * 3600000).toISOString(),
      estimatedDeliveryTimestamp: new Date(Date.now() - 0.5 * 3600000).toISOString(),
      actualDeliveryDate: new Date(Date.now() - 0.3 * 3600000).toISOString(),
      status: "Delivered",
      currentProgressPercent: 100,
      currentLocationDesc: "Delivered at Wholesale Inbound Bay 2",
      driverName: "Tarun Das",
      driverPhone: "+91-98360-77112",
      currentTemperatureCelsius: null,
      temperatureStatus: "Ambient Dry Transport",
      estimatedTransportationCostINR: 3700,
      notes: "Tea distribution wholesale fulfillment"
    },
    {
      id: "SHP-2026-E04",
      distributionPlanId: "PLAN-EAST-01",
      shipmentNumber: "TRK-WB-9901",
      sourceWarehouseId: "WH-CCU-01",
      sourceWarehouseName: "Dankuni Industrial Supply Chain Hub",
      sourceRegion: "East",
      destinationId: "DEST-CCU-04",
      destinationName: "Apollo Pharmacy Sector V Electronic Complex",
      destinationType: "Pharmacy",
      destinationRegion: "East",
      destinationCity: "Salt Lake Kolkata",
      region: "East",
      productId: "PROD-PHARMA-006",
      productName: "Cipladine 5% Povidone Iodine Antiseptic Solution (200ml)",
      category: "Pharmaceuticals",
      batchNumber: "BAT-DNK-PHARMA-2026104",
      quantity: 1300,
      quantityShipped: 1300,
      transportMode: "Standard Box Courier Van",
      vehicleType: "Standard Box Courier Van",
      vehicleId: "WB-04-CL-9901",
      vehicleNumber: "WB-04-CL-9901",
      isColdChain: false,
      dispatchDate: new Date(Date.now() + 2.0 * 3600000).toISOString(),
      dispatchTimestamp: new Date(Date.now() + 2.0 * 3600000).toISOString(),
      expectedDeliveryDate: new Date(Date.now() + 6.0 * 3600000).toISOString(),
      estimatedDeliveryTimestamp: new Date(Date.now() + 6.0 * 3600000).toISOString(),
      actualDeliveryDate: null,
      status: "Pending",
      currentProgressPercent: 5,
      currentLocationDesc: "Order picking in progress Dankuni Bay A",
      driverName: "Amit Sen",
      driverPhone: "+91-98319-22450",
      currentTemperatureCelsius: null,
      temperatureStatus: "Ambient Dry Transport",
      estimatedTransportationCostINR: 2500,
      notes: "Antiseptic first-aid stock replenishment"
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
