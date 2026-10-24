import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Search,
  Calendar,
  MapPin,
  Bell,
  Sparkles,
  ChevronDown,
  Layers,
  AlertTriangle,
  CheckCircle2,
  RefreshCw
} from 'lucide-react';

interface NavbarProps {
  selectedRegion: string;
  onRegionChange: (region: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  notificationCount?: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  selectedRegion,
  onRegionChange,
  searchQuery,
  onSearchChange,
  notificationCount = 6
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [showNotifications, setShowNotifications] = useState(false);

  // Map route to human title
  const getPageInfo = () => {
    switch (location.pathname) {
      case '/':
        return { title: 'Executive Logistics Dashboard', subtitle: 'Regional FMCG & Pharmaceutical Control Tower' };
      case '/network-map':
        return { title: 'Pan-India Real Geographic Network (OSM)', subtitle: 'Actual Verified Coordinates, Flow Animations & Overpass API' };
      case '/inventory':
        return { title: 'Inventory & Warehouse Operations', subtitle: 'Batch Traceability, FEFO Queues & 3D Racks' };
      case '/forecasting':
        return { title: 'AI Demand Forecasting Engine', subtitle: 'Multi-Horizon Predictive Models & Holdout Evaluation' };
      case '/optimizer':
        return { title: 'AI Multi-Objective Distribution Optimizer', subtitle: 'Constraint Solver & Automated Route Allocation' };
      case '/shipments':
        return { title: 'Shipments, Tracking & Performance Analytics', subtitle: 'Fleet Dispatch, Cold-Chain Telemetry & KPI Reports' };
      case '/database':
        return { title: 'Database Collections & Schema Inspector', subtitle: 'PostgreSQL DDL, Mongoose Schemas & JSON Dataset Dumps' };
      case '/settings':
        return { title: 'Optimization Settings & Model Assumptions', subtitle: 'Algorithmic Weights, Penalty Rates & Audit Trails' };
      default:
        return { title: 'SahiSupply AI', subtitle: 'Distribution Intelligence' };
    }
  };

  const pageInfo = getPageInfo();

  const alerts = [
    { title: 'Milk Shortage in Kolhapur', desc: 'Forecast exceeds available stock by 640 units', time: '12m ago', route: '/optimizer', urgent: true },
    { title: 'Greek Yogurt 6-Day Expiry in Pune', desc: 'FEFO dispatch urgently recommended', time: '45m ago', route: '/inventory', urgent: true },
    { title: 'Reefer Van MH-12-KQ-4019 in Transit', desc: '4.1°C inside cold envelope • Satara bypass', time: '15m ago', route: '/shipments', urgent: false },
    { title: 'Bhiwandi Hub 86% Utilization', desc: 'Soft capacity limit approaching', time: '2h ago', route: '/inventory', urgent: false }
  ];

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between shrink-0 shadow-sm z-30">
      {/* Page Title & Breadcrumbs */}
      <div>
        <h1 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
          {pageInfo.title}
        </h1>
        <p className="text-xs text-slate-500 font-normal">{pageInfo.subtitle}</p>
      </div>

      {/* Center & Right Controls */}
      <div className="flex items-center gap-3">
        {/* Global Search Input */}
        <div className="relative w-64 hidden md:block">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search SKU, batch, warehouse..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
          />
        </div>

        {/* Region Filter Selector */}
        <div className="relative">
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-700">
            <MapPin className="w-3.5 h-3.5 text-blue-600" />
            <select
              value={selectedRegion}
              onChange={(e) => onRegionChange(e.target.value)}
              className="bg-transparent text-xs font-semibold text-slate-800 focus:outline-none cursor-pointer"
            >
              <option value="All">🇮🇳 All India (National Network)</option>
              <option value="North">🏔️ North Region (Delhi-NCR / Haryana / UP)</option>
              <option value="West">🌊 West Region (Mumbai / Pune / Gujarat)</option>
              <option value="South">🌴 South Region (Bengaluru / Hyderabad / Chennai)</option>
              <option value="East">🌅 East Region (Kolkata / West Bengal)</option>
            </select>
          </div>
        </div>

        {/* Date Selector Badge */}
        <div className="hidden lg:flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg text-xs text-slate-600 font-mono">
          <Calendar className="w-3.5 h-3.5 text-slate-500" />
          <span>Oct 24, 2026</span>
        </div>

        {/* Prominent Quick "Run AI Optimization" Action Button */}
        {location.pathname !== '/optimizer' && (
          <button
            onClick={() => navigate('/optimizer')}
            className="hidden sm:flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold shadow-md shadow-blue-500/20 transition-all"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Run AI Optimizer</span>
          </button>
        )}

        {/* Actionable Notification Center */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            title="Notifications & Alerts"
          >
            <Bell className="w-4 h-4" />
            {notificationCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-600 animate-pulse"></span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-2xl border border-slate-200 p-3 z-50 text-xs animate-in fade-in duration-150">
              <div className="flex justify-between items-center pb-2 border-b border-slate-100 font-bold text-slate-800">
                <span className="flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                  Active Operational Alerts ({alerts.length})
                </span>
                <span className="text-[10px] text-blue-600 cursor-pointer hover:underline" onClick={() => setShowNotifications(false)}>
                  Close
                </span>
              </div>
              <div className="mt-2 space-y-2 max-h-72 overflow-y-auto">
                {alerts.map((a, i) => (
                  <div
                    key={i}
                    onClick={() => {
                      setShowNotifications(false);
                      navigate(a.route);
                    }}
                    className={`p-2 rounded-lg cursor-pointer transition-colors border ${
                      a.urgent ? 'bg-red-50/70 border-red-200/80 hover:bg-red-100/70' : 'bg-slate-50 border-slate-200/70 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex justify-between font-semibold text-slate-900">
                      <span>{a.title}</span>
                      <span className="text-[10px] text-slate-400 font-normal">{a.time}</span>
                    </div>
                    <p className="text-[11px] text-slate-600 mt-0.5">{a.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
