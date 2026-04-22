"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import DashboardLayout from "@/components/DashboardLayout";
import axios from "axios";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/v1";

const DEFAULT_JOB_TITLES = [
  "Software Engineer",
  "Data Scientist",
  "Frontend Developer",
  "Backend Developer",
  "DevOps Engineer",
  "Machine Learning Engineer",
  "Product Manager",
  "UX Designer",
  "Cybersecurity Analyst",
  "Cloud Architect",
];

const LEVELS = [
  { key: "beginner", label: "Beginner", color: "#22C55E", desc: "0–1 yr exp" },
  { key: "intermediate", label: "Intermediate", color: "#F59E0B", desc: "1–3 yr exp" },
  { key: "advanced", label: "Advanced", color: "#EF4444", desc: "3+ yr exp" },
];

export default function RoadmapPage() {
  const { getToken } = useAuth();
  const [targetRole, setTargetRole] = useState("Software Engineer");
  const [level, setLevel] = useState("beginner");
  const [jobTitles, setJobTitles] = useState<string[]>(DEFAULT_JOB_TITLES);
  const [roadmap, setRoadmap] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [source, setSource] = useState<"ai" | "static" | null>(null);

  // Fetch available job titles from backend
  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const token = await getToken();
        const resp = await axios.get(`${API}/copilot/roadmap/options`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (resp.data?.job_titles?.length) setJobTitles(resp.data.job_titles);
      } catch {
        // use defaults silently
      }
    };
    fetchOptions();
  }, [getToken]);

  const generate = async () => {
    setLoading(true);
    setError(null);
    setRoadmap(null);
    setSource(null);
    try {
      const token = await getToken();
      const resp = await axios.post(
        `${API}/copilot/roadmap`,
        { target_role: targetRole, level },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setRoadmap(resp.data);
      // If response came back quickly it's likely static data
      setSource(resp.headers["x-source"] === "static" ? "static" : "ai");
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Failed to generate roadmap. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const selectedLevel = LEVELS.find((l) => l.key === level)!;

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div>
          <p className="text-xs font-mono" style={{ color: "#378ADD", letterSpacing: "0.15em" }}>
            SYSTEM / ROADMAP
          </p>
          <h1
            style={{
              fontFamily: "Syne, sans-serif",
              fontSize: 30,
              fontWeight: 800,
              color: "var(--text-primary)",
            }}
          >
            Skill-Gap Roadmap
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: 14, marginTop: 4 }}>
            12-week personalised learning plan for your target role
          </p>
        </div>

        {/* Controls */}
        <div className="glass-card p-5 space-y-5">
          {/* Job Title Dropdown */}
          <div className="space-y-2">
            <label
              htmlFor="role-select"
              className="text-xs font-semibold uppercase tracking-widest"
              style={{ color: "var(--text-muted)" }}
            >
              Target Role
            </label>
            <select
              id="role-select"
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value)}
              className="w-full p-3 rounded-xl text-sm appearance-none cursor-pointer"
              style={{
                background: "var(--bg-deep)",
                border: "1px solid var(--border-default)",
                color: "var(--text-primary)",
              }}
            >
              {jobTitles.map((title) => (
                <option key={title} value={title}>
                  {title}
                </option>
              ))}
            </select>
          </div>

          {/* Level Selector */}
          <div className="space-y-2">
            <p
              className="text-xs font-semibold uppercase tracking-widest"
              style={{ color: "var(--text-muted)" }}
            >
              Experience Level
            </p>
            <div className="grid grid-cols-3 gap-3">
              {LEVELS.map((l) => (
                <button
                  key={l.key}
                  onClick={() => setLevel(l.key)}
                  className="p-3 rounded-xl text-sm font-semibold transition-all duration-200"
                  style={{
                    border: `2px solid ${level === l.key ? l.color : "var(--border-default)"}`,
                    background:
                      level === l.key
                        ? `${l.color}18`
                        : "var(--bg-deep)",
                    color: level === l.key ? l.color : "var(--text-muted)",
                    transform: level === l.key ? "scale(1.03)" : "scale(1)",
                  }}
                >
                  <span className="block text-base">{l.label}</span>
                  <span className="block text-xs font-normal mt-0.5 opacity-70">{l.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Generate Button */}
          <button
            id="generate-roadmap-btn"
            onClick={generate}
            disabled={loading}
            className="glow-btn glow-btn-primary text-sm py-2.5 px-6 w-full"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
                Generating Roadmap…
              </span>
            ) : (
              `Generate ${selectedLevel.label} Roadmap for ${targetRole}`
            )}
          </button>

          {/* Error */}
          {error && (
            <p className="text-sm text-red-400 bg-red-400/10 rounded-lg px-4 py-3">{error}</p>
          )}
        </div>

        {/* Roadmap Output */}
        {roadmap && (
          <div className="glass-card p-5 space-y-3">
            {/* Source badge */}
            <div className="flex items-center justify-between mb-2">
              <h2
                className="text-sm font-semibold"
                style={{ color: "var(--text-primary)" }}
              >
                {targetRole} — {selectedLevel.label} Path
              </h2>
              {source === "static" && (
                <span
                  className="text-xs px-2 py-0.5 rounded-full"
                  style={{ background: "#F59E0B22", color: "#F59E0B", border: "1px solid #F59E0B44" }}
                >
                  Curated
                </span>
              )}
              {source === "ai" && (
                <span
                  className="text-xs px-2 py-0.5 rounded-full"
                  style={{ background: "#22C55E22", color: "#22C55E", border: "1px solid #22C55E44" }}
                >
                  AI Generated
                </span>
              )}
            </div>

            {(roadmap.weeks || []).map((week: any) => (
              <div
                key={week.week}
                className="rounded-xl p-4 transition-all hover:scale-[1.01]"
                style={{
                  border: "1px solid var(--border-default)",
                  background: "var(--bg-deep)",
                }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className="text-xs font-bold px-2 py-0.5 rounded-full"
                    style={{
                      background: `${selectedLevel.color}22`,
                      color: selectedLevel.color,
                    }}
                  >
                    Week {week.week}
                  </span>
                </div>
                <p className="text-sm font-medium mb-1" style={{ color: "var(--text-primary)" }}>
                  {(week.topics || []).join(" · ")}
                </p>
                <div className="flex flex-wrap gap-1 mt-2">
                  {(week.resources || []).map((r: string, i: number) => (
                    <span
                      key={i}
                      className="text-xs px-2 py-0.5 rounded-full"
                      style={{
                        background: "#60A5FA18",
                        color: "#60A5FA",
                        border: "1px solid #60A5FA33",
                      }}
                    >
                      {r}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
