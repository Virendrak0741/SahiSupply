import React, { useState, useEffect } from 'react';
import {
  Settings,
  ShieldCheck,
  Save,
  RotateCcw,
  CheckCircle2,
  FileText,
  AlertCircle
} from 'lucide-react';
import { apiFetch, getApiUrl } from '../utils/api';

export const SettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<any>(null);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const json = await apiFetch<any>('/api/settings');
      if (json && json.success) {
        setSettings(json.settings);
        setAuditLogs(json.auditLogs || []);
      }
    } catch (err) {
      console.error('Failed to load settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      const res = await fetch(getApiUrl('/api/settings'), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });
      const json = await res.json();
      if (json.success) {
        alert('Optimization model parameters updated successfully!');
      }
    } catch (err) {
      alert('Error updating settings');
    } finally {
      setSaving(false);
    }
  };

  const handleResetData = async () => {
    if (!confirm('Are you sure you want to reseed the entire SahiSupply database with fresh initial records?')) return;
    try {
      const res = await fetch(getApiUrl('/api/settings/reset'), { method: 'POST' });
      const json = await res.json();
      if (json.success) {
        alert('Database reseeded successfully! Reloading...');
        window.location.reload();
      }
    } catch (err) {
      alert('Failed to reset database');
    }
  };

  if (loading || !settings) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm font-medium text-slate-500">Loading Configuration Parameters...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12 max-w-5xl">
      {/* Settings Form */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <div className="flex justify-between items-center pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <Settings className="w-5 h-5 text-blue-600" />
              <h2 className="text-base font-bold text-slate-900">Optimization Model Parameters</h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Tune objective penalties, shelf-life barriers, and cold-chain strictness
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleResetData}
              type="button"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-semibold"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reseed Demo Data</span>
            </button>
            <button
              onClick={handleSaveSettings}
              disabled={saving}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{saving ? 'Saving...' : 'Save Parameters'}</span>
            </button>
          </div>
        </div>

        <form onSubmit={handleSaveSettings} className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
          <div>
            <label className="block text-slate-700 font-semibold mb-1">Safety Stock Coverage (Days)</label>
            <input
              type="number"
              min="1"
              max="30"
              value={settings.safetyStockDays}
              onChange={(e) => setSettings({ ...settings, safetyStockDays: parseInt(e.target.value, 10) })}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-mono"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">Stockout Penalty (₹ / Unit)</label>
            <input
              type="number"
              min="10"
              value={settings.stockoutPenaltyPerUnitINR}
              onChange={(e) => setSettings({ ...settings, stockoutPenaltyPerUnitINR: parseInt(e.target.value, 10) })}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-mono"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">Inventory Holding Cost (₹ / Unit / Day)</label>
            <input
              type="number"
              step="0.1"
              value={settings.holdingCostPerUnitPerDayINR}
              onChange={(e) => setSettings({ ...settings, holdingCostPerUnitPerDayINR: parseFloat(e.target.value) })}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-mono"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">Minimum Remaining Shelf Life Buffer (Days)</label>
            <input
              type="number"
              min="5"
              value={settings.minShelfLifeBufferDays}
              onChange={(e) => setSettings({ ...settings, minShelfLifeBufferDays: parseInt(e.target.value, 10) })}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-mono"
            />
          </div>
        </form>
      </div>

      {/* Model Assumptions Documentation Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
          <FileText className="w-5 h-5 text-indigo-600" />
          <h3 className="font-bold text-sm text-slate-900">Documented Operational Assumptions</h3>
        </div>
        <ul className="mt-4 space-y-2 text-xs text-slate-600 list-disc pl-5 leading-relaxed">
          {settings.assumptions?.map((ass: string, idx: number) => (
            <li key={idx}>{ass}</li>
          ))}
          <li>
            Pharmaceutical GDP traceability applies SHA-256 batch cryptographic verification for regulatory compliance.
          </li>
          <li>
            Mixed-integer programming solver prioritizes high-velocity perishable goods to prevent near-expiry inventory spoilage.
          </li>
        </ul>
      </div>

      {/* Audit History Log */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
          <ShieldCheck className="w-5 h-5 text-emerald-600" />
          <h3 className="font-bold text-sm text-slate-900">System Security & Allocation Audit Trail</h3>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-[11px] uppercase font-bold text-slate-500 border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">Timestamp</th>
                <th className="py-2.5 px-3">Action Type</th>
                <th className="py-2.5 px-3">Entity</th>
                <th className="py-2.5 px-3">Audit Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {auditLogs.map((log: any, i: number) => (
                <tr key={i} className="hover:bg-slate-50">
                  <td className="py-2.5 px-3 font-mono text-[11px] text-slate-500">{log.timestamp}</td>
                  <td className="py-2.5 px-3 font-semibold text-slate-900">{log.action}</td>
                  <td className="py-2.5 px-3 text-slate-600">{log.entity}</td>
                  <td className="py-2.5 px-3 text-slate-700">{log.details}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
