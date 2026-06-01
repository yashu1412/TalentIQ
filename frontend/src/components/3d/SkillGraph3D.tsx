"use client";

import { useRef, useMemo, useCallback } from "react";
import { useFrame } from "@react-three/fiber";
import { Billboard, Text, OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import Canvas3D from "./Canvas3D";

interface SkillNode {
  name: string;
  type: "matched" | "missing" | "bonus";
  importance?: number;
}

interface SkillGraph3DProps {
  matchData: {
    matched?: string[] | { matched: number; total: number };
    missing?: string[];
    bonus?: string[];
    matchScore?: number;
  };
}

const TYPE_COLOR = { matched: "#378ADD", missing: "#F43F5E", bonus: "#F59E0B" } as const;

function SkillNodeMesh({
  name, type, position, importance, onClick,
}: { name: string; type: keyof typeof TYPE_COLOR; position: THREE.Vector3; importance: number; onClick: (n: string) => void }) {
  const ref = useRef<THREE.Mesh>(null);
  const color = TYPE_COLOR[type];
  const radius = 0.08 + importance * 0.17;

  useFrame((_, delta) => {
    if (!ref.current) return;
    ref.current.position.y += Math.sin(Date.now() * 0.001 + position.x) * 0.001;
  });

  return (
    <group position={position}>
      <mesh ref={ref} onClick={() => onClick(name)}>
        <sphereGeometry args={[radius, 16, 16]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.5} roughness={0.3} metalness={0.6} />
      </mesh>
      <Billboard>
        <Text fontSize={0.1} color="#FFFFFF" anchorX="center" anchorY="bottom" position={[0, radius + 0.05, 0]}>
          {name}
        </Text>
      </Billboard>
    </group>
  );
}

function CenterOrb({ score }: { score: number }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame(() => {
    if (ref.current) ref.current.rotation.y += 0.005;
  });
  const color = score >= 70 ? "#378ADD" : score >= 40 ? "#F59E0B" : "#F43F5E";
  return (
    <group>
      <mesh ref={ref}>
        <sphereGeometry args={[0.5, 32, 32]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.8} transparent opacity={0.9} />
      </mesh>
      <Billboard>
        <Text fontSize={0.25} color="#FFFFFF" fontWeight="bold" anchorX="center" anchorY="middle">
          {score}%
        </Text>
      </Billboard>
    </group>
  );
}

export default function SkillGraph3D({ matchData }: SkillGraph3DProps) {
  const allNodes: Array<{
    name: string;
    type: "matched" | "missing" | "bonus";
    importance: number;
    position: THREE.Vector3;
  }> = useMemo(() => {
    // Handle both array and count formats for matched skills
    const matchedArray = Array.isArray(matchData.matched) ? matchData.matched : [];
    const missingArray = Array.isArray(matchData.missing) ? matchData.missing : [];
    const bonusArray = Array.isArray(matchData.bonus) ? matchData.bonus : [];
    
    const all = [
      ...matchedArray.map(n => ({ name: n, type: "matched" as const })),
      ...missingArray.map(n => ({ name: n, type: "missing" as const })),
      ...bonusArray.map(n => ({ name: n, type: "bonus" as const })),
    ].slice(0, 20);

    return all.map((node, i) => {
      const angle = (i / (all.length || 1)) * Math.PI * 2;
      const radius = 2.2 + (Math.random() - 0.5) * 0.5;
      const importance = Math.random() * 0.5 + 0.5;
      return {
        name: node.name,
        type: node.type,
        importance,
        position: new THREE.Vector3(
          Math.cos(angle) * radius,
          (Math.random() - 0.5) * 1.5,
          Math.sin(angle) * radius,
        ),
      };
    });
  }, [matchData]);

  const handleClick = useCallback((name: string) => {
    console.log("Skill clicked:", name);
  }, []);

  return (
    <Canvas3D height={520}>
      <ambientLight intensity={0.4} />
      <pointLight position={[5, 5, 5]} color="#378ADD" intensity={3} />
      <pointLight position={[-5, -5, -5]} color="#8B5CF6" intensity={2} />
      <CenterOrb score={matchData.matchScore || 0} />
      {allNodes.map((node, i) => (
        <SkillNodeMesh 
          key={i} 
          name={node.name}
          type={node.type}
          position={node.position}
          importance={node.importance}
          onClick={handleClick} 
        />
      ))}
      <OrbitControls autoRotate autoRotateSpeed={0.5} enableZoom dampingFactor={0.1} enableDamping />
    </Canvas3D>
  );
}
