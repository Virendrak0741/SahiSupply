import React from 'react';
import { IndiaDistributionMap } from '../components/map/IndiaDistributionMap';

export const GeographicMapPage: React.FC = () => {
  return (
    <div className="space-y-4 pb-8">
      <div>
        <h2 className="text-base font-bold text-slate-900 tracking-tight">
          Pan-India Geographic Distribution Network (OpenStreetMap Verified)
        </h2>
        <p className="text-xs text-slate-500">
          Real geographic facilities across India with automated flow animations, cold-chain corridors, and stockout risk beacons
        </p>
      </div>

      <IndiaDistributionMap />
    </div>
  );
};
