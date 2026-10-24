import React, { useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';
import * as THREE from 'three';
import { Warehouse, WarehouseZone } from '../../types';

interface WarehouseSceneProps {
  warehouse: Warehouse;
}

// 3D Industrial Storage Rack Component
function StorageRack({
  position,
  rackData,
  onSelect
}: {
  position: [number, number, number];
  rackData: any;
  onSelect: () => void;
}) {
  const [hovered, setHovered] = useState(false);

  const statusColor = rackData.status === 'Critical Care' || rackData.status === 'Near Expiry Risk'
    ? '#DC2626'
    : rackData.status === 'Excess Stock'
    ? '#2563EB'
    : '#10B981';

  return (
    <group
      position={position}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
      }}
      onPointerOut={() => setHovered(false)}
    >
      {/* Vertical Steel Rack Uprights */}
      <mesh position={[-0.8, 1.2, -0.4]}>
        <boxGeometry args={[0.08, 2.4, 0.08]} />
        <meshStandardMaterial color="#64748B" metalness={0.8} roughness={0.3} />
      </mesh>
      <mesh position={[0.8, 1.2, -0.4]}>
        <boxGeometry args={[0.08, 2.4, 0.08]} />
        <meshStandardMaterial color="#64748B" metalness={0.8} roughness={0.3} />
      </mesh>
      <mesh position={[-0.8, 1.2, 0.4]}>
        <boxGeometry args={[0.08, 2.4, 0.08]} />
        <meshStandardMaterial color="#64748B" metalness={0.8} roughness={0.3} />
      </mesh>
      <mesh position={[0.8, 1.2, 0.4]}>
        <boxGeometry args={[0.08, 2.4, 0.08]} />
        <meshStandardMaterial color="#64748B" metalness={0.8} roughness={0.3} />
      </mesh>

      {/* Horizontal Shelves (3 Levels) */}
      {[0.4, 1.1, 1.8].map((y, idx) => (
        <group key={idx} position={[0, y, 0]}>
          <mesh>
            <boxGeometry args={[1.7, 0.05, 0.85]} />
            <meshStandardMaterial color="#E2E8F0" metalness={0.6} />
          </mesh>
          {/* Pallet Wooden Base */}
          <mesh position={[0, 0.04, 0]}>
            <boxGeometry args={[1.5, 0.04, 0.75]} />
            <meshStandardMaterial color="#B45309" roughness={0.9} />
          </mesh>
          {/* Product Cartons / Pallet boxes on shelf */}
          <mesh position={[-0.4, 0.2, 0]}>
            <boxGeometry args={[0.5, 0.3, 0.6]} />
            <meshStandardMaterial
              color={hovered ? '#F59E0B' : statusColor}
              roughness={0.5}
            />
          </mesh>
          <mesh position={[0.4, 0.22, 0]}>
            <boxGeometry args={[0.5, 0.34, 0.6]} />
            <meshStandardMaterial
              color={hovered ? '#F59E0B' : statusColor}
              roughness={0.5}
            />
          </mesh>
        </group>
      ))}

      {/* Rack ID Label Header */}
      <Html position={[0, 2.6, 0]} center distanceFactor={12}>
        <div className={`px-2 py-0.5 rounded text-[10px] font-bold whitespace-nowrap shadow cursor-pointer transition-transform ${
          hovered ? 'bg-amber-500 text-white scale-110' : 'bg-slate-900/90 text-slate-200 border border-slate-700'
        }`}>
          {rackData.rackId} • {rackData.category.slice(0, 14)}
        </div>
      </Html>
    </group>
  );
}

export const WarehouseScene3D: React.FC<WarehouseSceneProps> = ({ warehouse }) => {
  const [selectedRack, setSelectedRack] = useState<any>(null);

  // Mock zones if none returned
  const zones: WarehouseZone[] = warehouse.zones || [
    {
      id: "ZONE-A",
      name: "Zone A: Ambient FMCG & Snacks",
      tempRange: "Ambient (20-25°C)",
      capacityUnits: 50000,
      utilizationPercent: 78,
      colorHex: "#3B82F6",
      racks: [
        { rackId: "RACK-A1", row: 1, col: 1, levels: 3, category: "Snacks & Confectionery", status: "Normal", itemCount: 2450 },
        { rackId: "RACK-A2", row: 1, col: 2, levels: 3, category: "Packaged Foods", status: "Excess Stock", itemCount: 4100 },
        { rackId: "RACK-A3", row: 1, col: 3, levels: 3, category: "Household Cleaning", status: "Normal", itemCount: 1800 }
      ]
    },
    {
      id: "ZONE-C",
      name: "Zone C: Active Cold-Storage Reefer Vault",
      tempRange: "Strict 2°C to 8°C",
      capacityUnits: warehouse.coldStorageCapacityUnits,
      utilizationPercent: 84,
      colorHex: "#06B6D4",
      isColdChain: true,
      racks: [
        { rackId: "RACK-C1", row: 2, col: 1, levels: 3, category: "Dairy Products", status: "Near Expiry Risk", itemCount: 1950 },
        { rackId: "RACK-C2", row: 2, col: 2, levels: 3, category: "Pharmaceuticals (Cold)", status: "Critical Care", itemCount: 1420 }
      ]
    },
    {
      id: "ZONE-D",
      name: "Zone D: GDP Pharmaceutical Regulated Lockup",
      tempRange: "Controlled 15°C to 25°C",
      capacityUnits: 25000,
      utilizationPercent: 62,
      colorHex: "#8B5CF6",
      isPharmaSecured: true,
      racks: [
        { rackId: "RACK-D1", row: 3, col: 1, levels: 3, category: "Pharmaceuticals", status: "Healthy / GDP Verified", itemCount: 2800 },
        { rackId: "RACK-D2", row: 3, col: 2, levels: 3, category: "Pharmaceuticals", status: "QA Quarantined", itemCount: 600 }
      ]
    }
  ];

  return (
    <div className="relative w-full h-[520px] bg-gradient-to-b from-slate-950 via-slate-900 to-navy-900 rounded-2xl overflow-hidden border border-slate-800 shadow-2xl">
      <Canvas camera={{ position: [0, 10, 14], fov: 45 }}>
        <ambientLight intensity={0.8} />
        <directionalLight position={[8, 15, 10]} intensity={1.3} castShadow />
        <pointLight position={[-6, 8, -4]} intensity={0.8} color="#38BDF8" />

        {/* Industrial Warehouse Concrete Floor */}
        <mesh position={[0, -0.05, 0]}>
          <boxGeometry args={[22, 0.1, 16]} />
          <meshStandardMaterial color="#1E293B" roughness={0.7} metalness={0.2} />
        </mesh>
        <gridHelper args={[22, 22, '#475569', '#334155']} position={[0, 0.01, 0]} />

        {/* Loading Dock Bay at the front */}
        <mesh position={[0, 0.02, 7.2]}>
          <boxGeometry args={[14, 0.02, 1.4]} />
          <meshStandardMaterial color="#EAB308" />
        </mesh>

        {/* Parked Delivery Van at Dock */}
        <group position={[-5, 0, 7.5]} rotation={[0, Math.PI, 0]}>
          <mesh position={[0, 0.5, 0]}>
            <boxGeometry args={[1.2, 1.0, 2.4]} />
            <meshStandardMaterial color="#2563EB" metalness={0.5} />
          </mesh>
          <mesh position={[0, 0.4, 1.3]}>
            <boxGeometry args={[1.1, 0.8, 0.8]} />
            <meshStandardMaterial color="#0F172A" />
          </mesh>
        </group>

        {/* Cold-Storage Chamber Enclosure (Frosted Cyan Enclosure Walls) */}
        <mesh position={[-6.5, 1.8, -2.5]}>
          <boxGeometry args={[6.5, 3.6, 6.5]} />
          <meshStandardMaterial
            color="#06B6D4"
            transparent
            opacity={0.18}
            roughness={0.1}
            metalness={0.4}
            side={THREE.DoubleSide}
          />
        </mesh>

        {/* Cold Storage Neon Header */}
        <Html position={[-6.5, 3.8, -2.5]} center distanceFactor={14}>
          <div className="bg-cyan-950/90 text-cyan-300 border border-cyan-500/50 text-[10px] px-2 py-0.5 rounded font-mono font-bold whitespace-nowrap shadow-lg">
            ❄️ 2-8°C REEFER VAULT
          </div>
        </Html>

        {/* Pharmaceutical GDP High-Security Caged Area */}
        <mesh position={[6.5, 1.8, -2.5]}>
          <boxGeometry args={[6.5, 3.6, 6.5]} />
          <meshStandardMaterial
            color="#8B5CF6"
            transparent
            opacity={0.18}
            roughness={0.2}
            side={THREE.DoubleSide}
          />
        </mesh>

        <Html position={[6.5, 3.8, -2.5]} center distanceFactor={14}>
          <div className="bg-purple-950/90 text-purple-300 border border-purple-500/50 text-[10px] px-2 py-0.5 rounded font-mono font-bold whitespace-nowrap shadow-lg">
            🔒 GDP PHARMA VAULT
          </div>
        </Html>

        {/* Render Racks in Zone Layout */}
        {/* Ambient Center Racks */}
        <StorageRack
          position={[-1.2, 0, -2.5]}
          rackData={zones[0].racks[0]}
          onSelect={() => setSelectedRack({ ...zones[0].racks[0], zoneName: zones[0].name, temp: zones[0].tempRange })}
        />
        <StorageRack
          position={[1.2, 0, -2.5]}
          rackData={zones[0].racks[1]}
          onSelect={() => setSelectedRack({ ...zones[0].racks[1], zoneName: zones[0].name, temp: zones[0].tempRange })}
        />
        <StorageRack
          position={[0, 0, 1.5]}
          rackData={zones[0].racks[2]}
          onSelect={() => setSelectedRack({ ...zones[0].racks[2], zoneName: zones[0].name, temp: zones[0].tempRange })}
        />

        {/* Cold Storage Racks */}
        <StorageRack
          position={[-7.5, 0, -3.0]}
          rackData={zones[1].racks[0]}
          onSelect={() => setSelectedRack({ ...zones[1].racks[0], zoneName: zones[1].name, temp: zones[1].tempRange })}
        />
        <StorageRack
          position={[-5.2, 0, -3.0]}
          rackData={zones[1].racks[1]}
          onSelect={() => setSelectedRack({ ...zones[1].racks[1], zoneName: zones[1].name, temp: zones[1].tempRange })}
        />

        {/* Pharma Vault Racks */}
        <StorageRack
          position={[5.2, 0, -3.0]}
          rackData={zones[2].racks[0]}
          onSelect={() => setSelectedRack({ ...zones[2].racks[0], zoneName: zones[2].name, temp: zones[2].tempRange })}
        />
        <StorageRack
          position={[7.5, 0, -3.0]}
          rackData={zones[2].racks[1]}
          onSelect={() => setSelectedRack({ ...zones[2].racks[1], zoneName: zones[2].name, temp: zones[2].tempRange })}
        />

        <OrbitControls
          enableDamping
          dampingFactor={0.05}
          maxPolarAngle={Math.PI / 2.15}
          minDistance={5}
          maxDistance={25}
        />
      </Canvas>

      {/* Floating Info Overlay */}
      <div className="absolute top-4 left-4 bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-xl p-3 text-xs text-white shadow-xl pointer-events-auto">
        <h4 className="font-bold text-sm text-slate-100 flex items-center gap-2">
          <span>🏬</span> {warehouse.name}
        </h4>
        <div className="text-slate-400 text-[11px] mt-0.5">{warehouse.location}</div>
        <div className="flex gap-4 mt-2.5 pt-2 border-t border-slate-800 text-[11px]">
          <div>
            <div className="text-slate-400">Capacity</div>
            <div className="font-semibold text-emerald-400">
              {(warehouse.totalCapacityUnits || 150000).toLocaleString()} units
            </div>
          </div>
          <div>
            <div className="text-slate-400">Reefer Chamber</div>
            <div className="font-semibold text-cyan-400">
              {(warehouse.coldStorageCapacityUnits || 35000).toLocaleString()} units
            </div>
          </div>
          <div>
            <div className="text-slate-400">Active Trucks</div>
            <div className="font-semibold text-blue-400">{warehouse.fleetSizeTrucks} Units</div>
          </div>
        </div>
      </div>

      {/* Selected Rack Inspector Panel */}
      {selectedRack && (
        <div className="absolute bottom-4 right-4 max-w-sm w-full bg-slate-900/95 backdrop-blur-md border border-blue-500/40 rounded-xl p-4 text-white shadow-2xl animate-in fade-in duration-200">
          <div className="flex justify-between items-start pb-2 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-blue-400">{selectedRack.rackId}</span>
                <span className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300 font-mono">
                  {selectedRack.status}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">{selectedRack.zoneName}</p>
            </div>
            <button
              onClick={() => setSelectedRack(null)}
              className="text-slate-400 hover:text-white text-xs px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700"
            >
              ✕
            </button>
          </div>
          <div className="mt-3 space-y-1.5 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-400">Category Assigned:</span>
              <span className="font-medium text-slate-100">{selectedRack.category}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Current Item Stored:</span>
              <span className="font-semibold text-emerald-400">{selectedRack.itemCount.toLocaleString()} units</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Storage Environment:</span>
              <span className="font-medium text-cyan-300">{selectedRack.temp}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Vertical Levels:</span>
              <span className="font-medium text-slate-200">Tier 1 to Tier {selectedRack.levels}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
