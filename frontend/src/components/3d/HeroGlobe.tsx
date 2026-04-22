"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { Stars, OrbitControls, PerspectiveCamera } from "@react-three/drei";
import * as THREE from "three";
import Canvas3D from "./Canvas3D";

/** Animated arc between two 3D points on sphere surface */
function GlobeArc({ start, end }: { start: THREE.Vector3; end: THREE.Vector3 }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const curve = useMemo(() => {
    const mid = start.clone().add(end).multiplyScalar(0.5).normalize().multiplyScalar(1.9);
    return new THREE.QuadraticBezierCurve3(start, mid, end);
  }, [start, end]);
  const points = useMemo(() => curve.getPoints(50), [curve]);
  const geometry = useMemo(() => new THREE.BufferGeometry().setFromPoints(points), [points]);

  useFrame(({ clock }) => {
    if (meshRef.current) {
      // @ts-ignore
      meshRef.current.material.dashOffset = -clock.getElapsedTime() * 0.5;
    }
  });

  return (
    <primitive object={new THREE.Line(geometry)} ref={meshRef}>
      <lineDashedMaterial color="#378ADD" dashSize={0.1} gapSize={0.1} opacity={0.6} transparent />
    </primitive>
  );
}

/** 2000-particle star field on sphere surface */
function GlobeParticles() {
  const count = 2000;
  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 1.45 + Math.random() * 0.5;
      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = r * Math.cos(phi);
    }
    return pos;
  }, []);

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial size={0.015} color="#60A5FA" transparent opacity={0.6} sizeAttenuation blending={THREE.AdditiveBlending} />
    </points>
  );
}

function Globe() {
  const meshRef = useRef<THREE.Mesh>(null);
  const arcs = useMemo(() => {
    const a = [];
    for (let i = 0; i < 8; i++) {
      const s = new THREE.Vector3(
        (Math.random() - 0.5) * 2.8, (Math.random() - 0.5) * 2.8, (Math.random() - 0.5) * 2.8
      ).normalize().multiplyScalar(1.42);
      const e = new THREE.Vector3(
        (Math.random() - 0.5) * 2.8, (Math.random() - 0.5) * 2.8, (Math.random() - 0.5) * 2.8
      ).normalize().multiplyScalar(1.42);
      a.push({ start: s, end: e });
    }
    return a;
  }, []);

  useFrame((_, delta) => {
    if (meshRef.current) meshRef.current.rotation.y += 0.003;
  });

  return (
    <group>
      <mesh ref={meshRef}>
        <sphereGeometry args={[1.4, 64, 64]} />
        <meshStandardMaterial color="#0a0a0a" roughness={0.7} metalness={0.3} wireframe={false} />
      </mesh>
      {/* Teal continent overlay */}
      <mesh>
        <sphereGeometry args={[1.42, 32, 32]} />
        <meshStandardMaterial color="#378ADD" roughness={0.5} wireframe transparent opacity={0.15} />
      </mesh>
      {arcs.map((arc, i) => <GlobeArc key={i} {...arc} />)}
      <GlobeParticles />
    </group>
  );
}

export default function HeroGlobe() {
  return (
    <Canvas3D height={520}>
      <PerspectiveCamera makeDefault fov={60} position={[0, 0, 3.5]} />
      <ambientLight intensity={0.3} />
      <pointLight position={[3, 2, 3]} color="#378ADD" intensity={3} />
      <pointLight position={[-3, -2, -3]} color="#0a0a0a" intensity={2} />
      <Globe />
      <Stars radius={80} depth={40} count={3000} factor={3} saturation={0} fade speed={0.5} />
      <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={0.3} />
    </Canvas3D>
  );
}
