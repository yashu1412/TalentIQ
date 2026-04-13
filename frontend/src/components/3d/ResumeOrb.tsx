"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { Text } from "@react-three/drei";
import * as THREE from "three";
import Canvas3D from "./Canvas3D";

type OrbStatus = "idle" | "processing" | "done" | "error";

interface ResumeOrbProps {
  status?: OrbStatus;
  progress?: number; // 0-100
}

function OrbMesh({ status, progress }: ResumeOrbProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const t = useRef(0);

  const color = useMemo(() => {
    if (status === "done") return "#378ADD";
    if (status === "error") return "#F43F5E";
    if (status === "processing") return "#378ADD";
    return "#262626";
  }, [status]);

  const emissiveIntensity = status === "done" ? 0.6 : status === "processing" ? 0.4 : 0.15;

  useFrame((_, delta) => {
    t.current += delta;
    if (!meshRef.current) return;

    if (status === "idle") {
      meshRef.current.rotation.y += 0.003;
      meshRef.current.position.y = Math.sin(t.current * 0.8) * 0.08;
    } else if (status === "processing") {
      meshRef.current.rotation.y += 0.04;
      meshRef.current.rotation.x = Math.sin(t.current * 2) * 0.2;
      // Noise displacement via scale pulsing
      const pulse = 1 + Math.sin(t.current * 5) * 0.05;
      meshRef.current.scale.setScalar(pulse);
    } else if (status === "done") {
      meshRef.current.rotation.y += 0.003;
    }

    // Animate ring based on progress
    if (ringRef.current) {
      const ringMat = ringRef.current.material as THREE.MeshStandardMaterial;
      ringMat.opacity = status === "processing" ? 0.8 : status === "done" ? 1 : 0;
    }
  });

  const progressFraction = (progress ?? 0) / 100;

  return (
    <group>
      <mesh ref={meshRef}>
        <icosahedronGeometry args={[1.2, 4]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={emissiveIntensity}
          roughness={0.3}
          metalness={0.7}
        />
      </mesh>

      {/* Progress ring */}
      <mesh ref={ringRef} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.6, 0.05, 16, 100]} />
        <meshStandardMaterial
          color="#60A5FA"
          emissive="#60A5FA"
          emissiveIntensity={0.8}
          transparent
          opacity={status === "processing" || status === "done" ? 0.8 : 0}
        />
      </mesh>

      {/* Label */}
      {status === "processing" && (
        <Text position={[0, -1.8, 0]} fontSize={0.18} color="#60A5FA" anchorX="center">
          {`Extracting Skills... ${progress ?? 0}%`}
        </Text>
      )}
      {status === "done" && (
        <Text position={[0, -1.8, 0]} fontSize={0.2} color="#378ADD" anchorX="center">
          ✓ Analysis Complete!
        </Text>
      )}
      {status === "error" && (
        <Text position={[0, -1.8, 0]} fontSize={0.18} color="#F43F5E" anchorX="center">
          ✗ Parse Failed
        </Text>
      )}
    </group>
  );
}

export default function ResumeOrb({ status = "idle", progress = 0 }: ResumeOrbProps) {
  return (
    <Canvas3D height={400}>
      <ambientLight intensity={0.3} />
      <pointLight position={[3, 3, 3]} color="#378ADD" intensity={4} />
      <pointLight position={[-3, -3, -3]} color="#0a0a0a" intensity={2} />
      <OrbMesh status={status} progress={progress} />
    </Canvas3D>
  );
}
