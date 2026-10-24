import React, { useEffect, useState } from 'react';
import {
  Boxes,
  Plus,
  ArrowRightLeft,
  Download,
  Filter,
  Search,
  AlertTriangle,
  Clock,
  ShieldCheck,
  Snowflake,
  Warehouse as WarehouseIcon,
  CheckCircle2,
  XCircle,
  Eye,
  Layers
} from 'lucide-react';
import { WarehouseScene3D } from '../components/3d/WarehouseScene3D';
import { InventoryBatch, Warehouse, ProductCategory, Product } from '../types';

interface InventoryPageProps {
  selectedRegion: string;
  searchQuery: string;
}

export const InventoryPage: React.FC<InventoryPageProps> = ({ selectedRegion, searchQuery: globalSearch }) => {
  const [batches, setBatches] = useState<InventoryBatch[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedWarehouse, setSelectedWarehouse] = useState<Warehouse | null>(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [expiryFilter, setExpiryFilter] = useState<string>('All');
  const [pharmaOnly, setPharmaOnly] = useState<boolean>(false);
  const [localSearch, setLocalSearch] = useState<string>('');

  // 3D View vs 2D View
  const [view3D, setView3D] = useState(true);

  // Modals
  const [showAddBatchModal, setShowAddBatchModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [selectedBatchForTransfer, setSelectedBatchForTransfer] = useState<InventoryBatch | null>(null);
  const [transferTargetWh, setTransferTargetWh] = useState<string>('WH-MUMBAI-01');
  const [transferQty, setTransferQty] = useState<number>(100);

  // New Batch Form State
  const [newBatchData, setNewBatchData] = useState({
    productId: '',
    warehouseId: 'WH-PUNE-01',
    batchNumber: '',
    quantity: 500,
    expiryDate: '2027-04-15'
  });

  const categories: ProductCategory[] = [
    "Dairy Products", "Packaged Foods", "Beverages",
    "Personal Care", "Household Cleaning", "Snacks & Confectionery", "Pharmaceuticals"
  ];

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const [batchRes, whRes, prodRes] = await Promise.all([
        fetch('/api/inventory/batches'),
        fetch('/api/warehouses'),
        fetch('/api/inventory/products')
      ]);

      const batchJson = await batchRes.json();
      const whJson = await whRes.json();
      const prodJson = await prodRes.json();

      if (batchJson.success) setBatches(batchJson.data);
      if (whJson.success) {
        setWarehouses(whJson.data);
        if (whJson.data.length > 0) setSelectedWarehouse(whJson.data[0]);
      }
      if (prodJson.success) {
        setProducts(prodJson.data);
        if (prodJson.data.length > 0) {
          setNewBatchData(prev => ({ ...prev, productId: prodJson.data[0].id }));
        }
      }
    } catch (err) {
      console.error('Failed to load inventory data:', err);
    } finally {
      setLoading(false);
    }
  };

  // KPI Calculations
  const totalUnits = batches.reduce((s, b) => s + b.totalQuantity, 0);
  const availableUnits = batches.reduce((s, b) => s + b.availableQuantity, 0);
  const reservedUnits = batches.reduce((s, b) => s + b.reservedQuantity, 0);
  const lowStockCount = batches.filter(b => b.inventoryStatus === 'Low Stock' || b.inventoryStatus === 'Critical').length;
  const excessStockCount = batches.filter(b => b.inventoryStatus === 'Excess Stock').length;
  const nearExpiryCount = batches.filter(b => b.daysUntilExpiry > 0 && b.daysUntilExpiry <= 14).length;
  const pharmaCount = batches.filter(b => b.isPharma).length;

  // Filter batches
  const filteredBatches = batches.filter(b => {
    if (categoryFilter !== 'All' && b.category !== categoryFilter) return false;
    if (statusFilter !== 'All' && b.inventoryStatus !== statusFilter) return false;
    if (pharmaOnly && !b.isPharma) return false;
    if (selectedRegion !== 'All' && b.warehouseName && !b.warehouseName.toLowerCase().includes(selectedRegion.toLowerCase())) {
      return false;
    }
    if (expiryFilter === '7d' && !(b.daysUntilExpiry > 0 && b.daysUntilExpiry <= 7)) return false;
    if (expiryFilter === '15d' && !(b.daysUntilExpiry > 0 && b.daysUntilExpiry <= 15)) return false;
    if (expiryFilter === 'expired' && !(b.daysUntilExpiry <= 0 || b.inventoryStatus === 'Expired' || b.inventoryStatus === 'Quarantined')) return false;

    const q = (localSearch || globalSearch).toLowerCase();
    if (q) {
      const match =
        b.productName.toLowerCase().includes(q) ||
        b.batchNumber.toLowerCase().includes(q) ||
        b.sku.toLowerCase().includes(q) ||
        b.warehouseName.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  const handleExportCSV = () => {
    window.location.href = '/api/inventory/export-csv';
  };

  const handleCreateBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/inventory/batches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newBatchData)
      });
      const json = await res.json();
      if (json.success) {
        setShowAddBatchModal(false);
        fetchInventory();
      } else {
        alert(json.error || 'Failed to add batch');
      }
    } catch (err) {
      alert('Network error adding batch');
    }
  };

  const handleExecuteTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBatchForTransfer) return;

    try {
      const res = await fetch('/api/inventory/transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          batchId: selectedBatchForTransfer.id,
          targetWarehouseId: transferTargetWh,
          quantity: transferQty
        })
      });
      const json = await res.json();
      if (json.success) {
        setShowTransferModal(false);
        fetchInventory();
        alert('Stock transferred successfully!');
      } else {
        alert(json.error || 'Transfer failed');
      }
    } catch (err) {
      alert('Error transferring stock');
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm font-medium text-slate-500">Loading Warehouse Stock & Batches...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* 2.2 Top Inventory KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        <div className="bg-white p-3 rounded-xl border border-slate-200/90 shadow-sm">
          <div className="text-[11px] text-slate-500 uppercase font-semibold">Total SKUs</div>
          <div className="text-xl font-bold text-slate-900 mt-1 font-mono">{products.length}</div>
          <div className="text-[10px] text-slate-400">across 7 categories</div>
        </div>
        <div className="bg-white p-3 rounded-xl border border-slate-200/90 shadow-sm">
          <div className="text-[11px] text-slate-500 uppercase font-semibold">Total Units</div>
          <div className="text-xl font-bold text-slate-900 mt-1 font-mono">{(totalUnits / 1000).toFixed(1)}k</div>
          <div className="text-[10px] text-slate-400">in warehouse grid</div>
        </div>
        <div className="bg-white p-3 rounded-xl border border-slate-200/90 shadow-sm">
          <div className="text-[11px] text-emerald-600 uppercase font-semibold">Available</div>
          <div className="text-xl font-bold text-emerald-600 mt-1 font-mono">{(availableUnits / 1000).toFixed(1)}k</div>
          <div className="text-[10px] text-slate-400">ready to allocate</div>
        </div>
        <div className="bg-white p-3 rounded-xl border border-slate-200/90 shadow-sm">
          <div className="text-[11px] text-slate-500 uppercase font-semibold">Reserved</div>
          <div className="text-xl font-bold text-slate-700 mt-1 font-mono">{(reservedUnits / 1000).toFixed(1)}k</div>
          <div className="text-[10px] text-slate-400">committed stock</div>
        </div>
        <div className="bg-white p-3 rounded-xl border border-slate-200/90 shadow-sm">
          <div className="text-[11px] text-red-600 uppercase font-semibold">Low Stock</div>
          <div className="text-xl font-bold text-red-600 mt-1 font-mono">{lowStockCount}</div>
          <div className="text-[10px] text-slate-400">urgent replenishment</div>
        </div>
        <div className="bg-white p-3 rounded-xl border border-slate-200/90 shadow-sm">
          <div className="text-[11px] text-blue-600 uppercase font-semibold">Excess Stock</div>
          <div className="text-xl font-bold text-blue-600 mt-1 font-mono">{excessStockCount}</div>
          <div className="text-[10px] text-slate-400">rebalance source</div>
        </div>
        <div className="bg-white p-3 rounded-xl border border-slate-200/90 shadow-sm">
          <div className="text-[11px] text-amber-600 uppercase font-semibold">Near Expiry</div>
          <div className="text-xl font-bold text-amber-600 mt-1 font-mono">{nearExpiryCount}</div>
          <div className="text-[10px] text-slate-400">&lt; 14 days FEFO</div>
        </div>
        <div className="bg-white p-3 rounded-xl border border-slate-200/90 shadow-sm">
          <div className="text-[11px] text-purple-600 uppercase font-semibold">Pharma GDP</div>
          <div className="text-xl font-bold text-purple-600 mt-1 font-mono">{pharmaCount}</div>
          <div className="text-[10px] text-slate-400">traced batches</div>
        </div>
      </div>

      {/* 2.4 & 2.5 Interactive Warehouse 3D Digital Twin Viewer */}
      {selectedWarehouse && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-4 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <WarehouseIcon className="w-5 h-5 text-blue-600" />
                <h2 className="text-base font-bold text-slate-900">
                  {selectedWarehouse.name} — Interactive 3D Warehouse Interior
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700">
                  {selectedWarehouse.region} Hub
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Industrial Racks, Cold-Storage Reefer Chamber (2-8°C), and Secured GDP Pharmaceutical Vault
              </p>
            </div>

            {/* Warehouse Selector & 2D/3D Toggle */}
            <div className="flex items-center gap-2">
              <select
                value={selectedWarehouse.id}
                onChange={(e) => {
                  const wh = warehouses.find(w => w.id === e.target.value);
                  if (wh) setSelectedWarehouse(wh);
                }}
                className="bg-slate-50 border border-slate-200 text-xs font-semibold px-3 py-1.5 rounded-lg text-slate-800 focus:outline-none"
              >
                {warehouses.map(w => (
                  <option key={w.id} value={w.id}>
                    {w.name} ({w.region})
                  </option>
                ))}
              </select>

              <div className="flex rounded-lg border border-slate-200 p-0.5 bg-slate-50 text-xs">
                <button
                  onClick={() => setView3D(true)}
                  className={`px-3 py-1 rounded-md font-semibold ${
                    view3D ? 'bg-white shadow text-blue-600' : 'text-slate-600'
                  }`}
                >
                  3D Racks
                </button>
                <button
                  onClick={() => setView3D(false)}
                  className={`px-3 py-1 rounded-md font-semibold ${
                    !view3D ? 'bg-white shadow text-blue-600' : 'text-slate-600'
                  }`}
                >
                  2D Grid
                </button>
              </div>
            </div>
          </div>

          <div className="mt-4">
            {view3D ? (
              <WarehouseScene3D warehouse={selectedWarehouse} />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
                <div className="p-4 bg-white rounded-lg border border-slate-200 shadow-sm">
                  <h4 className="font-bold text-xs text-blue-600 uppercase">Zone A: Fast-Moving FMCG</h4>
                  <p className="text-xs text-slate-600 mt-1">Snacks, Packaged Foods, Cleaners</p>
                  <div className="mt-3 text-xs space-y-1 text-slate-500">
                    <div>Capacity: 50,000 units</div>
                    <div>Utilization: 78% (Healthy)</div>
                    <div>Environment: Ambient (20-25°C)</div>
                  </div>
                </div>
                <div className="p-4 bg-white rounded-lg border border-cyan-200 shadow-sm bg-cyan-50/20">
                  <h4 className="font-bold text-xs text-cyan-700 uppercase flex items-center gap-1">
                    <Snowflake className="w-3.5 h-3.5" /> Zone C: Cold-Storage Reefer Vault
                  </h4>
                  <p className="text-xs text-slate-600 mt-1">Dairy Milk, Probiotic Yogurt, Cold Pharma</p>
                  <div className="mt-3 text-xs space-y-1 text-slate-500">
                    <div>Capacity: {selectedWarehouse.coldStorageCapacityUnits.toLocaleString()} units</div>
                    <div>Utilization: 84% (Near Capacity)</div>
                    <div>Environment: Monitored 2°C to 8°C</div>
                  </div>
                </div>
                <div className="p-4 bg-white rounded-lg border border-purple-200 shadow-sm bg-purple-50/20">
                  <h4 className="font-bold text-xs text-purple-700 uppercase flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" /> Zone D: GDP Pharmaceutical Vault
                  </h4>
                  <p className="text-xs text-slate-600 mt-1">Prescription Antibiotics, ORS, Paracetamol</p>
                  <div className="mt-3 text-xs space-y-1 text-slate-500">
                    <div>Capacity: 25,000 units</div>
                    <div>Utilization: 62%</div>
                    <div>Environment: Controlled 15-25°C &lt; 60% RH</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2.3 & 2.6 Inventory Batches Table & Operations */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-4 border-b border-slate-100">
          <div>
            <h3 className="font-bold text-sm text-slate-900">Warehouse Inventory & Batch Traceability</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              FEFO Prioritization, Minimum Shelf-Life Lockout, and Batch QA Status
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAddBatchModal(true)}
              className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold shadow-sm transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Batch</span>
            </button>
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="mt-4 flex flex-wrap items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
          {/* Category Dropdown */}
          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <span className="font-semibold text-slate-700">Category:</span>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-white border border-slate-200 rounded px-2 py-1 text-xs font-medium text-slate-800 focus:outline-none"
            >
              <option value="All">All Categories</option>
              {categories.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Status Dropdown */}
          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <span className="font-semibold text-slate-700">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-white border border-slate-200 rounded px-2 py-1 text-xs font-medium text-slate-800 focus:outline-none"
            >
              <option value="All">All Statuses</option>
              <option value="Healthy">Healthy</option>
              <option value="Low Stock">Low Stock</option>
              <option value="Critical">Critical</option>
              <option value="Excess Stock">Excess Stock</option>
              <option value="Near Expiry">Near Expiry</option>
              <option value="Expired">Expired</option>
              <option value="Quarantined">Quarantined</option>
            </select>
          </div>

          {/* Expiry Bucket */}
          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <span className="font-semibold text-slate-700">Expiry Window:</span>
            <select
              value={expiryFilter}
              onChange={(e) => setExpiryFilter(e.target.value)}
              className="bg-white border border-slate-200 rounded px-2 py-1 text-xs font-medium text-slate-800 focus:outline-none"
            >
              <option value="All">All Expiry Horizons</option>
              <option value="7d">Expires within 7 Days</option>
              <option value="15d">Expires within 15 Days</option>
              <option value="expired">Expired / Quarantined</option>
            </select>
          </div>

          {/* Pharma Checkbox Toggle */}
          <label className="flex items-center gap-1.5 text-xs font-semibold text-purple-700 cursor-pointer ml-auto">
            <input
              type="checkbox"
              checked={pharmaOnly}
              onChange={(e) => setPharmaOnly(e.target.checked)}
              className="rounded text-purple-600 focus:ring-purple-500"
            />
            <span>💊 Pharmaceuticals Only</span>
          </label>
        </div>

        {/* Batches Table */}
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-[11px] uppercase font-bold text-slate-500 border-b border-slate-200">
              <tr>
                <th className="py-3 px-3">Batch Number</th>
                <th className="py-3 px-3">Product Name</th>
                <th className="py-3 px-3">Category</th>
                <th className="py-3 px-3">Warehouse</th>
                <th className="py-3 px-3 text-right">Available</th>
                <th className="py-3 px-3 text-right">Reserved</th>
                <th className="py-3 px-3 text-right">Days Supply</th>
                <th className="py-3 px-3">Expiry Date</th>
                <th className="py-3 px-3">Days Left</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3">Eligibility</th>
                <th className="py-3 px-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredBatches.slice(0, 30).map((batch) => {
                const isNearExpiry = batch.daysUntilExpiry > 0 && batch.daysUntilExpiry <= 14;
                const isExpiredOrLocked = !batch.isEligibleForDistribution;

                return (
                  <tr key={batch.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-3 font-mono font-semibold text-slate-900">
                      {batch.batchNumber}
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-semibold text-slate-900">{batch.productName}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{batch.sku}</div>
                    </td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                        batch.isPharma ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {batch.category}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-600">{batch.warehouseName}</td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-slate-800">
                      {batch.availableQuantity.toLocaleString()}
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-slate-500">
                      {batch.reservedQuantity.toLocaleString()}
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-slate-700">
                      {batch.daysOfInventoryRemaining}d
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-600">{batch.expiryDate}</td>
                    <td className="py-3 px-3 font-mono font-semibold">
                      <span className={
                        batch.daysUntilExpiry <= 0
                          ? 'text-red-600'
                          : batch.daysUntilExpiry <= 14
                          ? 'text-amber-600'
                          : 'text-emerald-600'
                      }>
                        {batch.daysUntilExpiry <= 0 ? 'EXPIRED' : `${batch.daysUntilExpiry}d`}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                        batch.inventoryStatus === 'Healthy'
                          ? 'bg-emerald-100 text-emerald-800'
                          : batch.inventoryStatus === 'Low Stock' || batch.inventoryStatus === 'Critical'
                          ? 'bg-red-100 text-red-800'
                          : batch.inventoryStatus === 'Excess Stock'
                          ? 'bg-blue-100 text-blue-800'
                          : batch.inventoryStatus === 'Near Expiry'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-slate-800 text-white'
                      }`}>
                        {batch.inventoryStatus}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      {batch.isEligibleForDistribution ? (
                        <span className="flex items-center gap-1 text-[11px] text-emerald-600 font-semibold">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Eligible
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-[11px] text-red-600 font-semibold" title={batch.rejectionReason || "Ineligible"}>
                          <XCircle className="w-3.5 h-3.5" />
                          Locked
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <button
                        onClick={() => {
                          setSelectedBatchForTransfer(batch);
                          setShowTransferModal(true);
                        }}
                        disabled={batch.availableQuantity <= 0 || !batch.isEligibleForDistribution}
                        className="px-2.5 py-1 rounded text-[11px] font-semibold bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        Transfer
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Add Inventory Batch */}
      {showAddBatchModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="font-bold text-sm text-slate-900">Add New Inventory Batch</h3>
              <button onClick={() => setShowAddBatchModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <form onSubmit={handleCreateBatch} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 font-medium mb-1">Select Product SKU</label>
                <select
                  value={newBatchData.productId}
                  onChange={(e) => setNewBatchData({ ...newBatchData, productId: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs"
                >
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-slate-600 font-medium mb-1">Target Warehouse</label>
                <select
                  value={newBatchData.warehouseId}
                  onChange={(e) => setNewBatchData({ ...newBatchData, warehouseId: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs"
                >
                  {warehouses.map(w => (
                    <option key={w.id} value={w.id}>{w.name} ({w.region})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-slate-600 font-medium mb-1">Batch Number</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. BAT-MILK-2026999"
                  value={newBatchData.batchNumber}
                  onChange={(e) => setNewBatchData({ ...newBatchData, batchNumber: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Quantity (Units)</label>
                  <input
                    type="number"
                    min="10"
                    required
                    value={newBatchData.quantity}
                    onChange={(e) => setNewBatchData({ ...newBatchData, quantity: parseInt(e.target.value, 10) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Expiry Date</label>
                  <input
                    type="date"
                    required
                    value={newBatchData.expiryDate}
                    onChange={(e) => setNewBatchData({ ...newBatchData, expiryDate: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs"
                  />
                </div>
              </div>
              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100 mt-4">
                <button
                  type="button"
                  onClick={() => setShowAddBatchModal(false)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold"
                >
                  Save Batch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Transfer Inventory Between Warehouses */}
      {showTransferModal && selectedBatchForTransfer && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                <ArrowRightLeft className="w-4 h-4 text-blue-600" />
                Inter-Warehouse Stock Transfer
              </h3>
              <button onClick={() => setShowTransferModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <form onSubmit={handleExecuteTransfer} className="mt-4 space-y-3 text-xs">
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                <div className="font-semibold text-slate-800">{selectedBatchForTransfer.productName}</div>
                <div className="text-slate-500 text-[11px] mt-0.5">
                  Batch: {selectedBatchForTransfer.batchNumber} • Source: {selectedBatchForTransfer.warehouseName}
                </div>
                <div className="text-emerald-600 font-mono font-bold mt-1">
                  Available: {selectedBatchForTransfer.availableQuantity.toLocaleString()} units
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">Destination Warehouse</label>
                <select
                  value={transferTargetWh}
                  onChange={(e) => setTransferTargetWh(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs"
                >
                  {warehouses
                    .filter(w => w.id !== selectedBatchForTransfer.warehouseId)
                    .map(w => (
                      <option key={w.id} value={w.id}>{w.name} ({w.region})</option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">Transfer Quantity (Units)</label>
                <input
                  type="number"
                  min="1"
                  max={selectedBatchForTransfer.availableQuantity}
                  required
                  value={transferQty}
                  onChange={(e) => setTransferQty(parseInt(e.target.value, 10))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100 mt-4">
                <button
                  type="button"
                  onClick={() => setShowTransferModal(false)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold"
                >
                  Execute Transfer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
