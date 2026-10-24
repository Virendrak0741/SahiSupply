import React, { useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';
import * as THREE from 'three';

interface DemandItem {
  destinationId: string;
  destinationName: string;
  region: string;
  productName: string;
  forecastDemand: number;
  currentInventory: number;
  urgencyStatus: string;
  isPharma: boolean;
  stockoutDate?: string | null;
}

interface DemandSceneProps {
  items: DemandItem[];
}

function DemandColumn({
  item,
  position,
  onClick
}: {
  item: DemandItem;
  position: [number, number, number];
  onClick: () => void;
}) {
  const [hovered, setHovered] = useState(false);

  // Height proportional to forecast demand
  const height = Math.max(0.6, Math.min(6, (item.forecastDemand / 400) * 1.8));

  // Color according to trend and urgency
  let color = '#10B981'; // Green: stable
  if (item.isPharma) color = '#8B5CF6'; // Purple: pharma
  else if (item.urgencyStatus === 'Stockout Imminent') color = '#DC2626'; // Red: critical
  else if (item.urgencyStatus === 'Low Safety Margin') color = '#F59E0B'; // Amber: elevated risk
  else if (item.forecastDemand > 500) color = '#2563EB'; // Blue: high surging demand

  return (
    <group
      position={position}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
      }}
      onPointerOut={() => setHovered(false)}
    >
      {/* 3D Vertical Demand Pillar */}
      <mesh position={[0, height / 2, 0]}>
        <cylinderGeometry args={[0.3, 0.35, height, 16]} />
        <meshStandardMaterial
          color={hovered ? '#FCD34D' : color}
          emissive={color}
          emissiveIntensity={hovered ? 0.7 : 0.25}
          metalness={0.2}
          roughness={0.3}
        />
      </mesh>

      {/* Top Cap */}
      <mesh position={[0, height + 0.08, 0]}>
        <sphereGeometry args={[0.26, 16, 16]} />
        <meshStandardMaterial color={hovered ? '#FFFFFF' : color} emissive={color} emissiveIntensity={0.5} />
      </mesh>

      {/* Ground Projection Ring */}
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.35, 0.55, 24]} />
        <meshBasicMaterial color={color} transparent opacity={0.4} />
      </mesh>

      {/* Label Billboarding */}
      <Html position={[0, height + 0.6, 0]} center distanceFactor={14}>
        <div className={`px-2 py-0.5 rounded text-[10px] font-bold whitespace-nowrap shadow-md cursor-pointer transition-all ${
          hovered ? 'bg-amber-500 text-white scale-110' : 'bg-slate-900/90 text-slate-100 border border-slate-700'
        }`}>
          {item.destinationName.slice(0, 15)}
          <span className="block text-[9px] text-amber-300 font-mono">
            {item.forecastDemand.toLocaleString()} Units
          </span>
        </div>
      </Html>
    </group>
  );
}

export const DemandScene3D: React.FC<DemandSceneProps> = ({ items }) => {
  const [selectedItem, setSelectedItem] = useState<DemandItem | null>(null);

  // Layout items in a neat spatial grid
  const displayItems = items.slice(0, 20);

  return (
    <div className="relative w-full h-[520px] bg-gradient-to-b from-slate-950 via-slate-900 to-navy-900 rounded-2xl overflow-hidden border border-slate-800 shadow-2xl">
      <Canvas camera={{ position: [0, 12, 16], fov: 45 }}>
        <ambientLight intensity={0.7} />
        <directionalLight position={[10, 18, 12]} intensity={1.2} />
        <pointLight position={[-8, 12, -8]} intensity={0.6} color="#38BDF8" />

        {/* 3D Terrain Grid */}
        <gridHelper args={[26, 26, '#334155', '#1E293B']} position={[0, -0.01, 0]} />

        {/* Render Demand Pillars */}
        {displayItems.map((item, idx) => {
          const row = Math.floor(idx / 5) - 1.5;
          const col = (idx % 5) - 2;
          const x = col * 4 + (row % 2 ? 0.8 : -0.8);
          const z = row * 3.8;

          return (
            <DemandColumn
              key={`${item.destinationId}-${idx}`}
              item={item}
              position={[x, 0, z]}
              onClick={() => setSelectedItem(item)}
            />
          );
        })}

        <OrbitControls
          enableDamping
          dampingFactor={0.05}
          maxPolarAngle={Math.PI / 2.2}
          minDistance={6}
          maxDistance={30}
        />
      </Canvas>

      {/* Floating Legend */}
      <div className="absolute top-4 left-4 bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-xl p-3 text-xs text-white shadow-xl pointer-events-auto">
        <div className="font-semibold text-slate-200 mb-2 flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
          3D Forecast Demand Elevation
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-[11px] text-slate-300">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-emerald-500"></span>
            Adequately Stocked
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-purple-500"></span>
            Pharmaceutical Rx
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-amber-500"></span>
            Low Safety Margin
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-red-500"></span>
            Stockout Imminent
          </div>
        </div>
      </div>

      {/* Selected Pillar Inspector */}
      {selectedItem && (
        <div className="absolute bottom-4 right-4 max-w-sm w-full bg-slate-900/95 backdrop-blur-md border border-emerald-500/40 rounded-xl p-4 text-white shadow-2xl animate-in fade-in duration-200">
          <div className="flex justify-between items-start pb-2 border-b border-slate-800">
            <div>
              <h4 className="font-bold text-sm text-emerald-400">{selectedItem.destinationName}</h4>
              <p className="text-[11px] text-slate-400">{selectedItem.region} • {selectedItem.productName}</p>
            </div>
            <button
              onClick={() => setSelectedItem(null)}
              className="text-slate-400 hover:text-white text-xs px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700"
            >
              ✕
            </button>
          </div>
          <div className="mt-3 space-y-1.5 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-400">Forecast 7-Day Demand:</span>
              <span className="font-semibold text-emerald-300">{selectedItem.forecastDemand.toLocaleString()} units</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Current Destination Inventory:</span>
              <span className="font-semibold text-slate-200">{selectedItem.currentInventory.toLocaleString()} units</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Stockout Risk Date:</span>
              <span className={`font-semibold ${selectedItem.stockoutDate ? 'text-red-400' : 'text-emerald-400'}`}>
                {selectedItem.stockoutDate || 'No Stockout Projected'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Category Status:</span>
              <span className="font-medium text-slate-200">{selectedItem.isPharma ? '💊 Pharmaceutical GDP' : '📦 FMCG Commercial'}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
