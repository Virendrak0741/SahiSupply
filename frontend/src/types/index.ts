// SahiSupply AI — TypeScript Domain Definitions

export type ProductCategory =
  | "Dairy Products"
  | "Packaged Foods"
  | "Beverages"
  | "Personal Care"
  | "Household Cleaning"
  | "Snacks & Confectionery"
  | "Pharmaceuticals";

export type InventoryStatus =
  | "Healthy"
  | "Low Stock"
  | "Critical"
  | "Excess Stock"
  | "Near Expiry"
  | "Expired"
  | "Quarantined";

export type ShipmentStatus =
  | "Pending"
  | "Approved"
  | "Dispatched"
  | "In Transit"
  | "Delivered"
  | "Delayed"
  | "Cancelled";

export interface Product {
  id: string;
  name: string;
  category: ProductCategory;
  sku: string;
  packagingSize: string;
  unitOfMeasure: string;
  basePriceINR: number;
  standardShelfLifeDays: number;
  minShelfLifeDaysDelivery: number;
  isColdChainRequired: boolean;
  tempRangeCelsius: string;
  isPharma: boolean;
  weightKgPerUnit: number;
  volumeCubicMeters: number;
  handlingNotes: string;
}

export interface Warehouse {
  id: string;
  name: string;
  location: string;
  region: string;
  coordinates: { x: number; z: number; lat: number; lng: number };
  totalCapacityUnits: number;
  coldStorageCapacityUnits: number;
  handlingCapabilities: string[];
  coldStorageAvailable: boolean;
  fleetSizeTrucks: number;
  usedCapacityUnits?: number;
  availableCapacityUnits?: number;
  utilizationPercent?: number;
  uniqueSKUs?: number;
  totalInventoryUnits?: number;
  nearExpiryUnits?: number;
  coldChainUnits?: number;
  activeInboundShipments: number;
  activeOutboundShipments: number;
  managerName?: string;
  contactPhone?: string;
  zones?: WarehouseZone[];
}

export interface WarehouseZone {
  id: string;
  name: string;
  tempRange: string;
  capacityUnits: number;
  utilizationPercent: number;
  colorHex: string;
  isColdChain?: boolean;
  isPharmaSecured?: boolean;
  racks: WarehouseRack[];
}

export interface WarehouseRack {
  rackId: string;
  row: number;
  col: number;
  levels: number;
  category: string;
  status: string;
  itemCount: number;
}

export interface Destination {
  id: string;
  name: string;
  type: "Pharmacy" | "Retail Store" | "Distributor" | "Hypermarket";
  region: string;
  coordinates: { x: number; z: number };
  capacityUnits: number;
  hasColdChain: boolean;
  hasPharmaLicense: boolean;
}

export interface InventoryBatch {
  id: string;
  batchNumber: string;
  productId: string;
  productName: string;
  category: ProductCategory;
  sku: string;
  warehouseId: string;
  warehouseName: string;
  warehouseRegion?: string;
  manufacturingDate: string;
  expiryDate: string;
  daysUntilExpiry: number;
  availableQuantity: number;
  reservedQuantity: number;
  totalQuantity: number;
  safetyStock: number;
  minStock: number;
  avgDailyDemand: number;
  daysOfInventoryRemaining: number;
  inventoryStatus: InventoryStatus;
  isEligibleForDistribution: boolean;
  rejectionReason?: string | null;
  isPharma: boolean;
  isColdChainRequired: boolean;
  storageTempRange: string;
  handlingRequirements: string;
  traceabilityHash?: string;
  costValueINR?: number;
}

export interface Recommendation {
  id: string;
  productId: string;
  productName: string;
  category: ProductCategory;
  sku: string;
  sourceWarehouseId: string;
  sourceWarehouseName: string;
  destinationId: string;
  destinationName: string;
  destinationType: string;
  destinationRegion: string;
  batchNumber: string;
  batchExpiryDate: string;
  daysUntilExpiry: number;
  recommendedQuantity: number;
  forecastDemand: number;
  projectedDestinationStock: number;
  estimatedTransportationCostINR: number;
  unitFreightCostINR: number;
  leadTimeDays: number;
  expectedDeliveryDate: string;
  priority: "Urgent" | "High" | "Standard";
  isColdChain: boolean;
  isPharma: boolean;
  explanation: string;
  status: "Recommended" | "Approved" | "Modified" | "Rejected";
}

export interface BeforeAndAfterMetric {
  baseline: number;
  optimized: number;
  savingsPercent?: number;
  reductionPercent?: number;
  improvementPercent?: number;
}

export interface DistributionPlan {
  id: string;
  planId?: string;
  status: "Pending Approval" | "Approved" | "Rejected";
  createdAt: string;
  approvedAt?: string;
  approver?: string;
  rejectionReason?: string;
  runtimeMs: number;
  configuration: {
    planningHorizonDays: number;
    selectedCategories: string[];
    selectedWarehouseIds: string[];
    selectedDestinationIds: string[];
    transportationBudgetINR?: number | null;
    weights?: {
      transportationWeight: number;
      stockoutWeight: number;
      expiryWeight: number;
    };
  };
  metrics: {
    totalUnitsAllocated: number;
    totalDemandRequested: number;
    demandFulfillmentRate: number;
    unmetDemandUnits: number;
    totalTransportationCostINR: number;
    numberOfShipmentsRecommended: number;
    urgentReplenishmentCount: number;
    pharmaBatchesAllocated: number;
    coldChainShipmentsCount: number;
    optimizationStatus: string;
  };
  recommendations: Recommendation[];
  unfulfilledDemands?: Array<{
    productId: string;
    productName: string;
    destinationId: string;
    destinationName: string;
    requestedQty: number;
    unmetQty: number;
    reason: string;
  }>;
  beforeAndAfter: {
    unmetDemand: BeforeAndAfterMetric;
    transportationCostINR: BeforeAndAfterMetric;
    expiryWastageUnits: BeforeAndAfterMetric;
    fillRatePercent: BeforeAndAfterMetric;
    shipmentConsolidation: {
      baselineShipmentsCount: number;
      optimizedShipmentsCount: number;
      reductionPercent: number;
    };
  };
}

export interface Shipment {
  id: string;
  distributionPlanId: string;
  sourceWarehouseId: string;
  sourceWarehouseName: string;
  destinationId: string;
  destinationName: string;
  destinationType: string;
  region: string;
  sourceRegion?: string;
  destinationRegion?: string;
  productId: string;
  productName: string;
  category: ProductCategory;
  batchNumber: string;
  quantity: number;
  transportMode: string;
  isColdChain: boolean;
  vehicleId: string;
  dispatchDate: string;
  expectedDeliveryDate: string;
  actualDeliveryDate: string | null;
  estimatedTransportationCostINR: number;
  status: ShipmentStatus;
  currentProgressPercent: number;
  currentLocationDesc: string;
  notes?: string;
}

export interface DashboardData {
  regionalContext?: {
    name?: string;
    macroContext?: string;
    primaryDrivers?: string;
  };
  kpis: {
    totalInventoryUnits: number;
    forecastDemandNext7Days: number;
    stockoutRiskLocationsCount: number;
    expiryRiskUnits: number;
    estimatedTransportationCostINR: number;
    allocationEfficiency: number;
  };
  charts: {
    demandVsInventoryByCategory: Array<{
      category: string;
      availableInventory: number;
      forecastDemand7Days: number;
    }>;
    inventoryByRegion: Array<{
      region: string;
      warehouseName: string;
      totalUnits: number;
      coldUnits: number;
      capacityUnits: number;
      utilization: number;
    }>;
    transportCostByRegion: Array<{
      region: string;
      spendINR: number;
      shipmentsCount: number;
    }>;
    stockoutRiskByCategory: Array<{
      category: string;
      riskIndexPercent: number;
    }>;
    expiryRiskBreakdown: Array<{
      bucket: string;
      units: number;
      status: string;
    }>;
    fmcgVsPharma: Array<{
      name: string;
      units: number;
      percentage: number;
    }>;
  };
  alerts: Array<{
    id: string;
    severity: "critical" | "warning" | "info";
    title: string;
    description: string;
    timestamp: string;
    actionText: string;
    actionRoute: string;
  }>;
  recentRecommendations: Array<{
    id: string;
    productName: string;
    category: string;
    sourceWarehouseName: string;
    destinationName: string;
    recommendedQuantity: number;
    estimatedTransportationCostINR: number;
    priority: string;
    status: string;
  }>;
}
