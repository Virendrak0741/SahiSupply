-- =====================================================================
-- SahiSupply AI — Relational Database Schema (PostgreSQL / SQLite Compatible)
-- FMCG & Pharmaceutical Distribution Intelligence & Optimization Engine
-- =====================================================================

-- 1. PRODUCTS TABLE
CREATE TABLE IF NOT EXISTS products (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL CHECK (category IN (
        'Dairy Products',
        'Packaged Foods',
        'Beverages',
        'Personal Care',
        'Household Cleaning',
        'Snacks & Confectionery',
        'Pharmaceuticals'
    )),
    sku VARCHAR(100) UNIQUE NOT NULL,
    packaging_size VARCHAR(100) NOT NULL,
    unit_of_measure VARCHAR(50) DEFAULT 'Units',
    base_price_inr NUMERIC(10, 2) NOT NULL CHECK (base_price_inr >= 0),
    standard_shelf_life_days INT NOT NULL CHECK (standard_shelf_life_days > 0),
    min_shelf_life_days_delivery INT NOT NULL CHECK (min_shelf_life_days_delivery > 0),
    is_cold_chain_required BOOLEAN DEFAULT FALSE,
    temp_range_celsius VARCHAR(100) DEFAULT 'Ambient',
    is_pharma BOOLEAN DEFAULT FALSE,
    weight_kg_per_unit NUMERIC(8, 3) DEFAULT 1.0,
    volume_cubic_meters NUMERIC(8, 4) DEFAULT 0.001,
    handling_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_cold_chain ON products(is_cold_chain_required);
CREATE INDEX idx_products_pharma ON products(is_pharma);

-- 2. WAREHOUSES TABLE
CREATE TABLE IF NOT EXISTS warehouses (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    location VARCHAR(255) NOT NULL,
    region VARCHAR(100) NOT NULL CHECK (region IN ('Pune', 'Mumbai', 'Nashik', 'Kolhapur', 'Nagpur')),
    coord_x NUMERIC(6, 2) NOT NULL,
    coord_z NUMERIC(6, 2) NOT NULL,
    latitude NUMERIC(9, 6) NOT NULL,
    longitude NUMERIC(9, 6) NOT NULL,
    total_capacity_units INT NOT NULL CHECK (total_capacity_units > 0),
    cold_storage_capacity_units INT DEFAULT 0 CHECK (cold_storage_capacity_units >= 0),
    cold_storage_available BOOLEAN DEFAULT FALSE,
    fleet_size_trucks INT DEFAULT 10,
    active_inbound_shipments INT DEFAULT 0,
    active_outbound_shipments INT DEFAULT 0,
    manager_name VARCHAR(150),
    contact_phone VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_warehouses_region ON warehouses(region);

-- 3. DESTINATIONS TABLE (Retail Stores, Pharmacies, Distributors)
CREATE TABLE IF NOT EXISTS destinations (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(100) NOT NULL CHECK (type IN ('Pharmacy', 'Retail Store', 'Distributor', 'Hypermarket')),
    region VARCHAR(100) NOT NULL CHECK (region IN ('Pune', 'Mumbai', 'Nashik', 'Kolhapur', 'Nagpur')),
    coord_x NUMERIC(6, 2) NOT NULL,
    coord_z NUMERIC(6, 2) NOT NULL,
    capacity_units INT NOT NULL CHECK (capacity_units > 0),
    has_cold_chain BOOLEAN DEFAULT FALSE,
    has_pharma_license BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_destinations_region ON destinations(region);
CREATE INDEX idx_destinations_type ON destinations(type);

-- 4. INVENTORY BATCHES (Multi-Batch Tracking with FEFO Priority)
CREATE TABLE IF NOT EXISTS inventory_batches (
    id VARCHAR(50) PRIMARY KEY,
    batch_number VARCHAR(100) NOT NULL,
    product_id VARCHAR(50) NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    warehouse_id VARCHAR(50) NOT NULL REFERENCES warehouses(id) ON DELETE CASCADE,
    manufacturing_date DATE NOT NULL,
    expiry_date DATE NOT NULL,
    days_until_expiry INT NOT NULL,
    available_quantity INT NOT NULL CHECK (available_quantity >= 0),
    reserved_quantity INT DEFAULT 0 CHECK (reserved_quantity >= 0),
    total_quantity INT NOT NULL CHECK (total_quantity >= 0),
    safety_stock INT DEFAULT 100,
    min_stock INT DEFAULT 40,
    avg_daily_demand INT DEFAULT 25,
    days_of_inventory_remaining INT DEFAULT 30,
    inventory_status VARCHAR(50) NOT NULL CHECK (inventory_status IN (
        'Healthy', 'Low Stock', 'Critical', 'Excess Stock', 'Near Expiry', 'Expired', 'Quarantined'
    )),
    is_eligible_for_distribution BOOLEAN DEFAULT TRUE,
    rejection_reason TEXT,
    is_pharma BOOLEAN DEFAULT FALSE,
    is_cold_chain_required BOOLEAN DEFAULT FALSE,
    storage_temp_range VARCHAR(100),
    handling_requirements TEXT,
    traceability_hash VARCHAR(100),
    cost_value_inr NUMERIC(12, 2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for strict FEFO retrieval (warehouse + product sorted by earliest expiry)
CREATE INDEX idx_batches_fefo ON inventory_batches(warehouse_id, product_id, expiry_date ASC);
CREATE INDEX idx_batches_status ON inventory_batches(inventory_status);
CREATE INDEX idx_batches_expiry ON inventory_batches(days_until_expiry);

-- 5. ROUTES TABLE (Distance, Freight Costs & Transit Lead Times)
CREATE TABLE IF NOT EXISTS routes (
    id VARCHAR(100) PRIMARY KEY,
    source_warehouse_id VARCHAR(50) NOT NULL REFERENCES warehouses(id) ON DELETE CASCADE,
    destination_id VARCHAR(50) NOT NULL REFERENCES destinations(id) ON DELETE CASCADE,
    distance_km NUMERIC(8, 2) NOT NULL CHECK (distance_km > 0),
    lead_time_hours INT NOT NULL CHECK (lead_time_hours > 0),
    lead_time_days INT NOT NULL CHECK (lead_time_days > 0),
    standard_cost_per_unit_inr NUMERIC(8, 2) NOT NULL CHECK (standard_cost_per_unit_inr > 0),
    cold_chain_cost_per_unit_inr NUMERIC(8, 2) NOT NULL CHECK (cold_chain_cost_per_unit_inr > 0),
    route_capacity_units INT NOT NULL CHECK (route_capacity_units > 0),
    is_eligible_cold_chain BOOLEAN DEFAULT FALSE,
    is_eligible_pharma BOOLEAN DEFAULT FALSE,
    UNIQUE(source_warehouse_id, destination_id)
);

CREATE INDEX idx_routes_source ON routes(source_warehouse_id);
CREATE INDEX idx_routes_dest ON routes(destination_id);

-- 6. DEMAND HISTORY TABLE (90-Day Telemetry)
CREATE TABLE IF NOT EXISTS demand_history (
    id SERIAL PRIMARY KEY,
    record_date DATE NOT NULL,
    day_index INT NOT NULL,
    product_id VARCHAR(50) NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    destination_id VARCHAR(50) NOT NULL REFERENCES destinations(id) ON DELETE CASCADE,
    quantity_demanded INT NOT NULL CHECK (quantity_demanded >= 0),
    quantity_fulfilled INT NOT NULL CHECK (quantity_fulfilled >= 0),
    unmet_demand INT DEFAULT 0 CHECK (unmet_demand >= 0),
    stockout_recorded BOOLEAN DEFAULT FALSE,
    revenue_inr NUMERIC(12, 2) DEFAULT 0
);

CREATE INDEX idx_demand_lookup ON demand_history(product_id, destination_id, record_date);

-- 7. DISTRIBUTION PLANS TABLE (Optimization Run Outcomes)
CREATE TABLE IF NOT EXISTS distribution_plans (
    id VARCHAR(50) PRIMARY KEY,
    status VARCHAR(50) NOT NULL CHECK (status IN ('Pending Approval', 'Approved', 'Rejected')),
    planning_horizon_days INT NOT NULL DEFAULT 7,
    total_units_allocated INT NOT NULL DEFAULT 0,
    total_demand_requested INT NOT NULL DEFAULT 0,
    demand_fulfillment_rate NUMERIC(5, 2) NOT NULL DEFAULT 0.0,
    unmet_demand_units INT NOT NULL DEFAULT 0,
    total_transportation_cost_inr NUMERIC(14, 2) NOT NULL DEFAULT 0.0,
    number_of_shipments INT NOT NULL DEFAULT 0,
    pharma_batches_allocated INT NOT NULL DEFAULT 0,
    cold_chain_shipments_count INT NOT NULL DEFAULT 0,
    runtime_ms INT NOT NULL DEFAULT 0,
    approver VARCHAR(100),
    rejection_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    approved_at TIMESTAMP
);

-- 8. PLAN RECOMMENDATIONS TABLE (x(w,l,p) Allocation Variables)
CREATE TABLE IF NOT EXISTS plan_recommendations (
    id VARCHAR(50) PRIMARY KEY,
    plan_id VARCHAR(50) NOT NULL REFERENCES distribution_plans(id) ON DELETE CASCADE,
    product_id VARCHAR(50) NOT NULL REFERENCES products(id),
    source_warehouse_id VARCHAR(50) NOT NULL REFERENCES warehouses(id),
    destination_id VARCHAR(50) NOT NULL REFERENCES destinations(id),
    batch_number VARCHAR(100) NOT NULL,
    recommended_quantity INT NOT NULL CHECK (recommended_quantity > 0),
    forecast_demand INT NOT NULL,
    estimated_transportation_cost_inr NUMERIC(12, 2) NOT NULL,
    expected_delivery_date DATE NOT NULL,
    priority VARCHAR(50) DEFAULT 'Standard' CHECK (priority IN ('Urgent', 'High', 'Standard')),
    is_cold_chain BOOLEAN DEFAULT FALSE,
    is_pharma BOOLEAN DEFAULT FALSE,
    explanation TEXT
);

CREATE INDEX idx_rec_plan ON plan_recommendations(plan_id);

-- 9. SHIPMENTS TABLE (Physical Execution Telemetry)
CREATE TABLE IF NOT EXISTS shipments (
    id VARCHAR(50) PRIMARY KEY,
    distribution_plan_id VARCHAR(50) REFERENCES distribution_plans(id),
    source_warehouse_id VARCHAR(50) NOT NULL REFERENCES warehouses(id),
    destination_id VARCHAR(50) NOT NULL REFERENCES destinations(id),
    product_id VARCHAR(50) NOT NULL REFERENCES products(id),
    batch_number VARCHAR(100) NOT NULL,
    quantity INT NOT NULL CHECK (quantity > 0),
    transport_mode VARCHAR(100) NOT NULL,
    is_cold_chain BOOLEAN DEFAULT FALSE,
    vehicle_id VARCHAR(50) NOT NULL,
    dispatch_date TIMESTAMP NOT NULL,
    expected_delivery_date TIMESTAMP NOT NULL,
    actual_delivery_date TIMESTAMP,
    estimated_transportation_cost_inr NUMERIC(10, 2) NOT NULL,
    status VARCHAR(50) NOT NULL CHECK (status IN (
        'Pending', 'Approved', 'Dispatched', 'In Transit', 'Delivered', 'Delayed', 'Cancelled'
    )),
    current_progress_percent INT DEFAULT 0 CHECK (current_progress_percent BETWEEN 0 AND 100),
    current_location_desc VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_shipments_status ON shipments(status);

-- 10. AUDIT LOGS TABLE
CREATE TABLE IF NOT EXISTS audit_logs (
    id VARCHAR(50) PRIMARY KEY,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    action VARCHAR(100) NOT NULL,
    entity VARCHAR(100) NOT NULL,
    details TEXT NOT NULL
);

-- =====================================================================
-- ANALYTICAL VIEWS
-- =====================================================================

-- View: FEFO Batches Nearing Expiry (< 30 days)
CREATE OR REPLACE VIEW v_near_expiry_batches AS
SELECT 
    b.id,
    b.batch_number,
    p.name AS product_name,
    p.category,
    w.name AS warehouse_name,
    w.region,
    b.available_quantity,
    b.days_until_expiry,
    b.expiry_date,
    b.is_cold_chain_required,
    b.is_pharma
FROM inventory_batches b
JOIN products p ON b.product_id = p.id
JOIN warehouses w ON b.warehouse_id = w.id
WHERE b.days_until_expiry <= 30 AND b.is_eligible_for_distribution = TRUE
ORDER BY b.days_until_expiry ASC;

-- View: Warehouse Storage Utilization
CREATE OR REPLACE VIEW v_warehouse_utilization AS
SELECT 
    w.id AS warehouse_id,
    w.name,
    w.region,
    w.total_capacity_units,
    COALESCE(SUM(b.total_quantity), 0) AS used_capacity_units,
    ROUND((COALESCE(SUM(b.total_quantity), 0)::NUMERIC / w.total_capacity_units) * 100, 1) AS utilization_percent,
    w.cold_storage_available,
    w.fleet_size_trucks
FROM warehouses w
LEFT JOIN inventory_batches b ON w.id = b.warehouse_id
GROUP BY w.id, w.name, w.region, w.total_capacity_units, w.cold_storage_available, w.fleet_size_trucks;
