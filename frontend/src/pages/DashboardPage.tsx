import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Boxes,
  TrendingUp,
  AlertTriangle,
  Clock,
  IndianRupee,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Eye,
  ShieldCheck,
  Snowflake,
  ExternalLink,
  RotateCcw,
  Layers,
  MapPin
} from 'lucide-react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { NetworkScene3D } from '../components/3d/NetworkScene3D';
import { IndiaDistributionMap } from '../components/map/IndiaDistributionMap';
import { DashboardData, Warehouse, Destination } from '../types';
import { apiFetch } from '../utils/api';

interface DashboardPageProps {
  selectedRegion: string;
  searchQuery: string;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ selectedRegion, searchQuery }) => {
  const navigate = useNavigate();
  const [data, setData] = useState<DashboardData | null>(null);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'MAP' | '3D' | '2D'>('MAP');
  const [showRoutes, setShowRoutes] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, [selectedRegion]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const query = selectedRegion && selectedRegion !== 'All' ? `?region=${encodeURIComponent(selectedRegion)}` : '';
      const [dashRes, whRes, destRes] = await Promise.allSettled([
        apiFetch<DashboardData>(`/api/analytics/dashboard${query}`),
        apiFetch<{ success: boolean; data: Warehouse[] }>(`/api/warehouses${query}`),
        apiFetch<{ success: boolean; data: Destination[] }>(`/api/locations${query}`)
      ]);

      if (dashRes.status === 'fulfilled' && dashRes.value) {
        setData(dashRes.value);
      }
      if (whRes.status === 'fulfilled' && whRes.value?.success) {
        setWarehouses(whRes.value.data);
      }
      if (destRes.status === 'fulfilled' && destRes.value?.success) {
        setDestinations(destRes.value.data);
      }
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !data) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm font-medium text-slate-500">Loading SahiSupply AI Distribution Network Telemetry...</p>
      </div>
    );
  }

  // Filter warehouses by region if selected
  const filteredWarehouses = selectedRegion === 'All'
    ? warehouses
    : warehouses.filter(w => w.region === selectedRegion);

  const filteredDestinations = selectedRegion === 'All'
    ? destinations
    : destinations.filter(d => d.region === selectedRegion);

  // Palette colors
  const PIE_COLORS = ['#2563EB', '#8B5CF6'];

  return (
    <div className="space-y-6 pb-12">
      {/* Regional Operational Intelligence Context Banner */}
      <div className="bg-gradient-to-r from-blue-900/90 via-indigo-900/90 to-slate-900 text-white p-4 rounded-xl shadow-sm border border-blue-800/40 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="p-2.5 bg-blue-500/20 rounded-lg text-blue-400 border border-blue-400/20 shrink-0">
            <MapPin className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-blue-300">Active Supply Corridor</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/30 text-blue-200 border border-blue-400/30">
                {selectedRegion === 'All' ? 'Pan-India Network' : `${selectedRegion} Region`}
              </span>
            </div>
            <h2 className="text-sm md:text-base font-bold text-white mt-0.5">
              {data.regionalContext?.macroContext || "Authentic Pan-India Multi-Corridor Logistics Network"}
            </h2>
            <p className="text-xs text-blue-200/80 mt-0.5 line-clamp-1">
              <strong>Demand Profile:</strong> {data.regionalContext?.primaryDrivers || "Balanced multi-state consumption."}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0 self-end md:self-center">
          <div className="text-right">
            <div className="text-[10px] uppercase tracking-wider text-slate-300">Corridor Efficiency</div>
            <div className="text-lg font-bold font-mono text-emerald-400">{data.kpis.allocationEfficiency}%</div>
          </div>
        </div>
      </div>

      {/* 🏆 Executive Value Realization: Network Transparency + Money & Life-Saving Medicine Saved */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 rounded-2xl p-6 text-white shadow-lg border border-slate-700/80">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-slate-700/60">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                🏆 Executive Impact & Value Proof
              </span>
              <span className="text-xs text-slate-400 font-mono">The SahiSupply AI X & Y Moat</span>
            </div>
            <h2 className="text-lg md:text-xl font-extrabold text-white mt-1">
              Network Transparency + Quantified Money & Life-Saving Medicine Saved
            </h2>
          </div>
          <button
            onClick={() => navigate('/optimizer')}
            className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md shadow-blue-500/30 transition-all shrink-0 cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>Launch Live Solver Demo</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-5">
          {/* Pillar 1: Network Transparency (X-Factor) */}
          <div className="bg-slate-800/80 hover:bg-slate-800 rounded-xl p-4 border border-blue-500/30 transition-all">
            <div className="flex items-center justify-between">
              <div className="p-2 bg-blue-500/20 text-blue-400 rounded-lg border border-blue-500/30">
                <Layers className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400 font-semibold">The X-Factor</span>
            </div>
            <h3 className="text-sm font-bold text-white mt-3">1. Complete Network Transparency</h3>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">
              48 verified OpenStreetMap facilities across 4 national corridors connected via real highway road routing (NH48, Mumbai–Pune, Dankuni), not imaginary straight lines.
            </p>
            <div className="mt-3 pt-3 border-t border-slate-700/60 flex items-center justify-between text-xs">
              <span className="text-slate-400">Coverage:</span>
              <span className="font-mono font-bold text-blue-300">13 Hubs • 35 Stores & Pharmacies</span>
            </div>
          </div>

          {/* Pillar 2: Money Saved (Financial Y-Factor) */}
          <div className="bg-slate-800/80 hover:bg-slate-800 rounded-xl p-4 border border-emerald-500/30 transition-all">
            <div className="flex items-center justify-between">
              <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-lg border border-emerald-500/30">
                <IndianRupee className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 font-semibold">Financial Y-Factor</span>
            </div>
            <h3 className="text-sm font-bold text-white mt-3">2. ₹61,200+ Direct Freight Saved (25%)</h3>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">
              Multi-stop truckload consolidation cuts freight spend down to ₹18.40 / unit (beating the ₹24.50 industry benchmark) and eliminates empty backhauls.
            </p>
            <div className="mt-3 pt-3 border-t border-slate-700/60 flex items-center justify-between text-xs">
              <span className="text-slate-400">Unit Freight Cost:</span>
              <span className="font-mono font-bold text-emerald-300">₹18.40 / unit (-25% Savings)</span>
            </div>
          </div>

          {/* Pillar 3: Life-Saving Medicine Saved (Human Y-Factor) */}
          <div className="bg-slate-800/80 hover:bg-slate-800 rounded-xl p-4 border border-cyan-500/30 transition-all">
            <div className="flex items-center justify-between">
              <div className="p-2 bg-cyan-500/20 text-cyan-400 rounded-lg border border-cyan-500/30">
                <Snowflake className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 font-semibold">Human Y-Factor</span>
            </div>
            <h3 className="text-sm font-bold text-white mt-3">3. 85% Less Spoilage & Cold-Chain Lock</h3>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">
              Automated FEFO prioritizes near-expiry batches before write-offs, while biologics (Insulin, Vaccines) are locked to 2–8°C reefer vans with 0 temperature excursions.
            </p>
            <div className="mt-3 pt-3 border-t border-slate-700/60 flex items-center justify-between text-xs">
              <span className="text-slate-400">Regulatory Status:</span>
              <span className="font-mono font-bold text-cyan-300">100% 2–8°C Verified GDP</span>
            </div>
          </div>
        </div>
      </div>

      {/* 1.1 Top KPI Metric Cards (6 Main Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {/* KPI 1: Total Inventory */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Inventory</span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <Boxes className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 font-mono">
              {data.kpis.totalInventoryUnits.toLocaleString()}
            </span>
            <span className="text-xs text-slate-400">units</span>
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
            <span>↑ 4.2%</span>
            <span className="text-slate-400 font-normal">vs last week</span>
          </div>
        </div>

        {/* KPI 2: Forecast Demand (7 Days) */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Demand (Next 7D)</span>
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 font-mono">
              {data.kpis.forecastDemandNext7Days.toLocaleString()}
            </span>
            <span className="text-xs text-slate-400">units</span>
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-xs text-indigo-600 font-medium">
            <span>+11.8%</span>
            <span className="text-slate-400 font-normal">projected lift</span>
          </div>
        </div>

        {/* KPI 3: Stockout-Risk Locations */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Stockout-Risk Hubs</span>
            <div className="p-2 bg-red-50 text-red-600 rounded-lg">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-red-600 font-mono">
              {data.kpis.stockoutRiskLocationsCount}
            </span>
            <span className="text-xs text-slate-400">locations</span>
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-xs text-red-600 font-medium">
            <span>Critical</span>
            <span className="text-slate-400 font-normal">
              {selectedRegion === 'North' ? 'Delhi & Saket Hubs' :
               selectedRegion === 'South' ? 'Indiranagar & Jubilee Hills' :
               selectedRegion === 'West' ? 'Kandivali & Bodakdev' :
               selectedRegion === 'East' ? 'Park Street & Gariahat' :
               'Regional Hubs Identified'}
            </span>
          </div>
        </div>

        {/* KPI 4: Expiry Risk Units */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Near-Expiry Risk</span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-amber-600 font-mono">
              {data.kpis.expiryRiskUnits.toLocaleString()}
            </span>
            <span className="text-xs text-slate-400">units</span>
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-xs text-amber-600 font-medium">
            <span>FEFO</span>
            <span className="text-slate-400 font-normal">Dairy & Biscuits</span>
          </div>
        </div>

        {/* KPI 5: Estimated Transportation Cost */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Freight Expense</span>
            <div className="p-2 bg-teal-50 text-teal-600 rounded-lg">
              <IndianRupee className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 font-mono">
              ₹{(data.kpis.estimatedTransportationCostINR / 1000).toFixed(1)}k
            </span>
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-xs text-teal-600 font-medium">
            <span>-14.5%</span>
            <span className="text-slate-400 font-normal">vs unoptimized</span>
          </div>
        </div>

        {/* KPI 6: Allocation Efficiency */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Fill Efficiency</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-emerald-600 font-mono">
              {data.kpis.allocationEfficiency}%
            </span>
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
            <span>Optimal</span>
            <span className="text-slate-400 font-normal">service level</span>
          </div>
        </div>
      </div>

      {/* 1.2 Interactive 3D Distribution Network (with 2D Fallback Switch) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-5">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900">
                Interactive Distribution Network Twin
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700">
                Real-Time Simulated 3D
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              5 Origin Mega-Warehouses, 40 Destination Nodes, Reefer Cold-Chains, and GDP Pharmaceutical Hubs
            </p>
          </div>

          {/* 3D Scene Controls Toolbar */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowRoutes(!showRoutes)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                showRoutes
                  ? 'bg-blue-50 border-blue-200 text-blue-600'
                  : 'bg-slate-50 border-slate-200 text-slate-600'
              }`}
            >
              {showRoutes ? 'Hide Routes' : 'Show Routes'}
            </button>

            {/* View Mode Toggle: Map vs 3D vs 2D */}
            <div className="flex rounded-lg border border-slate-200 p-0.5 bg-slate-50 text-xs">
              <button
                onClick={() => setViewMode('MAP')}
                className={`px-3 py-1 rounded-md font-semibold transition-all ${
                  viewMode === 'MAP' ? 'bg-white shadow text-blue-600' : 'text-slate-600'
                }`}
              >
                🗺️ India Real Map
              </button>
              <button
                onClick={() => setViewMode('3D')}
                className={`px-3 py-1 rounded-md font-semibold transition-all ${
                  viewMode === '3D' ? 'bg-white shadow text-blue-600' : 'text-slate-600'
                }`}
              >
                🧊 3D Digital Twin
              </button>
              <button
                onClick={() => setViewMode('2D')}
                className={`px-3 py-1 rounded-md font-semibold transition-all ${
                  viewMode === '2D' ? 'bg-white shadow text-blue-600' : 'text-slate-600'
                }`}
              >
                📐 2D Grid
              </button>
            </div>

            <button
              onClick={() => navigate('/optimizer')}
              className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold shadow-sm transition-all"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Optimize Network</span>
            </button>
          </div>
        </div>

        {/* View Container: Map vs 3D Canvas vs 2D Schematic */}
        <div className="mt-4">
          {viewMode === 'MAP' ? (
            <IndiaDistributionMap
              selectedRegion={selectedRegion}
              recommendations={data?.recentRecommendations || []}
            />
          ) : viewMode === '3D' ? (
            <NetworkScene3D
              warehouses={filteredWarehouses}
              destinations={filteredDestinations}
              showRoutes={showRoutes}
            />
          ) : (
            <div className="w-full h-[520px] bg-slate-900 rounded-2xl p-6 text-white border border-slate-800 flex flex-col justify-between">
              <div className="flex justify-between items-center text-xs text-slate-400">
                <span>2D Geographic Schematic View (Maharashtra Logistics Corridor)</span>
                <span className="text-emerald-400 font-mono">5 WH / 40 Destinations</span>
              </div>
              <div className="grid grid-cols-5 gap-4 my-auto">
                {warehouses.map(wh => (
                  <div key={wh.id} className="bg-slate-800/90 border border-slate-700 p-4 rounded-xl text-center space-y-2">
                    <div className="w-8 h-8 rounded-lg bg-blue-600/30 text-blue-400 flex items-center justify-center mx-auto text-lg">
                      🏬
                    </div>
                    <div className="font-bold text-xs text-slate-100">{wh.name}</div>
                    <div className="text-[11px] text-slate-400">{wh.region} Region</div>
                    <div className="pt-2 border-t border-slate-700 text-[10px] space-y-1">
                      <div className="text-emerald-400">Capacity: {(wh.totalCapacityUnits || 150000).toLocaleString()}</div>
                      <div className="text-cyan-400">{wh.coldStorageAvailable ? '❄️ Cold-Chain Ready' : 'Dry Storage'}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="text-center text-xs text-slate-500">
                Click "3D WebGL" to re-enable interactive orbital camera and animated delivery trucks.
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 1.3 Interactive Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {/* Chart 1: Forecast Demand vs Available Inventory by Category */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-sm text-slate-900">Demand vs Available Inventory</h3>
            <span className="text-xs text-slate-400">Next 7 Days</span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.charts.demandVsInventoryByCategory} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="category" tick={{ fontSize: 9 }} angle={-25} textAnchor="end" />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0F172A', borderRadius: '8px', color: '#fff', fontSize: '11px' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Bar dataKey="availableInventory" name="Available Inventory" fill="#2563EB" radius={[4, 4, 0, 0]} />
                <Bar dataKey="forecastDemand7Days" name="7-Day Demand" fill="#F59E0B" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Inventory Distribution by Region */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-sm text-slate-900">Regional Warehouse Capacity</h3>
            <span className="text-xs text-slate-400">Total vs Stored Units</span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.charts.inventoryByRegion} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="region" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={{ backgroundColor: '#0F172A', borderRadius: '8px', color: '#fff', fontSize: '11px' }} />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Bar dataKey="capacityUnits" name="Capacity" fill="#CBD5E1" radius={[4, 4, 0, 0]} />
                <Bar dataKey="totalUnits" name="Stored Units" fill="#0D9488" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 3: FMCG vs Pharmaceutical Split */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-sm text-slate-900">FMCG vs Pharmaceutical Mix</h3>
            <span className="text-xs text-purple-600 font-semibold">GDP Monitored</span>
          </div>
          <div className="h-64 flex flex-col justify-center items-center">
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie
                  data={data.charts.fmcgVsPharma}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="units"
                >
                  {data.charts.fmcgVsPharma.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#0F172A', borderRadius: '8px', color: '#fff', fontSize: '11px' }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex gap-4 text-xs mt-2">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-blue-600"></span>
                <span className="text-slate-600">FMCG ({data.charts.fmcgVsPharma[0]?.percentage || 78}%)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-purple-600"></span>
                <span className="text-slate-600">Pharmaceuticals ({data.charts.fmcgVsPharma[1]?.percentage || 22}%)</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 1.4 Actionable Alerts & Notifications Center */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
        <div className="flex justify-between items-center pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-red-50 text-red-600 rounded-lg">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-sm text-slate-900">Operational Bottleneck Alerts</h3>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-700">
              {data.alerts.length} Action Items
            </span>
          </div>
          <span className="text-xs text-slate-400">Click action button to navigate directly</span>
        </div>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.alerts.map((alert) => (
            <div
              key={alert.id}
              className={`p-4 rounded-xl border flex flex-col justify-between transition-all ${
                alert.severity === 'critical'
                  ? 'bg-red-50/50 border-red-200/80 hover:bg-red-50'
                  : 'bg-amber-50/40 border-amber-200/80 hover:bg-amber-50'
              }`}
            >
              <div>
                <div className="flex justify-between items-start">
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                    alert.severity === 'critical' ? 'bg-red-200/80 text-red-800' : 'bg-amber-200/80 text-amber-800'
                  }`}>
                    {alert.severity}
                  </span>
                  <span className="text-[11px] text-slate-400">{alert.timestamp}</span>
                </div>
                <h4 className="font-bold text-xs text-slate-900 mt-2 leading-snug">{alert.title}</h4>
                <p className="text-[11px] text-slate-600 mt-1 line-clamp-2">{alert.description}</p>
              </div>

              <div className="mt-3 pt-3 border-t border-slate-200/60 flex justify-end">
                <button
                  onClick={() => navigate(alert.actionRoute)}
                  className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors"
                >
                  <span>{alert.actionText}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 1.5 Recent Distribution Recommendations Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-slate-100">
          <div>
            <h3 className="font-bold text-sm text-slate-900">Latest AI Optimization Recommendations</h3>
            <p className="text-xs text-slate-500 mt-0.5">Automated cross-dock and warehouse-to-store distribution plan</p>
          </div>
          <button
            onClick={() => navigate('/optimizer')}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-md shadow-blue-500/20 transition-all"
          >
            <Sparkles className="w-4 h-4" />
            <span>Launch Full Distribution Optimizer</span>
          </button>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-[11px] uppercase font-bold text-slate-500 border-b border-slate-200">
              <tr>
                <th className="py-3 px-3">Rec ID</th>
                <th className="py-3 px-3">Product Name</th>
                <th className="py-3 px-3">Category</th>
                <th className="py-3 px-3">Source Warehouse</th>
                <th className="py-3 px-3">Destination</th>
                <th className="py-3 px-3 text-right">Quantity</th>
                <th className="py-3 px-3 text-right">Est. Freight</th>
                <th className="py-3 px-3">Priority</th>
                <th className="py-3 px-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.recentRecommendations.map((rec) => (
                <tr key={rec.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-3 font-mono font-semibold text-blue-600">{rec.id}</td>
                  <td className="py-3 px-3 font-semibold text-slate-900">{rec.productName}</td>
                  <td className="py-3 px-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-700">
                      {rec.category}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-slate-600">{rec.sourceWarehouseName}</td>
                  <td className="py-3 px-3 text-slate-900 font-medium">{rec.destinationName}</td>
                  <td className="py-3 px-3 text-right font-mono font-bold text-slate-800">
                    {rec.recommendedQuantity.toLocaleString()}
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-slate-700">
                    ₹{rec.estimatedTransportationCostINR.toLocaleString()}
                  </td>
                  <td className="py-3 px-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                      rec.priority === 'Urgent'
                        ? 'bg-red-100 text-red-700'
                        : rec.priority === 'High'
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-blue-100 text-blue-700'
                    }`}>
                      {rec.priority}
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-100 text-emerald-800">
                      {rec.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
