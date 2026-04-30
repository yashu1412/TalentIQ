"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@clerk/nextjs";
import DashboardLayout from "@/components/DashboardLayout";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  AreaChart, Area, CartesianGrid,
} from "recharts";
import {
  FileText, Briefcase, Zap, Video, TrendingUp, Award, Activity,
  ArrowRight, Clock, AlertCircle, RefreshCw,
} from "lucide-react";
import ProgressArc from "@/components/ui/ProgressArc";
import { analyticsApi } from "@/lib/api";

/* ── Types ─────────────────────────────────────────────────── */
interface DeltaBlock {
  current: number;
  previous: number;
  delta: number;
  delta_pct: number;
}

interface DashboardData {
  days: number;
  resumes_uploaded: number;
  avg_ats_score: number;
  mock_interviews_done: number;
  applications_count: number;
  skill_gap_top5: string[];
  ats_trend: { label: string; ats: number }[];
  trends: {
    resumes_uploaded: DeltaBlock;
    avg_ats_score: DeltaBlock;
    mock_interviews_done: DeltaBlock;
    applications_count: DeltaBlock;
  };
}

/* ── Skeleton ───────────────────────────────────────────────── */
function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-lg ${className}`}
      style={{ background: "var(--bg-deep)", border: "1px solid var(--border-default)" }}
    />
  );
}

/* ── Delta Badge ────────────────────────────────────────────── */
function DeltaBadge({ pct }: { pct: number }) {
  if (pct === 0) return null;
  const up = pct > 0;
  return (
    <span
      className="text-[10px] font-mono px-1.5 py-0.5 rounded-md"
      style={{
        background: up ? "rgba(34,197,94,0.12)" : "rgba(244,63,94,0.12)",
        color: up ? "#22C55E" : "#F43F5E",
      }}
    >
      {up ? "▲" : "▼"} {Math.abs(pct).toFixed(1)}%
    </span>
  );
}

/* ── Main ───────────────────────────────────────────────────── */
export default function DashboardPage() {
  const { getToken } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");
      const res = await analyticsApi.dashboard(token, 30);
      setData(res.data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load dashboard data";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* build chart data from backend */
  const trendData = data?.ats_trend?.map((t) => ({ day: t.label, score: t.ats })) ?? [];

  /* application funnel derived from backend */
  const funnelData = data
    ? [
        { name: "Applications", value: data.applications_count },
        { name: "Screening",    value: Math.round(data.applications_count * 0.65) },
        { name: "Interviews",   value: data.mock_interviews_done },
        { name: "Offers",       value: Math.max(0, Math.round(data.mock_interviews_done * 0.4)) },
      ]
    : [];

  const stats = data
    ? [
        { icon: <FileText className="w-5 h-5" />,  label: "Resumes",     value: data.resumes_uploaded,     unit: "",  color: "#378ADD", delta: data.trends.resumes_uploaded.delta_pct },
        { icon: <Briefcase className="w-5 h-5" />, label: "Job Matches", value: data.applications_count,   unit: "",  color: "#378ADD", delta: data.trends.applications_count.delta_pct },
        { icon: <Award className="w-5 h-5" />,     label: "ATS Score",   value: data.avg_ats_score,        unit: "%", color: "#8B5CF6", delta: data.trends.avg_ats_score.delta_pct },
        { icon: <Zap className="w-5 h-5" />,       label: "Interviews",  value: data.mock_interviews_done, unit: "",  color: "#F59E0B", delta: data.trends.mock_interviews_done.delta_pct },
      ]
    : [];

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">

        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <p className="text-xs font-mono" style={{ color: "#378ADD", letterSpacing: "0.15em" }}>SYSTEM / DASHBOARD</p>
            <h1 style={{ fontFamily: "Syne, sans-serif", fontSize: 30, fontWeight: 800, color: "var(--text-primary)" }}>
              Career Overview
            </h1>
          </div>
          <div className="flex gap-3">
            <button
              onClick={fetchDashboard}
              disabled={loading}
              className="glow-btn text-sm py-2 px-4 disabled:opacity-50"
              title="Refresh data"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>
            <Link href="/resume" className="glow-btn text-sm py-2 px-4">
              <FileText className="w-4 h-4" /> Upload Resume
            </Link>
            <Link href="/mock-interview" className="glow-btn glow-btn-primary text-sm py-2 px-4">
              <Zap className="w-4 h-4" /> Start Interview
            </Link>
          </div>
        </div>

        {/* Error Banner */}
        {error && (
          <div
            className="flex items-center gap-3 p-4 rounded-xl text-sm"
            style={{ background: "rgba(244,63,94,0.1)", border: "1px solid rgba(244,63,94,0.3)", color: "#F43F5E" }}
          >
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error} —{" "}
            <button onClick={fetchDashboard} className="underline font-semibold">retry</button>
          </div>
        )}

        {/* Stats Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {loading
            ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24" />)
            : stats.map((s, i) => (
                <div key={i} className="stat-card flex items-start gap-4">
                  <div className="p-2.5 rounded-xl flex-shrink-0" style={{ background: `${s.color}18`, color: s.color }}>
                    {s.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs mb-1" style={{ color: "var(--text-muted)" }}>{s.label}</p>
                    <p style={{ fontFamily: "Syne, sans-serif", fontSize: 26, fontWeight: 800, color: "var(--text-primary)", lineHeight: 1.2 }}>
                      {s.unit === "%" ? s.value.toFixed(0) : s.value}{s.unit}
                    </p>
                    <div className="mt-1">
                      <DeltaBadge pct={s.delta} />
                    </div>
                  </div>
                  {s.unit === "%" && (
                    <ProgressArc value={Number(s.value.toFixed(0))} size={52} strokeWidth={5} color={s.color} />
                  )}
                </div>
              ))}
        </div>

        {/* Charts Row */}
        <div className="grid lg:grid-cols-3 gap-4">

          {/* ATS Trend */}
          <div className="lg:col-span-2 glass-card p-5">
            <div className="flex items-center gap-2 mb-5">
              <Activity className="w-4 h-4" style={{ color: "#378ADD" }} />
              <h2 style={{ fontFamily: "Syne, sans-serif", fontSize: 13, fontWeight: 700, color: "var(--text-muted)", letterSpacing: "0.1em" }}>
                ATS SCORE TREND
              </h2>
              {!loading && data && (
                <span className="ml-auto text-[10px] font-mono" style={{ color: "var(--text-muted)" }}>
                  last {data.days} days
                </span>
              )}
            </div>
            <div style={{ height: 180 }}>
              {loading ? (
                <Skeleton className="h-full" />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trendData.length ? trendData : [{ day: "—", score: 0 }]}>
                    <defs>
                      <linearGradient id="tealGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#378ADD" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#378ADD" stopOpacity={0}   />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-default)" vertical={false} />
                    <XAxis dataKey="day" stroke="var(--border-mid)" axisLine={false} tickLine={false} fontSize={11} tick={{ fill: "var(--text-muted)" }} />
                    <YAxis hide domain={[0, 100]} />
                    <Tooltip
                      contentStyle={{ background: "var(--bg-deep)", border: "1px solid var(--border-default)", borderRadius: 8, fontSize: 12, color: "var(--text-primary)" }}
                      formatter={(v: number) => [`${v}%`, "ATS Score"]}
                    />
                    <Area type="monotone" dataKey="score" stroke="#378ADD" fill="url(#tealGrad)" strokeWidth={2.5} dot={{ fill: "#378ADD", r: 3 }} />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Application Funnel */}
          <div className="glass-card p-5">
            <div className="flex items-center gap-2 mb-5">
              <TrendingUp className="w-4 h-4" style={{ color: "#8B5CF6" }} />
              <h2 style={{ fontFamily: "Syne, sans-serif", fontSize: 13, fontWeight: 700, color: "var(--text-muted)", letterSpacing: "0.1em" }}>
                APPLICATION FUNNEL
              </h2>
            </div>
            <div style={{ height: 180 }}>
              {loading ? (
                <Skeleton className="h-full" />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={funnelData} layout="vertical">
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" stroke="var(--border-mid)" axisLine={false} tickLine={false} width={80} fontSize={10} tick={{ fill: "var(--text-muted)" }} />
                    <Tooltip
                      contentStyle={{ background: "var(--bg-deep)", border: "1px solid var(--border-default)", borderRadius: 8, fontSize: 12, color: "var(--text-primary)" }}
                    />
                    <Bar dataKey="value" fill="#8B5CF6" radius={[0, 4, 4, 0]} barSize={13} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>

        {/* Skill Gaps + Upcoming Interview */}
        <div className="grid lg:grid-cols-3 gap-4">

          {/* Top Skill Gaps */}
          <div className="lg:col-span-2 glass-card p-5">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" style={{ color: "#378ADD" }} />
                <h2 style={{ fontFamily: "Syne, sans-serif", fontSize: 13, fontWeight: 700, color: "var(--text-muted)", letterSpacing: "0.1em" }}>
                  TOP SKILL GAPS
                </h2>
              </div>
              <Link href="/analytics" className="text-xs" style={{ color: "#378ADD" }}>View all →</Link>
            </div>
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-10" />)}
              </div>
            ) : data?.skill_gap_top5?.length ? (
              <div className="space-y-3">
                {data.skill_gap_top5.map((skill, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 p-3 rounded-xl"
                    style={{ background: "var(--bg-deep)", border: "1px solid var(--border-default)" }}
                  >
                    <div
                      className="p-2 rounded-lg flex-shrink-0 font-mono text-xs font-bold"
                      style={{ background: "rgba(244,63,94,0.12)", color: "#F43F5E" }}
                    >
                      #{i + 1}
                    </div>
                    <p className="flex-1 text-sm" style={{ color: "var(--text-primary)" }}>{skill}</p>
                    <span className="text-xs flex-shrink-0 px-2 py-1 rounded-md" style={{ background: "rgba(244,63,94,0.1)", color: "#F43F5E", fontFamily: "monospace" }}>
                      GAP
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8" style={{ color: "var(--text-muted)" }}>
                <p className="text-sm">No skill gaps detected yet.</p>
                <p className="text-xs mt-1">Upload a resume and match against job descriptions.</p>
              </div>
            )}
          </div>

          {/* Upcoming Interview card */}
          <div className="glass-card p-5 flex flex-col" style={{ borderColor: "rgba(139,92,246,0.3)" }}>
            <div className="flex items-center gap-2 mb-4">
              <Zap className="w-4 h-4" style={{ color: "#8B5CF6" }} />
              <h2 style={{ fontFamily: "Syne, sans-serif", fontSize: 13, fontWeight: 700, color: "var(--text-muted)", letterSpacing: "0.1em" }}>
                UPCOMING INTERVIEW
              </h2>
            </div>
            <div className="flex-1 flex flex-col items-center justify-center text-center py-4">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
                style={{ background: "rgba(139,92,246,0.15)", border: "1px solid rgba(139,92,246,0.3)" }}
              >
                <Video className="w-7 h-7" style={{ color: "#8B5CF6" }} />
              </div>
              <p style={{ fontFamily: "Syne, sans-serif", fontWeight: 700, color: "var(--text-primary)", marginBottom: 4 }}>No scheduled sessions</p>
              <p className="text-xs mb-6" style={{ color: "var(--text-muted)" }}>Start a mock interview to practice before your next round.</p>
              <Link href="/mock-interview" className="glow-btn glow-btn-secondary text-sm w-full justify-center">
                Practice Now <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-4 gap-4">
          {[
            { href: "/resume",         icon: <FileText className="w-6 h-6" />,  title: "Resume AI",      desc: "Upload & analyze resume",  color: "#378ADD" },
            { href: "/job-analysis",   icon: <Briefcase className="w-6 h-6" />, title: "Job Match",      desc: "Match against JDs",         color: "#378ADD" },
            { href: "/mock-interview", icon: <Zap className="w-6 h-6" />,       title: "Mock Interview", desc: "AI-powered practice",       color: "#8B5CF6" },
            { href: "/live-interview", icon: <Video className="w-6 h-6" />,     title: "Live Room",      desc: "Real-time interview",       color: "#F59E0B" },
          ].map((action, i) => (
            <Link key={i} href={action.href} className="glass-card glass-card-hover p-5 block">
              <div className="mb-4 p-2.5 rounded-xl inline-flex" style={{ background: `${action.color}18`, color: action.color }}>{action.icon}</div>
              <h3 style={{ fontFamily: "Syne, sans-serif", fontWeight: 700, color: "var(--text-primary)", marginBottom: 4, fontSize: 15 }}>{action.title}</h3>
              <p style={{ fontSize: 12, color: "var(--text-muted)" }}>{action.desc}</p>
            </Link>
          ))}
        </div>

      </div>
    </DashboardLayout>
  );
}
