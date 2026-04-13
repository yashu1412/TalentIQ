"use client";

import { useEffect, useRef, ReactNode, Children } from "react";

type StaggerRevealProps = {
  children: ReactNode;
  delay?: number;       // stagger interval in ms between children
  threshold?: number;   // IntersectionObserver threshold
  className?: string;
};

export default function StaggerReveal({
  children,
  delay = 80,
  threshold = 0.15,
  className = "",
}: StaggerRevealProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const items = containerRef.current?.children;
    if (!items) return;

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const el = entry.target as HTMLElement;
            const idx = parseInt(el.dataset.idx || "0", 10);
            setTimeout(() => {
              el.style.opacity = "1";
              el.style.transform = "translateY(0)";
            }, idx * delay);
            io.unobserve(el);
          }
        });
      },
      { threshold }
    );

    Array.from(items).forEach((child, idx) => {
      const el = child as HTMLElement;
      el.style.opacity = "0";
      el.style.transform = "translateY(24px)";
      el.style.transition = `opacity 0.5s ease, transform 0.5s ease`;
      el.dataset.idx = String(idx);
      io.observe(el);
    });

    return () => io.disconnect();
  }, [delay, threshold]);

  return (
    <div ref={containerRef} className={className}>
      {children}
    </div>
  );
}
