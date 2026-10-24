// SahiSupply AI — Realistic Dataset Generator
// Generates 90-day historical demand, multi-warehouse batches with FEFO & Expiry dynamics, and route costs

const { PRODUCTS, WAREHOUSES, DISTRIBUTORS, RETAIL_AND_PHARMACIES } = require("./seedData");

// Base date reference: October 24, 2026
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

// Haversine distance approximation between warehouse and destination
function calculateDistanceKm(coord1, coord2) {
  const dx = (coord1.x - coord2.x) * 45; // scale factor
  const dz = (coord1.z - coord2.z) * 45;
  const dist = Math.sqrt(dx * dx + dz * dz);
  return Math.max(15, Math.round(dist + 20)); // minimum 15km
}

// Generate Routes between 5 Warehouses and all 40 Destinations (10 Dist + 30 Retail/Pharma)
function generateRoutes() {
  const allDestinations = [...DISTRIBUTORS, ...RETAIL_AND_PHARMACIES];
  const routes = [];

  for (const wh of WAREHOUSES) {
    for (const dest of allDestinations) {
      const distanceKm = calculateDistanceKm(wh.coordinates, dest.coordinates);
      // Lead time based on distance (speed ~ 45km/h + loading)
      const leadTimeHours = Math.max(2, Math.round(distanceKm / 40 + 2));
      const leadTimeDays = Math.ceil(leadTimeHours / 24);

      // Transportation cost per unit: base freight rate ₹1.5/km/unit-pallet factor
      const baseCostPerUnit = Math.max(12, Math.round(15 + distanceKm * 0.18));
      const coldChainCostPerUnit = Math.round(baseCostPerUnit * 1.65); // 65% premium for reefer trucks

      // Route capacity based on regional logistics link
      const maxTruckCapacityUnits = distanceKm > 300 ? 12000 : 8000;

      routes.push({
        id: `ROUTE-${wh.id}-${dest.id}`,
        sourceWarehouseId: wh.id,
        sourceWarehouseName: wh.name,
        destinationId: dest.id,
        destinationName: dest.name,
        destinationType: dest.type,
        destinationRegion: dest.region,
        distanceKm,
        leadTimeHours,
        leadTimeDays,
        standardCostPerUnitINR: baseCostPerUnit,
        coldChainCostPerUnitINR: coldChainCostPerUnit,
        routeCapacityUnits: maxTruckCapacityUnits,
        isEligibleColdChain: wh.coldStorageAvailable && dest.hasColdChain,
        isEligiblePharma: wh.handlingCapabilities.includes("Pharmaceutical GDP") && (dest.hasPharmaLicense || !dest.type.includes("Pharmacy"))
      });
    }
  }

  return routes;
}

// Generate Realistic Inventory Batches
function generateInventoryBatches() {
  const batches = [];
  let batchCounter = 1000;

  for (const wh of WAREHOUSES) {
    for (const prod of PRODUCTS) {
      // Different stock situations across warehouses:
      // Pune has high stock of Dairy & Pharma
      // Mumbai has excess FMCG & Packaged food
      // Kolhapur has low stock of Dairy (simulating regional deficit)
      // Nashik has excess Beverages
      // Nagpur has critical low stock of Insulin & Paracetamol
      let baseBatchCount = 3;
      let qtyMultiplier = 1.0;

      if (wh.id === "WH-MUMBAI-01" && (prod.category === "Packaged Foods" || prod.category === "Snacks & Confectionery")) {
        qtyMultiplier = 2.4; // Excess stock
      } else if (wh.id === "WH-PUNE-01" && prod.category === "Dairy Products") {
        qtyMultiplier = 1.8; // High availability
      } else if (wh.id === "WH-KOLHAPUR-01" && prod.id === "PROD-DAIRY-001") {
        qtyMultiplier = 0.25; // Critical low stock scenario!
      } else if (wh.id === "WH-NAGPUR-01" && prod.id === "PROD-PHARMA-007") {
        qtyMultiplier = 0.15; // Critical stockout risk for Insulin in Nagpur!
      } else if (wh.id === "WH-NASHIK-01" && prod.category === "Household Cleaning") {
        qtyMultiplier = 1.6;
      }

      for (let b = 0; b < baseBatchCount; b++) {
        batchCounter++;
        const batchNum = `BAT-${prod.sku.substring(4, 9)}-${2026}${String(batchCounter).slice(-3)}`;

        // Batch expiration profiles:
        // b = 0: Regular fresh batch (healthy shelf life)
        // b = 1: Mid-life batch
        // b = 2: Scenario batch (either near-expiry, expired/quarantined, or reserved)
        let daysUntilExpiry;
        let mfgDaysAgo;
        let qaStatus = "Healthy";
        let isQuarantined = false;

        if (b === 0) {
          daysUntilExpiry = Math.round(prod.standardShelfLifeDays * 0.85);
          mfgDaysAgo = Math.round(prod.standardShelfLifeDays * 0.15);
        } else if (b === 1) {
          daysUntilExpiry = Math.round(prod.standardShelfLifeDays * 0.45);
          mfgDaysAgo = Math.round(prod.standardShelfLifeDays * 0.55);
        } else {
          // Special scenarios!
          if (prod.id === "PROD-DAIRY-002" && wh.id === "WH-PUNE-01") {
            // Near expiry yogurt batch (6 days left!)
            daysUntilExpiry = 6;
            mfgDaysAgo = 19;
            qaStatus = "Near Expiry";
          } else if (prod.id === "PROD-SNACK-001" && wh.id === "WH-MUMBAI-01") {
            // Excess biscuits nearing 18 days
            daysUntilExpiry = 18;
            mfgDaysAgo = 72;
            qaStatus = "Near Expiry";
          } else if (prod.id === "PROD-PHARMA-004" && wh.id === "WH-NASHIK-01") {
            // Quarantined / Expired cough syrup batch (expired 10 days ago)
            daysUntilExpiry = -10;
            mfgDaysAgo = 550;
            qaStatus = "Expired";
            isQuarantined = true;
          } else if (prod.id === "PROD-PHARMA-001" && wh.id === "WH-KOLHAPUR-01") {
            // Batch undergoing QA audit quarantine
            daysUntilExpiry = 220;
            mfgDaysAgo = 140;
            qaStatus = "Quarantined";
            isQuarantined = true;
          } else {
            daysUntilExpiry = Math.round(prod.standardShelfLifeDays * 0.6);
            mfgDaysAgo = Math.round(prod.standardShelfLifeDays * 0.4);
          }
        }

        const mfgDate = formatDate(addDays(CURRENT_DATE, -mfgDaysAgo));
        const expDate = formatDate(addDays(CURRENT_DATE, daysUntilExpiry));

        // Available vs reserved quantities
        const baseQty = Math.round((prod.isPharma ? 600 : 1800) * qtyMultiplier * (0.8 + Math.random() * 0.4));
        const reservedQty = Math.round(baseQty * (0.05 + Math.random() * 0.12));
        const availableQty = Math.max(0, baseQty - reservedQty);

        // Calculate Days of Inventory Remaining (DOIR) based on estimated avg daily demand
        const avgDailyDraw = Math.max(10, Math.round(baseQty / 30));
        const daysOfSupply = Math.round(availableQty / avgDailyDraw);

        // Determine inventory status badge
        let status = "Healthy";
        if (isQuarantined) {
          status = qaStatus;
        } else if (daysUntilExpiry <= 0) {
          status = "Expired";
        } else if (daysUntilExpiry <= 14 && prod.standardShelfLifeDays <= 45) {
          status = "Near Expiry";
        } else if (availableQty < 150) {
          status = "Critical";
        } else if (availableQty < 400) {
          status = "Low Stock";
        } else if (availableQty > 2500) {
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
            ? `Batch ${qaStatus}: Locked by regulatory QA protocol`
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

// Generate 90-day Historical Demand Records (July 26, 2026 to October 24, 2026)
function generateDemandHistory() {
  const history = [];
  const allDestinations = [...DISTRIBUTORS, ...RETAIL_AND_PHARMACIES];
  const totalDays = 90;

  for (let d = totalDays; d >= 1; d--) {
    const recordDate = addDays(CURRENT_DATE, -d);
    const dateStr = formatDate(recordDate);
    const dayOfWeek = recordDate.getDay(); // 0 is Sunday, 6 is Saturday
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    for (const prod of PRODUCTS) {
      // Pick a sample of destinations per day to keep size realistic and fast (~2-3 destinations per product per day)
      for (const dest of allDestinations) {
        // Base demand parameter per product-destination profile
        let baseDemand = prod.isPharma ? 25 : 65;
        if (dest.type === "Hypermarket" || dest.type === "Distributor") {
          baseDemand *= 2.8;
        }

        // Weekend surge for groceries and snacks (30% increase)
        if (isWeekend && (prod.category === "Snacks & Confectionery" || prod.category === "Dairy Products" || prod.category === "Packaged Foods")) {
          baseDemand *= 1.35;
        }

        // Seasonal spike in beverages during warmer days
        if (prod.category === "Beverages" && d > 45) {
          baseDemand *= 1.2;
        }

        // Random gaussian-like fluctuation
        const noise = (Math.random() + Math.random() + Math.random() - 1.5) * 0.35;
        const actualSales = Math.max(0, Math.round(baseDemand * (1 + noise)));

        // Unmet demand (stockout occurrence on ~4% of observations)
        const hadStockout = Math.random() < 0.04;
        const lostSales = hadStockout ? Math.round(actualSales * 0.4) : 0;

        history.push({
          date: dateStr,
          dayIndex: 91 - d,
          productId: prod.id,
          productName: prod.name,
          category: prod.category,
          sku: prod.sku,
          destinationId: dest.id,
          destinationName: dest.name,
          destinationType: dest.type,
          region: dest.region,
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

// Initial Live Shipments
function generateInitialShipments(routes) {
  const shipments = [
    {
      id: "SHP-2026-9001",
      distributionPlanId: "PLAN-BASE-INIT",
      sourceWarehouseId: "WH-PUNE-01",
      sourceWarehouseName: "Pune Central Fulfillment Hub",
      destinationId: "DEST-PUN-01",
      destinationName: "Apollo 24x7 Pharmacy Kothrud",
      destinationType: "Pharmacy",
      region: "Pune",
      productId: "PROD-PHARMA-007",
      productName: "Insulin Glargine Solostar Recombinant Pen",
      category: "Pharmaceuticals",
      batchNumber: "BAT-INSUL-2026102",
      quantity: 450,
      transportMode: "Refrigerated Reefer Van (2-8°C)",
      isColdChain: true,
      vehicleId: "MH-12-RN-8821",
      dispatchDate: "2026-10-24T08:30:00Z",
      expectedDeliveryDate: "2026-10-24T14:30:00Z",
      actualDeliveryDate: null,
      estimatedTransportationCostINR: 2450,
      status: "In Transit",
      currentProgressPercent: 65,
      currentLocationDesc: "Passing Shivaji Nagar Bypass, Pune",
      notes: "High-priority GDP cold chain insulin shipment."
    },
    {
      id: "SHP-2026-9002",
      distributionPlanId: "PLAN-BASE-INIT",
      sourceWarehouseId: "WH-MUMBAI-01",
      sourceWarehouseName: "Mumbai Metropolitan Mega Logistics Hub",
      destinationId: "DEST-NSK-02",
      destinationName: "D-Mart Panchavati",
      destinationType: "Retail Store",
      region: "Nashik",
      productId: "PROD-FOOD-001",
      productName: "Chakki Fresh Stone Ground Wheat Atta (5kg)",
      category: "Packaged Foods",
      batchNumber: "BAT-ATTA-2026118",
      quantity: 1200,
      transportMode: "16-Ton Heavy Freight Truck",
      isColdChain: false,
      vehicleId: "MH-04-AX-5510",
      dispatchDate: "2026-10-23T18:00:00Z",
      expectedDeliveryDate: "2026-10-24T11:00:00Z",
      actualDeliveryDate: "2026-10-24T10:45:00Z",
      estimatedTransportationCostINR: 11400,
      status: "Delivered",
      currentProgressPercent: 100,
      currentLocationDesc: "Delivered at Nashik Panchavati Dock 3",
      notes: "Replenished weekend stock for retail chain."
    },
    {
      id: "SHP-2026-9003",
      distributionPlanId: "PLAN-BASE-INIT",
      sourceWarehouseId: "WH-PUNE-01",
      sourceWarehouseName: "Pune Central Fulfillment Hub",
      destinationId: "DEST-KOL-02",
      destinationName: "D-Mart Tarabai Park Kolhapur",
      destinationType: "Retail Store",
      region: "Kolhapur",
      productId: "PROD-DAIRY-001",
      productName: "Pure Organic Farm Fresh Milk (1L)",
      category: "Dairy Products",
      batchNumber: "BAT-MILK-2026105",
      quantity: 800,
      transportMode: "Chilled Reefer Truck (4°C)",
      isColdChain: true,
      vehicleId: "MH-12-KQ-4019",
      dispatchDate: "2026-10-24T06:00:00Z",
      expectedDeliveryDate: "2026-10-24T16:00:00Z",
      actualDeliveryDate: null,
      estimatedTransportationCostINR: 6800,
      status: "In Transit",
      currentProgressPercent: 80,
      currentLocationDesc: "Approving Satara Highway Toll Plaza",
      notes: "Urgent dairy replenishment to prevent Kolhapur stockout."
    },
    {
      id: "SHP-2026-9004",
      distributionPlanId: "PLAN-BASE-INIT",
      sourceWarehouseId: "WH-NASHIK-01",
      sourceWarehouseName: "Nashik North Distribution Gateway",
      destinationId: "DIST-AURANGABAD-01",
      destinationName: "Marathwada Central Supply",
      destinationType: "Distributor",
      region: "Nashik",
      productId: "PROD-BEV-001",
      productName: "Cold-Pressed Valencia Orange Juice (1L)",
      category: "Beverages",
      batchNumber: "BAT-JUICE-2026134",
      quantity: 950,
      transportMode: "Refrigerated Van",
      isColdChain: true,
      vehicleId: "MH-15-EM-7190",
      dispatchDate: "2026-10-24T11:00:00Z",
      expectedDeliveryDate: "2026-10-24T18:00:00Z",
      actualDeliveryDate: null,
      estimatedTransportationCostINR: 5200,
      status: "Dispatched",
      currentProgressPercent: 25,
      currentLocationDesc: "Nashik Outskirts Toll Gate",
      notes: "Perishable juice allocation under FEFO."
    },
    {
      id: "SHP-2026-9005",
      distributionPlanId: "PLAN-BASE-INIT",
      sourceWarehouseId: "WH-NAGPUR-01",
      sourceWarehouseName: "Nagpur Central Multi-Modal Logistics Center",
      destinationId: "DEST-NGP-02",
      destinationName: "AIIMS Hospital Pharmacy Wing Nagpur",
      destinationType: "Pharmacy",
      region: "Nagpur",
      productId: "PROD-PHARMA-002",
      productName: "Amoxicillin + Potassium Clavulanate 625mg",
      category: "Pharmaceuticals",
      batchNumber: "BAT-AMOX-2026155",
      quantity: 600,
      transportMode: "GPS Tracked Pharma Courier",
      isColdChain: false,
      vehicleId: "MH-31-TR-1022",
      dispatchDate: "2026-10-24T13:00:00Z",
      expectedDeliveryDate: "2026-10-24T15:30:00Z",
      actualDeliveryDate: null,
      estimatedTransportationCostINR: 1800,
      status: "Dispatched",
      currentProgressPercent: 40,
      currentLocationDesc: "MIHAN Industrial Flyover",
      notes: "Direct hospital antibiotic replenishment."
    },
    {
      id: "SHP-2026-9006",
      distributionPlanId: "PLAN-BASE-INIT",
      sourceWarehouseId: "WH-MUMBAI-01",
      sourceWarehouseName: "Mumbai Metropolitan Mega Logistics Hub",
      destinationId: "DEST-MUM-01",
      destinationName: "Apollo Pharmacy Bandra West",
      destinationType: "Pharmacy",
      region: "Mumbai",
      productId: "PROD-PHARMA-001",
      productName: "Paracetamol 650mg Antipyretic Analgesic Tablets",
      category: "Pharmaceuticals",
      batchNumber: "BAT-PCM-2026101",
      quantity: 500,
      transportMode: "City Delivery Van",
      isColdChain: false,
      vehicleId: "MH-02-CP-9014",
      dispatchDate: "2026-10-24T14:00:00Z",
      expectedDeliveryDate: "2026-10-24T17:00:00Z",
      actualDeliveryDate: null,
      estimatedTransportationCostINR: 1400,
      status: "Pending",
      currentProgressPercent: 5,
      currentLocationDesc: "Staged at Mumbai Hub Bay 4",
      notes: "Approved batch awaiting final courier dispatch."
    }
  ];

  return shipments;
}

// System Settings Defaults
const DEFAULT_SETTINGS = {
  safetyStockDays: 5,
  stockoutPenaltyPerUnitINR: 150,
  holdingCostPerUnitPerDayINR: 1.25,
  expiryCostMultiplier: 1.0, // 100% of product value
  transportationWeight: 0.35,
  stockoutWeight: 0.40,
  expiryWeight: 0.25,
  defaultForecastHorizonDays: 7,
  defaultForecastModel: "Exponential Smoothing",
  maxShipmentCapPerRun: 50,
  minShelfLifeBufferDays: 14,
  coldChainEnforcementStrict: true,
  gdpTraceabilityRequired: true,
  assumptions: [
    "Distances are calculated using road-network euclidean metric scaled by 1.25 winding factor.",
    "Reefer cold-chain transportation incurs a 65% freight premium over standard dry logistics.",
    "Expired batches and batches failing minimum shelf-life threshold are strictly ineligible for shipment.",
    "Destinations without cold-storage licensing cannot receive cold-chain sensitive pharmaceuticals or dairy items.",
    "Historical demand reflects 90 days of simulated retail consumption and distributor pull data."
  ]
};

module.exports = {
  CURRENT_DATE_STR,
  CURRENT_DATE,
  generateRoutes,
  generateInventoryBatches,
  generateDemandHistory,
  generateInitialShipments,
  DEFAULT_SETTINGS
};
