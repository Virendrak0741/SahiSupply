import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Boxes,
  TrendingUp,
  Cpu,
  Truck,
  FileBarChart2,
  Settings,
  ShieldCheck,
  Snowflake,
  ExternalLink,
  MapPin
} from 'lucide-react';

interface SidebarProps {
  className?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({ className = '' }) => {
  const navItems = [
    {
      to: '/',
      label: 'Executive Dashboard',
      icon: LayoutDashboard,
      badge: null
    },
    {
      to: '/network-map',
      label: 'India Real Map',
      icon: MapPin,
      badge: 'Live OSM'
    },
    {
      to: '/inventory',
      label: 'Inventory & Warehouses',
      icon: Boxes,
      badge: '5 Hubs'
    },
    {
      to: '/forecasting',
      label: 'Demand Forecasting',
      icon: TrendingUp,
      badge: 'AI'
    },
    {
      to: '/optimizer',
      label: 'Distribution Optimizer',
      icon: Cpu,
      badge: 'Core'
    },
    {
      to: '/shipments',
      label: 'Shipments & Reports',
      icon: Truck,
      badge: 'Live'
    },
    {
      to: '/database',
      label: 'Database & Schemas',
      icon: Boxes,
      badge: 'JSON/SQL'
    },
    {
      to: '/settings',
      label: 'Settings & Model',
      icon: Settings,
      badge: null
    }
  ];

  return (
    <aside className={`w-64 bg-navy-900 border-r border-slate-800 flex flex-col shrink-0 text-white select-none ${className}`}>
      {/* Brand Header */}
      <div className="h-16 px-5 flex items-center gap-3 border-b border-slate-800/80 bg-slate-950/40">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-teal-500 flex items-center justify-center shadow-lg shadow-blue-500/20 text-white">
          <Boxes className="w-5 h-5 text-white" />
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-base tracking-tight text-white">SahiSupply</span>
            <span className="px-1.5 py-0.2 rounded text-[10px] font-extrabold bg-blue-500/20 text-blue-400 border border-blue-500/30">
              AI
            </span>
          </div>
          <p className="text-[10px] text-slate-400 font-medium">Distribution Intelligence</p>
        </div>
      </div>

      {/* Network Status Badge */}
      <div className="px-4 py-3 border-b border-slate-800/60 bg-slate-900/40">
        <div className="flex items-center justify-between text-xs">
          <span className="flex items-center gap-2 text-slate-300">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            Maharashtra Grid
          </span>
          <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-800/40">
            OPTIMAL
          </span>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
          Supply Chain Platform
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/25 font-semibold'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
                }`
              }
            >
              <div className="flex items-center gap-3">
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${
                  item.badge === 'Core'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    : 'bg-slate-800 text-slate-300'
                }`}>
                  {item.badge}
                </span>
              )}
            </NavLink>
          );
        })}

        {/* Feature Highlights Section */}
        <div className="pt-6 px-3 pb-2 text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
          Specialized Engines
        </div>
        <div className="px-3 py-2 rounded-xl bg-slate-950/40 border border-slate-800/80 space-y-2 text-xs">
          <div className="flex items-center gap-2 text-purple-300 font-medium text-[11px]">
            <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
            <span>Pharma GDP Traceability</span>
          </div>
          <div className="flex items-center gap-2 text-cyan-300 font-medium text-[11px]">
            <Snowflake className="w-3.5 h-3.5 text-cyan-400" />
            <span>2-8°C Cold Chain Protocol</span>
          </div>
        </div>
      </nav>

      {/* Footer Profile & Version */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/60">
        <div className="flex items-center gap-3 p-2 rounded-lg bg-slate-900/60 border border-slate-800/80">
          <div className="w-7 h-7 rounded-full bg-blue-500/20 border border-blue-400/40 flex items-center justify-center text-blue-400 font-bold text-xs">
            SC
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-slate-200 truncate">Supply Chain Admin</p>
            <p className="text-[10px] text-slate-400 truncate">FMCG & Pharma Ops</p>
          </div>
        </div>
        <div className="mt-2 text-center text-[10px] text-slate-500">
          SahiSupply AI v1.0.0 • Hackathon Demo
        </div>
      </div>
    </aside>
  );
};
