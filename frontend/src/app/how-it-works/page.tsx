"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { 
  ArrowLeft, ArrowRight, FileText, Brain, Video, Zap, Target, BarChart2, 
  ChevronRight, Sparkles, Terminal, Play, Cpu, Check, ShieldAlert, 
  KeyRound, HelpCircle, Code2, Globe, Heart, Shield, Lock, FileCode, 
  CheckCircle, Database 
} from "lucide-react";

const STEPS = [
  { step: "01", title: "Smart Upload", desc: "Our AI scans your resume and instantly extracts your professional profile.", color: "#60A5FA" },
  { step: "02", title: "Skill Analysis", desc: "Identify your strengths and uncover critical skill gaps compared to market trends.", color: "#8B5CF6" },
  { step: "03", title: "AI Mock Practice", desc: "Simulate real interview scenarios and receive personalized coaching feedback.", color: "#F59E0B" },
  { step: "04", title: "Track Success", desc: "Manage your applications and monitor your career growth in one unified dashboard.", color: "#F43F5E" },
];

export default function HowItWorksPage() {
  const [activeTab, setActiveTab] = useState<"journey" | "build" | "features" | "autobot">("journey");

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] font-sans overflow-x-hidden pt-28 relative">
      <Navbar />

      {/* Floating Background Glow Orbs */}
      <div className="absolute top-0 right-10 w-[500px] h-[500px] rounded-full bg-[#378ADD]/5 blur-[140px] pointer-events-none -z-10 animate-orb-drift" />
      <div className="absolute top-60 left-0 w-[450px] h-[450px] rounded-full bg-[#8B5CF6]/5 blur-[150px] pointer-events-none -z-10 animate-orb-drift" style={{ animationDelay: "-4s" }} />

      {/* Advanced Scroll-Driven Background Shapes (User Reference Animation Implementation) */}
      <div className="absolute left-6 top-[22%] pointer-events-none hidden xl:block z-0 animate-scroll-left">
        <div className="w-20 h-20 bg-gradient-to-tr from-[var(--color-teal-600)]/20 to-transparent shape-circle border border-[var(--color-teal-600)]/30" />
      </div>
      <div className="absolute right-8 top-[36%] pointer-events-none hidden xl:block z-0 animate-scroll-right">
        <div className="w-24 h-24 bg-gradient-to-bl from-[var(--color-violet)]/20 to-transparent shape-square border border-[var(--color-violet)]/30" />
      </div>
      <div className="absolute left-8 top-[52%] pointer-events-none hidden xl:block z-0 animate-scroll-scale">
        <div className="w-20 h-20 bg-gradient-to-br from-[var(--color-amber)]/15 to-transparent shape-triangle border border-[var(--color-amber)]/30" />
      </div>
      <div className="absolute right-10 top-[68%] pointer-events-none hidden xl:block z-0 animate-scroll-rotate">
        <div className="w-24 h-24 bg-gradient-to-tl from-[var(--color-rose)]/20 to-transparent shape-star border border-[var(--color-rose)]/30" />
      </div>
      <div className="absolute left-12 top-[82%] pointer-events-none hidden xl:block z-0 animate-scroll-left">
        <div className="w-20 h-20 bg-gradient-to-tr from-[var(--color-cyan)]/25 to-transparent shape-circle border border-[var(--color-cyan)]/30" />
      </div>
      <div className="absolute right-6 top-[92%] pointer-events-none hidden xl:block z-0 animate-scroll-scale">
        <div className="w-24 h-24 bg-gradient-to-bl from-[var(--color-teal-300)]/20 to-transparent shape-square border border-[var(--color-teal-300)]/30" />
      </div>

      <div className="max-w-6xl mx-auto px-6 pb-24 relative z-10">
        
        {/* Navigation Breadcrumb */}
        <div className="mb-8 animate-fade-in-up">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-[var(--text-muted)] hover:text-[var(--color-teal-300)] transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Home
          </Link>
        </div>

        {/* Header Section */}
        <div className="text-center mb-16 animate-fade-in-up">
          <span className="px-3 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-[0.2em] border border-[var(--color-teal-600)]/30 bg-[var(--color-teal-600)]/10 text-[var(--color-teal-300)]">
            SYSTEM CONSOLE
          </span>
          <h1 className="mt-6 font-display text-4xl md:text-6xl font-extrabold tracking-tight mb-4">
            How TalentIQ <span className="grad-text">Operates & Builds</span>
          </h1>
          <p className="text-[var(--text-muted)] text-lg max-w-2xl mx-auto leading-relaxed">
            Welcome to the operational command center. Below, you can explore development instructions, functional workflows, and feature utilization details.
          </p>
        </div>

        {/* Tab Selection */}
        <div className="flex flex-wrap justify-center gap-3 mb-12 border-b border-[var(--border-default)] pb-8 animate-fade-in-up">
          {[
            { id: "journey", label: "User Journey", icon: <Sparkles className="w-4 h-4" /> },
            { id: "build", label: "Build & Setup", icon: <Terminal className="w-4 h-4" /> },
            { id: "features", label: "Features Guide", icon: <Code2 className="w-4 h-4" /> },
            { id: "autobot", label: "Auto Job Bot Detail", icon: <Cpu className="w-4 h-4" /> },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "flex items-center gap-2 px-6 py-3.5 rounded-xl border text-sm font-semibold transition-all cursor-pointer",
                activeTab === tab.id
                  ? "bg-[var(--color-teal-600)]/20 border-[var(--color-teal-600)] text-[var(--color-teal-300)] shadow-[var(--glow-teal)]"
                  : "bg-[var(--bg-card)]/40 border-[var(--border-default)] text-[var(--text-muted)] hover:border-[var(--border-mid)] hover:text-[var(--text-primary)]"
              )}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Contents */}
        <div className="glass-card p-8 md:p-12 border-[var(--border-default)] relative overflow-hidden animate-scale-up">
          <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-[var(--color-teal-600)]/3 blur-[120px] pointer-events-none" />
          
          {/* Decorative background shapes for scroll timeline animation inside content */}
          <div className="absolute left-4 top-1/4 pointer-events-none hidden xl:block z-0">
            <div className="w-24 h-24 bg-gradient-to-tr from-[var(--color-teal-600)]/10 to-transparent shape-circle border border-[var(--color-teal-600)]/20 shape-anim" />
          </div>
          <div className="absolute right-4 top-1/3 pointer-events-none hidden xl:block z-0">
            <div className="w-28 h-28 bg-gradient-to-bl from-[var(--color-violet)]/10 to-transparent shape-square border border-[var(--color-violet)]/20 shape-anim" style={{ animationDelay: "0.2s" }} />
          </div>

          {/* 1. USER JOURNEY TAB */}
          {activeTab === "journey" && (
            <div className="space-y-10 animate-fade-in-up relative z-10">
              <div className="grid lg:grid-cols-2 gap-12 items-center">
                <div>
                  <h3 className="font-display text-3xl font-bold mb-4 flex items-center gap-2">
                    <Sparkles className="text-[var(--color-teal-300)] w-7 h-7" /> Four Steps to Success
                  </h3>
                  <p className="text-sm text-[var(--text-muted)] leading-relaxed mb-8">
                    TalentIQ acts as an intelligent career loop. By connecting resume insights directly with roadmap planning and automated mock simulator modules, the platform helps you optimize continuously.
                  </p>
                  <div className="space-y-4">
                    {STEPS.map((s, idx) => (
                      <div key={idx} className="flex gap-4 p-5 rounded-2xl bg-[var(--bg-deep)]/40 border border-[var(--border-default)] hover:border-[var(--color-teal-600)]/30 transition-all">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center font-mono font-bold text-sm flex-shrink-0" style={{ background: `${s.color}22`, color: s.color }}>
                          {s.step}
                        </div>
                        <div>
                          <h4 className="font-bold text-base text-[var(--text-primary)]">{s.title}</h4>
                          <p className="text-xs text-[var(--text-muted)] mt-1.5 leading-relaxed">{s.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Visual Reference Shape Scrolling Demo */}
                <div className="bg-[var(--bg-deep)]/60 rounded-3xl p-8 border border-[var(--border-default)] flex flex-col items-center justify-center relative overflow-hidden min-h-[380px]">
                  <div className="absolute inset-0 pointer-events-none bg-radial-gradient from-[var(--color-teal-600)]/5 to-transparent" />
                  <p className="text-xs font-mono text-[var(--color-teal-300)] mb-6 tracking-widest">// SCROLL SHAPES DEMO</p>
                  
                  {/* Wrapper with shape classes */}
                  <div className="flex flex-col gap-6 w-full items-center">
                    <div className="flex items-center gap-6 w-full max-w-[320px] justify-between p-3.5 bg-[var(--bg-primary)]/80 rounded-2xl border border-[var(--border-default)] animate-scroll-left">
                      <div className="w-12 h-12 bg-[var(--color-teal-600)]/20 border border-[var(--color-teal-600)]/40 shape-circle flex items-center justify-center font-bold text-white">01</div>
                      <span className="text-xs font-bold text-[var(--text-muted)]">Circle: Profile Analysis</span>
                    </div>
                    <div className="flex items-center gap-6 w-full max-w-[320px] justify-between p-3.5 bg-[var(--bg-primary)]/80 rounded-2xl border border-[var(--border-default)] animate-scroll-right">
                      <div className="w-12 h-12 bg-[var(--color-violet)]/20 border border-[var(--color-violet)]/40 shape-square flex items-center justify-center font-bold text-white">02</div>
                      <span className="text-xs font-bold text-[var(--text-muted)]">Square: Skill Gap mapping</span>
                    </div>
                    <div className="flex items-center gap-6 w-full max-w-[320px] justify-between p-3.5 bg-[var(--bg-primary)]/80 rounded-2xl border border-[var(--border-default)] animate-scroll-left">
                      <div className="w-12 h-12 bg-[var(--color-amber)]/20 border border-[var(--color-amber)]/40 shape-triangle flex items-center justify-center font-bold text-white">03</div>
                      <span className="text-xs font-bold text-[var(--text-muted)]">Triangle: Practice simulation</span>
                    </div>
                    <div className="flex items-center gap-6 w-full max-w-[320px] justify-between p-3.5 bg-[var(--bg-primary)]/80 rounded-2xl border border-[var(--border-default)] animate-scroll-right">
                      <div className="w-12 h-12 bg-[var(--color-rose)]/20 border border-[var(--color-rose)]/40 shape-star flex items-center justify-center font-bold text-white">04</div>
                      <span className="text-xs font-bold text-[var(--text-muted)]">Star: Application automation</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 2. BUILD & SETUP GUIDE */}
          {activeTab === "build" && (
            <div className="space-y-6 animate-fade-in-up font-sans relative z-10">
              <h3 className="font-display text-2xl font-bold mb-2 flex items-center gap-2">
                <Terminal className="text-[var(--color-teal-300)]" /> Project Build Instructions
              </h3>
              <p className="text-sm text-[var(--text-muted)] leading-relaxed mb-6">
                Follow these commands to configure the development stack on your local workspace. Ensure database servers and message brokers are running.
              </p>

              <div className="grid lg:grid-cols-2 gap-8">
                {/* Left Column: Requirements & Envs */}
                <div className="space-y-6">
                  <div className="p-6 rounded-2xl bg-[var(--bg-deep)]/40 border border-[var(--border-default)]">
                    <h4 className="text-sm font-bold text-[var(--color-teal-300)] flex items-center gap-2 mb-3">
                      <Database className="w-4 h-4" /> System Dependencies
                    </h4>
                    <ul className="text-xs text-[var(--text-muted)] space-y-3 list-disc pl-4 leading-relaxed">
                      <li><strong>Node.js:</strong> v20.0+ (Next.js 15 app server)</li>
                      <li><strong>Python:</strong> v3.11+ (FastAPI backend server)</li>
                      <li><strong>PostgreSQL:</strong> v16.0+ (relational data store)</li>
                      <li><strong>Redis:</strong> (message broker for Celery worker queues)</li>
                      <li><strong>Chromium:</strong> (Playwright package for autobot processes)</li>
                    </ul>
                  </div>

                  <div className="p-6 rounded-2xl bg-[var(--bg-deep)]/40 border border-[var(--border-default)]">
                    <h4 className="text-sm font-bold text-[var(--color-violet)] flex items-center gap-2 mb-3">
                      <KeyRound className="w-4 h-4" /> Essential API Keys
                    </h4>
                    <p className="text-xs text-[var(--text-muted)] mb-3">
                      Copy <code>.env.example</code> into <code>.env</code> configs. Important variables:
                    </p>
                    <pre className="text-[10px] font-mono p-4 bg-black/50 rounded-xl text-emerald-400 overflow-x-auto leading-relaxed">
{`GOOGLE_API_KEY=AI_Studio_Gemini_Key
DATABASE_URL=postgresql+asyncpg://user:pwd@localhost/db
CLERK_SECRET_KEY=clerk_auth_jwt_key
STREAM_API_KEY=getstream_video_chat_key`}
                    </pre>
                  </div>
                </div>

                {/* Right Column: Code CLI Commands */}
                <div className="space-y-6">
                  <div className="p-6 rounded-2xl bg-black border border-[var(--border-default)] flex flex-col justify-between h-full">
                    <div>
                      <div className="flex items-center justify-between border-b border-zinc-800 pb-3 mb-4">
                        <span className="text-xs font-mono text-zinc-400">Terminal — Execution Script</span>
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                      </div>
                      
                      <div className="space-y-4 font-mono text-[11px] leading-relaxed">
                        <div>
                          <span className="text-zinc-500"># 1. Install & start Frontend client</span>
                          <pre className="text-emerald-400 bg-zinc-950 p-2.5 rounded-md mt-1 overflow-x-auto">
                            cd frontend && npm install && npm run dev
                          </pre>
                        </div>

                        <div>
                          <span className="text-zinc-500"># 2. Run backend FastAPI API server</span>
                          <pre className="text-emerald-400 bg-zinc-950 p-2.5 rounded-md mt-1 overflow-x-auto">
{`cd backend
python -m venv venv && venv\\Scripts\\activate
pip install -r requirements.txt
uvicorn src.main:app --reload --port 8000`}
                          </pre>
                        </div>

                        <div>
                          <span className="text-zinc-500"># 3. Spin up Celery workers for parser</span>
                          <pre className="text-emerald-400 bg-zinc-950 p-2.5 rounded-md mt-1 overflow-x-auto">
                            celery -A src.workers.tasks worker --loglevel=info
                          </pre>
                        </div>
                      </div>
                    </div>
                    <div className="text-[10px] text-zinc-500 font-mono mt-4 text-center">
                      Frontend runs at <b>http://localhost:3000</b> · Backend at <b>http://localhost:8000</b>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 3. FEATURES GUIDE */}
          {activeTab === "features" && (
            <div className="space-y-8 animate-fade-in-up relative z-10">
              <h3 className="font-display text-2xl font-bold mb-4 flex items-center gap-2">
                <Code2 className="text-[var(--color-teal-300)]" /> App Feature Utilization
              </h3>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[
                  {
                    title: "Resume Analyzer",
                    badge: "ATS Scoring",
                    icon: <FileText className="text-[var(--color-teal-300)] w-6 h-6" />,
                    usage: "Upload a PDF document. The PDF parsed with PyMuPDF goes into Gemini fallback chain. You get a score, skill radar visualization, and bullet recommendations."
                  },
                  {
                    title: "Opportunity Matcher",
                    badge: "Semantic Rank",
                    icon: <Target className="text-[var(--color-violet)] w-6 h-6" />,
                    usage: "Paste a description. Hybrid algorithms check Jaccard keyword overlap and vector cosine similarity. Highlights matching skills vs missing gaps."
                  },
                  {
                    title: "Mock Interview",
                    badge: "Animated Avatar",
                    icon: <Brain className="text-[var(--color-amber)] w-6 h-6" />,
                    usage: "Simulate coding or soft-skills interviews. Speaks via browser audio. Provides comprehensive technical accuracy and clarity scorecards."
                  },
                  {
                    title: "Live prep room",
                    badge: "Stream SDK",
                    icon: <Video className="text-[var(--color-rose)] w-6 h-6" />,
                    usage: "Initiate direct video classrooms. Embeds Monaco Code Editor syncing real-time inputs. Run Python or JS inside via Piston API endpoints."
                  },
                  {
                    title: "Application Kanban",
                    badge: "Pipeline Hub",
                    icon: <BarChart2 className="text-[var(--color-cyan)] w-6 h-6" />,
                    usage: "Move items across columns. Integrates with the Resume Analyzer and Opportunity Matcher to automatically flag target matching scores."
                  },
                  {
                    title: "AI Chat Copilot",
                    badge: "Gemini SSE",
                    icon: <Zap className="text-[var(--color-teal-300)] w-6 h-6" />,
                    usage: "Ask questions on cover drafts or negotiation advice. Connects with SSE channels to render streaming responses word-by-word."
                  }
                ].map((feat, idx) => (
                  <div key={idx} className="p-6 rounded-2xl bg-[var(--bg-deep)]/40 border border-[var(--border-default)] hover:border-[var(--color-teal-600)]/30 transition-all flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <div className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800">
                          {feat.icon}
                        </div>
                        <span className="text-[9px] font-mono font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-zinc-800/80 text-zinc-300 border border-zinc-700">{feat.badge}</span>
                      </div>
                      <h4 className="font-display font-bold text-base mb-2 text-[var(--text-primary)]">{feat.title}</h4>
                      <p className="text-xs text-[var(--text-muted)] leading-relaxed">{feat.usage}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 4. AUTOBOT DETAIL */}
          {activeTab === "autobot" && (
            <div className="space-y-8 animate-fade-in-up font-sans relative z-10">
              <div className="grid lg:grid-cols-2 gap-12 items-start">
                <div>
                  <div className="flex items-center gap-2.5 mb-3">
                    <Cpu className="text-[#FF6600] w-7 h-7" />
                    <h3 className="font-display text-2xl font-bold">Auto Job Bot Walkthrough</h3>
                  </div>
                  <p className="text-sm text-[var(--text-muted)] leading-relaxed mb-6">
                    The Auto Job Bot runs as a headless Playwright automation engine, executing application loops for LinkedIn Easy Apply, Naukri submissions, and YC Work at a Startup.
                  </p>

                  <div className="space-y-5">
                    <div className="p-5 rounded-2xl bg-[var(--bg-deep)]/40 border border-[var(--border-default)]">
                      <h4 className="text-xs font-bold text-[#FF6600] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <CheckCircle className="w-4 h-4" /> 1. Playwright Setup (Required)
                      </h4>
                      <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                        Since the bot operates simulated browsers, you must install Playwright binaries. Navigate to the standalone bot folder or run:
                        <code className="block mt-2.5 p-2.5 bg-black/60 text-emerald-400 rounded-md font-mono text-[10px]">
                          npx playwright install chromium
                        </code>
                      </p>
                    </div>

                    <div className="p-5 rounded-2xl bg-[var(--bg-deep)]/40 border border-[var(--border-default)]">
                      <h4 className="text-xs font-bold text-[#FF6600] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <Shield className="w-4 h-4" /> 2. Security Vault Credentials
                      </h4>
                      <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                        Add accounts on the bot page. Credentials are secure. You can toggle **Google SSO** mode. In SSO mode, the bot uses a persisted local browser profile, logging you in automatically after your first manual click.
                      </p>
                    </div>

                    <div className="p-5 rounded-2xl bg-[var(--bg-deep)]/40 border border-[var(--border-default)]">
                      <h4 className="text-xs font-bold text-[#FF6600] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <Lock className="w-4 h-4" /> 3. Config Editor & Keywords
                      </h4>
                      <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                        Keywords can be synchronized from your parsed resume profile skills. The configuration holds country prioritizations, limit controls, and platform toggles without requiring app restarts.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Architecture & Code Preferences block */}
                <div className="space-y-6">
                  <div className="p-6 rounded-2xl bg-black border border-[var(--border-default)] font-mono text-[11px] leading-relaxed">
                    <div className="flex items-center justify-between border-b border-zinc-800 pb-3 mb-4">
                      <span className="text-zinc-400 text-xs font-bold">Preferences Config (job_prefs.json)</span>
                      <span className="text-orange-500 font-bold font-sans text-[10px]">JSON FILE</span>
                    </div>
                    <pre className="text-emerald-400 bg-zinc-950 p-4 rounded-xl overflow-x-auto leading-normal">
{`{
  "keywords": ["Full Stack Developer", "AI Intern"],
  "experience_level": ["Entry level", "Internship"],
  "remote_only": false,
  "max_applications_per_day": 80,
  "countries": [
    { "country": "India", "priority": 1, "active": true },
    { "country": "Remote", "priority": 2, "active": true }
  ],
  "platforms": {
    "linkedin": { "enabled": true },
    "naukri": { "enabled": true }
  }
}`}
                    </pre>
                  </div>

                  <div className="p-6 rounded-2xl bg-[var(--bg-deep)]/50 border border-[var(--border-default)] space-y-4">
                    <h4 className="text-sm font-bold text-[var(--text-primary)]">Real-time SSE Live Log Channel</h4>
                    <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                      When the bot starts, the FastAPI server forks the playwright script as a background process. Outputs are captured and streamed via Server-Sent Events (SSE) directly to the web client, showing full progress metrics and skip/success badges.
                    </p>
                    <div className="flex flex-wrap gap-2 pt-2">
                      {["Submitted ✅", "Stuck ⚠️", "Failed ❌", "Skipped ⏭️"].map(badge => (
                        <span key={badge} className="px-3 py-1.5 rounded-full text-[10px] font-bold bg-zinc-800 border border-zinc-700 text-zinc-300">{badge}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>

      </div>

      <Footer />
    </div>
  );
}
