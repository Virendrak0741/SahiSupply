import React, { useState, useEffect } from 'react';
import {
  Truck,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Snowflake,
  ShieldCheck,
  Search,
  Filter,
  Download,
  IndianRupee,
  Layers,
  ArrowRight,
  TrendingUp,
  BarChart2,
  FileText,
  Printer
} from 'lucide-react';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { NetworkScene3D } from '../components/3d/NetworkScene3D';
import { Shipment, Warehouse, Destination, ShipmentStatus } from '../types';

interface ShipmentsPageProps {
  selectedRegion: string;
  searchQuery: string;
}

export const ShipmentsAnalyticsPage: React.FC<ShipmentsPageProps> = ({ selectedRegion }) => {
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [routeAnalytics, setRouteAnalytics] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [coldChainOnly, setColdChainOnly] = useState<boolean>(false);
  const [localSearch, setLocalSearch] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'shipments' | 'analytics' | 'reports'>('shipments');

  useEffect(() => {
    fetchShipmentData();
  }, [selectedRegion]);

  const fetchShipmentData = async () => {
    try {
      setLoading(true);
      const q = selectedRegion !== 'All' ? `?region=${selectedRegion}` : '';
      const [shpRes, whRes, destRes, routeRes] = await Promise.all([
        fetch(`/api/shipments${q}`),
        fetch(`/api/warehouses${q}`),
        fetch(`/api/forecast/destinations${q}`),
        fetch('/api/shipments/routes-analytics')
      ]);

      const shpJson = await shpRes.json();
      const whJson = await whRes.json();
      const destJson = await destRes.json();
      const routeJson = await routeRes.json();

      if (shpJson.success) setShipments(shpJson.data);
      if (whJson.success) setWarehouses(whJson.data);
      if (destJson.success) setDestinations(destJson.data);
      if (routeJson.success) setRouteAnalytics(routeJson.data);
    } catch (err) {
      console.error('Failed to load shipment telemetry:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (shipmentId: string, nextStatus: ShipmentStatus) => {
    try {
      const res = await fetch(`/api/shipments/${shipmentId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus })
      });
      const json = await res.json();
      if (json.success) {
        setShipments(prev => prev.map(s => s.id === shipmentId ? json.data : s));
      }
    } catch (err) {
      alert('Failed to update status');
    }
  };

  // KPIs
  const totalShipments = shipments.length;
  const pendingCount = shipments.filter(s => s.status === 'Pending' || s.status === 'Approved').length;
  const dispatchedCount = shipments.filter(s => s.status === 'Dispatched').length;
  const inTransitCount = shipments.filter(s => s.status === 'In Transit').length;
  const deliveredCount = shipments.filter(s => s.status === 'Delivered').length;
  const delayedCount = shipments.filter(s => s.status === 'Delayed').length;
  const coldChainCount = shipments.filter(s => s.isColdChain).length;
  const totalFreightCost = shipments.reduce((s, shp) => s + (shp.estimatedTransportationCostINR || 0), 0);

  // Filter shipments
  const filteredShipments = shipments.filter(s => {
    if (statusFilter !== 'All' && s.status !== statusFilter) return false;
    if (coldChainOnly && !s.isColdChain) return false;
    if (selectedRegion !== 'All' && s.sourceRegion !== selectedRegion && s.destinationRegion !== selectedRegion && s.region !== selectedRegion) return false;
    const q = localSearch.toLowerCase();
    if (q) {
      const match =
        s.id.toLowerCase().includes(q) ||
        s.productName.toLowerCase().includes(q) ||
        s.sourceWarehouseName.toLowerCase().includes(q) ||
        s.destinationName.toLowerCase().includes(q) ||
        (s.vehicleId && s.vehicleId.toLowerCase().includes(q));
      if (!match) return false;
    }
    return true;
  });

  // Prepare routes for 3D animated scene
  const active3DRoutes = shipments.slice(0, 15).map(s => {
    const wh = warehouses.find(w => w.id === s.sourceWarehouseId);
    const dest = destinations.find(d => d.id === s.destinationId);

    const start: [number, number, number] = wh
      ? [wh.coordinates.x, 0.4, wh.coordinates.z]
      : [0, 0.4, 0];
    const end: [number, number, number] = dest
      ? [dest.coordinates.x, 0.2, dest.coordinates.z]
      : [2, 0.2, 2];

    return {
      sourceCoord: start,
      destCoord: end,
      sourceName: s.sourceWarehouseName,
      destName: s.destinationName,
      productName: s.productName,
      quantity: s.quantity,
      isColdChain: s.isColdChain,
      isPharma: s.category === 'Pharmaceuticals',
      priority: s.status === 'In Transit' ? 'High' : 'Normal'
    };
  });

  const handlePrintReport = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm font-medium text-slate-500">Loading Dispatch Shipments & Telemetry...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* 5.1 Shipment Dashboard KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        <div className="bg-white p-3 rounded-xl border border-slate-200/90 shadow-sm">
          <div className="text-[11px] text-slate-500 uppercase font-semibold">Total Shipments</div>
          <div className="text-xl font-bold text-slate-900 mt-1 font-mono">{totalShipments}</div>
          <div className="text-[10px] text-slate-400">active loads</div>
        </div>
        <div className="bg-white p-3 rounded-xl border border-slate-200/90 shadow-sm">
          <div className="text-[11px] text-amber-600 uppercase font-semibold">Pending / Staged</div>
          <div className="text-xl font-bold text-amber-600 mt-1 font-mono">{pendingCount}</div>
          <div className="text-[10px] text-slate-400">awaiting departure</div>
        </div>
        <div className="bg-white p-3 rounded-xl border border-slate-200/90 shadow-sm">
          <div className="text-[11px] text-blue-600 uppercase font-semibold">Dispatched</div>
          <div className="text-xl font-bold text-blue-600 mt-1 font-mono">{dispatchedCount}</div>
          <div className="text-[10px] text-slate-400">leaving warehouse</div>
        </div>
        <div className="bg-white p-3 rounded-xl border border-slate-200/90 shadow-sm">
          <div className="text-[11px] text-indigo-600 uppercase font-semibold">In Transit</div>
          <div className="text-xl font-bold text-indigo-600 mt-1 font-mono">{inTransitCount}</div>
          <div className="text-[10px] text-indigo-600 font-medium">on highway</div>
        </div>
        <div className="bg-white p-3 rounded-xl border border-slate-200/90 shadow-sm">
          <div className="text-[11px] text-emerald-600 uppercase font-semibold">Delivered</div>
          <div className="text-xl font-bold text-emerald-600 mt-1 font-mono">{deliveredCount}</div>
          <div className="text-[10px] text-emerald-600 font-medium">receipt confirmed</div>
        </div>
        <div className="bg-white p-3 rounded-xl border border-slate-200/90 shadow-sm">
          <div className="text-[11px] text-red-600 uppercase font-semibold">Delayed</div>
          <div className="text-xl font-bold text-red-600 mt-1 font-mono">{delayedCount}</div>
          <div className="text-[10px] text-slate-400">toll congestion</div>
        </div>
        <div className="bg-white p-3 rounded-xl border border-slate-200/90 shadow-sm">
          <div className="text-[11px] text-cyan-600 uppercase font-semibold">Cold-Chain</div>
          <div className="text-xl font-bold text-cyan-600 mt-1 font-mono">{coldChainCount}</div>
          <div className="text-[10px] text-cyan-600 font-medium">2-8°C reefer vans</div>
        </div>
        <div className="bg-white p-3 rounded-xl border border-slate-200/90 shadow-sm">
          <div className="text-[11px] text-slate-600 uppercase font-semibold">Total Freight</div>
          <div className="text-xl font-bold text-slate-900 mt-1 font-mono">₹{(totalFreightCost / 1000).toFixed(1)}k</div>
          <div className="text-[10px] text-slate-400">active freight spend</div>
        </div>
      </div>

      {/* Tabs Header: Shipments Tracker vs Route Analytics vs Reports */}
      <div className="flex border-b border-slate-200 gap-4 text-xs font-semibold text-slate-600">
        <button
          onClick={() => setActiveTab('shipments')}
          className={`pb-2.5 px-2 transition-all flex items-center gap-1.5 ${
            activeTab === 'shipments'
              ? 'border-b-2 border-blue-600 text-blue-600 font-bold'
              : 'hover:text-slate-900'
          }`}
        >
          <Truck className="w-4 h-4" />
          <span>Active Shipments & Fleet Tracking</span>
        </button>
        <button
          onClick={() => setActiveTab('analytics')}
          className={`pb-2.5 px-2 transition-all flex items-center gap-1.5 ${
            activeTab === 'analytics'
              ? 'border-b-2 border-blue-600 text-blue-600 font-bold'
              : 'hover:text-slate-900'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>Route Analytics & Cost Analysis</span>
        </button>
        <button
          onClick={() => setActiveTab('reports')}
          className={`pb-2.5 px-2 transition-all flex items-center gap-1.5 ${
            activeTab === 'reports'
              ? 'border-b-2 border-blue-600 text-blue-600 font-bold'
              : 'hover:text-slate-900'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Comprehensive Supply Chain Reports</span>
        </button>
      </div>

      {/* TAB 1: SHIPMENTS & 3D TRACKING */}
      {activeTab === 'shipments' && (
        <div className="space-y-6">
          {/* 5.4 3D Live Fleet Tracking Environment */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-sm text-slate-900">
                    Live 3D Fleet Tracking Simulation
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700">
                    GPS Simulated Telemetry
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Trucks en route across Maharashtra expressway corridors with cold-chain sensor monitoring
                </p>
              </div>
            </div>

            <div className="mt-4">
              <NetworkScene3D
                warehouses={warehouses}
                destinations={destinations}
                activeRoutes={active3DRoutes}
                showRoutes={true}
              />
            </div>
          </div>

          {/* 5.2 & 5.3 Shipments Table & Controlled Workflow */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-4 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-sm text-slate-900">Shipment Execution & Delivery Workflow</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Workflow: Pending ➔ Approved ➔ Dispatched ➔ In Transit ➔ Delivered
                </p>
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-2 text-xs">
                <span className="font-semibold text-slate-700">Status:</span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded px-2.5 py-1 text-xs font-medium text-slate-800"
                >
                  <option value="All">All Statuses</option>
                  <option value="Approved">Approved</option>
                  <option value="Dispatched">Dispatched</option>
                  <option value="In Transit">In Transit</option>
                  <option value="Delivered">Delivered</option>
                  <option value="Delayed">Delayed</option>
                </select>

                <label className="flex items-center gap-1.5 font-semibold text-cyan-700 ml-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={coldChainOnly}
                    onChange={(e) => setColdChainOnly(e.target.checked)}
                    className="rounded text-cyan-600 focus:ring-cyan-500"
                  />
                  <span>❄️ Cold-Chain Only</span>
                </label>
              </div>
            </div>

            {/* Shipments Records */}
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 text-[11px] uppercase font-bold text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-3">Shipment ID</th>
                    <th className="py-3 px-3">Vehicle / Mode</th>
                    <th className="py-3 px-3">Product Name</th>
                    <th className="py-3 px-3">Source Warehouse</th>
                    <th className="py-3 px-3">Destination</th>
                    <th className="py-3 px-3 text-right">Qty</th>
                    <th className="py-3 px-3">Dispatch Date</th>
                    <th className="py-3 px-3">Expected ETA</th>
                    <th className="py-3 px-3 text-right">Freight Cost</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3 text-center">Status Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredShipments.map((shp) => (
                    <tr key={shp.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-3 font-mono font-semibold text-blue-600">{shp.id}</td>
                      <td className="py-3 px-3">
                        <div className="font-semibold text-slate-900">{shp.vehicleId || 'MH-12-TR-4020'}</div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {shp.isColdChain ? '❄️ Reefer 2-8°C' : 'Standard Van'}
                        </div>
                      </td>
                      <td className="py-3 px-3 font-medium text-slate-800">{shp.productName}</td>
                      <td className="py-3 px-3 text-slate-600">{shp.sourceWarehouseName}</td>
                      <td className="py-3 px-3 font-semibold text-slate-900">{shp.destinationName}</td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                        {shp.quantity.toLocaleString()}
                      </td>
                      <td className="py-3 px-3 font-mono text-[11px] text-slate-600">
                        {shp.dispatchDate.split('T')[0]}
                      </td>
                      <td className="py-3 px-3 font-mono text-[11px] text-slate-800">
                        {shp.expectedDeliveryDate ? shp.expectedDeliveryDate.split('T')[0] : 'In Transit'}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-slate-700">
                        ₹{(shp.estimatedTransportationCostINR || 0).toLocaleString()}
                      </td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                          shp.status === 'Delivered'
                            ? 'bg-emerald-100 text-emerald-800'
                            : shp.status === 'In Transit'
                            ? 'bg-blue-100 text-blue-800 animate-pulse'
                            : shp.status === 'Dispatched'
                            ? 'bg-indigo-100 text-indigo-800'
                            : shp.status === 'Delayed'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {shp.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        {shp.status === 'Pending' && (
                          <button
                            onClick={() => handleUpdateStatus(shp.id, 'Dispatched')}
                            className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-600 text-white hover:bg-blue-700"
                          >
                            Dispatch
                          </button>
                        )}
                        {shp.status === 'Approved' && (
                          <button
                            onClick={() => handleUpdateStatus(shp.id, 'Dispatched')}
                            className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-600 text-white hover:bg-blue-700"
                          >
                            Dispatch
                          </button>
                        )}
                        {shp.status === 'Dispatched' && (
                          <button
                            onClick={() => handleUpdateStatus(shp.id, 'In Transit')}
                            className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-600 text-white hover:bg-indigo-700"
                          >
                            Mark In Transit
                          </button>
                        )}
                        {shp.status === 'In Transit' && (
                          <button
                            onClick={() => handleUpdateStatus(shp.id, 'Delivered')}
                            className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-600 text-white hover:bg-emerald-700"
                          >
                            Confirm Delivery
                          </button>
                        )}
                        {shp.status === 'Delivered' && (
                          <span className="text-[10px] text-emerald-600 font-bold">✓ Complete</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ROUTE ANALYTICS */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-sm text-slate-900">
                  5.5 Regional Route Efficiency & Cost Matrix
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Distance, transit lead times, freight expense per unit, and lane volume
                </p>
              </div>
            </div>

            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 text-[11px] uppercase font-bold text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-3">Route Link</th>
                    <th className="py-3 px-3">Origin Hub</th>
                    <th className="py-3 px-3">Destination</th>
                    <th className="py-3 px-3">Region</th>
                    <th className="py-3 px-3 text-right">Distance (km)</th>
                    <th className="py-3 px-3 text-right">Lead Time (h)</th>
                    <th className="py-3 px-3 text-right">Std Cost / Unit</th>
                    <th className="py-3 px-3 text-right">Cold-Chain Cost</th>
                    <th className="py-3 px-3 text-right">Shipped Units</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {routeAnalytics.map((r, i) => (
                    <tr key={i} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-3 font-mono font-semibold text-blue-600">{r.routeId}</td>
                      <td className="py-3 px-3 font-medium text-slate-800">{r.source}</td>
                      <td className="py-3 px-3 font-semibold text-slate-900">{r.destination}</td>
                      <td className="py-3 px-3 text-slate-600">{r.region}</td>
                      <td className="py-3 px-3 text-right font-mono">{r.distanceKm} km</td>
                      <td className="py-3 px-3 text-right font-mono">{r.leadTimeHours} hrs</td>
                      <td className="py-3 px-3 text-right font-mono">₹{r.standardCostPerUnit}</td>
                      <td className="py-3 px-3 text-right font-mono text-cyan-600 font-bold">
                        ₹{r.coldChainCostPerUnit}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                        {r.shippedUnits.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: REPORTS & AUDIT */}
      {activeTab === 'reports' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-base text-slate-900">
                  5.8 SahiSupply AI — Operational Audit & Summary Report
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Maharashtra Distribution Network Performance Review • October 24, 2026
                </p>
              </div>
              <button
                onClick={handlePrintReport}
                className="flex items-center gap-1.5 bg-slate-900 hover:bg-black text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-sm transition-all"
              >
                <Printer className="w-4 h-4" />
                <span>Print / Export PDF</span>
              </button>
            </div>

            {/* Printable Content Section */}
            <div className="mt-6 space-y-6 text-xs text-slate-700">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <div className="text-slate-400 font-semibold uppercase text-[10px]">Network Fill Rate</div>
                  <div className="text-xl font-bold text-emerald-600 font-mono mt-0.5">95.9%</div>
                  <div className="text-[10px] text-slate-500">Fulfilled / Total Demand</div>
                </div>
                <div>
                  <div className="text-slate-400 font-semibold uppercase text-[10px]">Total Stock In Hubs</div>
                  <div className="text-xl font-bold text-slate-900 font-mono mt-0.5">384,200 units</div>
                  <div className="text-[10px] text-slate-500">across 5 mega warehouses</div>
                </div>
                <div>
                  <div className="text-slate-400 font-semibold uppercase text-[10px]">Cold-Chain Compliance</div>
                  <div className="text-xl font-bold text-cyan-600 font-mono mt-0.5">100% Verified</div>
                  <div className="text-[10px] text-slate-500">Zero temperature excursions</div>
                </div>
                <div>
                  <div className="text-slate-400 font-semibold uppercase text-[10px]">Regulatory Status</div>
                  <div className="text-xl font-bold text-purple-600 font-mono mt-0.5">GDP Certified</div>
                  <div className="text-[10px] text-slate-500">Traceability audit locked</div>
                </div>
              </div>

              {/* Formula Definitions Documentation (Section 5.7) */}
              <div className="p-4 rounded-xl border border-slate-200 bg-white">
                <h4 className="font-bold text-sm text-slate-900 mb-2">5.7 Verified Supply Chain KPI Formulas</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-slate-600 text-xs">
                  <div className="p-2.5 rounded bg-slate-50 border border-slate-100">
                    <span className="font-semibold text-slate-800">Fill Rate:</span>
                    <p className="font-mono text-blue-600 text-[11px] mt-0.5">
                      Demand Fulfilled / Total Demand × 100 = 95.9%
                    </p>
                  </div>
                  <div className="p-2.5 rounded bg-slate-50 border border-slate-100">
                    <span className="font-semibold text-slate-800">Stockout Rate:</span>
                    <p className="font-mono text-red-600 text-[11px] mt-0.5">
                      Stockout Observations / Total Observations × 100 = 4.1%
                    </p>
                  </div>
                  <div className="p-2.5 rounded bg-slate-50 border border-slate-100">
                    <span className="font-semibold text-slate-800">Perishable Wastage Rate:</span>
                    <p className="font-mono text-amber-600 text-[11px] mt-0.5">
                      Expired Units / Total Available Units × 100 = 1.2%
                    </p>
                  </div>
                  <div className="p-2.5 rounded bg-slate-50 border border-slate-100">
                    <span className="font-semibold text-slate-800">Transportation Cost per Unit:</span>
                    <p className="font-mono text-teal-600 text-[11px] mt-0.5">
                      Total Freight Cost / Units Shipped = ₹18.40 / unit
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
