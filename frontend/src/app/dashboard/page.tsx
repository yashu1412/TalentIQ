"use client";

import Link from "next/link";
import DashboardLayout from "@/components/DashboardLayout";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area,
} from "recharts";
import {
  FileText, Briefcase, Zap, Video, TrendingUp, Award, Activity,
  ArrowRight, Clock, CheckCircle, AlertCircle,
} from "lucide-react";
import ProgressArc from "@/components/ui/ProgressArc";

const activityData = [
  { day: "Mon", score: 65 },
  { day: "Tue", score: 72 },
  { day: "Wed", score: 85 },
  { day: "Thu", score: 78 },
  { day: "Fri", score: 92 },
  { day: "Sat", score: 88 },
  { day: "Sun", score: 95 },
];

const funnelData = [
  { name: "Applications", value: 12 },
  { name: "Screening",    value: 8  },
  { name: "Interviews",   value: 5  },
  { name: "Offers",       value: 2  },
];

const RECENT_ACTIVITY = [
  { icon: <FileText className="w-4 h-4" />,  color: "#378ADD", text: "Resume uploaded & parsed",              time: "2 min ago" },
  { icon: <Briefcase className="w-4 h-4" />, color: "#378ADD", text: "Matched against Senior Backend role",   time: "18 min ago" },
  { icon: <Zap className="w-4 h-4" />,       color: "#8B5CF6", text: "Completed Technical mock interview",    time: "1 hr ago" },
  { icon: <CheckCircle className="w-4 h-4" />,color: "#22C55E", text: "Application saved to tracker",        time: "3 hr ago" },
  { icon: <AlertCircle className="w-4 h-4" />,color: "#F43F5E", text: "Skill gap detected: Kubernetes",      time: "Yesterday" },
];

export default function DashboardPage() {
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
            <Link href="/resume" className="glow-btn text-sm py-2 px-4">
              <FileText className="w-4 h-4" /> Upload Resume
            </Link>
            <Link href="/mock-interview" className="glow-btn glow-btn-primary text-sm py-2 px-4">
              <Zap className="w-4 h-4" /> Start Interview
            </Link>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { icon: <FileText className="w-5 h-5" />,  label: "Resumes",      value: 2,   unit: "",  color: "#378ADD" },
            { icon: <Briefcase className="w-5 h-5" />, label: "Job Matches",  value: 8,   unit: "",  color: "#378ADD" },
            { icon: <Award className="w-5 h-5" />,     label: "ATS Score",    value: 82,  unit: "%", color: "#8B5CF6" },
            { icon: <Zap className="w-5 h-5" />,       label: "Interviews",   value: 3,   unit: "",  color: "#F59E0B" },
          ].map((s, i) => (
            <div key={i} className="stat-card flex items-start gap-4">
              <div className="p-2.5 rounded-xl flex-shrink-0" style={{ background: `${s.color}18`, color: s.color }}>{s.icon}</div>
              <div className="flex-1 min-w-0">
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>{s.label}</p>
                <p style={{ fontFamily: "Syne, sans-serif", fontSize: 26, fontWeight: 800, color: "var(--text-primary)", lineHeight: 1.2 }}>
                  {s.value}{s.unit}
                </p>
              </div>
              {s.unit === "%" && (
                <ProgressArc value={s.value} size={52} strokeWidth={5} color={s.color} />
              )}
            </div>
          ))}
        </div>

        {/* Charts + Activity Row */}
        <div className="grid lg:grid-cols-3 gap-4">

          {/* Area Chart */}
          <div className="lg:col-span-2 glass-card p-5">
            <div className="flex items-center gap-2 mb-5">
              <Activity className="w-4 h-4" style={{ color: "#378ADD" }} />
              <h2 style={{ fontFamily: "Syne, sans-serif", fontSize: 13, fontWeight: 700, color: "var(--text-muted)", letterSpacing: "0.1em" }}>
                WEEKLY READINESS TREND
              </h2>
            </div>
            <div style={{ height: 180 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={activityData}>
                  <defs>
                    <linearGradient id="tealGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#378ADD" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#378ADD" stopOpacity={0}   />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-default)" vertical={false} />
                  <XAxis dataKey="day" stroke="var(--border-mid)" axisLine={false} tickLine={false} fontSize={11} tick={{ fill: "var(--text-muted)" }} />
                  <YAxis hide />
                  <Tooltip contentStyle={{ background: "var(--bg-deep)", border: "1px solid var(--border-default)", borderRadius: 8, fontSize: 12, color: "var(--text-primary)" }} />
                  <Area type="monotone" dataKey="score" stroke="#378ADD" fill="url(#tealGrad)" strokeWidth={2.5} dot={{ fill: "#378ADD", r: 3 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Funnel */}
          <div className="glass-card p-5">
            <div className="flex items-center gap-2 mb-5">
              <TrendingUp className="w-4 h-4" style={{ color: "#8B5CF6" }} />
              <h2 style={{ fontFamily: "Syne, sans-serif", fontSize: 13, fontWeight: 700, color: "var(--text-muted)", letterSpacing: "0.1em" }}>
                APPLICATION FUNNEL
              </h2>
            </div>
            <div style={{ height: 180 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={funnelData} layout="vertical">
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" stroke="var(--border-mid)" axisLine={false} tickLine={false} width={80} fontSize={10} tick={{ fill: "var(--text-muted)" }} />
                  <Bar dataKey="value" fill="#8B5CF6" radius={[0, 4, 4, 0]} barSize={13} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Recent Activity + Upcoming Interview */}
        <div className="grid lg:grid-cols-3 gap-4">

          {/* Recent Activity feed */}
          <div className="lg:col-span-2 glass-card p-5">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" style={{ color: "#378ADD" }} />
                <h2 style={{ fontFamily: "Syne, sans-serif", fontSize: 13, fontWeight: 700, color: "var(--text-muted)", letterSpacing: "0.1em" }}>
                  RECENT ACTIVITY
                </h2>
              </div>
              <Link href="/analytics" className="text-xs" style={{ color: "#378ADD" }}>View all →</Link>
            </div>
            <div className="space-y-3">
              {RECENT_ACTIVITY.map((item, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: "var(--bg-deep)", border: "1px solid var(--border-default)" }}>
                  <div className="p-2 rounded-lg flex-shrink-0" style={{ background: `${item.color}18`, color: item.color }}>
                    {item.icon}
                  </div>
                  <p className="flex-1 text-sm" style={{ color: "var(--text-primary)" }}>{item.text}</p>
                  <span className="text-xs flex-shrink-0" style={{ color: "var(--text-muted)" }}>{item.time}</span>
                </div>
              ))}
            </div>
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
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
                style={{ background: "rgba(139,92,246,0.15)", border: "1px solid rgba(139,92,246,0.3)" }}>
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
            { href: "/resume",          icon: <FileText className="w-6 h-6" />, title: "Resume AI",      desc: "Upload & analyze resume",    color: "#378ADD" },
            { href: "/job-analysis",    icon: <Briefcase className="w-6 h-6" />,title: "Job Match",      desc: "Match against JDs",          color: "#378ADD" },
            { href: "/mock-interview",  icon: <Zap className="w-6 h-6" />,      title: "Mock Interview", desc: "AI-powered practice",        color: "#8B5CF6" },
            { href: "/live-interview",  icon: <Video className="w-6 h-6" />,    title: "Live Room",      desc: "Real-time interview",        color: "#F59E0B" },
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
