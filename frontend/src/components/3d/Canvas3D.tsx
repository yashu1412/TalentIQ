"use client";

import React, { Suspense } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { Canvas } from '@react-three/fiber';
import { Loader } from '@react-three/drei';

interface Canvas3DProps {
  children: React.ReactNode;
  height?: number | string;
  fallback?: React.ReactNode;
  cameraFov?: number;
  cameraPos?: [number, number, number];
}

function FallbackUI() {
  return (
    <div className="flex w-full h-full items-center justify-center bg-[#161616]/50 rounded-2xl border border-[#262626]">
      <p className="text-[#A1A1AA] text-sm">Failed to load 3D context. WebGL may be disabled.</p>
    </div>
  );
}

export function CanvasSkeleton({ height = 400 }: { height?: number | string }) {
  return (
    <div 
      className="flex w-full items-center justify-center bg-[#161616]/30 rounded-2xl animate-pulse"
      style={{ height }}
    >
      <Loader />
    </div>
  );
}

export default function Canvas3D({ 
  children, 
  height = 400,
  fallback = <FallbackUI />,
  cameraFov = 60,
  cameraPos = [0, 0, 5]
}: Canvas3DProps) {
  return (
    <div className="relative w-full overflow-hidden" style={{ height }}>
      <ErrorBoundary fallback={<>{fallback}</>}>
        <Suspense fallback={<CanvasSkeleton height={height} />}>
          <Canvas
            dpr={[1, 1.5]} // Limit pixel ratio for performance
            camera={{ fov: cameraFov, position: cameraPos, near: 0.1, far: 1000 }}
            style={{ width: '100%', height: '100%', background: 'transparent' }}
            gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
          >

            {(children as any)}
          </Canvas>
        </Suspense>
      </ErrorBoundary>
    </div>
  );
}
