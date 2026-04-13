"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { Text } from "@react-three/drei";
import * as THREE from "three";
import Canvas3D from "./Canvas3D";

interface ScoreRing3DProps {
  scores: {
    relevance: number;    // 0-10
    accuracy: number;
    clarity: number;
    completeness: number;
  };
}

const SEGMENT_CONFIG = [
  { key: "relevance" as const,     color: "#378ADD", label: "Relevance" },
  { key: "accuracy" as const,      color: "#378ADD", label: "Accuracy" },
  { key: "clarity" as const,       color: "#8B5CF6", label: "Clarity" },
  { key: "completeness" as const,  color: "#F59E0B", label: "Completeness" },
] as const;

function ScoreArc({
  score, color, label, startAngle, arcLength,
}: { score: number; color: string; label: string; startAngle: number; arcLength: number }) {
  const ref = useRef<THREE.Mesh>(null);
  const t = useRef(0);

  // Pre-compute arc geometry points
  const points = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    const segments = Math.max(4, Math.floor(arcLength * 50));
    for (let i = 0; i <= segments; i++) {
      const angle = startAngle + (arcLength * i) / segments;
      pts.push(new THREE.Vector3(Math.cos(angle), Math.sin(angle), 0).multiplyScalar(1));
    }
    return pts;
  }, [startAngle, arcLength]);

  const geometry = useMemo(() => new THREE.BufferGeometry().setFromPoints(points), [points]);

  useFrame((_, delta) => {
    t.current += delta;
    if (ref.current) {
      const mat = ref.current.material as any;
      if (mat.emissiveIntensity !== undefined) {
        mat.emissiveIntensity = 0.5 + Math.sin(t.current * 2) * 0.2;
      }
    }
  });

  const midAngle = startAngle + arcLength / 2;
  const labelPos = new THREE.Vector3(Math.cos(midAngle) * 1.5, Math.sin(midAngle) * 1.5, 0);

  return (
    <group>
      <mesh ref={ref} rotation={[0, 0, startAngle]}>
        <torusGeometry args={[1, 0.12, 32, 200, arcLength]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.5} roughness={0.2} metalness={0.8} />
      </mesh>
      <Text
        position={labelPos}
        fontSize={0.12}
        color="#FFFFFF"
        anchorX="center"
        anchorY="middle"
      >
        {`${label}\n${score.toFixed(1)}`}
      </Text>
    </group>
  );
}

export default function ScoreRing3D({ scores }: ScoreRing3DProps) {
  const overall = Object.values(scores).reduce((a, b) => a + b, 0) / 4;

  const arcs = useMemo(() => {
    const total = Object.values(scores).reduce((a, b) => a + b, 0);
    let angle = 0;
    return SEGMENT_CONFIG.map(({ key, color, label }) => {
      const frac = total > 0 ? scores[key] / total : 0.25;
      const arcLength = frac * Math.PI * 2 * 0.95; // 5% gap
      const start = angle;
      angle += arcLength + Math.PI * 2 * 0.05 / 4;
      return { score: scores[key], color, label, startAngle: start, arcLength };
    });
  }, [scores]);

  return (
    <Canvas3D height={400}>
      <ambientLight intensity={0.3} />
      <pointLight position={[0, 0, 5]} color="#ffffff" intensity={2} />
      {arcs.map((arc, i) => <ScoreArc key={i} {...arc} />)}
      <Text fontSize={0.4} color="#FFFFFF" fontWeight="bold" anchorX="center" anchorY="middle">
        {overall.toFixed(1)}
      </Text>
      <Text position={[0, -0.5, 0]} fontSize={0.12} color="#60A5FA" anchorX="center">
        / 10
      </Text>
    </Canvas3D>
  );
}
