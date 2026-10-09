"use client";
import { useRef, useMemo } from "react";
import { useFrame, useLoader } from "@react-three/fiber";
import { Points, PointMaterial } from "@react-three/drei";
import * as THREE from "three";

/* ═══════════════════════════════════════════════
   Atmospheric Glow Shaders
   Fresnel-based edge glow simulating atmosphere
   ═══════════════════════════════════════════════ */
const atmosphereVertexShader = `
  varying vec3 vNormal;
  varying vec3 vPosition;
  void main() {
    vNormal = normalize(normalMatrix * normal);
    vPosition = (modelViewMatrix * vec4(position, 1.0)).xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const atmosphereFragmentShader = `
  varying vec3 vNormal;
  varying vec3 vPosition;
  void main() {
    vec3 viewDir = normalize(-vPosition);
    float fresnel = dot(viewDir, vNormal);
    fresnel = clamp(1.0 - fresnel, 0.0, 1.0);
    fresnel = pow(fresnel, 3.0);
    vec3 color = mix(vec3(0.1, 0.4, 1.0), vec3(0.3, 0.7, 1.0), fresnel);
    gl_FragColor = vec4(color, clamp(fresnel * 0.7, 0.0, 1.0));
  }
`;

/* ── Outer atmospheric halo (bigger, softer glow) ── */
const outerGlowVertexShader = `
  varying vec3 vNormal;
  varying vec3 vPosition;
  void main() {
    vNormal = normalize(normalMatrix * normal);
    vPosition = (modelViewMatrix * vec4(position, 1.0)).xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const outerGlowFragmentShader = `
  varying vec3 vNormal;
  varying vec3 vPosition;
  void main() {
    vec3 viewDir = normalize(-vPosition);
    float fresnel = dot(viewDir, vNormal);
    fresnel = clamp(1.0 - fresnel, 0.0, 1.0);
    fresnel = pow(fresnel, 4.0);
    vec3 color = vec3(0.15, 0.45, 1.0);
    gl_FragColor = vec4(color, clamp(fresnel * 0.6, 0.0, 1.0));
  }
`;

/* ── Star field background ── */
function StarField({ count = 2500 }) {
  const positions = useMemo(() => {
    const p = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const spread = 80;
      p[i * 3] = (Math.random() - 0.5) * spread;
      p[i * 3 + 1] = (Math.random() - 0.5) * spread;
      p[i * 3 + 2] = -Math.random() * spread; // Push behind the globe
    }
    return p;
  }, [count]);

  const sizes = useMemo(() => {
    const s = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      s[i] = 0.02 + Math.random() * 0.06;
    }
    return s;
  }, [count]);

  return (
    <Points positions={positions}>
      <PointMaterial
        transparent
        color="#ffffff"
        size={0.06}
        sizeAttenuation
        depthWrite={false}
        opacity={0.8}
      />
    </Points>
  );
}

/* ── Animated hotspot with pulse ring ── */
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

  // Compute normal to orient the ring flat against the globe surface
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
      {/* Core glowing dot */}
      <mesh ref={ref}>
        <sphereGeometry args={[size, 12, 12]} />
        <meshBasicMaterial color={data.color} />
      </mesh>
      {/* Pulse ring aligned to surface */}
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

/* ── Hotspot data (real-world pollution coordinates) ── */
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

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

/* ═══════════════════════════════════════════════
   Main Interactive Globe
   ═══════════════════════════════════════════════ */
export function InteractiveGlobe() {
  const earthRef = useRef<THREE.Mesh>(null);
  const cloudsRef = useRef<THREE.Mesh>(null);
  const hotspotsRef = useRef<THREE.Group>(null);
  
  const { resolvedTheme } = useTheme();
  const [isLightMode, setIsLightMode] = useState(false);

  useEffect(() => {
    setIsLightMode(resolvedTheme === "light");
  }, [resolvedTheme]);

  // Load all textures
  const [earthMap, bumpMap, cloudsMap] = useLoader(THREE.TextureLoader, [
    "/textures/earth-blue-marble.jpg",
    "/textures/earth-topology.png",
    "/textures/earth-clouds.png",
  ]);

  // Configure texture quality
  useMemo(() => {
    earthMap.colorSpace = THREE.SRGBColorSpace;
    earthMap.anisotropy = 8;
    cloudsMap.colorSpace = THREE.SRGBColorSpace;
  }, [earthMap, cloudsMap]);

  // Atmosphere glow materials
  const atmosphereMaterial = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: atmosphereVertexShader,
        fragmentShader: atmosphereFragmentShader,
        transparent: true,
        side: THREE.FrontSide,
        depthWrite: false,
        blending: isLightMode ? THREE.NormalBlending : THREE.AdditiveBlending,
      }),
    [isLightMode]
  );

  const outerGlowMaterial = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: outerGlowVertexShader,
        fragmentShader: outerGlowFragmentShader,
        transparent: true,
        side: THREE.BackSide,
        depthWrite: false,
        blending: isLightMode ? THREE.NormalBlending : THREE.AdditiveBlending,
      }),
    [isLightMode]
  );

  useFrame((_state, delta) => {
    const speed = delta * 0.06;
    if (earthRef.current) earthRef.current.rotation.y += speed;
    if (cloudsRef.current) cloudsRef.current.rotation.y += speed * 1.15;
    if (hotspotsRef.current) hotspotsRef.current.rotation.y += speed;
  });

  return (
    <>
      {/* Stars - Only show in dark mode */}
      {!isLightMode && <StarField />}

      {/* Lighting - Perfectly bright and front-lit like globe.gl */}
      <ambientLight intensity={isLightMode ? 2.0 : 0.4} />
      <directionalLight position={[0, 0, 5]} intensity={isLightMode ? 3.0 : 2.5} color="#ffffff" />
      <directionalLight position={[-5, 3, 5]} intensity={isLightMode ? 1.0 : 0.5} color="#cceeff" />

      {/* ── Earth Surface ── */}
      <mesh ref={earthRef}>
        <sphereGeometry args={[2, 64, 64]} />
        <meshPhongMaterial
          map={earthMap}
          bumpMap={bumpMap}
          bumpScale={0.03}
          specularMap={bumpMap}
          specular={new THREE.Color("#222233")}
          shininess={15}
        />
      </mesh>

      {/* ── Cloud Layer ── */}
      <mesh ref={cloudsRef}>
        <sphereGeometry args={[2.015, 64, 64]} />
        <meshPhongMaterial
          map={cloudsMap}
          transparent
          opacity={0.75}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* ── Hotspots ── */}
      <group ref={hotspotsRef}>
        {HOTSPOTS.map((h) => (
          <Hotspot key={h.label} data={h} />
        ))}
      </group>
    </>
  );
}
