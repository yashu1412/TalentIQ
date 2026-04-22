"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, Home, FileText, Target, Bot, Zap, Video, BarChart2, Key } from "lucide-react";

const PAGES = [
  { icon: <Home />, route: '/dashboard', title: 'Main Dashboard', desc: 'Your central hub for tracking career progress, match scores, and recent activity.', tag: 'Project Overview', color: '#60A5FA' },
  { icon: <FileText />, route: '/resume', title: 'Resume Analyzer', desc: 'AI-driven evaluation of your professional documents with actionable improvement tips.', tag: 'Profile Optimization', color: '#8B5CF6' },
  { icon: <Target />, route: '/job-analysis', title: 'Opportunity Matcher', desc: 'Intelligent comparison between your profile and job requirements for better alignment.', tag: 'Precision Matching', color: '#F59E0B' },
  { icon: <Bot />, route: '/copilot', title: 'Career Copilot', desc: 'Interactive AI mentor providing personalized advice, cover letters, and roadmaps.', tag: 'Strategic Guidance', color: '#F43F5E' },
  { icon: <Zap />, route: '/mock-interview', title: 'Interview Simulator', desc: 'Voice-enabled practice sessions with real-time feedback on your performance.', tag: 'Skill Mastery', color: '#60A5FA' },
  { icon: <Video />, route: '/live-interview', title: 'Collaboration Room', desc: 'Live technical assessment environment with real-time video and shared coding.', tag: 'Professional Prep', color: '#10B981' },
  { icon: <BarChart2 />, route: '/analytics', title: 'Growth Analytics', desc: 'Visual insights into your professional evolution and application success rates.', tag: 'Data Intelligence', color: '#F9A8D4' },
  { icon: <Key />, route: '/tracker', title: 'Application Tracker', desc: 'Automated management of your entire job pipeline from application to offer.', tag: 'Pipeline Control', color: '#FDBA74' },
];

export default function PageSlider() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const sliderTimer = useRef<NodeJS.Timeout | null>(null);

  const goToSlide = (idx: number) => {
    setCurrentSlide((idx + PAGES.length) % PAGES.length);
  };

  useEffect(() => {
    if (!isHovered) {
      sliderTimer.current = setInterval(() => {
        goToSlide(currentSlide + 1);
      }, 3500);
    }
    return () => {
      if (sliderTimer.current) clearInterval(sliderTimer.current);
    };
  }, [currentSlide, isHovered]);

  return (
    <div className="py-20 flex flex-col items-center w-full relative">
      <div className="max-w-7xl mx-auto px-6 mb-12 text-center md:text-left animate-fade-in-up">
        <span className="px-3 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-[0.2em] border border-[var(--color-teal-600)]/30 bg-[var(--color-teal-600)]/10 text-[var(--color-teal-300)]">
          PROJECT MODULES
        </span>
        <h2 className="mt-6 font-display text-4xl md:text-5xl font-extrabold tracking-tight">
          Explore the <span className="grad-text">Project Ecosystem</span>
        </h2>
        <p className="mt-4 text-[var(--text-muted)] max-w-lg leading-relaxed">
          Discover the functional modules of TalentIQ, each designed to empower your career journey.
        </p>
      </div>

      <div 
        className="relative w-full h-[500px] flex items-center justify-center [perspective:1200px]"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="relative w-full h-full flex items-center justify-center [transform-style:preserve-3d]">
          {PAGES.map((page, i) => {
            const diff = ((i - currentSlide) + PAGES.length) % PAGES.length;
            const signed = diff > PAGES.length / 2 ? diff - PAGES.length : diff;
            
            // Logic for visibility and transform
            const isVisible = Math.abs(signed) <= 2;
            const x = signed * 340;
            const rotateY = signed * -12;
            const scale = 1 - Math.abs(signed) * 0.12 + (signed === 0 ? 0.06 : 0);
            const z = 100 - Math.abs(signed) * 50;
            const opacity = isVisible ? (1 - Math.abs(signed) * 0.35) : 0;

            return (
              <motion.div 
                key={i}
                initial={false}
                animate={{ 
                  x,
                  scale,
                  rotateY,
                  opacity,
                  zIndex: isVisible ? 10 - Math.abs(signed) : 0,
                }}
                transition={{ 
                  type: "spring", 
                  stiffness: 260, 
                  damping: 25 
                }}
                onClick={() => isVisible && goToSlide(i)}
                className={cn(
                  "page-slider-card absolute w-[320px] h-[340px] rounded-[32px] p-8 flex flex-col justify-between backdrop-blur-2xl cursor-pointer overflow-hidden",
                  !isVisible && "pointer-events-none"
                )}
                style={{ 
                  borderColor: `${page.color}33`,
                  boxShadow: signed === 0 ? `0 20px 50px -12px ${page.color}44` : 'none'
                }}
              >
                <div className="absolute inset-0 opacity-50 pointer-events-none page-slider-card-overlay" />
                
                <div className="relative z-10">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl mb-6" style={{ background: `${page.color}22`, color: page.color, border: `1px solid ${page.color}33` }}>
                    {page.icon}
                  </div>
                  <div className="font-mono text-[10px] text-[var(--text-muted)] mb-1 uppercase tracking-tighter">{page.title}</div>
                  <h3 className="font-display font-bold text-2xl text-[var(--text-primary)]">{page.tag}</h3>
                </div>

                <div className="relative z-10">
                  <p className="text-sm text-[var(--text-muted)] leading-relaxed mb-6">{page.desc}</p>
                  <span className="px-3 py-1 rounded-full text-[10px] font-bold page-slider-route uppercase tracking-tighter">
                    {page.route}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      <div className="flex items-center gap-8 mt-12">
        <button 
          onClick={() => goToSlide(currentSlide - 1)}
          className="page-slider-nav-btn w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        <div className="flex gap-2">
          {PAGES.map((_, i) => (
            <div 
              key={i}
              onClick={() => goToSlide(i)}
              className={cn(
                "w-2.5 h-2.5 rounded-full cursor-pointer transition-all duration-300",
                i === currentSlide ? "bg-[var(--color-teal-300)] w-8 shadow-[0_0_10px_var(--color-teal-300)]" : "page-slider-dot-inactive"
              )}
            />
          ))}
        </div>

        <button 
          onClick={() => goToSlide(currentSlide + 1)}
          className="page-slider-nav-btn w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
}
