"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { Float, MeshDistortMaterial, ContactShadows, Sparkles } from "@react-three/drei";
import { EffectComposer, Bloom, Noise, Glitch } from "@react-three/postprocessing";
import { GlitchMode } from "postprocessing";
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

  // Memoize colors to avoid re-calculating every frame
  const colors = useMemo(() => ({
    head: state === "thinking" ? "#8B5CF6" : state === "speaking" ? "#6D28D9" : "#7C3AED",
    eyes: "#378ADD",
    mouth: "#60A5FA",
    ring: "#8B5CF6"
  }), [state]);

  useFrame(({ mouse, viewport, clock }, delta) => {
    t.current += delta;

    if (!headRef.current) return;

    // Target values for lerping
    const targetPos = { x: 0, y: 0, z: 0 };
    const targetRot = { x: 0, y: 0, z: 0 };
    let targetEmissive = 0.3;
    let targetMouthScaleY = 0.12;
    let targetEyeScale = 1;
    let targetDistort = 0.2;

    // Mouse influence (tilting)
    const mx = (mouse.x * viewport.width) / 2;
    const my = (mouse.y * viewport.height) / 2;

    if (state === "idle") {
      targetPos.y = Math.sin(t.current * 0.8) * 0.1;
      targetPos.x = Math.cos(t.current * 0.5) * 0.05;
      targetRot.y = Math.sin(t.current * 0.3) * 0.15 + (mx * 0.05);
      targetRot.x = -(my * 0.05);
      targetDistort = 0.2;
    } else if (state === "thinking") {
      targetRot.y = t.current * 1.5;
      targetEmissive = 0.4 + Math.sin(t.current * 5) * 0.2;
      targetEyeScale = 1.3 + Math.sin(t.current * 4) * 0.15;
      targetPos.y = Math.sin(t.current * 2) * 0.08;
      targetDistort = 0.5;
    } else if (state === "speaking") {
      targetRot.y = Math.sin(t.current * 2) * 0.1 + (mx * 0.1);
      targetRot.x = Math.cos(t.current * 2) * 0.05 - (my * 0.1);
      targetMouthScaleY = 0.5 + Math.abs(Math.sin(t.current * 10)) * 2.8;
      targetEmissive = 0.6 + Math.sin(t.current * 8) * 0.3;
      targetDistort = 0.3;
      
      if (ringRef.current) {
        const ringScale = 1.1 + Math.sin(t.current * 8) * 0.25;
        ringRef.current.scale.setScalar(THREE.MathUtils.lerp(ringRef.current.scale.x, ringScale, 0.1));
        (ringRef.current.material as THREE.MeshStandardMaterial).opacity = 0.5 + Math.sin(t.current * 8) * 0.3;
      }
    }

    // Apply lerped values
    headRef.current.position.y = THREE.MathUtils.lerp(headRef.current.position.y, targetPos.y, 0.1);
    headRef.current.position.x = THREE.MathUtils.lerp(headRef.current.position.x, targetPos.x, 0.1);
    headRef.current.rotation.y = THREE.MathUtils.lerp(headRef.current.rotation.y, targetRot.y, 0.1);
    headRef.current.rotation.x = THREE.MathUtils.lerp(headRef.current.rotation.x, targetRot.x, 0.1);
    
    const mat = headRef.current.material as any; // Using any for MeshDistortMaterial specific props
    if (mat.emissiveIntensity !== undefined) {
      mat.emissiveIntensity = THREE.MathUtils.lerp(mat.emissiveIntensity, targetEmissive, 0.1);
    }
    if (mat.distort !== undefined) {
      mat.distort = THREE.MathUtils.lerp(mat.distort, targetDistort, 0.05);
      mat.speed = THREE.MathUtils.lerp(mat.speed, state === "thinking" ? 4 : 2, 0.05);
    }

    if (mouthRef.current) {
      mouthRef.current.scale.y = THREE.MathUtils.lerp(mouthRef.current.scale.y, targetMouthScaleY, 0.2);
    }

    // Blinking logic
    const blink = Math.sin(t.current * 0.5) > 0.98 ? 0.05 : 1;
    const finalEyeScale = targetEyeScale * blink;

    if (eyeL.current) {
      eyeL.current.rotation.x = -my * 0.05;
      eyeL.current.rotation.y = mx * 0.05;
      eyeL.current.scale.y = THREE.MathUtils.lerp(eyeL.current.scale.y, finalEyeScale, 0.2);
    }
    if (eyeR.current) {
      eyeR.current.rotation.x = -my * 0.05;
      eyeR.current.rotation.y = mx * 0.05;
      eyeR.current.scale.y = THREE.MathUtils.lerp(eyeR.current.scale.y, finalEyeScale, 0.2);
    }
  });

  return (
    <group>
      <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
        {/* Head with Distort Effect */}
        <mesh ref={headRef}>
          <icosahedronGeometry args={[1, 4]} />
          <MeshDistortMaterial
            color={colors.head}
            emissive={colors.head}
            emissiveIntensity={0.4}
            distort={0.3}
            speed={2}
            roughness={0.2}
            metalness={0.8}
          />
        </mesh>

        {/* Eye left */}
        <mesh ref={eyeL} position={[-0.35, 0.2, 0.92]}>
          <sphereGeometry args={[0.18, 32, 32]} />
          <meshStandardMaterial color={colors.eyes} emissive={colors.eyes} emissiveIntensity={2} />
        </mesh>

        {/* Eye right */}
        <mesh ref={eyeR} position={[0.35, 0.2, 0.92]}>
          <sphereGeometry args={[0.18, 32, 32]} />
          <meshStandardMaterial color={colors.eyes} emissive={colors.eyes} emissiveIntensity={2} />
        </mesh>

        {/* Mouth */}
        <mesh ref={mouthRef} position={[0, -0.35, 0.92]} scale={[0.45, 0.12, 0.12]}>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color={colors.mouth} emissive={colors.mouth} emissiveIntensity={1} />
        </mesh>

        {/* Speaking ring */}
        {state === "speaking" && (
          <mesh ref={ringRef} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[1.6, 0.03, 16, 100]} />
            <meshStandardMaterial
              color={colors.ring}
              emissive={colors.ring}
              emissiveIntensity={2}
              transparent
              opacity={0.6}
            />
          </mesh>
        )}
      </Float>

      {/* Ground Shadow */}
      <ContactShadows position={[0, -2, 0]} opacity={0.4} scale={10} blur={2.5} far={4} />

      {/* State-specific particles */}
      {state === "thinking" && (
        <Sparkles count={50} scale={3} size={2} speed={0.4} color={colors.head} />
      )}
    </group>
  );
}

export default function InterviewAvatar3D({ state = "idle" }: InterviewAvatar3DProps) {
  return (
    <Canvas3D height={450}>
      <ambientLight intensity={0.4} />
      <pointLight position={[5, 5, 5]} color="#8B5CF6" intensity={5} />
      <pointLight position={[-5, -5, -5]} color="#378ADD" intensity={3} />
      
      <AvatarMesh state={state} />

      {/* Post Processing for Glow */}
      <EffectComposer disableNormalPass>
        <Bloom luminanceThreshold={1} mipmapBlur intensity={1.5} radius={0.4} />
        <Noise opacity={0.05} />
        {state === "thinking" && (
          <Glitch 
            delay={[0.2, 0.5]} 
            duration={[0.1, 0.3]} 
            strength={[0.1, 0.2]} 
            mode={GlitchMode.SPORADIC} 
          />
        )}
      </EffectComposer>
    </Canvas3D>
  );
}
