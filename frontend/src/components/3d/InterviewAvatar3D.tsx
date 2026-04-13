"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import Canvas3D from "./Canvas3D";

type AvatarState = "idle" | "thinking" | "speaking";

interface InterviewAvatar3DProps {
  state?: AvatarState;
}

function AvatarMesh({ state = "idle" }: InterviewAvatar3DProps) {
  const headRef = useRef<THREE.Mesh>(null);
  const eyeL = useRef<THREE.Mesh>(null);
  const eyeR = useRef<THREE.Mesh>(null);
  const mouthRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const t = useRef(0);

  useFrame(({ mouse, viewport }, delta) => {
    t.current += delta;

    if (!headRef.current) return;

    if (state === "idle") {
      // Gentle head bob
      headRef.current.position.y = Math.sin(t.current * 0.8) * 0.06;
      headRef.current.rotation.y = Math.sin(t.current * 0.3) * 0.1;
    } else if (state === "thinking") {
      headRef.current.rotation.y += 0.008;
      const mat = headRef.current.material as THREE.MeshStandardMaterial;
      mat.emissiveIntensity = 0.3 + Math.sin(t.current * 2) * 0.15;
    } else if (state === "speaking") {
      headRef.current.rotation.y += 0.003;
      // Mouth morph via Y scale pulsing
      if (mouthRef.current) {
        mouthRef.current.scale.y = 1 + Math.abs(Math.sin(t.current * 8)) * 1.5;
      }
      // Pulsing speaking ring
      if (ringRef.current) {
        const scale = 1 + Math.sin(t.current * 6) * 0.15;
        ringRef.current.scale.setScalar(scale);
        (ringRef.current.material as THREE.MeshStandardMaterial).opacity = 0.4 + Math.sin(t.current * 6) * 0.3;
      }
    }

    // Eye tracking: pupils follow mouse
    const mx = (mouse.x * viewport.width) / 2;
    const my = (mouse.y * viewport.height) / 2;
    if (eyeL.current) {
      eyeL.current.rotation.x = -my * 0.03;
      eyeL.current.rotation.y = mx * 0.03;
    }
    if (eyeR.current) {
      eyeR.current.rotation.x = -my * 0.03;
      eyeR.current.rotation.y = mx * 0.03;
    }
  });

  const headColor = state === "thinking" ? "#8B5CF6" : state === "speaking" ? "#6D28D9" : "#7C3AED";

  return (
    <group>
      {/* Head */}
      <mesh ref={headRef}>
        <icosahedronGeometry args={[1, 2]} />
        <meshStandardMaterial
          color={headColor}
          emissive={headColor}
          emissiveIntensity={0.3}
          roughness={0.4}
          metalness={0.6}
        />
      </mesh>

      {/* Eye left */}
      <mesh ref={eyeL} position={[-0.35, 0.2, 0.88]}>
        <sphereGeometry args={[0.18, 16, 16]} />
        <meshStandardMaterial color="#378ADD" emissive="#378ADD" emissiveIntensity={1} />
      </mesh>

      {/* Eye right */}
      <mesh ref={eyeR} position={[0.35, 0.2, 0.88]}>
        <sphereGeometry args={[0.18, 16, 16]} />
        <meshStandardMaterial color="#378ADD" emissive="#378ADD" emissiveIntensity={1} />
      </mesh>

      {/* Mouth */}
      <mesh ref={mouthRef} position={[0, -0.35, 0.88]} scale={[0.4, 0.12, 0.12]}>
        <boxGeometry />
        <meshStandardMaterial color="#60A5FA" emissive="#60A5FA" emissiveIntensity={0.6} />
      </mesh>

      {/* Speaking ring */}
      {state === "speaking" && (
        <mesh ref={ringRef} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[1.5, 0.04, 8, 64]} />
          <meshStandardMaterial
            color="#8B5CF6"
            emissive="#8B5CF6"
            emissiveIntensity={1}
            transparent
            opacity={0.6}
          />
        </mesh>
      )}
    </group>
  );
}

export default function InterviewAvatar3D({ state = "idle" }: InterviewAvatar3DProps) {
  return (
    <Canvas3D height={400}>
      <ambientLight intensity={0.3} />
      <pointLight position={[3, 3, 3]} color="#8B5CF6" intensity={4} />
      <pointLight position={[-3, -3, -3]} color="#378ADD" intensity={2} />
      <AvatarMesh state={state} />
    </Canvas3D>
  );
}
