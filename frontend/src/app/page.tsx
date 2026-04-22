"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { ArrowRight, FileText, Brain, Video, Zap, Target, BarChart2, ChevronRight, Sparkles } from "lucide-react";
import dynamic from "next/dynamic";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import TypingText from "@/components/ui/TypingText";
import TechExplode from "@/components/ui/TechExplode";
import PageSlider from "@/components/ui/PageSlider";

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

/* ── User Journey data ── */
const STEPS = [
  { step: "01", title: "Smart Upload", desc: "Our AI scans your resume and instantly extracts your professional profile.", color: "var(--color-teal-600)" },
  { step: "02", title: "Skill Analysis", desc: "Identify your strengths and uncover critical skill gaps compared to market trends.", color: "var(--color-teal-600)" },
  { step: "03", title: "AI Mock Practice", desc: "Simulate real interview scenarios and receive personalized coaching feedback.", color: "var(--color-violet)" },
  { step: "04", title: "Track Success", desc: "Manage your applications and monitor your career growth in one unified dashboard.", color: "var(--color-amber)" },
];

const FEATURES = [
  { icon: <FileText className="w-7 h-7" />, title: "Resume Intelligence", desc: "Get an instant ATS score and section-by-section AI advice to make your resume stand out to top recruiters.", color: "var(--color-teal-600)", href: "/resume" },
  { icon: <Target className="w-7 h-7" />, title: "Precision Matching", desc: "Stop applying blindly. See exactly how well your skills align with specific job descriptions before you hit apply.", color: "var(--color-teal-300)", href: "/job-analysis" },
  { icon: <Brain className="w-7 h-7" />, title: "Interview Coaching", desc: "Practice with AI-driven interviewers that adapt to the job role and provide deep insights on your responses.", color: "var(--color-violet)", href: "/mock-interview" },
  { icon: <Video className="w-7 h-7" />, title: "Live Prep Rooms", desc: "Collaborate in real-time practice sessions with a built-in code editor and technical assessment tools.", color: "var(--color-amber)", href: "/live-interview" },
  { icon: <Zap className="w-7 h-7" />, title: "24/7 AI Copilot", desc: "A dedicated career mentor available anytime to draft cover letters and provide real-time career strategy.", color: "var(--color-rose)", href: "/copilot" },
  { icon: <BarChart2 className="w-7 h-7" />, title: "Career Analytics", desc: "Visualize your professional growth, track skill improvements, and monitor your entire application pipeline.", color: "var(--color-cyan)", href: "/analytics" },
];

export default function Home() {
  const resumeCount = useCountUp(10000);
  const successRate = useCountUp(94);
  const modules = useCountUp(6);

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] font-sans overflow-x-hidden">
      <Navbar />

      {/* ── HERO ── */}
      <section className="min-h-screen flex items-center relative overflow-hidden pt-20">
        {/* Background blobs / Orbs */}
        <div className="absolute inset-0 pointer-events-none z-0">
          <div className="absolute top-[-150px] left-[-100px] w-[500px] h-[500px] bg-[var(--color-teal-600)] rounded-full blur-[100px] opacity-10 animate-orb-drift" />
          <div className="absolute bottom-[10%] right-[5%] w-[400px] h-[400px] bg-[var(--color-violet)] rounded-full blur-[100px] opacity-5 animate-orb-drift [animation-delay:-8s]" />
          <div className="absolute bottom-0 left-[40%] w-[300px] h-[300px] bg-[var(--color-rose)] rounded-full blur-[100px] opacity-5 animate-orb-drift [animation-delay:-4s]" />
        </div>

        <div className="max-w-7xl mx-auto px-6 py-20 w-full relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left */}
            <div className="space-y-8 animate-fade-in-up">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-mono font-bold uppercase tracking-widest border border-[var(--color-teal-600)]/30 bg-[var(--color-teal-600)]/10 text-[var(--color-teal-300)]">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping-slow absolute inline-flex h-full w-full rounded-full bg-[var(--color-teal-300)] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--color-teal-300)]"></span>
                </span>
                The Ultimate Career Intelligence Platform
              </div>

              <div className="space-y-2">
                <h1 className="font-display text-[clamp(44px,7vw,88px)] font-extrabold leading-[1.05] tracking-tight">
                  Accelerate Your{" "}
                  <span className="grad-text-anim">Career</span>{" "}
                  Journey.
                </h1>
                <TypingText 
                  text="Analyzing resume... Match score: 98% for Senior AI Engineer." 
                  className="text-[var(--color-teal-300)] text-sm md:text-base opacity-80"
                  speed={40}
                  repeat
                />
              </div>

              <p className="text-lg text-[var(--text-muted)] leading-relaxed max-w-lg">
                TalentIQ transforms how you land your next role. Upload your resume, find your perfect match, and practice with our world-class AI coaching modules.
              </p>

              <div className="flex flex-wrap gap-4">
                <Link href="/dashboard" className="glow-btn glow-btn-primary text-base px-8 py-4">
                  Start Your Journey <ArrowRight className="w-5 h-5" />
                </Link>
                <a href="#how-it-works" className="glow-btn text-base px-8 py-4">
                  See Features
                </a>
              </div>

              {/* Count-up stats */}
              <div className="flex gap-12 pt-4">
                {[
                  { val: `${(resumeCount / 1000).toFixed(0)}K+`, label: "Successful Hires" },
                  { val: `${successRate}%`, label: "Interview Confidence" },
                  { val: String(modules), label: "Project Modules" },
                ].map(({ val, label }) => (
                  <div key={label} className="group cursor-default">
                    <div className="font-display font-extrabold text-3xl text-[var(--color-teal-300)] group-hover:scale-110 transition-transform duration-300">{val}</div>
                    <div className="text-xs text-[var(--text-muted)] mt-1 font-mono uppercase tracking-wider">{label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right — HeroGlobe */}
            <div className="relative hidden lg:block animate-scale-up">
              <div className="absolute inset-0 rounded-[32px] bg-radial-gradient from-[var(--color-teal-600)]/10 to-transparent blur-3xl" />
              <div className="relative z-10 glass-card p-4 rounded-3xl border-[var(--color-teal-600)]/20">
                <HeroGlobe />
                {/* Floating stat card overlay */}
                <div className="absolute -bottom-10 -right-10 w-64 animate-float-y">
                   <div className="glass-card p-6 border-[var(--color-teal-600)]/30">
                      <div className="flex items-center gap-2 mb-4">
                        <Sparkles className="w-4 h-4 text-[var(--color-teal-300)]" />
                        <span className="font-mono text-[10px] text-[var(--color-teal-300)] uppercase tracking-tighter">// PLATFORM.STATUS: ACTIVE</span>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 bg-[var(--bg-deep)] rounded-xl border border-[var(--border-default)]">
                          <div className="text-xl font-display font-bold text-[var(--color-teal-300)]">99%</div>
                          <div className="text-[10px] text-[var(--text-muted)]">Match Accuracy</div>
                        </div>
                        <div className="p-3 bg-[var(--bg-deep)] rounded-xl border border-[var(--border-default)]">
                          <div className="text-xl font-display font-bold text-[var(--color-violet)]">10K+</div>
                          <div className="text-[10px] text-[var(--text-muted)]">Users Joined</div>
                        </div>
                      </div>
                   </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="gradient-strip mx-6 max-w-7xl xl:mx-auto" />

      {/* ── FEATURES ── */}
      <section id="features" className="py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20 animate-fade-in-up">
            <span className="px-3 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-[0.2em] border border-[var(--color-teal-600)]/30 bg-[var(--color-teal-600)]/10 text-[var(--color-teal-300)]">
              PROJECT CAPABILITIES
            </span>
            <h2 className="mt-6 font-display text-4xl md:text-5xl font-extrabold tracking-tight">
              Powerful tools to <span className="grad-text">own your future</span>
            </h2>
            <p className="mt-6 text-lg text-[var(--text-muted)] max-w-xl mx-auto leading-relaxed">
              TalentIQ combines multiple project modules to give you a complete career advantage.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {FEATURES.map((f, i) => (
              <Link 
                key={i} 
                href={f.href} 
                className="glass-card glass-card-hover p-8 group animate-fade-in-up" 
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                <div className="mb-6 p-4 inline-flex rounded-2xl transition-all duration-300 group-hover:scale-110 group-hover:rotate-3" 
                  style={{ background: `${f.color}15`, color: f.color, border: `1px solid ${f.color}30` }}>
                  {f.icon}
                </div>
                <h3 className="font-display font-bold text-xl mb-3 group-hover:text-[var(--color-teal-300)] transition-colors">{f.title}</h3>
                <p className="text-sm text-[var(--text-muted)] leading-relaxed mb-6">{f.desc}</p>
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider group-hover:translate-x-2 transition-transform" style={{ color: f.color }}>
                  Explore Project Feature <ChevronRight className="w-4 h-4" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── 3D PAGE SLIDER ── */}
      <section className="bg-[var(--bg-deep)]/20 py-10">
        <PageSlider />
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how-it-works" className="py-32 px-6 bg-[var(--bg-deep)]/30 border-y border-[var(--border-default)]">
        <div className="max-w-5xl mx-auto text-center">
          <span className="px-3 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-[0.2em] border border-[var(--color-teal-600)]/30 bg-[var(--color-teal-600)]/10 text-[var(--color-teal-300)]">
            USER JOURNEY
          </span>
          <h2 className="mt-6 font-display text-4xl md:text-5xl font-extrabold tracking-tight mb-6">
            Four simple steps to <span className="text-[var(--color-teal-300)]">your next role</span>
          </h2>
          <p className="mb-20 text-[var(--text-muted)] text-lg max-w-lg mx-auto">TalentIQ guides you from profile creation to the final offer letter.</p>
          
          <div className="grid md:grid-cols-4 gap-8">
            {STEPS.map((s, i) => (
              <div key={i} className="text-center relative group animate-fade-in-up" style={{ animationDelay: `${i * 0.15}s` }}>
                <div className="w-16 h-16 rounded-2xl mx-auto mb-6 flex flex-col items-center justify-center relative transition-transform duration-500 group-hover:rotate-[360deg]"
                  style={{ background: `${s.color}15`, border: `1px solid ${s.color}40` }}>
                  <span className="font-display font-extrabold text-[10px] tracking-tighter opacity-60" style={{ color: s.color }}>STEP</span>
                  <span className="font-display font-extrabold text-2xl leading-none" style={{ color: s.color }}>{s.step}</span>
                </div>
                <h3 className="font-display font-bold text-lg mb-3">{s.title}</h3>
                <p className="text-sm text-[var(--text-muted)] leading-relaxed">{s.desc}</p>
                {i < 3 && (
                  <div className="hidden lg:block absolute top-8 left-[calc(50%+4rem)] w-full pointer-events-none opacity-20">
                    <ArrowRight className="w-6 h-6" style={{ color: 'var(--border-mid)' }} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── ANIMATION SHOWCASE ── */}
      <section id="animations" className="py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20 animate-fade-in-up">
            <span className="px-3 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-[0.2em] border border-[var(--color-teal-600)]/30 bg-[var(--color-teal-600)]/10 text-[var(--color-teal-300)]">
              ✨ PROJECT INTERACTIVITY
            </span>
            <h2 className="mt-6 font-display text-4xl md:text-5xl font-extrabold tracking-tight">
              A Modern <span className="grad-text">Digital Experience</span>
            </h2>
            <p className="mt-6 text-lg text-[var(--text-muted)] max-w-xl mx-auto leading-relaxed">
              Every interaction in the TalentIQ project is designed for professional engagement.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { name: 'Floating Cards', icon: '🌊', cls: 'animate-float-y', bg: 'rgba(55,138,221,0.1)', desc: 'Elegant bobs' },
              { name: 'Loading States', icon: '✨', cls: 'animate-shimmer', bg: 'rgba(96,165,250,0.08)', desc: 'Smooth shimmers' },
              { name: 'Active Modules', icon: '⚙️', cls: 'animate-rotate', bg: 'rgba(139,92,246,0.1)', desc: 'Spinning UI' },
              { name: 'Spring Feedback', icon: '🏀', cls: 'animate-bounce-spring', bg: 'rgba(245,158,11,0.1)', desc: 'Elastic clicks' },
              { name: 'Error Alerts', icon: '❗', cls: 'animate-shake', bg: 'rgba(244,63,94,0.1)', desc: 'Smart shakes' },
              { name: 'Playful UI', icon: '🎭', cls: 'animate-wiggle', bg: 'rgba(249,168,212,0.1)', desc: 'Wiggle effects' },
              { name: 'System Glow', icon: '💙', cls: 'animate-pulse-blue', bg: 'rgba(37,99,235,0.1)', desc: 'Glow pulses' },
              { name: 'Alert Glow', icon: '❤️', cls: 'animate-pulse-red', bg: 'rgba(244,63,94,0.1)', desc: 'Pulse warnings' },
            ].map((a, i) => (
              <div 
                key={i} 
                className="glass-card p-8 flex flex-col items-center justify-center text-center group hover:border-[var(--color-teal-600)] transition-all"
                style={{ background: a.bg }}
              >
                <div className={cn("text-4xl mb-4 transition-transform", a.cls)}>
                  {a.name === 'Loading States' ? (
                    <div className="w-12 h-3 rounded-full animate-shimmer" />
                  ) : (
                    a.icon
                  )}
                </div>
                <h4 className="font-mono text-sm font-bold text-[var(--color-teal-300)]">{a.name}</h4>
                <p className="text-[10px] text-[var(--text-muted)] mt-1 uppercase tracking-tighter">{a.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TECH EXPLODE ── */}
      <section className="py-20">
        <TechExplode />
      </section>

      {/* ── FOOTER ── */}
      <Footer />
    </div>
  );
}
