"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { ArrowRight, FileText, Brain, Video, Zap, Target, BarChart2, ChevronRight } from "lucide-react";
import dynamic from "next/dynamic";
import Navbar from "@/components/Navbar";

const HeroGlobe = dynamic(() => import("@/components/3d/HeroGlobe"), { ssr: false });

/* ── Count-up hook ── */
function useCountUp(target: number, duration = 1800) {
  const [value, setValue] = useState(0);
  const started = useRef(false);
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(Math.round(eased * target));
      if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [target, duration]);
  return value;
}

/* ── How it works data ── */
const STEPS = [
  { step: "01", title: "Upload Resume", desc: "Drop your PDF. Our AI parses every section.", color: "#378ADD" },
  { step: "02", title: "AI Analysis", desc: "ATS scoring, skill extraction, gap detection.", color: "#378ADD" },
  { step: "03", title: "Practice & Match", desc: "Mock interviews + job matching using hybrid AI.", color: "#8B5CF6" },
  { step: "04", title: "Get Hired", desc: "Apply with confidence and track your pipeline.", color: "#F59E0B" },
];

export default function Home() {
  const resumeCount = useCountUp(10000);
  const successRate = useCountUp(94);
  const modules = useCountUp(6);

  return (
    <div style={{ background: "#0a0a0a", minHeight: "100vh", color: "#FFFFFF", fontFamily: "DM Sans, sans-serif", overflowX: "hidden" }}>
      <Navbar />

      {/* ── HERO ── */}
      <section style={{ minHeight: "100vh", display: "flex", alignItems: "center", position: "relative", overflow: "hidden" }}>
        {/* Background blobs */}
        <div style={{ position: "absolute", top: "20%", left: "10%", width: 500, height: 500, background: "radial-gradient(circle, rgba(55,138,221,0.06) 0%, transparent 70%)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: "10%", right: "5%", width: 400, height: 400, background: "radial-gradient(circle, rgba(139,92,246,0.05) 0%, transparent 70%)", pointerEvents: "none" }} />

        <div className="max-w-7xl mx-auto px-6 py-20 w-full">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left */}
            <div className="space-y-8 animate-fade-in">
              <div
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest"
                style={{ background: "rgba(55,138,221,0.12)", border: "1px solid rgba(55,138,221,0.4)", color: "#60A5FA" }}
              >
                <span className="status-dot-active" style={{ width: 6, height: 6 }} /> AI-Powered Career Intelligence
              </div>

              <h1 style={{ fontFamily: "Syne, sans-serif", fontSize: "clamp(44px, 6.5vw, 78px)", fontWeight: 800, lineHeight: 1.05, letterSpacing: "-1px" }}>
                Your AI{" "}
                <span style={{ color: "#378ADD", textShadow: "0 0 30px rgba(55,138,221,0.4)" }}>Career</span>{" "}
                Copilot.
              </h1>

              <p style={{ fontSize: 18, color: "#A1A1AA", lineHeight: 1.75, maxWidth: 480 }}>
                Upload resume → Get AI-matched to jobs → Practice with AI interviews → <strong style={{ color: "#60A5FA" }}>Get hired faster.</strong>
              </p>

              <div className="flex flex-wrap gap-4">
                <Link href="/dashboard" className="glow-btn glow-btn-primary text-base px-7 py-3.5">
                  Get Started Free <ArrowRight className="w-5 h-5" />
                </Link>
                <a href="#how-it-works" className="glow-btn text-base px-7 py-3.5">
                  Watch Demo
                </a>
              </div>

              {/* Count-up stats */}
              <div className="flex gap-10 pt-2">
                {[
                  { val: `${(resumeCount / 1000).toFixed(0)}K+`, label: "Resumes Analyzed" },
                  { val: `${successRate}%`, label: "Interview Success" },
                  { val: String(modules), label: "AI Modules" },
                ].map(({ val, label }) => (
                  <div key={label}>
                    <div style={{ fontFamily: "Syne, sans-serif", fontWeight: 800, fontSize: 30, color: "#60A5FA" }}>{val}</div>
                    <div style={{ fontSize: 12, color: "#71717a", marginTop: 2 }}>{label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right — HeroGlobe */}
            <div className="relative hidden lg:block">
              <div style={{ position: "absolute", inset: 0, borderRadius: 32, background: "radial-gradient(circle at 50% 50%, rgba(55,138,221,0.07) 0%, transparent 70%)" }} />
              <HeroGlobe />
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-xs font-mono mb-3" style={{ color: "#378ADD", letterSpacing: "0.2em" }}>SYSTEM MODULES</p>
            <h2 style={{ fontFamily: "Syne, sans-serif", fontSize: 40, fontWeight: 800, color: "#FFFFFF" }}>
              Every feature you need to get hired
            </h2>
            <p className="mt-4 text-lg" style={{ color: "#71717a", maxWidth: 460, margin: "16px auto 0" }}>
              Six AI-powered modules working together as one unified career intelligence platform.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: <FileText className="w-7 h-7" />, title: "Resume AI", desc: "Neural parsing with ATS scoring, section-level AI improvement suggestions, and version tracking.", color: "#378ADD", href: "/resume" },
              { icon: <Target className="w-7 h-7" />, title: "Job Matching", desc: "Hybrid scoring engine: semantic similarity + Jaccard skill overlap = perfect match score.", color: "#378ADD", href: "/job-analysis" },
              { icon: <Brain className="w-7 h-7" />, title: "Mock Interviews", desc: "6-dimension AI scoring with personalized coaching tips, question counter, and voice mode.", color: "#8B5CF6", href: "/mock-interview" },
              { icon: <Video className="w-7 h-7" />, title: "Live Rooms", desc: "Stream Video rooms with Monaco code editor, Piston sandboxed execution, and real-time chat.", color: "#F59E0B", href: "/live-interview" },
              { icon: <Zap className="w-7 h-7" />, title: "AI Copilot", desc: "Streaming mentor for cover letters, career roadmaps, resume improvement, and real-time Q&A.", color: "#F43F5E", href: "/copilot" },
              { icon: <BarChart2 className="w-7 h-7" />, title: "Analytics", desc: "Track ATS trends, skill gap evolution, and interview performance over time.", color: "#60A5FA", href: "/analytics" },
            ].map((f, i) => (
              <Link key={i} href={f.href} className="glass-card glass-card-hover p-6 block" style={{ animationDelay: `${i * 0.08}s` }}>
                <div className="mb-5 p-3 inline-flex rounded-xl" style={{ background: `${f.color}18`, color: f.color }}>
                  {f.icon}
                </div>
                <h3 style={{ fontFamily: "Syne, sans-serif", fontWeight: 700, fontSize: 18, color: "#FFFFFF", marginBottom: 8 }}>{f.title}</h3>
                <p style={{ fontSize: 14, color: "#71717a", lineHeight: 1.65 }}>{f.desc}</p>
                <div className="mt-4 flex items-center gap-1 text-xs font-semibold" style={{ color: f.color }}>
                  Explore <ChevronRight className="w-3 h-3" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how-it-works" className="py-24 px-6" style={{ background: "rgba(22,22,22,0.25)" }}>
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-xs font-mono mb-3" style={{ color: "#378ADD", letterSpacing: "0.2em" }}>HOW IT WORKS</p>
          <h2 style={{ fontFamily: "Syne, sans-serif", fontSize: 40, fontWeight: 800, color: "#FFFFFF", marginBottom: 12 }}>
            4 steps to your next role
          </h2>
          <p className="mb-16" style={{ color: "#71717a", fontSize: 16 }}>From upload to offer letter — TalentIQ has every step covered.</p>
          <div className="grid md:grid-cols-4 gap-6">
            {STEPS.map((s, i) => (
              <div key={i} className="text-center relative">
                <div className="w-14 h-14 rounded-2xl mx-auto mb-5 flex flex-col items-center justify-center relative"
                  style={{ background: `${s.color}18`, border: `1px solid ${s.color}50` }}>
                  <span style={{ fontFamily: "Syne, sans-serif", fontWeight: 800, fontSize: 11, color: s.color, letterSpacing: "0.1em" }}>STEP</span>
                  <span style={{ fontFamily: "Syne, sans-serif", fontWeight: 800, fontSize: 20, color: s.color }}>{s.step}</span>
                </div>
                <h3 style={{ fontFamily: "Syne, sans-serif", fontWeight: 700, color: "#FFFFFF", marginBottom: 6, fontSize: 15 }}>{s.title}</h3>
                <p style={{ fontSize: 13, color: "#71717a", lineHeight: 1.6 }}>{s.desc}</p>
                {i < 3 && (
                  <div className="hidden md:block absolute top-7 left-full w-full" style={{ zIndex: 0 }}>
                    <ArrowRight className="w-4 h-4 -ml-2" style={{ color: "#262626" }} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="py-14 px-6 border-t border-[#262626]">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "#378ADD" }}>
              <Zap className="w-3.5 h-3.5 text-white" />
            </div>
            <span style={{ fontFamily: "Syne, sans-serif", fontWeight: 800, fontSize: 18, color: "#FFFFFF" }}>TalentIQ</span>
          </div>
          <p className="text-xs" style={{ color: "#52525b" }}>© 2026 TalentIQ Career Copilot · Built with AI for the next generation of talent.</p>
          <div className="flex gap-6">
            {["Features", "How It Works", "Privacy", "Terms"].map(l => (
              <a key={l} href={l === "How It Works" ? "#how-it-works" : `#${l.toLowerCase()}`} className="text-xs transition-colors hover:text-[#60A5FA]" style={{ color: "#52525b" }}>{l}</a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
