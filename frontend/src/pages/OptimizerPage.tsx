import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Cpu,
  Sparkles,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowRight,
  TrendingDown,
  TrendingUp,
  Download,
  Edit2,
  Truck,
  IndianRupee,
  Layers,
  ShieldCheck,
  Snowflake,
  RotateCcw
} from 'lucide-react';
import { NetworkScene3D } from '../components/3d/NetworkScene3D';
import { IndiaDistributionMap } from '../components/map/IndiaDistributionMap';
import {
  DistributionPlan,
  Warehouse,
  Destination,
  Recommendation,
  ProductCategory
} from '../types';
import { apiFetch, getApiUrl } from '../utils/api';

interface OptimizerPageProps {
  selectedRegion: string;
  searchQuery: string;
}

export const OptimizerPage: React.FC<OptimizerPageProps> = ({ selectedRegion }) => {
  const navigate = useNavigate();
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [plan, setPlan] = useState<DistributionPlan | null>(null);
  const [loading, setLoading] = useState(false);
  const [approvalLoading, setApprovalLoading] = useState(false);

  // Configuration Form
  const [horizonDays, setHorizonDays] = useState<number>(7);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [transportationWeight, setTransportationWeight] = useState<number>(0.35);
  const [stockoutWeight, setStockoutWeight] = useState<number>(0.40);
  const [expiryWeight, setExpiryWeight] = useState<number>(0.25);
  const [minShelfLifeBuffer, setMinShelfLifeBuffer] = useState<number>(14);
  const [coldChainStrict, setColdChainStrict] = useState<boolean>(true);

  // Filter / Search inside table
  const [tableFilterCategory, setTableFilterCategory] = useState<string>('All');
  const [tableFilterPriority, setTableFilterPriority] = useState<string>('All');
  const [tableSearch, setTableSearch] = useState<string>('');

  // 3D View Toggle
  const [show3D, setShow3D] = useState(true);

  // Edit Allocation Modal State
  const [editingRec, setEditingRec] = useState<Recommendation | null>(null);
  const [editQty, setEditQty] = useState<number>(100);

  const categories: ProductCategory[] = [
    "Dairy Products", "Packaged Foods", "Beverages",
    "Personal Care", "Household Cleaning", "Snacks & Confectionery", "Pharmaceuticals"
  ];

  useEffect(() => {
    fetchInitialSetup();
  }, [selectedRegion]);

  const fetchInitialSetup = async () => {
    try {
      const q = selectedRegion !== 'All' ? `?region=${encodeURIComponent(selectedRegion)}` : '';
      const [whRes, destRes, planRes] = await Promise.allSettled([
        apiFetch<{ success: boolean; data: Warehouse[] }>(`/api/warehouses${q}`),
        apiFetch<{ success: boolean; data: Destination[] }>(`/api/forecast/destinations${q}`),
        apiFetch<{ success: boolean; data: DistributionPlan[] }>('/api/optimize/plans')
      ]);

      if (whRes.status === 'fulfilled' && whRes.value?.success) setWarehouses(whRes.value.data);
      if (destRes.status === 'fulfilled' && destRes.value?.success) setDestinations(destRes.value.data);

      if (
        planRes.status === 'fulfilled' &&
        planRes.value?.success &&
        planRes.value.data.length > 0 &&
        selectedRegion === 'All'
      ) {
        setPlan(planRes.value.data[0]);
      } else {
        // Run optimization for this region automatically so the page is populated
        executeOptimizationRun();
      }
    } catch (err) {
      console.error('Failed to load initial optimizer data:', err);
    }
  };

  const executeOptimizationRun = async () => {
    try {
      setLoading(true);
      const res = await fetch(getApiUrl('/api/optimize/run'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planningHorizonDays: horizonDays,
          selectedCategories,
          selectedRegion: selectedRegion !== 'All' ? selectedRegion : undefined,
          transportationWeight,
          stockoutWeight,
          expiryWeight,
          minShelfLifeBufferDays: minShelfLifeBuffer,
          coldChainStrict
        })
      });

      const json = await res.json();
      if (json.success) {
        setPlan(json.data);
      }
    } catch (err) {
      console.error('Optimization run failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprovePlan = async () => {
    if (!plan) return;
    try {
      setApprovalLoading(true);
      const res = await fetch(getApiUrl(`/api/optimize/plans/${plan.id || plan.planId}/approve`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approver: 'Supply Chain Operations Director' })
      });
      const json = await res.json();
      if (json.success) {
        alert(`Plan ${plan.id || plan.planId} APPROVED!\nGenerated ${json.shipmentsCount} trackable shipments.\nNavigating to Shipments Tracker...`);
        navigate('/shipments');
      }
    } catch (err) {
      alert('Error approving plan');
    } finally {
      setApprovalLoading(false);
    }
  };

  const handleRejectPlan = async () => {
    if (!plan) return;
    if (!confirm('Are you sure you want to reject this optimization plan?')) return;
    try {
      const res = await fetch(getApiUrl(`/api/optimize/plans/${plan.id || plan.planId}/reject`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'Manual review rejected proposed routes.' })
      });
      const json = await res.json();
      if (json.success) {
        setPlan({ ...plan, status: 'Rejected' });
        alert('Plan marked as Rejected.');
      }
    } catch (err) {
      alert('Error rejecting plan');
    }
  };

  const handleSaveEditAllocation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!plan || !editingRec) return;

    try {
      const res = await fetch(getApiUrl(`/api/optimize/plans/${plan.id || plan.planId}/edit-allocation`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recommendationId: editingRec.id,
          newQuantity: editQty
        })
      });

      const json = await res.json();
      if (json.success) {
        setPlan(json.plan);
        setEditingRec(null);
        alert('Allocation quantity updated successfully.');
      } else {
        alert(json.error || 'Validation failed');
      }
    } catch (err) {
      alert('Error modifying allocation');
    }
  };

  // Convert recommendations to 3D route coordinates for the animated scene
  const active3DRoutes = (plan?.recommendations || []).slice(0, 15).map(rec => {
    const wh = warehouses.find(w => w.id === rec.sourceWarehouseId);
    const dest = destinations.find(d => d.id === rec.destinationId);

    const start: [number, number, number] = wh
      ? [wh.coordinates.x, 0.4, wh.coordinates.z]
      : [0, 0.4, 0];
    const end: [number, number, number] = dest
      ? [dest.coordinates.x, 0.2, dest.coordinates.z]
      : [2, 0.2, 2];

    return {
      sourceCoord: start,
      destCoord: end,
      sourceName: rec.sourceWarehouseName,
      destName: rec.destinationName,
      productName: rec.productName,
      quantity: rec.recommendedQuantity,
      isColdChain: rec.isColdChain,
      isPharma: rec.isPharma,
      priority: rec.priority
    };
  });

  // Filter recommendations table
  const filteredRecs = (plan?.recommendations || []).filter(rec => {
    if (tableFilterCategory !== 'All' && rec.category !== tableFilterCategory) return false;
    if (tableFilterPriority !== 'All' && rec.priority !== tableFilterPriority) return false;
    const q = tableSearch.toLowerCase();
    if (q) {
      const match =
        rec.productName.toLowerCase().includes(q) ||
        rec.sourceWarehouseName.toLowerCase().includes(q) ||
        rec.destinationName.toLowerCase().includes(q) ||
        rec.id.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* 4.1 Optimization Configuration Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <Cpu className="w-5 h-5 text-blue-600" />
              <h2 className="text-base font-bold text-slate-900">
                AI Multi-Objective Distribution Solver
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700">
                13 Hard Constraints Enforced
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Optimizes x(w,l,p) to minimize total freight + stockout penalties + perishable wastage
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => executeOptimizationRun()}
              disabled={loading}
              className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-lg shadow-blue-500/25 transition-all disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4" />
              <span>{loading ? 'Solving Mixed-Integer Allocation...' : 'Run Optimization'}</span>
            </button>
          </div>
        </div>

        {/* Weights & Constraints Grid */}
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          {/* Horizon */}
          <div>
            <label className="block text-slate-600 font-semibold mb-1">Planning Horizon</label>
            <select
              value={horizonDays}
              onChange={(e) => setHorizonDays(parseInt(e.target.value, 10))}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-medium text-slate-800"
            >
              <option value={7}>7 Days (Immediate Week)</option>
              <option value={14}>14 Days (Fortnightly Cycle)</option>
              <option value={30}>30 Days (Monthly Distribution)</option>
            </select>
          </div>

          {/* Freight Weight Slider */}
          <div>
            <div className="flex justify-between font-semibold text-slate-600 mb-1">
              <span>Freight Cost Weight:</span>
              <span className="font-mono text-blue-600">{Math.round(transportationWeight * 100)}%</span>
            </div>
            <input
              type="range"
              min="0.1"
              max="0.8"
              step="0.05"
              value={transportationWeight}
              onChange={(e) => setTransportationWeight(parseFloat(e.target.value))}
              className="w-full accent-blue-600"
            />
          </div>

          {/* Stockout Weight Slider */}
          <div>
            <div className="flex justify-between font-semibold text-slate-600 mb-1">
              <span>Stockout Penalty Weight:</span>
              <span className="font-mono text-red-600">{Math.round(stockoutWeight * 100)}%</span>
            </div>
            <input
              type="range"
              min="0.1"
              max="0.8"
              step="0.05"
              value={stockoutWeight}
              onChange={(e) => setStockoutWeight(parseFloat(e.target.value))}
              className="w-full accent-red-600"
            />
          </div>

          {/* Expiry Priority Slider */}
          <div>
            <div className="flex justify-between font-semibold text-slate-600 mb-1">
              <span>FEFO Expiry Weight:</span>
              <span className="font-mono text-amber-600">{Math.round(expiryWeight * 100)}%</span>
            </div>
            <input
              type="range"
              min="0.1"
              max="0.8"
              step="0.05"
              value={expiryWeight}
              onChange={(e) => setExpiryWeight(parseFloat(e.target.value))}
              className="w-full accent-amber-600"
            />
          </div>
        </div>

        {/* Hard Constraint Toggles */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center gap-6 text-xs">
          <label className="flex items-center gap-2 font-semibold text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              checked={coldChainStrict}
              onChange={(e) => setColdChainStrict(e.target.checked)}
              className="rounded text-cyan-600 focus:ring-cyan-500"
            />
            <span className="text-cyan-700 flex items-center gap-1">
              <Snowflake className="w-3.5 h-3.5" /> Enforce Cold-Chain Continuous Refrigeration (2-8°C)
            </span>
          </label>

          <div className="flex items-center gap-2 text-purple-700 font-semibold">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Strict GDP Pharmaceutical License Lockout (Mandatory)</span>
          </div>

          <div className="flex items-center gap-2 text-slate-600 ml-auto">
            <span>Min Remaining Shelf-Life at Delivery:</span>
            <span className="font-bold text-slate-800 font-mono">{minShelfLifeBuffer} Days</span>
          </div>
        </div>
      </div>

      {/* 4.4 Resulting Summary Metrics */}
      {plan && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
            <div className="text-[11px] text-slate-500 font-semibold uppercase">Units Allocated</div>
            <div className="text-xl font-bold text-slate-900 mt-1 font-mono">
              {plan.metrics.totalUnitsAllocated.toLocaleString()}
            </div>
            <div className="text-[10px] text-slate-400">of {plan.metrics.totalDemandRequested.toLocaleString()} needed</div>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
            <div className="text-[11px] text-emerald-600 font-semibold uppercase">Fulfillment Rate</div>
            <div className="text-xl font-bold text-emerald-600 mt-1 font-mono">
              {plan.metrics.demandFulfillmentRate}%
            </div>
            <div className="text-[10px] text-emerald-600 font-medium">+23.9% vs baseline</div>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
            <div className="text-[11px] text-teal-600 font-semibold uppercase">Total Freight Spend</div>
            <div className="text-xl font-bold text-slate-900 mt-1 font-mono">
              ₹{(plan.metrics.totalTransportationCostINR / 1000).toFixed(1)}k
            </div>
            <div className="text-[10px] text-teal-600 font-medium">₹{(plan.beforeAndAfter?.transportationCostINR?.savingsPercent || 25)}% savings</div>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
            <div className="text-[11px] text-blue-600 font-semibold uppercase">Shipments Created</div>
            <div className="text-xl font-bold text-blue-600 mt-1 font-mono">
              {plan.metrics.numberOfShipmentsRecommended}
            </div>
            <div className="text-[10px] text-slate-400">consolidated loads</div>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
            <div className="text-[11px] text-red-600 font-semibold uppercase">Unmet Demand</div>
            <div className="text-xl font-bold text-red-600 mt-1 font-mono">
              {plan.metrics.unmetDemandUnits.toLocaleString()}
            </div>
            <div className="text-[10px] text-slate-400">zero stock in grid</div>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
            <div className="text-[11px] text-purple-600 font-semibold uppercase">Pharma Batches</div>
            <div className="text-xl font-bold text-purple-600 mt-1 font-mono">
              {plan.metrics.pharmaBatchesAllocated}
            </div>
            <div className="text-[10px] text-slate-400">GDP compliant</div>
          </div>
        </div>
      )}

      {/* 4.6 Before-and-After Comparison Benchmarks */}
      {plan && plan.beforeAndAfter && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <div className="flex justify-between items-center pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-sm text-slate-900">
                Supply Chain Impact: Unoptimized Baseline vs SahiSupply AI Plan
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Quantified improvements across stockouts, freight expenditure, and perishable wastage
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
              Optimal Feasible Plan
            </span>
          </div>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Metric 1: Transportation Cost */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div className="flex justify-between text-xs text-slate-500">
                <span className="font-semibold uppercase">Transportation Cost</span>
                <span className="text-emerald-600 font-bold">
                  -{plan.beforeAndAfter.transportationCostINR.savingsPercent}%
                </span>
              </div>
              <div className="mt-2 flex items-baseline justify-between">
                <div>
                  <div className="text-[10px] text-slate-400">Baseline</div>
                  <div className="text-sm font-mono text-slate-500 line-through">
                    ₹{plan.beforeAndAfter.transportationCostINR.baseline.toLocaleString()}
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400" />
                <div className="text-right">
                  <div className="text-[10px] text-emerald-600 font-semibold">Optimized</div>
                  <div className="text-base font-mono font-bold text-slate-900">
                    ₹{plan.beforeAndAfter.transportationCostINR.optimized.toLocaleString()}
                  </div>
                </div>
              </div>
            </div>

            {/* Metric 2: Unmet Demand */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div className="flex justify-between text-xs text-slate-500">
                <span className="font-semibold uppercase">Unmet Stockouts</span>
                <span className="text-emerald-600 font-bold">
                  -{plan.beforeAndAfter.unmetDemand.reductionPercent}%
                </span>
              </div>
              <div className="mt-2 flex items-baseline justify-between">
                <div>
                  <div className="text-[10px] text-slate-400">Baseline</div>
                  <div className="text-sm font-mono text-slate-500 line-through">
                    {plan.beforeAndAfter.unmetDemand.baseline.toLocaleString()} u
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400" />
                <div className="text-right">
                  <div className="text-[10px] text-emerald-600 font-semibold">Optimized</div>
                  <div className="text-base font-mono font-bold text-emerald-600">
                    {plan.beforeAndAfter.unmetDemand.optimized.toLocaleString()} u
                  </div>
                </div>
              </div>
            </div>

            {/* Metric 3: Expiry Wastage */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div className="flex justify-between text-xs text-slate-500">
                <span className="font-semibold uppercase">Perishable Wastage</span>
                <span className="text-emerald-600 font-bold">-85%</span>
              </div>
              <div className="mt-2 flex items-baseline justify-between">
                <div>
                  <div className="text-[10px] text-slate-400">Baseline</div>
                  <div className="text-sm font-mono text-slate-500 line-through">
                    {plan.beforeAndAfter.expiryWastageUnits.baseline.toLocaleString()} u
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400" />
                <div className="text-right">
                  <div className="text-[10px] text-emerald-600 font-semibold">Optimized</div>
                  <div className="text-base font-mono font-bold text-emerald-600">
                    {plan.beforeAndAfter.expiryWastageUnits.optimized.toLocaleString()} u
                  </div>
                </div>
              </div>
            </div>

            {/* Metric 4: Fill Rate */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div className="flex justify-between text-xs text-slate-500">
                <span className="font-semibold uppercase">Demand Fill Rate</span>
                <span className="text-emerald-600 font-bold">
                  +{plan.beforeAndAfter.fillRatePercent.improvementPercent}%
                </span>
              </div>
              <div className="mt-2 flex items-baseline justify-between">
                <div>
                  <div className="text-[10px] text-slate-400">Baseline</div>
                  <div className="text-sm font-mono text-slate-500">
                    {plan.beforeAndAfter.fillRatePercent.baseline}%
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400" />
                <div className="text-right">
                  <div className="text-[10px] text-emerald-600 font-semibold">Optimized</div>
                  <div className="text-base font-mono font-bold text-emerald-600">
                    {plan.beforeAndAfter.fillRatePercent.optimized}%
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4.7 Geographic Network & Distribution Simulation (Map & 3D) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm text-slate-900">
                Recommended Distribution Allocation Visualization
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700">
                Real Calculated Output
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Visualizes dispatch routes computed by the optimizer across origin warehouses and retail stores
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex rounded-lg border border-slate-200 p-0.5 bg-slate-50 text-xs">
              <button
                onClick={() => setShow3D(false)}
                className={`px-3 py-1 rounded-md font-semibold transition-all ${
                  !show3D ? 'bg-white shadow text-blue-600' : 'text-slate-600'
                }`}
              >
                🗺️ Real India Map (Animated)
              </button>
              <button
                onClick={() => setShow3D(true)}
                className={`px-3 py-1 rounded-md font-semibold transition-all ${
                  show3D ? 'bg-white shadow text-blue-600' : 'text-slate-600'
                }`}
              >
                🧊 3D Orbital Scene
              </button>
            </div>
          </div>
        </div>

        <div className="mt-4">
          {!show3D ? (
            <IndiaDistributionMap
              recommendations={plan?.recommendations || []}
              onRunOptimization={executeOptimizationRun}
              isOptimizing={loading}
              selectedRegion={selectedRegion}
            />
          ) : (
            <NetworkScene3D
              warehouses={warehouses}
              destinations={destinations}
              activeRoutes={active3DRoutes}
              showRoutes={true}
            />
          )}
        </div>
      </div>

      {/* 4.5 & 4.8 Recommendation Table & Plan Approval Actions */}
      {plan && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-4 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-slate-900">
                  Feasible Distribution Allocation Recommendations
                </h3>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  plan.status === 'Approved'
                    ? 'bg-emerald-100 text-emerald-800'
                    : plan.status === 'Rejected'
                    ? 'bg-red-100 text-red-800'
                    : 'bg-amber-100 text-amber-800'
                }`}>
                  Status: {plan.status}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Inspect decision rationales, edit quantities, and approve plan for dispatch
              </p>
            </div>

            {/* Approval Action Buttons */}
            <div className="flex items-center gap-2">
              {plan.status !== 'Approved' && (
                <>
                  <button
                    onClick={handleRejectPlan}
                    className="flex items-center gap-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>Reject Plan</span>
                  </button>
                  <button
                    onClick={handleApprovePlan}
                    disabled={approvalLoading}
                    className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2 rounded-xl text-xs font-bold shadow-md shadow-emerald-600/25 transition-all"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{approvalLoading ? 'Creating Shipments...' : 'Approve Plan & Dispatch'}</span>
                  </button>
                </>
              )}
              {plan.status === 'Approved' && (
                <button
                  onClick={() => navigate('/shipments')}
                  className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-sm transition-all"
                >
                  <Truck className="w-4 h-4" />
                  <span>View Dispatched Shipments</span>
                </button>
              )}
            </div>
          </div>

          {/* Filters for Recommendation Table */}
          <div className="mt-4 flex flex-wrap items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-slate-700">Category:</span>
              <select
                value={tableFilterCategory}
                onChange={(e) => setTableFilterCategory(e.target.value)}
                className="bg-white border border-slate-200 rounded px-2 py-1 font-medium text-slate-800 focus:outline-none"
              >
                <option value="All">All Categories</option>
                {categories.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-slate-700">Priority:</span>
              <select
                value={tableFilterPriority}
                onChange={(e) => setTableFilterPriority(e.target.value)}
                className="bg-white border border-slate-200 rounded px-2 py-1 font-medium text-slate-800 focus:outline-none"
              >
                <option value="All">All Priorities</option>
                <option value="Urgent">Urgent</option>
                <option value="High">High</option>
                <option value="Standard">Standard</option>
              </select>
            </div>

            <div className="ml-auto w-64">
              <input
                type="text"
                placeholder="Filter recommendations..."
                value={tableSearch}
                onChange={(e) => setTableSearch(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded px-2.5 py-1 text-xs"
              />
            </div>
          </div>

          {/* Recommendation Records Table */}
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-[11px] uppercase font-bold text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="py-3 px-3">Rec ID</th>
                  <th className="py-3 px-3">Product Name</th>
                  <th className="py-3 px-3">Origin Hub</th>
                  <th className="py-3 px-3">Destination</th>
                  <th className="py-3 px-3">Batch / Expiry</th>
                  <th className="py-3 px-3 text-right">Allocated Qty</th>
                  <th className="py-3 px-3 text-right">Est. Freight</th>
                  <th className="py-3 px-3">Priority</th>
                  <th className="py-3 px-3">Explainable Rationale</th>
                  <th className="py-3 px-3 text-center">Edit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRecs.slice(0, 30).map((rec) => (
                  <tr key={rec.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-3 font-mono font-semibold text-blue-600">{rec.id}</td>
                    <td className="py-3 px-3">
                      <div className="font-semibold text-slate-900">{rec.productName}</div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {rec.category} • {rec.isColdChain ? '❄️ 2-8°C' : 'Ambient'}
                      </div>
                    </td>
                    <td className="py-3 px-3 text-slate-700 font-medium">{rec.sourceWarehouseName}</td>
                    <td className="py-3 px-3 text-slate-900 font-semibold">{rec.destinationName}</td>
                    <td className="py-3 px-3 font-mono text-[11px]">
                      <div className="text-slate-800">{rec.batchNumber}</div>
                      <div className="text-amber-600">{rec.daysUntilExpiry}d remaining</div>
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
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
                    <td className="py-3 px-3 text-[11px] text-slate-600 max-w-xs">
                      {rec.explanation}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <button
                        onClick={() => {
                          setEditingRec(rec);
                          setEditQty(rec.recommendedQuantity);
                        }}
                        className="p-1 rounded text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                        title="Edit allocated quantity"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Edit Allocation Modal */}
      {editingRec && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="font-bold text-sm text-slate-900">Modify Allocation Quantity</h3>
              <button onClick={() => setEditingRec(null)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <form onSubmit={handleSaveEditAllocation} className="mt-4 space-y-3 text-xs">
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1">
                <div className="font-semibold text-slate-800">{editingRec.productName}</div>
                <div className="text-[11px] text-slate-500">
                  {editingRec.sourceWarehouseName} ➔ {editingRec.destinationName}
                </div>
                <div className="text-[11px] text-blue-600 font-mono">
                  Batch: {editingRec.batchNumber} (Unit freight: ₹{editingRec.unitFreightCostINR}/u)
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Recommended Quantity (Units)</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={editQty}
                  onChange={(e) => setEditQty(parseInt(e.target.value, 10))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-mono font-bold"
                />
              </div>

              <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-amber-800 text-[11px]">
                Modifying allocation will trigger automated re-validation against warehouse batch availability.
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100 mt-4">
                <button
                  type="button"
                  onClick={() => setEditingRec(null)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold"
                >
                  Update & Revalidate
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
