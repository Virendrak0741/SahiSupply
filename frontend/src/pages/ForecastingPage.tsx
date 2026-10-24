import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Cpu,
  Calendar,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  BarChart2,
  Layers,
  ArrowRight
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, ComposedChart
} from 'recharts';
import { DemandScene3D } from '../components/3d/DemandScene3D';
import { Product, ProductCategory, Destination } from '../types';

interface ForecastingPageProps {
  selectedRegion: string;
  searchQuery: string;
}

export const ForecastingPage: React.FC<ForecastingPageProps> = ({ selectedRegion }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [loading, setLoading] = useState(false);
  const [forecastData, setForecastData] = useState<any>(null);

  // Configuration Controls
  const [selectedProduct, setSelectedProduct] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [forecastHorizon, setForecastHorizon] = useState<number>(7);
  const [forecastModel, setForecastModel] = useState<string>('Exponential Smoothing');
  const [historicalDaysWindow, setHistoricalDaysWindow] = useState<number>(60);
  const [view3D, setView3D] = useState(true);

  const categories: ProductCategory[] = [
    "Dairy Products", "Packaged Foods", "Beverages",
    "Personal Care", "Household Cleaning", "Snacks & Confectionery", "Pharmaceuticals"
  ];

  useEffect(() => {
    fetchInitialData();
  }, [selectedRegion]);

  const fetchInitialData = async () => {
    try {
      const q = selectedRegion !== 'All' ? `?region=${selectedRegion}` : '';
      const [prodRes, destRes] = await Promise.all([
        fetch('/api/inventory/products'),
        fetch(`/api/forecast/destinations${q}`)
      ]);

      const prodJson = await prodRes.json();
      const destJson = await destRes.json();

      if (prodJson.success && prodJson.data.length > 0) {
        setProducts(prodJson.data);
      }
      if (destJson.success) setDestinations(destJson.data);

      // Auto-trigger default forecast run
      executeForecastRun('Exponential Smoothing', 7);
    } catch (err) {
      console.error('Failed to load initial forecasting data:', err);
    }
  };

  const executeForecastRun = async (
    model = forecastModel,
    horizon = forecastHorizon,
    prodId = selectedProduct,
    cat = selectedCategory
  ) => {
    try {
      setLoading(true);
      const res = await fetch('/api/forecast/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: prodId || undefined,
          category: cat || undefined,
          region: selectedRegion !== 'All' ? selectedRegion : undefined,
          horizonDays: horizon,
          model,
          historicalDaysWindow
        })
      });

      const json = await res.json();
      if (json.success) {
        setForecastData(json.data);
      }
    } catch (err) {
      console.error('Forecast calculation error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* 3.1 Forecast Configuration & Control Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              <h2 className="text-base font-bold text-slate-900">AI Predictive Demand Forecasting</h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700">
                90-Day Telemetry
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Configurable time-series algorithms, seasonal indices, and stockout projection dates
            </p>
          </div>

          <button
            onClick={() => executeForecastRun()}
            disabled={loading}
            className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-md shadow-blue-500/20 transition-all disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4" />
            <span>{loading ? 'Calculating Forecast...' : 'Generate AI Forecast'}</span>
          </button>
        </div>

        {/* Configuration Parameter Selectors */}
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
          {/* Horizon Selector */}
          <div>
            <label className="block text-slate-600 font-semibold mb-1">Forecast Horizon</label>
            <select
              value={forecastHorizon}
              onChange={(e) => setForecastHorizon(parseInt(e.target.value, 10))}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-medium text-slate-800 focus:outline-none"
            >
              <option value={7}>7 Days (Operational Replenishment)</option>
              <option value={14}>14 Days (Bi-Weekly Horizon)</option>
              <option value={30}>30 Days (Monthly Production Plan)</option>
              <option value={60}>60 Days (Quarterly Outlook)</option>
            </select>
          </div>

          {/* Model Selector */}
          <div>
            <label className="block text-slate-600 font-semibold mb-1">Forecasting Model</label>
            <select
              value={forecastModel}
              onChange={(e) => setForecastModel(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-medium text-slate-800 focus:outline-none"
            >
              <option value="Exponential Smoothing">Exponential Smoothing (Holt-Winters)</option>
              <option value="Moving Average">Moving Average (7-Day Rolling)</option>
              <option value="Seasonal Forecasting">Seasonal Index (Day-of-Week Weights)</option>
              <option value="Machine Learning Forecast">ML Regression (Trend + Dummies)</option>
            </select>
          </div>

          {/* Product Filter */}
          <div>
            <label className="block text-slate-600 font-semibold mb-1">Focus Product SKU</label>
            <select
              value={selectedProduct}
              onChange={(e) => setSelectedProduct(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-medium text-slate-800 focus:outline-none"
            >
              <option value="">All 26 Products</option>
              {products.map(p => (
                <option key={p.id} value={p.id}>{p.name.slice(0, 32)}</option>
              ))}
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <label className="block text-slate-600 font-semibold mb-1">Category Filter</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-medium text-slate-800 focus:outline-none"
            >
              <option value="">All Categories</option>
              {categories.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Historical Window */}
          <div>
            <label className="block text-slate-600 font-semibold mb-1">Historical Train Window</label>
            <select
              value={historicalDaysWindow}
              onChange={(e) => setHistoricalDaysWindow(parseInt(e.target.value, 10))}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-medium text-slate-800 focus:outline-none"
            >
              <option value={30}>Last 30 Days</option>
              <option value={60}>Last 60 Days (Recommended)</option>
              <option value={90}>Full 90-Day History</option>
            </select>
          </div>
        </div>
      </div>

      {/* 3.7 Holdout Accuracy Cards & AI Insights Banner */}
      {forecastData && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] text-slate-500 font-semibold uppercase">Holdout WAPE</div>
              <div className="text-xl font-bold text-slate-900 font-mono">
                {forecastData.metrics.wape}%
              </div>
              <div className="text-[10px] text-emerald-600 font-medium">Verified Holdout Split</div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-blue-50 text-blue-600">
              <BarChart2 className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] text-slate-500 font-semibold uppercase">MAE / Error Margin</div>
              <div className="text-xl font-bold text-slate-900 font-mono">
                ±{forecastData.metrics.mae} units
              </div>
              <div className="text-[10px] text-slate-400">Mean Absolute Deviation</div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-indigo-50 text-indigo-600">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] text-slate-500 font-semibold uppercase">Cumulative Forecast</div>
              <div className="text-xl font-bold text-indigo-600 font-mono">
                {forecastData.metrics.totalForecastDemand.toLocaleString()}
              </div>
              <div className="text-[10px] text-slate-400">units for {forecastHorizon} days</div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-amber-50 text-amber-600">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] text-slate-500 font-semibold uppercase">Daily Velocity</div>
              <div className="text-xl font-bold text-amber-600 font-mono">
                ~{forecastData.metrics.averageDailyForecast.toLocaleString()}
              </div>
              <div className="text-[10px] text-slate-400">avg daily units pull</div>
            </div>
          </div>
        </div>
      )}

      {/* 3.6 Data-Driven AI Insights */}
      {forecastData && forecastData.insights && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {forecastData.insights.map((ins: any, idx: number) => (
            <div
              key={idx}
              className="bg-gradient-to-r from-blue-50/70 via-indigo-50/40 to-white p-4 rounded-xl border border-blue-200/80 shadow-sm flex gap-3.5"
            >
              <div className="p-2 bg-blue-600 text-white rounded-lg h-fit">
                <Sparkles className="w-4 h-4" />
              </div>
              <div className="space-y-1 text-xs">
                <h4 className="font-bold text-slate-900">{ins.headline}</h4>
                <p className="text-slate-600 text-[11px] leading-relaxed">{ins.description}</p>
                <div className="pt-1.5 flex items-center gap-1.5 font-semibold text-blue-700 text-[11px]">
                  <span>Action:</span>
                  <span>{ins.recommendation}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 3.3 Forecast Visualization Line Chart with Prediction Intervals */}
      {forecastData && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <div className="flex justify-between items-center pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-sm text-slate-900">
                Historical Demand Series & Future Prediction Intervals (95% CI)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Past observations linked seamlessly with forecasted trajectory and uncertainty bands
              </p>
            </div>
            <span className="text-xs font-mono text-slate-400">Model: {forecastModel}</span>
          </div>

          <div className="mt-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={forecastData.chartSeries} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0F172A', borderRadius: '8px', color: '#fff', fontSize: '11px' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                {/* Prediction Interval shaded band */}
                <Area
                  type="monotone"
                  dataKey="upperBound"
                  name="Upper CI Bound"
                  stroke="none"
                  fill="#93C5FD"
                  fillOpacity={0.25}
                />
                <Area
                  type="monotone"
                  dataKey="lowerBound"
                  name="Lower CI Bound"
                  stroke="none"
                  fill="#93C5FD"
                  fillOpacity={0.25}
                />
                {/* Historical line */}
                <Line
                  type="monotone"
                  dataKey="historicalDemand"
                  name="Historical Sales Demand"
                  stroke="#2563EB"
                  strokeWidth={2.5}
                  dot={{ r: 2 }}
                />
                {/* Forecast line */}
                <Line
                  type="monotone"
                  dataKey="forecastDemand"
                  name={`AI Forecast (${forecastHorizon}D)`}
                  stroke="#F59E0B"
                  strokeWidth={2.5}
                  strokeDasharray="4 4"
                  dot={{ r: 3 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* 3.5 3D Demand Column Elevation Scene */}
      {forecastData && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-slate-900">
                  3D Spatial Demand Height Visualization
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                  Interactive Columns
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Column heights scale dynamically with forecast demand pull across Maharashtra retail nodes
              </p>
            </div>

            <div className="flex rounded-lg border border-slate-200 p-0.5 bg-slate-50 text-xs">
              <button
                onClick={() => setView3D(true)}
                className={`px-3 py-1 rounded-md font-semibold ${
                  view3D ? 'bg-white shadow text-blue-600' : 'text-slate-600'
                }`}
              >
                3D Demand Grid
              </button>
              <button
                onClick={() => setView3D(false)}
                className={`px-3 py-1 rounded-md font-semibold ${
                  !view3D ? 'bg-white shadow text-blue-600' : 'text-slate-600'
                }`}
              >
                Hide 3D
              </button>
            </div>
          </div>

          {view3D && (
            <div className="mt-4">
              <DemandScene3D items={forecastData.breakdownTable} />
            </div>
          )}
        </div>
      )}

      {/* 3.4 Demand Forecast & Projected Stockout Table */}
      {forecastData && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <div className="flex justify-between items-center pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-sm text-slate-900">Destination Demand Breakdown & Projected Stockouts</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Identifies locations where projected closing inventory falls below safety-stock margin
              </p>
            </div>
            <span className="text-xs text-slate-400">
              {forecastData.breakdownTable.length} destination-product pairs
            </span>
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-[11px] uppercase font-bold text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="py-3 px-3">Destination Name</th>
                  <th className="py-3 px-3">Product Name</th>
                  <th className="py-3 px-3">Category</th>
                  <th className="py-3 px-3 text-right">Avg Daily</th>
                  <th className="py-3 px-3 text-right">Forecast Demand</th>
                  <th className="py-3 px-3 text-right">Current On-Hand</th>
                  <th className="py-3 px-3 text-right">Safety Stock</th>
                  <th className="py-3 px-3 text-right">Projected Stock</th>
                  <th className="py-3 px-3">Stockout Date</th>
                  <th className="py-3 px-3">Urgency Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {forecastData.breakdownTable.slice(0, 25).map((row: any, i: number) => (
                  <tr key={i} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-3 font-semibold text-slate-900">{row.destinationName}</td>
                    <td className="py-3 px-3 text-slate-800">{row.productName}</td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                        row.isPharma ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {row.category}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right font-mono">{row.averageDailyDemand}</td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-blue-600">
                      {row.forecastDemand.toLocaleString()}
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-slate-600">
                      {row.currentInventory.toLocaleString()}
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-slate-400">
                      {row.safetyStock}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold">
                      <span className={row.projectedClosingStock < 0 ? 'text-red-600' : 'text-emerald-600'}>
                        {row.projectedClosingStock.toLocaleString()}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-mono">
                      {row.stockoutDate ? (
                        <span className="text-red-600 font-bold">{row.stockoutDate}</span>
                      ) : (
                        <span className="text-slate-400">None Projected</span>
                      )}
                    </td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                        row.urgencyStatus === 'Stockout Imminent'
                          ? 'bg-red-100 text-red-700 animate-pulse'
                          : row.urgencyStatus === 'Low Safety Margin'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-emerald-100 text-emerald-700'
                      }`}>
                        {row.urgencyStatus}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
