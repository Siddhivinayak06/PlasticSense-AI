"use client";
import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { Edges, Text, Float, Environment, Lightformer } from "@react-three/drei";
import * as THREE from "three";

/* ── Realistic bottle with cap, body, ridges, and label using lathe geometry ── */
function Bottle() {
  const bottleGeom = useMemo(() => {
    const pts: THREE.Vector2[] = [];
    
    // Base
    pts.push(new THREE.Vector2(0, -0.9));
    pts.push(new THREE.Vector2(0.28, -0.9));
    pts.push(new THREE.Vector2(0.3, -0.85));

    // Lower body ridges (5 ridges for structural integrity like real PET bottles)
    for (let i = 0; i < 5; i++) {
      const y1 = -0.85 + i * 0.1;
      const y2 = -0.80 + i * 0.1;
      pts.push(new THREE.Vector2(0.32, y1)); // Ridge peak
      pts.push(new THREE.Vector2(0.28, y2)); // Ridge valley
    }

    // Label area (Smooth straight cylinder section)
    pts.push(new THREE.Vector2(0.31, -0.35));
    pts.push(new THREE.Vector2(0.31, 0.25));

    // Upper body ridges
    for (let i = 0; i < 2; i++) {
      const y1 = 0.25 + i * 0.1;
      const y2 = 0.30 + i * 0.1;
      pts.push(new THREE.Vector2(0.31, y1));
      pts.push(new THREE.Vector2(0.28, y2));
    }

    // Shoulder curve up to the neck
    pts.push(new THREE.Vector2(0.31, 0.45));
    pts.push(new THREE.Vector2(0.25, 0.55));
    pts.push(new THREE.Vector2(0.18, 0.65));
    pts.push(new THREE.Vector2(0.13, 0.75));

    // Neck
    pts.push(new THREE.Vector2(0.13, 0.75));
    pts.push(new THREE.Vector2(0.13, 0.92));

    // Lip ring
    pts.push(new THREE.Vector2(0.16, 0.93));
    pts.push(new THREE.Vector2(0.16, 0.97));
    pts.push(new THREE.Vector2(0.13, 0.98));
    pts.push(new THREE.Vector2(0, 0.98));
    
    // Use 64 segments for high-poly smoothness
    return new THREE.LatheGeometry(pts, 64); 
  }, []);

  const capGeom = useMemo(() => {
    const pts: THREE.Vector2[] = [];
    pts.push(new THREE.Vector2(0, 0.98));
    pts.push(new THREE.Vector2(0.165, 0.98));
    pts.push(new THREE.Vector2(0.165, 1.1));
    pts.push(new THREE.Vector2(0.14, 1.12));
    pts.push(new THREE.Vector2(0, 1.12));
    return new THREE.LatheGeometry(pts, 32);
  }, []);

  return (
    <group>
      {/* Bottle body – Crystal clear PET plastic */}
      <mesh geometry={bottleGeom}>
        <meshPhysicalMaterial
          color="#ffffff"
          transparent
          opacity={1}
          roughness={0.05}
          metalness={0.05}
          clearcoat={1}
          clearcoatRoughness={0.05}
          transmission={1.0} 
          thickness={0.5}
          ior={1.5}
          envMapIntensity={2.5}
          side={THREE.DoubleSide}
        />
      </mesh>
      
      {/* Bottle cap – Dark blue plastic */}
      <mesh geometry={capGeom}>
        <meshStandardMaterial color="#1e3a8a" roughness={0.6} metalness={0.1} />
      </mesh>

      {/* Label wrapped around the middle */}
      <mesh position={[0, -0.05, 0]}>
        <cylinderGeometry args={[0.312, 0.312, 0.6, 64]} />
        <meshStandardMaterial 
          color="#fda4af" // Rose/peach color matching the aesthetic of the reference label
          roughness={0.4} 
          metalness={0.1}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}

/* ── Scanning laser plane with glow ── */
function ScanLaser() {
  const ref = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const y = Math.sin(state.clock.elapsedTime * 1.8) * 1.0;
    if (ref.current) ref.current.position.y = y;
    if (glowRef.current) glowRef.current.position.y = y;
  });

  return (
    <group>
      <group ref={ref}>
        <mesh>
          <boxGeometry args={[1.2, 0.005, 1.2]} />
          <meshBasicMaterial color="#ef4444" transparent opacity={0.15} side={THREE.DoubleSide} />
          <Edges scale={1.0} color="#ef4444" />
        </mesh>
      </group>
      {/* Glow halo */}
      <mesh ref={glowRef}>
        <boxGeometry args={[1.3, 0.05, 1.3]} />
        <meshBasicMaterial color="#ef4444" transparent opacity={0.05} />
      </mesh>
    </group>
  );
}

/* ── Corner brackets for bounding box ── */
function BoundingBoxCorners({ size }: { size: [number, number, number] }) {
  const [w, h, d] = size;
  const hw = w / 2, hh = h / 2, hd = d / 2;
  const len = 0.2;
  const thick = 0.015;
  const color = "#10b981";

  const corners = [
    [-hw, hh, hd], [hw, hh, hd], [-hw, -hh, hd], [hw, -hh, hd],
    [-hw, hh, -hd], [hw, hh, -hd], [-hw, -hh, -hd], [hw, -hh, -hd],
  ] as [number, number, number][];

  return (
    <group>
      {corners.map((pos, i) => {
        const sx = pos[0] < 0 ? 1 : -1;
        const sy = pos[1] < 0 ? 1 : -1;
        const sz = pos[2] < 0 ? 1 : -1;
        return (
          <group key={i} position={pos}>
            {/* X arm */}
            <mesh position={[sx * len / 2, 0, 0]}>
              <boxGeometry args={[len, thick, thick]} />
              <meshBasicMaterial color={color} />
            </mesh>
            {/* Y arm */}
            <mesh position={[0, sy * len / 2, 0]}>
              <boxGeometry args={[thick, len, thick]} />
              <meshBasicMaterial color={color} />
            </mesh>
            {/* Z arm */}
            <mesh position={[0, 0, sz * len / 2]}>
              <boxGeometry args={[thick, thick, len]} />
              <meshBasicMaterial color={color} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

/* ── Floating data readout ── */
function DataReadout() {
  return (
    <Float speed={2} floatIntensity={0.3}>
      <group position={[1.1, 0.6, 0]}>
        {/* Background panel */}
        <mesh>
          <planeGeometry args={[2.0, 1.1]} />
          <meshBasicMaterial color="#020617" transparent opacity={0.75} />
        </mesh>
        {/* Border */}
        <mesh>
          <planeGeometry args={[2.03, 1.13]} />
          <meshBasicMaterial color="#10b981" transparent opacity={0.4} />
        </mesh>
        {/* Text labels */}
        <Text position={[-0.75, 0.35, 0.01]} fontSize={0.12} color="#10b981" anchorX="left" fontWeight="bold">
          ● DETECTED
        </Text>
        <Text position={[-0.75, 0.1, 0.01]} fontSize={0.11} color="#f8fafc" anchorX="left">
          Class: PET Bottle
        </Text>
        <Text position={[-0.75, -0.1, 0.01]} fontSize={0.11} color="#f8fafc" anchorX="left">
          Confidence: 98.7%
        </Text>
        <Text position={[-0.75, -0.3, 0.01]} fontSize={0.11} color="#f8fafc" anchorX="left">
          Material: Plastic
        </Text>
      </group>
    </Float>
  );
}

/* ── Main scanner component ── */
export function YoloScanner() {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((_state, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.25;
    }
  });

  return (
    <>
      <ambientLight intensity={1.5} />
      <directionalLight position={[5, 5, 5]} intensity={2.5} color="#f0f9ff" />
      <directionalLight position={[-5, 5, -5]} intensity={1.0} color="#0ea5e9" />
      <pointLight position={[-3, -2, 3]} intensity={1.0} color="#0ea5e9" />
      <spotLight position={[0, 5, 0]} angle={0.4} penumbra={0.8} intensity={2} color="#22d3ee" />

      {/* Procedural synchronous environment for beautiful glass reflections (no network requests) */}
      <Environment resolution={128}>
        <group rotation={[-Math.PI / 4, -0.3, 0]}>
          <Lightformer intensity={4} rotation-x={Math.PI / 2} position={[0, 5, -9]} scale={[10, 10, 1]} />
          <Lightformer intensity={2} rotation-y={Math.PI / 2} position={[-5, 1, -1]} scale={[20, 2, 1]} />
          <Lightformer intensity={2} rotation-y={Math.PI / 2} position={[5, 1, -1]} scale={[20, 2, 1]} />
          <Lightformer intensity={2} rotation-y={-Math.PI / 2} position={[10, 1, 0]} scale={[20, 10, 1]} />
        </group>
      </Environment>

      <group ref={groupRef} scale={1.5}>
        <Bottle />
        <ScanLaser />
        {/* Bounding box corners */}
        <BoundingBoxCorners size={[1.0, 2.4, 1.0]} />
        {/* Wireframe overlay */}
        <mesh position={[0, 0.05, 0]}>
          <boxGeometry args={[1.0, 2.4, 1.0]} />
          <meshBasicMaterial visible={false} />
          <Edges scale={1} color="#10b981" lineWidth={0.5} />
        </mesh>
      </group>

      <DataReadout />
    </>
  );
}
