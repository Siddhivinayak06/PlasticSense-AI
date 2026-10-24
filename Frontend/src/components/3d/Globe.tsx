"use client";

import { useRef, useMemo } from "react";
import { useMounted } from '@/hooks/useMounted';
import { useTheme } from "next-themes";
import { useFrame, useLoader } from "@react-three/fiber";
import * as THREE from "three";

/* ── Hotspot coordinates & pulsing marker ── */
interface HotspotData {
  lat: number;
  lon: number;
  color: string;
  intensity: number;
  label: string;
}

function latLonToXYZ(lat: number, lon: number, radius: number): [number, number, number] {
  const phi = ((90 - lat) * Math.PI) / 180;
  const theta = ((lon + 180) * Math.PI) / 180;
  return [
    -(radius * Math.sin(phi) * Math.cos(theta)),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta),
  ];
}

function Hotspot({ data, radius = 2.02 }: { data: HotspotData; radius?: number }) {
  const ref = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const pos = latLonToXYZ(data.lat, data.lon, radius);

  const normal = useMemo(() => new THREE.Vector3(...pos).normalize(), [pos]);
  const quaternion = useMemo(() => {
    const q = new THREE.Quaternion();
    q.setFromUnitVectors(new THREE.Vector3(0, 0, 1), normal);
    return q;
  }, [normal]);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (ref.current) {
      const s = 1 + Math.sin(t * 2.5 + data.lat) * 0.25;
      ref.current.scale.setScalar(s);
    }
    if (ringRef.current) {
      const pulse = 1 + Math.sin(t * 1.8 + data.lon) * 0.6;
      ringRef.current.scale.setScalar(pulse);
      (ringRef.current.material as THREE.MeshBasicMaterial).opacity = 0.5 - pulse * 0.18;
    }
  });

  const size = 0.025 + data.intensity * 0.035;

  return (
    <group position={pos}>
      <mesh ref={ref}>
        <sphereGeometry args={[size, 12, 12]} />
        <meshBasicMaterial color={data.color} />
      </mesh>
      <mesh ref={ringRef} quaternion={quaternion}>
        <ringGeometry args={[size * 2, size * 3, 32]} />
        <meshBasicMaterial
          color={data.color}
          transparent
          opacity={0.3}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}

const HOTSPOTS: HotspotData[] = [
  { lat: 28.61, lon: 77.23, color: "#ef4444", intensity: 0.9, label: "New Delhi" },
  { lat: 19.08, lon: 72.88, color: "#ef4444", intensity: 0.95, label: "Mumbai" },
  { lat: 13.08, lon: 80.27, color: "#f59e0b", intensity: 0.7, label: "Chennai" },
  { lat: 23.81, lon: 90.41, color: "#ef4444", intensity: 0.85, label: "Dhaka" },
  { lat: -6.2, lon: 106.85, color: "#ef4444", intensity: 0.9, label: "Jakarta" },
  { lat: 14.6, lon: 120.98, color: "#f59e0b", intensity: 0.75, label: "Manila" },
  { lat: 31.23, lon: 121.47, color: "#f59e0b", intensity: 0.6, label: "Shanghai" },
  { lat: 6.52, lon: 3.38, color: "#f97316", intensity: 0.8, label: "Lagos" },
  { lat: -23.55, lon: -46.63, color: "#f59e0b", intensity: 0.65, label: "São Paulo" },
  { lat: 40.71, lon: -74.01, color: "#10b981", intensity: 0.4, label: "New York" },
  { lat: 51.51, lon: -0.13, color: "#10b981", intensity: 0.35, label: "London" },
  { lat: 35.68, lon: 139.69, color: "#10b981", intensity: 0.3, label: "Tokyo" },
  { lat: -33.87, lon: 151.21, color: "#22d3ee", intensity: 0.25, label: "Sydney" },
  { lat: 25.28, lon: 51.52, color: "#f59e0b", intensity: 0.5, label: "Doha" },
  { lat: 1.35, lon: 103.82, color: "#10b981", intensity: 0.3, label: "Singapore" },
];

interface InteractiveGlobeProps {
  isLightMode?: boolean;
}

/* ═══════════════════════════════════════════════
   Main Interactive Globe (Minimal & Natural)
   ═══════════════════════════════════════════════ */
export function InteractiveGlobe({ isLightMode: isLightModeProp }: InteractiveGlobeProps = {}) {
  const earthRef = useRef<THREE.Mesh>(null);
  const cloudsRef = useRef<THREE.Mesh>(null);
  const hotspotsRef = useRef<THREE.Group>(null);

  const { resolvedTheme } = useTheme();
  const mounted = useMounted();
  const mountedLight = mounted && resolvedTheme === "light";

  const isLightMode = isLightModeProp !== undefined ? isLightModeProp : mountedLight;

  // Load all textures
  const [earthMap, bumpMap, cloudsMap] = useLoader(THREE.TextureLoader, [
    "/textures/earth-blue-marble.jpg",
    "/textures/earth-topology.png",
    "/textures/earth-clouds.png",
  ]);

  // Configuring loaded three.js textures in place is the standard R3F pattern;
  // these are GPU resources owned by the loader cache, not React state.
  useMemo(() => {
    /* eslint-disable react-hooks/immutability */
    earthMap.colorSpace = THREE.SRGBColorSpace;
    earthMap.anisotropy = 8;
    cloudsMap.colorSpace = THREE.SRGBColorSpace;
    /* eslint-enable react-hooks/immutability */
  }, [earthMap, cloudsMap]);

  useFrame((_state, delta) => {
    const speed = delta * 0.06;
    if (earthRef.current) earthRef.current.rotation.y += speed;
    if (cloudsRef.current) cloudsRef.current.rotation.y += speed * 1.15;
    if (hotspotsRef.current) hotspotsRef.current.rotation.y += speed;
  });

  return (
    <>
      {/* ── Realistic Natural Sunlight & Ambient Fill ── */}
      {/* Soft sky/ocean fill light eliminates deep black shadows without glare */}
      <hemisphereLight
        color="#ffffff"
        groundColor={isLightMode ? "#7dd3fc" : "#0f172a"}
        intensity={isLightMode ? 1.4 : 0.6}
      />

      {/* Sun key-light positioned at a realistic angle to prevent camera-flash glare */}
      <directionalLight
        position={[3.5, 2.5, 4.5]}
        intensity={isLightMode ? 2.4 : 1.8}
        color="#fffaf0"
      />

      {/* Soft ambient light for natural global daylight visibility */}
      <ambientLight
        intensity={isLightMode ? 1.6 : 0.6}
        color="#ffffff"
      />

      {/* Subtle fill light from opposite angle to softly light shadowed contours */}
      <directionalLight
        position={[-3.5, 1, 3]}
        intensity={isLightMode ? 1.2 : 0.5}
        color="#e0f2fe"
      />

      {/* ── Earth Surface (Authentic NASA Blue Marble - Matte & Glare-Free) ── */}
      <mesh ref={earthRef}>
        <sphereGeometry args={[2, 64, 64]} />
        <meshStandardMaterial
          map={earthMap}
          bumpMap={bumpMap}
          bumpScale={0.015}
          roughness={0.88}
          metalness={0.0}
        />
      </mesh>

      {/* ── Cloud Layer (Wispy, Delicate, Semi-Transparent) ── */}
      <mesh ref={cloudsRef}>
        <sphereGeometry args={[2.016, 64, 64]} />
        <meshStandardMaterial
          map={cloudsMap}
          transparent
          opacity={0.34}
          depthWrite={false}
          roughness={0.92}
          metalness={0.0}
        />
      </mesh>

      {/* Hotspots */}
      <group ref={hotspotsRef}>
        {HOTSPOTS.map((h) => (
          <Hotspot key={h.label} data={h} />
        ))}
      </group>
    </>
  );
}
