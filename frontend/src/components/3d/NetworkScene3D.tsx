import React, { useRef, useState, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text, Html } from '@react-three/drei';
import * as THREE from 'three';
import { Warehouse, Destination } from '../../types';

interface NetworkSceneProps {
  warehouses: Warehouse[];
  destinations: Destination[];
  activeRoutes?: Array<{
    sourceCoord: [number, number, number];
    destCoord: [number, number, number];
    sourceName: string;
    destName: string;
    productName: string;
    quantity: number;
    isColdChain: boolean;
    isPharma: boolean;
    priority: string;
  }>;
  onSelectNode?: (node: { type: 'warehouse' | 'destination'; data: any }) => void;
  showRoutes?: boolean;
}

// Animated Truck moving along a route line
function MovingTruck({
  start,
  end,
  speed = 0.4,
  isColdChain = false,
  isPharma = false
}: {
  start: [number, number, number];
  end: [number, number, number];
  speed?: number;
  isColdChain?: boolean;
  isPharma?: boolean;
}) {
  const meshRef = useRef<THREE.Group>(null);
  const progressRef = useRef(Math.random()); // start at random offset

  useFrame((_, delta) => {
    if (!meshRef.current) return;
    progressRef.current = (progressRef.current + delta * speed * 0.15) % 1;
    const t = progressRef.current;

    const x = THREE.MathUtils.lerp(start[0], end[0], t);
    const z = THREE.MathUtils.lerp(start[2], end[2], t);
    // Arc elevation slightly in the middle for parabolic visibility
    const y = THREE.MathUtils.lerp(start[1], end[1], t) + Math.sin(t * Math.PI) * 0.4 + 0.15;

    meshRef.current.position.set(x, y, z);

    // Look towards destination
    meshRef.current.lookAt(end[0], end[1], end[2]);
  });

  const truckColor = isColdChain ? '#06B6D4' : isPharma ? '#8B5CF6' : '#2563EB';

  return (
    <group ref={meshRef}>
      {/* Truck Cabin */}
      <mesh position={[0, 0.08, 0.12]}>
        <boxGeometry args={[0.2, 0.16, 0.18]} />
        <meshStandardMaterial color="#1E293B" metalness={0.6} roughness={0.3} />
      </mesh>
      {/* Truck Container Trailer */}
      <mesh position={[0, 0.11, -0.1]}>
        <boxGeometry args={[0.24, 0.22, 0.35]} />
        <meshStandardMaterial
          color={truckColor}
          emissive={truckColor}
          emissiveIntensity={0.2}
          roughness={0.4}
        />
      </mesh>
      {/* Refrigeration Unit indicator for cold-chain */}
      {isColdChain && (
        <mesh position={[0, 0.24, 0.05]}>
          <boxGeometry args={[0.12, 0.05, 0.08]} />
          <meshStandardMaterial color="#38BDF8" emissive="#38BDF8" emissiveIntensity={0.6} />
        </mesh>
      )}
    </group>
  );
}

// 3D Warehouse Building Model
function WarehouseBuilding({
  warehouse,
  onClick
}: {
  warehouse: Warehouse;
  onClick: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  const x = warehouse.coordinates.x;
  const z = warehouse.coordinates.z;

  const statusColor = (warehouse.utilizationPercent || 70) > 85 ? '#D97706' : '#16A34A';

  return (
    <group
      position={[x, 0, z]}
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
      {/* Concrete Foundation Base */}
      <mesh position={[0, 0.1, 0]}>
        <cylinderGeometry args={[1.5, 1.6, 0.2, 16]} />
        <meshStandardMaterial color="#334155" roughness={0.8} />
      </mesh>

      {/* Main Warehouse Structure */}
      <mesh position={[0, 0.65, 0]}>
        <boxGeometry args={[1.8, 0.9, 1.4]} />
        <meshStandardMaterial
          color={hovered ? '#3B82F6' : '#1E293B'}
          metalness={0.3}
          roughness={0.4}
        />
      </mesh>

      {/* Industrial Pitched Roof */}
      <mesh position={[0, 1.25, 0]} rotation={[0, 0, 0]}>
        <coneGeometry args={[1.4, 0.5, 4]} />
        <meshStandardMaterial color="#0F172A" roughness={0.2} />
      </mesh>

      {/* Loading Dock Bay Openings */}
      <mesh position={[0, 0.35, 0.71]}>
        <boxGeometry args={[0.9, 0.45, 0.05]} />
        <meshStandardMaterial color="#F59E0B" />
      </mesh>

      {/* Cold Storage Vent / Beacon if cold storage available */}
      {warehouse.coldStorageAvailable && (
        <mesh position={[0.6, 1.2, 0.4]}>
          <cylinderGeometry args={[0.12, 0.12, 0.3, 8]} />
          <meshStandardMaterial color="#06B6D4" emissive="#06B6D4" emissiveIntensity={0.8} />
        </mesh>
      )}

      {/* Status Ring Aura */}
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.6, 1.85, 32]} />
        <meshBasicMaterial color={statusColor} side={THREE.DoubleSide} transparent opacity={0.7} />
      </mesh>

      {/* Label Billboarding */}
      <Html position={[0, 1.7, 0]} center distanceFactor={15}>
        <div className={`px-2 py-1 rounded text-xs font-semibold whitespace-nowrap shadow-md cursor-pointer transition-all ${
          hovered ? 'bg-blue-600 text-white scale-110' : 'bg-slate-900/90 text-slate-100 border border-slate-700'
        }`}>
          🏬 {warehouse.region} Hub
          <span className="block text-[10px] text-emerald-400 font-mono">
            {warehouse.utilizationPercent || 72}% Cap
          </span>
        </div>
      </Html>
    </group>
  );
}

// 3D Destination Node (Store / Pharmacy / Distributor)
function DestinationNode({
  destination,
  onClick
}: {
  destination: Destination;
  onClick: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  const x = destination.coordinates.x;
  const z = destination.coordinates.z;

  const isPharma = destination.type === 'Pharmacy';
  const isDist = destination.type === 'Distributor';

  const markerColor = isPharma ? '#8B5CF6' : isDist ? '#0D9488' : '#2563EB';

  return (
    <group
      position={[x, 0, z]}
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
      {/* Node Marker Base */}
      <mesh position={[0, 0.25, 0]}>
        <boxGeometry args={[0.5, 0.5, 0.5]} />
        <meshStandardMaterial
          color={hovered ? '#F59E0B' : markerColor}
          emissive={markerColor}
          emissiveIntensity={hovered ? 0.6 : 0.2}
          roughness={0.3}
        />
      </mesh>

      {/* Marker Pin Head */}
      <mesh position={[0, 0.7, 0]}>
        <octahedronGeometry args={[0.22]} />
        <meshStandardMaterial color={isPharma ? '#A855F7' : '#38BDF8'} />
      </mesh>

      {/* Ground Shadow / Ring */}
      <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.3, 0.45, 16]} />
        <meshBasicMaterial color={markerColor} transparent opacity={0.4} />
      </mesh>

      {/* Hover Info Tag */}
      {hovered && (
        <Html position={[0, 1.1, 0]} center distanceFactor={14}>
          <div className="bg-slate-900 text-white text-xs px-2.5 py-1.5 rounded-lg shadow-xl border border-slate-700 whitespace-nowrap z-50">
            <div className="font-bold flex items-center gap-1.5">
              <span>{isPharma ? '💊' : isDist ? '📦' : '🛒'}</span>
              {destination.name}
            </div>
            <div className="text-[10px] text-slate-300 mt-0.5">
              Type: {destination.type} • {destination.region}
            </div>
            {destination.hasColdChain && (
              <div className="text-[10px] text-cyan-400 font-semibold">❄️ Cold-Chain Ready</div>
            )}
          </div>
        </Html>
      )}
    </group>
  );
}

// 3D Route Lines connecting Nodes
function RouteLine({
  start,
  end,
  isColdChain,
  isPharma
}: {
  start: [number, number, number];
  end: [number, number, number];
  isColdChain?: boolean;
  isPharma?: boolean;
}) {
  const points = useMemo(() => {
    const midX = (start[0] + end[0]) / 2;
    const midZ = (start[2] + end[2]) / 2;
    const midY = 0.35; // gentle parabolic arc
    return [
      new THREE.Vector3(...start),
      new THREE.Vector3(midX, midY, midZ),
      new THREE.Vector3(...end)
    ];
  }, [start, end]);

  const curve = useMemo(() => new THREE.QuadraticBezierCurve3(points[0], points[1], points[2]), [points]);
  const curvePoints = useMemo(() => curve.getPoints(24), [curve]);
  const geometry = useMemo(() => new THREE.BufferGeometry().setFromPoints(curvePoints), [curvePoints]);

  const lineColor = isColdChain ? '#06B6D4' : isPharma ? '#8B5CF6' : '#3B82F6';

  return (
    <primitive object={new THREE.Line(
      geometry,
      new THREE.LineBasicMaterial({
        color: lineColor,
        linewidth: 2,
        transparent: true,
        opacity: 0.75
      })
    )} />
  );
}

export const NetworkScene3D: React.FC<NetworkSceneProps> = ({
  warehouses,
  destinations,
  activeRoutes = [],
  onSelectNode,
  showRoutes = true
}) => {
  const [selectedInfo, setSelectedInfo] = useState<any>(null);

  // Generate fallback active route links if none provided
  const routesToRender = useMemo(() => {
    if (activeRoutes.length > 0) return activeRoutes;

    const sampleRoutes: any[] = [];
    if (warehouses.length > 0 && destinations.length > 0) {
      // Connect each warehouse to 2-3 regional destinations
      warehouses.forEach(wh => {
        const regionalDests = destinations.filter(d => d.region === wh.region).slice(0, 3);
        regionalDests.forEach(d => {
          sampleRoutes.push({
            sourceCoord: [wh.coordinates.x, 0.4, wh.coordinates.z],
            destCoord: [d.coordinates.x, 0.2, d.coordinates.z],
            sourceName: wh.name,
            destName: d.name,
            productName: d.type === 'Pharmacy' ? 'Insulin Glargine / Paracetamol' : 'Organic Milk / Staples',
            quantity: 850,
            isColdChain: wh.coldStorageAvailable && d.hasColdChain,
            isPharma: d.type === 'Pharmacy',
            priority: 'Normal'
          });
        });
      });
    }
    return sampleRoutes;
  }, [warehouses, destinations, activeRoutes]);

  const handleWarehouseClick = (wh: Warehouse) => {
    setSelectedInfo({
      type: 'warehouse',
      title: wh.name,
      subtitle: `${wh.region} Central Supply Hub`,
      details: [
        { label: 'Storage Capacity', value: `${wh.totalCapacityUnits.toLocaleString()} units` },
        { label: 'Capacity Utilization', value: `${wh.utilizationPercent || 74}%` },
        { label: 'Cold Storage Vault', value: wh.coldStorageAvailable ? 'Certified 2-8°C' : 'N/A' },
        { label: 'Truck Fleet Size', value: `${wh.fleetSizeTrucks} active vehicles` },
        { label: 'Outbound Shipments', value: `${wh.activeOutboundShipments} loads in transit` }
      ]
    });
    if (onSelectNode) onSelectNode({ type: 'warehouse', data: wh });
  };

  const handleDestinationClick = (dest: Destination) => {
    setSelectedInfo({
      type: 'destination',
      title: dest.name,
      subtitle: `${dest.type} • ${dest.region} Region`,
      details: [
        { label: 'Facility Type', value: dest.type },
        { label: 'Licensed Capacity', value: `${dest.capacityUnits.toLocaleString()} units` },
        { label: 'Cold-Chain Capable', value: dest.hasColdChain ? 'Yes (2-8°C Reefer)' : 'No' },
        { label: 'Pharma License', value: dest.hasPharmaLicense ? 'Schedule H / GDP' : 'General FMCG' },
        { label: 'Stockout Risk Alert', value: dest.type === 'Pharmacy' ? 'Low' : 'Stable' }
      ]
    });
    if (onSelectNode) onSelectNode({ type: 'destination', data: dest });
  };

  return (
    <div className="relative w-full h-[520px] bg-gradient-to-b from-slate-950 via-slate-900 to-navy-900 rounded-2xl overflow-hidden border border-slate-800 shadow-2xl">
      {/* 3D Canvas */}
      <Canvas camera={{ position: [0, 16, 18], fov: 42 }}>
        <ambientLight intensity={0.7} />
        <directionalLight position={[10, 20, 10]} intensity={1.2} castShadow />
        <pointLight position={[-10, 15, -10]} intensity={0.5} color="#38BDF8" />

        {/* Ground Logistics Grid Floor */}
        <gridHelper args={[34, 34, '#334155', '#1E293B']} position={[0, -0.01, 0]} />

        {/* Render Warehouses */}
        {warehouses.map(wh => (
          <WarehouseBuilding
            key={wh.id}
            warehouse={wh}
            onClick={() => handleWarehouseClick(wh)}
          />
        ))}

        {/* Render Destinations */}
        {destinations.slice(0, 24).map(dest => (
          <DestinationNode
            key={dest.id}
            destination={dest}
            onClick={() => handleDestinationClick(dest)}
          />
        ))}

        {/* Render Animated Routes & Moving Delivery Trucks */}
        {showRoutes && routesToRender.map((route, idx) => (
          <React.Fragment key={`route-${idx}`}>
            <RouteLine
              start={route.sourceCoord}
              end={route.destCoord}
              isColdChain={route.isColdChain}
              isPharma={route.isPharma}
            />
            <MovingTruck
              start={route.sourceCoord}
              end={route.destCoord}
              isColdChain={route.isColdChain}
              isPharma={route.isPharma}
              speed={0.45 + (idx % 3) * 0.15}
            />
          </React.Fragment>
        ))}

        <OrbitControls
          enableDamping
          dampingFactor={0.05}
          maxPolarAngle={Math.PI / 2.1}
          minDistance={6}
          maxDistance={35}
        />
      </Canvas>

      {/* Floating 3D Legend */}
      <div className="absolute top-4 left-4 bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-xl p-3 text-xs text-white shadow-xl pointer-events-auto">
        <div className="font-semibold text-slate-200 mb-2 flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse"></span>
          Maharashtra Supply Chain 3D Network
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-[11px] text-slate-300">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-blue-500"></span>
            Mega Warehouses (5)
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-purple-500"></span>
            Pharmacies / GDP (18)
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-teal-500"></span>
            FMCG Retail / Stores (22)
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-cyan-400"></span>
            Cold-Chain Reefer Route
          </div>
        </div>
      </div>

      {/* Selected Node Details Panel Modal Overlay */}
      {selectedInfo && (
        <div className="absolute bottom-4 right-4 max-w-sm w-full bg-slate-900/95 backdrop-blur-md border border-blue-500/40 rounded-xl p-4 text-white shadow-2xl animate-in fade-in duration-200">
          <div className="flex justify-between items-start pb-2 border-b border-slate-800">
            <div>
              <h4 className="font-bold text-sm text-blue-400">{selectedInfo.title}</h4>
              <p className="text-[11px] text-slate-400">{selectedInfo.subtitle}</p>
            </div>
            <button
              onClick={() => setSelectedInfo(null)}
              className="text-slate-400 hover:text-white text-xs px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700"
            >
              ✕
            </button>
          </div>
          <div className="mt-3 space-y-1.5">
            {selectedInfo.details.map((d: any, idx: number) => (
              <div key={idx} className="flex justify-between text-xs">
                <span className="text-slate-400">{d.label}:</span>
                <span className="font-medium text-slate-100">{d.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Camera Guidance Controls */}
      <div className="absolute bottom-3 left-4 text-[11px] text-slate-400 bg-slate-900/70 px-3 py-1.5 rounded-lg border border-slate-800 backdrop-blur-sm">
        Left Click: Rotate • Right Click: Pan • Scroll: Zoom
      </div>
    </div>
  );
};
