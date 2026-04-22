"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { X, Zap } from "lucide-react";

interface TechItem {
  id: string;
  name: string;
  icon: string;
  tag: string;
  color: string;
  desc: string;
  radius: number;
  initialAngle: number;
  duration: number;
}

const TECH_STACK: TechItem[] = [
  { 
    id: "nextjs", name: "Full-Stack Core", icon: "🚀", tag: "Project Engine", color: "#60A5FA", 
    radius: 240, initialAngle: 210, duration: 25,
    desc: "The backbone of TalentIQ, ensuring lightning-fast performance and seamless navigation across all career modules."
  },
  { 
    id: "framer", name: "Motion System", icon: "✨", tag: "User Experience", color: "#c4b5fd", 
    radius: 160, initialAngle: 270, duration: 18,
    desc: "A fluid and interactive interface that responds to your every move, making career prep feel like a premium experience."
  },
  { 
    id: "threejs", name: "3D Visualization", icon: "🌐", tag: "Visual Insights", color: "#fcd34d", 
    radius: 240, initialAngle: 330, duration: 28,
    desc: "Immersive 3D data visualizations that help you understand your career trajectory and skill relationships in real-time."
  },
  { 
    id: "mongodb", name: "Secure Storage", icon: "🔐", tag: "Data Safety", color: "#86efac", 
    radius: 160, initialAngle: 30, duration: 20,
    desc: "A robust and secure data layer that keeps your resumes, job applications, and personal career notes safe and accessible."
  },
  { 
    id: "openai", name: "AI Intelligence", icon: "🤖", tag: "Core Logic", color: "#fda4af", 
    radius: 240, initialAngle: 90, duration: 22,
    desc: "The brain of the project, providing expert-level resume analysis, job matching, and real-time interview coaching."
  },
  { 
    id: "clerk", name: "Identity Shield", icon: "🛡️", tag: "Authentication", color: "#f9a8d4", 
    radius: 160, initialAngle: 150, duration: 21,
    desc: "Advanced security protocols that protect your professional identity and ensure private access to your dashboard."
  },
];

export default function TechExplode() {
  const [isExploded, setIsExploded] = useState(false);
  const [selectedTech, setSelectedTech] = useState<TechItem | null>(null);

  return (
    <div className="relative py-20 flex flex-col items-center overflow-hidden min-h-[850px] w-full">
      <div className="text-center mb-12 animate-fade-in-up">
        <span className="px-3 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-[0.2em] border border-[var(--color-teal-600)]/30 bg-[var(--color-teal-600)]/10 text-[var(--color-teal-300)]">
          PROJECT ARCHITECTURE
        </span>
        <h2 className="mt-6 font-display text-4xl md:text-5xl font-extrabold tracking-tight grad-text-anim">
          Core Project Modules
        </h2>
        <p className="mt-4 text-[var(--text-muted)] max-w-md mx-auto">
          Explore the fundamental modules that power the TalentIQ career intelligence ecosystem.
        </p>
      </div>

      <div className="relative w-[600px] h-[600px] mt-10 flex items-center justify-center">
        {/* Orbit Rings */}
        <AnimatePresence>
          {isExploded && [180, 320, 480].map((size, i) => (
            <motion.div 
              key={size}
              initial={{ opacity: 0, scale: 0.8, rotate: 0 }}
              animate={{ opacity: 1, scale: 1, rotate: i % 2 === 0 ? 360 : -360 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ 
                opacity: { duration: 0.5 },
                scale: { duration: 0.5 },
                rotate: { duration: 60 + i * 20, repeat: Infinity, ease: "linear" }
              }}
              className="absolute rounded-full border border-dashed border-[var(--color-teal-600)]/20"
              style={{ width: size, height: size }}
            />
          ))}
        </AnimatePresence>

        {/* Core Button */}
        <motion.button 
          onClick={() => setIsExploded(!isExploded)}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className={cn(
            "relative w-24 h-24 rounded-full flex items-center justify-center text-2xl z-50 transition-colors duration-500 border-2 border-[var(--border-default)] shadow-2xl",
            isExploded 
              ? "bg-red-500/90 shadow-[0_0_50px_rgba(239,68,68,0.5)]" 
              : "bg-gradient-to-br from-[var(--color-teal-600)] to-[var(--color-violet)] shadow-[0_0_40px_rgba(55,138,221,0.5)]"
          )}
        >
          {isExploded ? <X className="w-8 h-8 text-white" /> : <Zap className="w-8 h-8 text-white" />}
        </motion.button>

        {/* Tech Bubbles */}
        {TECH_STACK.map((tech, i) => (
          <TechBubble 
            key={tech.id} 
            tech={tech} 
            isExploded={isExploded} 
            isSelected={selectedTech?.id === tech.id}
            onSelect={() => setSelectedTech(tech)}
            index={i}
          />
        ))}
      </div>

      {/* Info Panel */}
      <div className="h-32 mt-12 w-full max-w-md">
        <AnimatePresence mode="wait">
          {isExploded && selectedTech && (
            <motion.div 
              key={selectedTech.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="glass-card p-6 border-t-2" 
              style={{ borderTopColor: selectedTech.color, boxShadow: `0 10px 30px -10px ${selectedTech.color}44` }}
            >
              <div className="flex items-center gap-4 mb-3">
                <span className="text-3xl">{selectedTech.icon}</span>
                <h3 className="font-display font-bold text-xl" style={{ color: selectedTech.color }}>
                  {selectedTech.name}
                </h3>
              </div>
              <p className="text-sm text-[var(--text-muted)] leading-relaxed">
                {selectedTech.desc}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function TechBubble({ 
  tech, 
  isExploded, 
  isSelected, 
  onSelect,
  index 
}: { 
  tech: TechItem; 
  isExploded: boolean; 
  isSelected: boolean; 
  onSelect: () => void;
  index: number;
}) {
  return (
    <motion.div
      initial={{ rotate: tech.initialAngle, opacity: 0 }}
      animate={isExploded ? {
        rotate: [tech.initialAngle, tech.initialAngle + 360],
        opacity: 1,
      } : {
        rotate: tech.initialAngle,
        opacity: 0,
      }}
      transition={isExploded ? {
        rotate: { duration: tech.duration, repeat: Infinity, ease: "linear" },
        opacity: { duration: 0.5, delay: index * 0.1 }
      } : { duration: 0.3 }}
      className="absolute flex items-center justify-center z-30"
      style={{ width: 0, height: 0 }} // Center point for rotation
    >
      <motion.div
        initial={{ x: 0, scale: 0 }}
        animate={isExploded ? {
          x: [tech.radius - 5, tech.radius + 15, tech.radius - 5], // Organic breathing radius
          scale: isSelected ? 1.2 : 1,
        } : {
          x: 0,
          scale: 0,
        }}
        transition={isExploded ? {
          x: { 
            duration: 4 + index, 
            repeat: Infinity, 
            ease: "easeInOut",
            delay: index * 0.2 // Desynchronize breathing
          },
          scale: { type: "spring", stiffness: 300, damping: 20 },
        } : { duration: 0.3 }}
        className="absolute"
      >
        <motion.div
          animate={isExploded ? { rotate: [-(tech.initialAngle), -(tech.initialAngle + 360)] } : { rotate: -tech.initialAngle }}
          transition={isExploded ? {
            rotate: { duration: tech.duration, repeat: Infinity, ease: "linear" }
          } : { duration: 0.3 }}
          whileHover={{ 
            scale: 1.1, 
            boxShadow: `0 0 30px ${tech.color}66`,
            y: -5
          }}
          whileTap={{ scale: 0.95 }}
          onClick={onSelect}
          className={cn(
            "group relative w-28 h-28 rounded-2xl flex flex-col items-center justify-center backdrop-blur-xl border border-[var(--border-default)] cursor-pointer bg-[var(--bg-card)] transition-all shadow-xl overflow-hidden",
            isSelected && "border-[var(--color-teal-300)] ring-4 ring-[var(--color-teal-300)]/10"
          )}
          style={{ borderColor: `${tech.color}44` }}
        >
          {/* Animated Background Glow */}
          <div 
            className="absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity duration-500"
            style={{ background: `radial-gradient(circle at center, ${tech.color}, transparent 70%)` }}
          />
          
          {/* Corner accents */}
          <div className="absolute top-2 left-2 w-1 h-1 rounded-full opacity-40" style={{ backgroundColor: tech.color }} />
          <div className="absolute bottom-2 right-2 w-1 h-1 rounded-full opacity-40" style={{ backgroundColor: tech.color }} />

          <motion.span 
            className="text-3xl mb-1 relative z-10"
            animate={isExploded ? { y: [0, -3, 0] } : {}}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: index * 0.1 }}
          >
            {tech.icon}
          </motion.span>
          <span className="text-[10px] font-bold text-[var(--text-primary)] text-center px-1 leading-tight relative z-10">{tech.name}</span>
          <span className="text-[8px] font-mono text-[var(--text-muted)] mt-1 uppercase tracking-tighter relative z-10">{tech.tag}</span>
          
          {/* Subtle pulse ring when selected */}
          {isSelected && (
            <motion.div
              initial={{ scale: 0.8, opacity: 0.5 }}
              animate={{ scale: 1.5, opacity: 0 }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeOut" }}
              className="absolute inset-0 rounded-2xl border-2"
              style={{ borderColor: tech.color }}
            />
          )}
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
