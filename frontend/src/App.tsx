import React, { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Sidebar } from './components/layout/Sidebar';
import { Navbar } from './components/layout/Navbar';
import { DashboardPage } from './pages/DashboardPage';
import { GeographicMapPage } from './pages/GeographicMapPage';
import { InventoryPage } from './pages/InventoryPage';
import { ForecastingPage } from './pages/ForecastingPage';
import { OptimizerPage } from './pages/OptimizerPage';
import { ShipmentsAnalyticsPage } from './pages/ShipmentsAnalyticsPage';
import { DatabaseExplorerPage } from './pages/DatabaseExplorerPage';
import { SettingsPage } from './pages/SettingsPage';

export const App: React.FC = () => {
  const [selectedRegion, setSelectedRegion] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  return (
    <BrowserRouter>
      <div className="flex h-screen w-screen overflow-hidden bg-[#F8FAFC]">
        {/* Persistent Left Sidebar */}
        <Sidebar />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Top Persistent Navigation Bar */}
          <Navbar
            selectedRegion={selectedRegion}
            onRegionChange={setSelectedRegion}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
          />

          {/* Page Routing Container */}
          <main className="flex-1 overflow-y-auto px-6 py-6">
            <div className="max-w-7xl mx-auto">
              <Routes>
                <Route
                  path="/"
                  element={<DashboardPage selectedRegion={selectedRegion} searchQuery={searchQuery} />}
                />
                <Route
                  path="/network-map"
                  element={<GeographicMapPage />}
                />
                <Route
                  path="/inventory"
                  element={<InventoryPage selectedRegion={selectedRegion} searchQuery={searchQuery} />}
                />
                <Route
                  path="/forecasting"
                  element={<ForecastingPage selectedRegion={selectedRegion} searchQuery={searchQuery} />}
                />
                <Route
                  path="/optimizer"
                  element={<OptimizerPage selectedRegion={selectedRegion} searchQuery={searchQuery} />}
                />
                <Route
                  path="/shipments"
                  element={<ShipmentsAnalyticsPage selectedRegion={selectedRegion} searchQuery={searchQuery} />}
                />
                <Route
                  path="/database"
                  element={<DatabaseExplorerPage />}
                />
                <Route
                  path="/settings"
                  element={<SettingsPage />}
                />
              </Routes>
            </div>
          </main>
        </div>
      </div>
    </BrowserRouter>
  );
};

export default App;
