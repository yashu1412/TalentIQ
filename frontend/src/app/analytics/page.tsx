"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import DashboardLayout from "@/components/DashboardLayout";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  RadarChart, PolarGrid, PolarAngleAxis, Radar,
  AreaChart, Area, CartesianGrid,
} from "recharts";
import { TrendingUp, Zap, FileText, Briefcase, AlertTriangle, BarChart2 } from "lucide-react";
import ProgressArc from "@/components/ui/ProgressArc";
import axios from "axios";
import Link from "next/link";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/v1";

// Mock trend data for ATS over time
const ATS_TREND = [
  { week: "W1", ats: 54 }, { week: "W2", ats: 61 }, { week: "W3", ats: 70 },
  { week: "W4", ats: 74 }, { week: "W5", ats: 78 }, { week: "W6", ats: 82 },
  { week: "W7", ats: 82 }, { week: "W8", ats: 87 },
];

const INTERVIEW_HISTORY = [
  { date: "Mar 5",  score: 65 }, { date: "Mar 10", score: 72 }, { date: "Mar 15", score: 80 },
  { date: "Mar 20", score: 75 }, { date: "Mar 22", score: 88 },
];

export default function AnalyticsPage() {
  const { getToken } = useAuth();
  const [data, setData]           = useState<any>(null);
  const [skills, setSkills]       = useState<any>(null);
  const [interviews, setInterviews] = useState<any>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const token = await getToken();
        const headers = { Authorization: `Bearer ${token}` };
        const [d, s, i] = await Promise.all([
          axios.get(`${API}/analytics/dashboard`, { headers }),
          axios.get(`${API}/analytics/skills`, { headers }),
          axios.get(`${API}/analytics/interviews`, { headers }),
        ]);
        setData(d.data); setSkills(s.data); setInterviews(i.data);
      } catch {}
    };
    load();
  }, []);

  const radarData = interviews ? [
    { subject: "HR",          score: interviews.by_type?.hr ?? 0 },
    { subject: "Technical",   score: interviews.by_type?.technical ?? 0 },
    { subject: "Coding",      score: interviews.by_type?.coding ?? 0 },
    { subject: "Sys Design",  score: interviews.by_type?.system_design ?? 0 },
  ] : [];

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <div>
          <p className="text-xs font-mono" style={{ color: "#60A5FA", letterSpacing: "0.15em" }}>SYSTEM / ANALYTICS</p>
          <h1 style={{ fontFamily: "Syne, sans-serif", fontSize: 30, fontWeight: 800, color: "var(--text-primary)" }}>Career Analytics</h1>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { icon: <FileText className="w-5 h-5" />,  label: "Resumes",       value: data?.resumes_uploaded ?? "—",    color: "#378ADD", arcVal: null },
            { icon: <TrendingUp className="w-5 h-5" />, label: "Avg ATS Score", value: data?.avg_ats_score ?? 82,        color: "#378ADD", arcVal: data?.avg_ats_score ?? 82 },
            { icon: <Zap className="w-5 h-5" />,        label: "Interviews",    value: data?.mock_interviews_done ?? "—",color: "#8B5CF6", arcVal: null },
            { icon: <Briefcase className="w-5 h-5" />,  label: "Applications",  value: data?.applications_count ?? "—", color: "#F59E0B", arcVal: null },
          ].map((s, i) => (
            <div key={i} className="stat-card flex items-start gap-4">
              <div className="p-2.5 rounded-xl flex-shrink-0" style={{ background: `${s.color}18`, color: s.color }}>{s.icon}</div>
              <div className="flex-1 min-w-0">
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>{s.label}</p>
                <p style={{ fontFamily: "Syne, sans-serif", fontSize: 26, fontWeight: 800, color: "var(--text-primary)", lineHeight: 1.2 }}>
                  {typeof s.value === "number" && s.arcVal === null ? s.value : s.arcVal != null ? `${s.value}%` : s.value}
                </p>
              </div>
              {s.arcVal != null && <ProgressArc value={s.arcVal} size={52} strokeWidth={5} color={s.color} />}
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
          </div>
          <div style={{ height: 180 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={ATS_TREND}>
                <defs>
                  <linearGradient id="atsGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#378ADD" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#378ADD" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-default)" vertical={false} />
                <XAxis dataKey="week" stroke="var(--border-mid)" axisLine={false} tickLine={false} fontSize={11} tick={{ fill: "var(--text-muted)" }} />
                <YAxis domain={[40, 100]} hide />
                <Tooltip contentStyle={{ background: "var(--bg-deep)", border: "1px solid var(--border-default)", borderRadius: 8, fontSize: 12, color: "var(--text-primary)" }} />
                <Area type="monotone" dataKey="ats" name="ATS Score" stroke="#378ADD" fill="url(#atsGrad)" strokeWidth={2.5} dot={{ fill: "#378ADD", r: 3 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-5">
          {/* Interview History */}
          <div className="glass-card p-5">
            <div className="flex items-center gap-2 mb-5">
              <Zap className="w-4 h-4" style={{ color: "#8B5CF6" }} />
              <h2 style={{ fontFamily: "Syne, sans-serif", fontSize: 13, fontWeight: 700, color: "var(--text-muted)", letterSpacing: "0.1em" }}>
                INTERVIEW SCORE HISTORY
              </h2>
            </div>
            <div style={{ height: 180 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={INTERVIEW_HISTORY}>
                  <defs>
                    <linearGradient id="ivGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#8B5CF6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-default)" vertical={false} />
                  <XAxis dataKey="date" stroke="var(--border-mid)" axisLine={false} tickLine={false} fontSize={11} tick={{ fill: "var(--text-muted)" }} />
                  <YAxis domain={[0, 100]} hide />
                  <Tooltip contentStyle={{ background: "var(--bg-deep)", border: "1px solid var(--border-default)", borderRadius: 8, fontSize: 12, color: "var(--text-primary)" }} />
                  <Area type="monotone" dataKey="score" name="Score" stroke="#8B5CF6" fill="url(#ivGrad)" strokeWidth={2.5} dot={{ fill: "#8B5CF6", r: 3 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Interview Type Breakdown */}
          {radarData.some(d => d.score > 0) ? (
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
                    <Tooltip contentStyle={{ background: "var(--bg-deep)", border: "1px solid var(--border-default)", borderRadius: 8, color: "var(--text-primary)" }} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>
          ) : (
            /* Skill Gaps Chart (fallback if no interview data) */
            skills?.missing_skills?.length > 0 && (
              <div className="glass-card p-5">
                <div className="flex items-center gap-2 mb-5">
                  <AlertTriangle className="w-4 h-4" style={{ color: "#F43F5E" }} />
                  <h2 style={{ fontFamily: "Syne, sans-serif", fontSize: 13, fontWeight: 700, color: "var(--text-muted)", letterSpacing: "0.1em" }}>
                    TOP SKILL GAPS
                  </h2>
                </div>
                <div style={{ height: 180 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={skills.missing_skills.slice(0, 6)} layout="vertical">
                      <XAxis type="number" hide />
                      <YAxis dataKey="skill" type="category" axisLine={false} tickLine={false} width={90} fontSize={11} tick={{ fill: "var(--text-muted)" }} />
                      <Tooltip contentStyle={{ background: "var(--bg-deep)", border: "1px solid var(--border-default)", borderRadius: 8, color: "var(--text-primary)" }} />
                      <Bar dataKey="frequency" fill="#F43F5E" radius={[0, 4, 4, 0]} barSize={12} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )
          )}
        </div>

        {/* Skill gap tags */}
        {data?.skill_gap_top5?.length > 0 && (
          <div className="glass-card p-5">
            <h2 className="text-sm font-semibold mb-4" style={{ color: "var(--text-muted)" }}>Top Skills to Acquire</h2>
            <div className="flex flex-wrap gap-3">
              {data.skill_gap_top5.map((sk: string, i: number) => (
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

        {!data && (
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
