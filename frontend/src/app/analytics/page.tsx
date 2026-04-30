"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@clerk/nextjs";
import DashboardLayout from "@/components/DashboardLayout";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  RadarChart, PolarGrid, PolarAngleAxis, Radar,
  AreaChart, Area, CartesianGrid,
} from "recharts";
import {
  TrendingUp, Zap, FileText, Briefcase, AlertTriangle,
  BarChart2, AlertCircle, RefreshCw,
} from "lucide-react";
import ProgressArc from "@/components/ui/ProgressArc";
import { analyticsApi } from "@/lib/api";
import Link from "next/link";

/* ── Types ─────────────────────────────────────────────────── */
interface AtsTrendPoint { label: string; ats: number }
interface DeltaBlock { current: number; previous: number; delta: number; delta_pct: number }

interface DashboardData {
  days: number;
  resumes_uploaded: number;
  avg_ats_score: number;
  mock_interviews_done: number;
  applications_count: number;
  skill_gap_top5: string[];
  ats_trend: AtsTrendPoint[];
  trends: {
    resumes_uploaded: DeltaBlock;
    avg_ats_score: DeltaBlock;
    mock_interviews_done: DeltaBlock;
    applications_count: DeltaBlock;
  };
}

interface SkillsData {
  missing_skills: { skill: string; frequency: number }[];
  strong_skills: { skill: string; frequency: number }[];
}

interface InterviewsTrend { label: string; count: number; score: number }
interface InterviewsData {
  days: number;
  total: number;
  avg_score: number;
  by_type: { hr: number; technical: number; coding: number; system_design: number };
  trend: InterviewsTrend[];
  trends: { total: DeltaBlock; avg_score: DeltaBlock };
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
export default function AnalyticsPage() {
  const { getToken } = useAuth();
  const [data, setData]               = useState<DashboardData | null>(null);
  const [skills, setSkills]           = useState<SkillsData | null>(null);
  const [interviews, setInterviews]   = useState<InterviewsData | null>(null);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");
      const [d, s, i] = await Promise.all([
        analyticsApi.dashboard(token, 30),
        analyticsApi.skills(token, 30),
        analyticsApi.interviews(token, 30),
      ]);
      setData(d.data);
      setSkills(s.data);
      setInterviews(i.data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load analytics";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const radarData = interviews
    ? [
        { subject: "HR",         score: interviews.by_type?.hr ?? 0 },
        { subject: "Technical",  score: interviews.by_type?.technical ?? 0 },
        { subject: "Coding",     score: interviews.by_type?.coding ?? 0 },
        { subject: "Sys Design", score: interviews.by_type?.system_design ?? 0 },
      ]
    : [];

  const hasInterviewBreakdown = radarData.some((d) => d.score > 0);
  const hasSkillGaps = (skills?.missing_skills?.length ?? 0) > 0;

  const kpis = [
    { icon: <FileText className="w-5 h-5" />,   label: "Resumes",       value: data?.resumes_uploaded,     unit: "",  color: "#378ADD", arc: null as number | null,               delta: data?.trends.resumes_uploaded.delta_pct ?? 0 },
    { icon: <TrendingUp className="w-5 h-5" />, label: "Avg ATS Score", value: data?.avg_ats_score,        unit: "%", color: "#378ADD", arc: data?.avg_ats_score ?? null,          delta: data?.trends.avg_ats_score.delta_pct ?? 0 },
    { icon: <Zap className="w-5 h-5" />,        label: "Interviews",    value: data?.mock_interviews_done, unit: "",  color: "#8B5CF6", arc: null as number | null,               delta: data?.trends.mock_interviews_done.delta_pct ?? 0 },
    { icon: <Briefcase className="w-5 h-5" />,  label: "Applications",  value: data?.applications_count,   unit: "",  color: "#F59E0B", arc: null as number | null,               delta: data?.trends.applications_count.delta_pct ?? 0 },
  ];

  const tooltipStyle = {
    contentStyle: {
      background: "var(--bg-deep)",
      border: "1px solid var(--border-default)",
      borderRadius: 8,
      fontSize: 12,
      color: "var(--text-primary)",
    },
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">

        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <p className="text-xs font-mono" style={{ color: "#60A5FA", letterSpacing: "0.15em" }}>SYSTEM / ANALYTICS</p>
            <h1 style={{ fontFamily: "Syne, sans-serif", fontSize: 30, fontWeight: 800, color: "var(--text-primary)" }}>
              Career Analytics
            </h1>
          </div>
          <button
            onClick={fetchAll}
            disabled={loading}
            className="glow-btn text-sm py-2 px-4 disabled:opacity-50"
            title="Refresh analytics"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>

        {/* Error Banner */}
        {error && (
          <div
            className="flex items-center gap-3 p-4 rounded-xl text-sm"
            style={{ background: "rgba(244,63,94,0.1)", border: "1px solid rgba(244,63,94,0.3)", color: "#F43F5E" }}
          >
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error} —{" "}
            <button onClick={fetchAll} className="underline font-semibold">retry</button>
          </div>
        )}

        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {loading
            ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24" />)
            : kpis.map((s, i) => (
                <div key={i} className="stat-card flex items-start gap-4">
                  <div className="p-2.5 rounded-xl flex-shrink-0" style={{ background: `${s.color}18`, color: s.color }}>
                    {s.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs mb-1" style={{ color: "var(--text-muted)" }}>{s.label}</p>
                    <p style={{ fontFamily: "Syne, sans-serif", fontSize: 26, fontWeight: 800, color: "var(--text-primary)", lineHeight: 1.2 }}>
                      {s.value != null ? `${s.unit === "%" ? Number(s.value).toFixed(0) : s.value}${s.unit}` : "—"}
                    </p>
                    <div className="mt-1"><DeltaBadge pct={s.delta} /></div>
                  </div>
                  {s.arc != null && <ProgressArc value={s.arc} size={52} strokeWidth={5} color={s.color} />}
                </div>
              ))}
        </div>

        {/* ATS Trend */}
        <div className="glass-card p-5">
          <div className="flex items-center gap-2 mb-5">
            <TrendingUp className="w-4 h-4" style={{ color: "#378ADD" }} />
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
                <AreaChart data={data?.ats_trend ?? []}>
                  <defs>
                    <linearGradient id="atsGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#378ADD" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#378ADD" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-default)" vertical={false} />
                  <XAxis dataKey="label" stroke="var(--border-mid)" axisLine={false} tickLine={false} fontSize={11} tick={{ fill: "var(--text-muted)" }} />
                  <YAxis domain={[0, 100]} hide />
                  <Tooltip {...tooltipStyle} formatter={(v: number) => [`${v}%`, "ATS Score"]} />
                  <Area type="monotone" dataKey="ats" name="ATS Score" stroke="#378ADD" fill="url(#atsGrad)" strokeWidth={2.5} dot={{ fill: "#378ADD", r: 3 }} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Interview History + Breakdown / Skill Gaps */}
        <div className="grid lg:grid-cols-2 gap-5">

          {/* Interview Score History */}
          <div className="glass-card p-5">
            <div className="flex items-center gap-2 mb-5">
              <Zap className="w-4 h-4" style={{ color: "#8B5CF6" }} />
              <h2 style={{ fontFamily: "Syne, sans-serif", fontSize: 13, fontWeight: 700, color: "var(--text-muted)", letterSpacing: "0.1em" }}>
                INTERVIEW SCORE HISTORY
              </h2>
              {!loading && interviews && (
                <span className="ml-auto text-[10px] font-mono" style={{ color: "var(--text-muted)" }}>
                  avg {interviews.avg_score}
                </span>
              )}
            </div>
            <div style={{ height: 180 }}>
              {loading ? (
                <Skeleton className="h-full" />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={interviews?.trend ?? []}>
                    <defs>
                      <linearGradient id="ivGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#8B5CF6" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-default)" vertical={false} />
                    <XAxis dataKey="label" stroke="var(--border-mid)" axisLine={false} tickLine={false} fontSize={11} tick={{ fill: "var(--text-muted)" }} />
                    <YAxis domain={[0, 100]} hide />
                    <Tooltip {...tooltipStyle} formatter={(v: number) => [`${v}`, "Score"]} />
                    <Area type="monotone" dataKey="score" name="Score" stroke="#8B5CF6" fill="url(#ivGrad)" strokeWidth={2.5} dot={{ fill: "#8B5CF6", r: 3 }} />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Interview Breakdown (radar) OR Skill Gaps (bar) */}
          {loading ? (
            <Skeleton className="h-64" />
          ) : hasInterviewBreakdown ? (
            <div className="glass-card p-5">
              <div className="flex items-center gap-2 mb-5">
                <Zap className="w-4 h-4" style={{ color: "#8B5CF6" }} />
                <h2 style={{ fontFamily: "Syne, sans-serif", fontSize: 13, fontWeight: 700, color: "var(--text-muted)", letterSpacing: "0.1em" }}>
                  INTERVIEW BREAKDOWN
                </h2>
              </div>
              <div style={{ height: 180 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="var(--border-default)" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: "var(--text-muted)", fontSize: 11 }} />
                    <Radar name="Count" dataKey="score" stroke="#8B5CF6" fill="#8B5CF6" fillOpacity={0.3} />
                    <Tooltip {...tooltipStyle} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>
          ) : hasSkillGaps ? (
            <div className="glass-card p-5">
              <div className="flex items-center gap-2 mb-5">
                <AlertTriangle className="w-4 h-4" style={{ color: "#F43F5E" }} />
                <h2 style={{ fontFamily: "Syne, sans-serif", fontSize: 13, fontWeight: 700, color: "var(--text-muted)", letterSpacing: "0.1em" }}>
                  TOP SKILL GAPS
                </h2>
              </div>
              <div style={{ height: 180 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={skills!.missing_skills.slice(0, 6)} layout="vertical">
                    <XAxis type="number" hide />
                    <YAxis dataKey="skill" type="category" axisLine={false} tickLine={false} width={90} fontSize={11} tick={{ fill: "var(--text-muted)" }} />
                    <Tooltip {...tooltipStyle} />
                    <Bar dataKey="frequency" fill="#F43F5E" radius={[0, 4, 4, 0]} barSize={12} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          ) : null}
        </div>

        {/* Skill Gap Tags */}
        {!loading && (data?.skill_gap_top5?.length ?? 0) > 0 && (
          <div className="glass-card p-5">
            <h2 className="text-sm font-semibold mb-4" style={{ color: "var(--text-muted)" }}>Top Skills to Acquire</h2>
            <div className="flex flex-wrap gap-3">
              {data!.skill_gap_top5.map((sk, i) => (
                <span key={i} className="skill-badge-missing px-4 py-2 text-sm">{sk}</span>
              ))}
            </div>
            <div className="mt-4">
              <Link href="/roadmap" className="glow-btn text-xs py-2 px-4 inline-flex">
                Generate Skill-Gap Roadmap
              </Link>
            </div>
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && !data && (
          <div className="glass-card p-12 text-center">
            <BarChart2 className="w-12 h-12 mx-auto mb-4" style={{ color: "var(--text-muted)" }} />
            <p style={{ color: "var(--text-muted)" }}>Analytics will appear as you use the platform</p>
            <p className="text-sm mt-2" style={{ color: "var(--text-muted)" }}>Upload a resume and complete an interview to see insights.</p>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
}
