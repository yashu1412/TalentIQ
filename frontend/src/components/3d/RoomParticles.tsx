"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import Canvas3D from "./Canvas3D";

const PARTICLE_COUNT = 3000;

function SpiralParticles() {
  const ref = useRef<THREE.Points>(null);
  const t = useRef(0);

  const { positions, colors } = useMemo(() => {
    const pos = new Float32Array(PARTICLE_COUNT * 3);
    const col = new Float32Array(PARTICLE_COUNT * 3);
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const angle = (i / PARTICLE_COUNT) * Math.PI * 2 * 10;
      const radius = 2 + (Math.random() - 0.5) * 3;
      const height = (Math.random() - 0.5) * 6;
      pos[i * 3] = Math.cos(angle) * radius;
      pos[i * 3 + 1] = height;
      pos[i * 3 + 2] = Math.sin(angle) * radius;

      // Teal with ±20° hue variation
      const hue = 175 + (Math.random() - 0.5) * 40;
      const c = new THREE.Color(`hsl(${hue}, 70%, 50%)`);
      col[i * 3] = c.r;
      col[i * 3 + 1] = c.g;
      col[i * 3 + 2] = c.b;
    }
    return { positions: pos, colors: col };
  }, []);

  useFrame((_, delta) => {
    t.current += delta;
    if (!ref.current) return;
    ref.current.rotation.y += 0.002;
    ref.current.rotation.x = Math.sin(t.current * 0.1) * 0.05;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={PARTICLE_COUNT} array={positions} itemSize={3} />
        <bufferAttribute attach="attributes-color" count={PARTICLE_COUNT} array={colors} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial size={0.025} vertexColors transparent opacity={0.7} sizeAttenuation blending={THREE.AdditiveBlending} depthWrite={false} />
    </points>
  );
}

export default function RoomParticles() {
  return (
    <div className="fixed inset-0" style={{ zIndex: -1, pointerEvents: "none" }}>
      <Canvas3D height={typeof window !== "undefined" ? window.innerHeight : 800} className="w-full h-full">
        <ambientLight intensity={0.1} />
        <SpiralParticles />
      </Canvas3D>
    </div>
  );
}
