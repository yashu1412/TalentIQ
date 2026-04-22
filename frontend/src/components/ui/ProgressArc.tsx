"use client";

import { useEffect, useRef, useState } from "react";

type ProgressArcProps = {
  value: number;      // 0–100
  max?: number;
  color?: string;
  size?: number;      // px
  strokeWidth?: number;
  label?: string;
  animate?: boolean;
};

export default function ProgressArc({
  value,
  max = 100,
  color = "#378ADD",
  size = 80,
  strokeWidth = 7,
  label,
  animate = true,
}: ProgressArcProps) {
  const [current, setCurrent] = useState(animate ? 0 : value);
  const rafRef = useRef<number | null>(null);
  const startRef = useRef<number | null>(null);
  const DURATION = 900;

  useEffect(() => {
    if (!animate) { setCurrent(value); return; }
    const from = 0;
    const to = value;
    const step = (ts: number) => {
      if (!startRef.current) startRef.current = ts;
      const progress = Math.min((ts - startRef.current) / DURATION, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // cubic ease-out
      setCurrent(from + (to - from) * eased);
      if (progress < 1) rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [value, animate]);

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = Math.min(current / max, 1);
  const dashOffset = circumference * (1 - pct);

  return (
    <div style={{ position: "relative", width: size, height: size, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)", position: "absolute" }}>
        {/* Track */}
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke="rgba(38,38,38,0.6)" strokeWidth={strokeWidth}
        />
        {/* Arc */}
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke={color} strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 0.05s linear", filter: `drop-shadow(0 0 4px ${color})` }}
        />
      </svg>
      <div style={{ textAlign: "center", position: "relative" }}>
        <div style={{ fontFamily: "Syne, sans-serif", fontWeight: 800, fontSize: size * 0.22, color: "var(--text-primary)", lineHeight: 1 }}>
          {Math.round(current)}
        </div>
        {label && (
          <div style={{ fontSize: size * 0.13, color: "var(--text-muted)", marginTop: 2 }}>{label}</div>
        )}
      </div>
    </div>
  );
}
