"use client";

import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { 
  Sphere, MeshDistortMaterial, Float, 
  OrbitControls, PerspectiveCamera,
  Stars, Float as FloatDrei
} from "@react-three/drei";
import * as THREE from "three";

function ResumeOrb() {
  const mesh = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (!mesh.current) return;
    mesh.current.rotation.x = state.clock.getElapsedTime() * 0.1;
    mesh.current.rotation.y = state.clock.getElapsedTime() * 0.15;
  });

  return (
    <FloatDrei speed={4} rotationIntensity={0.5} floatIntensity={2}>
      <Sphere ref={mesh} args={[1.2, 128, 128]}>
        <MeshDistortMaterial
          color="#ffffff"
          attach="material"
          distort={0.3}
          speed={4}
          roughness={0.1}
          metalness={1}
          emissive="#ffffff"
          emissiveIntensity={0.2}
        />
      </Sphere>
    </FloatDrei>
  );
}

function FloatingDataPoints({ count = 150 }) {
  const points = useMemo(() => {
    const p = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      p[i * 3] = (Math.random() - 0.5) * 15;
      p[i * 3 + 1] = (Math.random() - 0.5) * 15;
      p[i * 3 + 2] = (Math.random() - 0.5) * 15;
    }
    return p;
  }, [count]);

  const meshRef = useRef<THREE.Points>(null);

  useFrame((state) => {
    if (!meshRef.current) return;
    meshRef.current.rotation.y = state.clock.getElapsedTime() * 0.05;
  });

  return (
    <points ref={meshRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={points.length / 3}
          array={points}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.03}
        color="#ffffff"
        transparent
        opacity={0.4}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

function Grid() {
  return (
    <gridHelper 
      args={[40, 40, 0xffffff, 0xffffff]} 
      position={[0, -5, 0]} 
      rotation={[0, 0, 0]}
    >
      <meshBasicMaterial attach="material" transparent opacity={0.05} />
    </gridHelper>
  );
}

export default function HeroScene() {
  return (
    <div className="absolute inset-0 z-0 bg-black">
      {/* Background radial gradient for depth */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.05)_0%,transparent_70%)]" />
      
      <Canvas shadows dpr={[1, 2]}>
        <PerspectiveCamera makeDefault position={[0, 0, 8]} fov={50} />
        
        <ambientLight intensity={0.2} />
        <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={2} castShadow />
        <pointLight position={[-10, -10, -10]} intensity={1} color="#ffffff" />
        
        <ResumeOrb />
        <FloatingDataPoints />
        <Grid />
        
        <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
        
        <OrbitControls 
          enableZoom={false} 
          enablePan={false} 
          autoRotate 
          autoRotateSpeed={0.5}
          maxPolarAngle={Math.PI / 2}
          minPolarAngle={Math.PI / 2}
        />
      </Canvas>
    </div>
  );
}
