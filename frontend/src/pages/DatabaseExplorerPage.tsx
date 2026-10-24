import React, { useState, useEffect } from 'react';
import {
  Database,
  Table,
  FileCode,
  Download,
  Copy,
  Check,
  Search,
  Server,
  Layers,
  ArrowRight,
  ShieldCheck,
  Package,
  MapPin,
  Boxes,
  Truck,
  Cpu
} from 'lucide-react';
import { apiFetch, getApiUrl } from '../utils/api';

export const DatabaseExplorerPage: React.FC = () => {
  const [collectionsSummary, setCollectionsSummary] = useState<any[]>([]);
  const [selectedCollection, setSelectedCollection] = useState<string>('products');
  const [collectionData, setCollectionData] = useState<any[]>([]);
  const [sqlSchema, setSqlSchema] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState<'table' | 'json' | 'sql'>('table');
  const [copied, setCopied] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');

  useEffect(() => {
    fetchSummary();
    fetchSqlSchema();
  }, []);

  useEffect(() => {
    fetchCollectionData(selectedCollection);
  }, [selectedCollection]);

  const fetchSummary = async () => {
    try {
      setLoading(true);
      const json = await apiFetch<any>('/api/database/summary');
      if (json && json.success) {
        setCollectionsSummary(json.collections);
      }
    } catch (err) {
      console.error('Failed to load database summary:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCollectionData = async (colName: string) => {
    try {
      const json = await apiFetch<any>(`/api/database/collections/${colName}`);
      if (json && json.success) {
        setCollectionData(json.data);
      }
    } catch (err) {
      console.error('Failed to load collection data:', err);
    }
  };

  const fetchSqlSchema = async () => {
    try {
      const json = await apiFetch<any>('/api/database/schema');
      if (json && json.success) {
        setSqlSchema(json.sql);
      }
    } catch (err) {
      console.error('Failed to load SQL schema:', err);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadJSON = (data: any, filename: string) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Filter collection rows
  const filteredRows = collectionData.filter((row: any) => {
    if (!searchFilter) return true;
    const str = JSON.stringify(row).toLowerCase();
    return str.includes(searchFilter.toLowerCase());
  });

  const columns = collectionData.length > 0 ? Object.keys(collectionData[0]).slice(0, 7) : [];

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <Database className="w-5 h-5 text-blue-600" />
              <h2 className="text-base font-bold text-slate-900">
                Database Explorer & Schema Inspector
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                Live Interconnected Dataset
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Inspect collections, export JSON datasets, view SQL DDL, and verify MongoDB / Relational schemas
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleDownloadJSON(collectionData, `${selectedCollection}.json`)}
              className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download {selectedCollection}.json</span>
            </button>
          </div>
        </div>

        {/* Collections Selector Cards */}
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
          {collectionsSummary.map((col) => {
            const isSelected = selectedCollection === col.name;
            return (
              <button
                key={col.name}
                onClick={() => setSelectedCollection(col.name)}
                className={`p-3 rounded-xl border text-left transition-all ${
                  isSelected
                    ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/20'
                    : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                }`}
              >
                <div className="text-[10px] uppercase font-bold tracking-wider truncate">
                  {col.name}
                </div>
                <div className={`text-lg font-bold font-mono mt-1 ${isSelected ? 'text-white' : 'text-slate-900'}`}>
                  {col.count.toLocaleString()}
                </div>
                <div className={`text-[10px] truncate ${isSelected ? 'text-blue-100' : 'text-slate-400'}`}>
                  records
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content Area: Table vs JSON vs SQL */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-slate-100">
          {/* View Mode Tabs */}
          <div className="flex rounded-lg border border-slate-200 p-0.5 bg-slate-50 text-xs">
            <button
              onClick={() => setActiveView('table')}
              className={`px-3 py-1.5 rounded-md font-semibold flex items-center gap-1.5 transition-all ${
                activeView === 'table' ? 'bg-white shadow text-blue-600' : 'text-slate-600'
              }`}
            >
              <Table className="w-3.5 h-3.5" />
              <span>Tabular Grid ({filteredRows.length})</span>
            </button>
            <button
              onClick={() => setActiveView('json')}
              className={`px-3 py-1.5 rounded-md font-semibold flex items-center gap-1.5 transition-all ${
                activeView === 'json' ? 'bg-white shadow text-blue-600' : 'text-slate-600'
              }`}
            >
              <FileCode className="w-3.5 h-3.5" />
              <span>Raw JSON Document</span>
            </button>
            <button
              onClick={() => setActiveView('sql')}
              className={`px-3 py-1.5 rounded-md font-semibold flex items-center gap-1.5 transition-all ${
                activeView === 'sql' ? 'bg-white shadow text-blue-600' : 'text-slate-600'
              }`}
            >
              <Database className="w-3.5 h-3.5" />
              <span>SQL DDL Schema</span>
            </button>
          </div>

          {/* Search Box */}
          {activeView === 'table' && (
            <div className="w-64">
              <input
                type="text"
                placeholder="Filter current collection..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          )}
        </div>

        {/* TABULAR VIEW */}
        {activeView === 'table' && (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-[11px] uppercase font-bold text-slate-500 border-b border-slate-200">
                <tr>
                  {columns.map((col) => (
                    <th key={col} className="py-2.5 px-3 whitespace-nowrap">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                {filteredRows.slice(0, 30).map((row: any, i: number) => (
                  <tr key={i} className="hover:bg-slate-50/80 transition-colors">
                    {columns.map((col) => {
                      const val = row[col];
                      const displayVal = typeof val === 'object' && val !== null
                        ? JSON.stringify(val).slice(0, 24)
                        : String(val ?? '');

                      return (
                        <td key={col} className="py-2.5 px-3 max-w-xs truncate text-slate-800">
                          {displayVal}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredRows.length > 30 && (
              <div className="p-3 text-center text-xs text-slate-400 border-t border-slate-100">
                Showing first 30 of {filteredRows.length} records. Download JSON above for full export.
              </div>
            )}
          </div>
        )}

        {/* RAW JSON VIEW */}
        {activeView === 'json' && (
          <div className="mt-4 relative">
            <button
              onClick={() => handleCopy(JSON.stringify(collectionData, null, 2))}
              className="absolute top-3 right-3 bg-slate-800 hover:bg-slate-700 text-white px-3 py-1 rounded text-xs font-semibold flex items-center gap-1.5 shadow"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied!' : 'Copy JSON'}</span>
            </button>
            <pre className="bg-slate-950 text-slate-200 p-4 rounded-xl text-xs font-mono overflow-auto max-h-[500px]">
              {JSON.stringify(collectionData.slice(0, 20), null, 2)}
            </pre>
          </div>
        )}

        {/* SQL SCHEMA DDL VIEW */}
        {activeView === 'sql' && (
          <div className="mt-4 relative">
            <button
              onClick={() => handleCopy(sqlSchema)}
              className="absolute top-3 right-3 bg-slate-800 hover:bg-slate-700 text-white px-3 py-1 rounded text-xs font-semibold flex items-center gap-1.5 shadow"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied!' : 'Copy SQL Schema'}</span>
            </button>
            <pre className="bg-slate-950 text-emerald-400 p-4 rounded-xl text-xs font-mono overflow-auto max-h-[500px]">
              {sqlSchema}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};
