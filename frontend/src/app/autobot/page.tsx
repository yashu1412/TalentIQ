"use client";

import DashboardLayout from "@/components/DashboardLayout";
import {
  Cpu, Play, Square, RefreshCw, ExternalLink, CheckCircle, XCircle,
  Trash2, Clock, BarChart2, Globe, Settings, ChevronDown, ChevronUp,
  Zap, Terminal, Briefcase, AlertTriangle, ToggleLeft, ToggleRight,
  Download, Lock, Eye, EyeOff, User, Sparkles, Shield
} from "lucide-react";
import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@clerk/nextjs";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";


// ─── Types ──────────────────────────────────────────────────────────────────

interface BotStatus {
  status: "running" | "idle";
  pid: number | null;
  uptime_seconds: number;
  today_applied: number;
  total_applied: number;
  external_pending: number;
  last_run: string | null;
  last_country: string | null;
  platforms_run: string[];
}

interface AppliedJob {
  original_index: number;
  id: string;
  platform: string;
  status: string;
  applied_at: string;
  company: string;
  title: string;
  external_url?: string;
  resume_used?: string;
  location?: { country?: string };
}

interface BotConfig {
  keywords: string[];
  experience_level: string[];
  job_type: string[];
  remote_only: boolean;
  max_applications_per_day: number;
  search_limit: number;
  countries: { country: string; priority: number; active: boolean }[];
  platforms: { [key: string]: { enabled: boolean } };
}

interface CredStatus {
  linkedin: { email: string; has_password: boolean };
  naukri: { email: string; has_password: boolean };
  ycombinator: { email: string; has_password: boolean };
}

interface ResumeProfile {
  full_name: string;
  email: string;
  skills: string[];
  summary: string;
  years_of_experience: number;
  current_title: string;
  education: string;
  resume_name: string;
  parse_status: string;
  ats_score: number | null;
}

const API = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

function formatUptime(secs: number) {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

function formatTime(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-IN", {
    hour12: true, hour: "2-digit", minute: "2-digit",
    day: "2-digit", month: "short"
  });
}

const PLATFORM_ICONS: Record<string, string> = {
  linkedin: "🔵",
  naukri: "🟠",
  ycombinator: "🟡",
};

const STATUS_COLORS: Record<string, string> = {
  "Submitted": "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  "External - Ready": "bg-sky-500/20 text-sky-300 border-sky-500/30",
  "Manually Applied": "bg-violet-500/20 text-violet-300 border-violet-500/30",
  "Stuck - Manual Action Needed": "bg-amber-500/20 text-amber-300 border-amber-500/30",
  "Failed": "bg-rose-500/20 text-rose-300 border-rose-500/30",
  "Skipped": "bg-gray-500/20 text-gray-300 border-gray-500/30",
};

const SKILL_ROLE_MAP: Record<string, string[]> = {
  python: ["Python Developer", "Python Engineer", "Backend Python Developer", "Python Software Engineer", "Python Web Developer", "Django Developer", "Flask Developer"],
  fastapi: ["FastAPI Developer", "Python Developer", "Backend Developer"],
  django: ["Django Developer", "Python Developer", "Backend Developer"],
  flask: ["Flask Developer", "Python Developer", "Backend Developer"],
  react: ["React Developer", "Next.js Developer", "React.js Developer", "Frontend Developer", "Frontend Engineer"],
  nextjs: ["Next.js Developer", "React Developer", "Frontend Developer", "Frontend Engineer"],
  typescript: ["TypeScript Developer", "Frontend Developer", "Frontend Engineer", "Full Stack Developer", "Full Stack Engineer"],
  javascript: ["JavaScript Developer", "Web Developer", "Frontend Developer", "Frontend Engineer"],
  node: ["Node.js Developer", "Backend Developer", "Backend Engineer"],
  express: ["Node.js Developer", "Backend Developer"],
  mongodb: ["MERN Stack Developer", "Backend Developer"],
  ai: ["AI Engineer", "AI Developer", "LLM Engineer", "Generative AI Engineer"],
  ml: ["Machine Learning Engineer", "Machine Learning Developer", "AI Engineer"],
  "machine learning": ["Machine Learning Engineer", "Machine Learning Developer", "AI Engineer"],
  llm: ["LLM Engineer", "Generative AI Engineer", "AI Engineer"],
  "generative ai": ["Generative AI Engineer", "AI Engineer", "LLM Engineer"],
  pytorch: ["Machine Learning Engineer", "AI Engineer"],
  tensorflow: ["Machine Learning Engineer", "AI Engineer"],
  deep: ["Machine Learning Engineer", "AI Engineer"],
};

const GENERAL_ROLES = [
  "Software Engineer",
  "Software Developer",
  "Web Developer",
  "Full Stack Developer",
  "Full Stack Engineer",
  "Frontend Developer",
  "Frontend Engineer",
  "Backend Developer",
  "Backend Engineer",
];

const DEFAULT_KEYWORD_SUITE = [
  "Full Stack Developer",
  "Full Stack Engineer",
  "Software Engineer",
  "Software Developer",
  "Frontend Developer",
  "Frontend Engineer",
  "React Developer",
  "Next.js Developer",
  "React.js Developer",
  "Backend Developer",
  "Backend Engineer",
  "Node.js Developer",
  "TypeScript Developer",
  "JavaScript Developer",
  "Web Developer",
  "Python Developer",
  "Python Engineer",
  "Backend Python Developer",
  "Python Software Engineer",
  "FastAPI Developer",
  "Django Developer",
  "Flask Developer",
  "MERN Stack Developer",
  "AI Engineer",
  "AI Developer",
  "Machine Learning Engineer",
  "Machine Learning Developer",
  "LLM Engineer",
  "Generative AI Engineer",
  "Software Engineer Intern",
  "Full Stack Developer Intern",
  "Frontend Developer Intern",
  "Backend Developer Intern",
  "React Developer Intern",
  "Web Developer Intern",
  "Python Intern",
  "AI Intern",
  "Machine Learning Intern",
];

function generateKeywordsFromProfile(profile: ResumeProfile): string[] {
  if (!profile) return [];
  const matched = new Set<string>();

  const yearsExp = typeof profile.years_of_experience === 'number' ? profile.years_of_experience : 0;
  const currentTitle = profile.current_title || "";
  const summary = profile.summary || "";

  const isIntern =
    yearsExp <= 1 ||
    /intern/i.test(currentTitle) ||
    /intern/i.test(summary);

  const skillsLower = (profile.skills || [])
    .filter(Boolean)
    .map(s => String(s).toLowerCase());

  if (currentTitle) {
    matched.add(currentTitle);
  }

  Object.entries(SKILL_ROLE_MAP).forEach(([skill, roles]) => {
    if (skillsLower.some(s => s.includes(skill) || skill.includes(s))) {
      roles.forEach(role => matched.add(role));
    }
  });

  if (matched.size < 3) {
    GENERAL_ROLES.forEach(role => matched.add(role));
  }

  const results = Array.from(matched);
  if (isIntern) {
    const internRoles: string[] = [];
    results.forEach(role => {
      if (!role.toLowerCase().includes("intern")) {
        internRoles.push(`${role} Intern`);
      } else {
        internRoles.push(role);
      }
    });
    // Add default intern roles
    [
      "Software Engineer Intern",
      "Full Stack Developer Intern",
      "Frontend Developer Intern",
      "Backend Developer Intern",
      "React Developer Intern",
      "Web Developer Intern",
      "Python Intern",
      "AI Intern",
      "Machine Learning Intern"
    ].forEach(r => internRoles.push(r));

    return [...new Set(internRoles)];
  }

  return results;
}

// ─── Credential Input Row ──────────────────────────────────────────────────

function CredRow({
  platform, icon, label, email, hasPassword, isSso,
  formEmail, formPassword, showPass,
  onEmailChange, onPasswordChange, onToggleShow, onToggleSso,
}: {
  platform: string; icon: string; label: string;
  email: string; hasPassword: boolean; isSso: boolean;
  formEmail: string; formPassword: string; showPass: boolean;
  onEmailChange: (v: string) => void;
  onPasswordChange: (v: string) => void;
  onToggleShow: () => void;
  onToggleSso: () => void;
}) {
  const isConfigured = isSso ? !!email : (hasPassword && !!email);

  return (
    <motion.div
      whileHover={{ y: -3, borderColor: "rgba(255,255,255,0.12)", boxShadow: "0 10px 25px -5px rgba(0,0,0,0.3)" }}
      transition={{ duration: 0.2 }}
      className="rounded-xl border border-[var(--border-default)] overflow-hidden bg-[var(--bg-card)]/30 backdrop-blur-sm"
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3"
        style={{ borderBottom: "1px solid var(--border-default)", background: "rgba(255,255,255,0.02)" }}>
        <span style={{ fontSize: 20 }}>{icon}</span>
        <span style={{ fontWeight: 700, color: "var(--text-primary)", fontSize: 14 }}>{label}</span>
        {isConfigured ? (
          <span className="ml-auto flex items-center gap-1 px-2 py-0.5 rounded-full text-xs"
            style={{ background: "rgba(34,197,94,0.1)", color: "#22c55e", border: "1px solid rgba(34,197,94,0.2)" }}>
            <Shield className="w-3 h-3" /> {isSso ? "Google SSO" : "Saved"}
          </span>
        ) : (
          <span className="ml-auto flex items-center gap-1 px-2 py-0.5 rounded-full text-xs"
            style={{ background: "rgba(107,114,128,0.1)", color: "#6b7280", border: "1px solid rgba(107,114,128,0.2)" }}>
            Not set
          </span>
        )}
      </div>

      <div className="p-4 space-y-3">
        {/* Google / SSO toggle */}
        <button
          onClick={onToggleSso}
          className="flex items-center gap-2.5 w-full px-4 py-2.5 rounded-xl border transition-all duration-300 text-left cursor-pointer select-none"
          style={{
            background: isSso ? "rgba(66,133,244,0.08)" : "var(--bg-card)",
            borderColor: isSso ? "rgba(66,133,244,0.3)" : "var(--border-default)",
          }}
        >
          <span style={{ fontSize: 16 }}>🇬</span>
          <span style={{ fontSize: 13, fontWeight: 600, color: isSso ? "#4285f4" : "var(--text-muted)" }}>
            I log in with Google — no password needed
          </span>
          <div className="ml-auto w-9 h-5 bg-zinc-800 rounded-full p-0.5 transition-colors duration-300 flex items-center" style={{ background: isSso ? "#4285f4" : "" }}>
            <motion.div
              layout
              className="w-4 h-4 bg-white rounded-full shadow-lg"
              animate={{ x: isSso ? 16 : 0 }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
            />
          </div>
        </button>

        {/* Email — always shown */}
        <div>
          <label className="block mb-1.5" style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 500 }}>
            {isSso ? "Google account email" : "Email"}
          </label>
          <input
            type="email"
            placeholder={email || "your@email.com"}
            value={formEmail ?? ""}
            onChange={e => onEmailChange(e.target.value)}
            className="w-full px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#FF6600]/50 transition-all"
            style={{ background: "var(--bg-card)", border: "1px solid var(--border-default)", color: "var(--text-primary)" }}
          />
        </div>

        {/* Password — hidden when SSO */}
        <AnimatePresence initial={false}>
          {!isSso && (
            <motion.div
              key="password-field"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className="overflow-hidden"
            >
              <div className="pt-1 pb-1">
                <label className="block mb-1.5" style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 500 }}>
                  Password {hasPassword && <span style={{ color: "#22c55e" }}>(already saved — enter to change)</span>}
                </label>
                <div className="relative">
                  <input
                    type={showPass ? "text" : "password"}
                    placeholder={hasPassword ? "••••••••" : "Enter password"}
                    value={formPassword ?? ""}
                    onChange={e => onPasswordChange(e.target.value)}
                    className="w-full px-3 py-2 pr-10 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#FF6600]/50 transition-all"
                    style={{ background: "var(--bg-card)", border: "1px solid var(--border-default)", color: "var(--text-primary)" }}
                  />
                  <button
                    onClick={onToggleShow}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 opacity-50 hover:opacity-100 cursor-pointer"
                  >
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* SSO info note */}
        <AnimatePresence initial={false}>
          {isSso && (
            <motion.div
              key="sso-note"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className="overflow-hidden"
            >
              <div className="flex items-start gap-2 rounded-lg px-3 py-2.5 mt-1"
                style={{ background: "rgba(66,133,244,0.05)", border: "1px solid rgba(66,133,244,0.15)" }}>
                <AlertTriangle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" style={{ color: "#4285f4" }} />
                <p style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.6 }}>
                  The bot will open a browser and click <strong style={{ color: "var(--text-secondary)" }}>&ldquo;Sign in with Google&rdquo;</strong>.
                  Your saved browser profile is reused, so if you&rsquo;ve already logged in once,
                  the bot will skip this step automatically on future runs.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function AutobotPage() {
  const { getToken } = useAuth();
  const [activeTab, setActiveTab] = useState<"dashboard" | "config" | "credentials">("dashboard");
  const [status, setStatus] = useState<BotStatus | null>(null);
  const [jobs, setJobs] = useState<AppliedJob[]>([]);
  const [config, setConfig] = useState<BotConfig | null>(null);
  const [credStatus, setCredStatus] = useState<CredStatus | null>(null);
  const [resumeProfile, setResumeProfile] = useState<ResumeProfile | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [showLogs, setShowLogs] = useState(true);
  const [configDirty, setConfigDirty] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [filter, setFilter] = useState<string>("all");
  const [portalFilter, setPortalFilter] = useState<string>("all");
  const [appliedFilter, setAppliedFilter] = useState<string>("all"); // "all" | "applied" | "not_applied"
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [syncLoading, setSyncLoading] = useState(false);
  const [syncError, setSyncError] = useState<string>("");
  const [credSaving, setCredSaving] = useState(false);
  const [credSaved, setCredSaved] = useState(false);
  const [showPassMap, setShowPassMap] = useState<Record<string, boolean>>({});
  const [ssoMap, setSsoMap] = useState<Record<string, boolean>>({});
  const [credForm, setCredForm] = useState({
    linkedin_email: "", linkedin_password: "",
    naukri_email: "", naukri_password: "",
    yc_email: "", yc_password: "",
  });

  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileForm, setProfileForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    city: "",
    country: "",
    years_of_experience: 0,
    current_title: "",
    education: "",
    linkedin_url: "",
    github_url: "",
    portfolio_url: "",
    skills: [] as string[],
  });

  const logRef = useRef<HTMLDivElement>(null);
  const sseRef = useRef<EventSource | null>(null);
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  // ── API helper ────────────────────────────────────────────────────────────
  const apiFetch = useCallback(async (path: string, opts: RequestInit = {}) => {
    const token = await getToken();
    const res = await fetch(`${API}/v1/autobot${path}`, {
      ...opts,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        ...(opts.headers || {}),
      },
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || `HTTP ${res.status}`);
    }
    return res.json();
  }, [getToken]);

  // ── Data fetchers ─────────────────────────────────────────────────────────
  const fetchStatus = useCallback(async () => {
    try { setStatus(await apiFetch("/status")); } catch { }
  }, [apiFetch]);

  const fetchJobs = useCallback(async () => {
    try { const d = await apiFetch("/applied-jobs"); setJobs(d.jobs || []); } catch { }
  }, [apiFetch]);

  const fetchConfig = useCallback(async () => {
    try { const d = await apiFetch("/config"); setConfig(d.config); } catch { }
  }, [apiFetch]);

  const fetchCredStatus = useCallback(async () => {
    try {
      const data = await apiFetch("/credentials/status");
      setCredStatus(data);
      // Initialize SSO state for platforms where email is set but no password
      setSsoMap(prev => ({
        ...prev,
        linkedin: !data.linkedin.has_password && !!data.linkedin.email,
        naukri: !data.naukri.has_password && !!data.naukri.email,
        ycombinator: !data.ycombinator.has_password && !!data.ycombinator.email,
      }));
    } catch { }
  }, [apiFetch]);

  const fetchResumeProfile = useCallback(async () => {
    try {
      const d = await apiFetch("/profile");
      setResumeProfile(d.profile);
    } catch { }
  }, [apiFetch]);

  // ── SSE log stream ────────────────────────────────────────────────────────
  const connectLogs = useCallback(async () => {
    if (sseRef.current) { sseRef.current.close(); sseRef.current = null; }
    const token = await getToken();
    const es = new EventSource(`${API}/v1/autobot/logs?token=${token}`);
    es.onmessage = (e) => {
      if (e.data && !e.data.startsWith(": ping")) {
        setLogs(prev => [...prev, e.data].slice(-300));
        setTimeout(() => logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: "smooth" }), 50);
      }
    };
    es.onerror = () => { es.close(); sseRef.current = null; };
    sseRef.current = es;
  }, [getToken]);

  // ── Init ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    fetchStatus(); fetchJobs(); fetchConfig(); fetchCredStatus(); connectLogs(); fetchResumeProfile();
    pollRef.current = setInterval(() => { fetchStatus(); fetchJobs(); }, 10000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      if (sseRef.current) sseRef.current.close();
    };
  }, [fetchStatus, fetchJobs, fetchConfig, fetchCredStatus, connectLogs, fetchResumeProfile]);

  useEffect(() => {
    if (showLogs) logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: "smooth" });
  }, [logs, showLogs]);

  // ── Sync from resume ──────────────────────────────────────────────────────
  const syncFromResume = async () => {
    setSyncLoading(true);
    setSyncError("");
    try {
      const d = await apiFetch("/profile/from-resume");
      const p: ResumeProfile = d.profile;

      // Persist the synced details on the backend profile
      await apiFetch("/profile", {
        method: "PUT",
        body: JSON.stringify(p),
      });

      setResumeProfile(p);
      setIsEditingProfile(false);

      // Auto-apply to config: generate and merge keywords based on resume profile
      if (config) {
        const autoKeywords = generateKeywordsFromProfile(p);
        setConfig(prev => {
          if (!prev) return null;
          const merged = [...new Set([...(prev.keywords || []), ...autoKeywords])];
          return { ...prev, keywords: merged };
        });
        setConfigDirty(true);
      }
      setSyncError(""); // clear any previous errors
    } catch (e: any) {
      setSyncError(e.message || "Failed to sync resume data.");
    } finally {
      setSyncLoading(false);
    }
  };

  const startEditingProfile = () => {
    if (resumeProfile) {
      setProfileForm({
        full_name: resumeProfile.full_name || "",
        email: resumeProfile.email || "",
        phone: (resumeProfile as any).phone || "",
        city: (resumeProfile as any).city || "India",
        country: (resumeProfile as any).country || "India",
        years_of_experience: resumeProfile.years_of_experience || 0,
        current_title: resumeProfile.current_title || "",
        education: resumeProfile.education || "",
        linkedin_url: (resumeProfile as any).linkedin_url || "",
        github_url: (resumeProfile as any).github_url || "",
        portfolio_url: (resumeProfile as any).portfolio_url || "",
        skills: resumeProfile.skills || [],
      });
      setIsEditingProfile(true);
    }
  };

  const saveProfile = async () => {
    setProfileSaving(true);
    try {
      const updated = await apiFetch("/profile", {
        method: "PUT",
        body: JSON.stringify(profileForm),
      });
      setResumeProfile(updated.profile);
      setIsEditingProfile(false);
    } catch (e: any) {
      alert(e.message || "Failed to save profile.");
    } finally {
      setProfileSaving(false);
    }
  };

  // ── Save credentials ──────────────────────────────────────────────────────
  const saveCredentials = async () => {
    setCredSaving(true);
    try {
      const payload: Record<string, string> = {};

      const platforms = [
        { key: "linkedin", prefix: "linkedin" },
        { key: "naukri", prefix: "naukri" },
        { key: "ycombinator", prefix: "yc" },
      ];

      platforms.forEach(({ key, prefix }) => {
        const emailKey = `${prefix}_email`;
        const passKey = `${prefix}_password`;

        const emailVal = credForm[emailKey as keyof typeof credForm]?.trim();
        const passVal = credForm[passKey as keyof typeof credForm]?.trim();

        // Always save email if it was entered
        if (emailVal !== undefined) {
          payload[emailKey] = emailVal;
        }

        // If SSO is active for this platform, explicitly clear the password
        if (ssoMap[key]) {
          payload[passKey] = "";
        } else if (passVal !== undefined && passVal !== "") {
          payload[passKey] = passVal;
        }
      });

      await apiFetch("/credentials", { method: "POST", body: JSON.stringify(payload) });
      setCredSaved(true);
      setTimeout(() => setCredSaved(false), 2500);
      await fetchCredStatus();
      // Clear password fields after save (keep emails for display)
      setCredForm(prev => ({
        ...prev,
        linkedin_password: "", naukri_password: "", yc_password: "",
      }));
    } catch (e: any) {
      alert(e.message);
    } finally {
      setCredSaving(false);
    }
  };

  // ── Bot actions ───────────────────────────────────────────────────────────
  const startBot = async () => {
    setActionLoading("start");
    try { await apiFetch("/start", { method: "POST", body: JSON.stringify({}) }); await fetchStatus(); }
    catch (e: any) { alert(e.message); }
    finally { setActionLoading(null); }
  };

  const stopBot = async () => {
    setActionLoading("stop");
    try { await apiFetch("/stop", { method: "POST" }); await fetchStatus(); }
    catch (e: any) { alert(e.message); }
    finally { setActionLoading(null); }
  };

  const markJob = async (idx: number) => {
    try { await apiFetch(`/applied-jobs/${idx}/mark`, { method: "POST" }); await fetchJobs(); }
    catch (e: any) { alert(e.message); }
  };

  const deleteJob = async (idx: number) => {
    if (!confirm("Remove this job from the list?")) return;
    try { await apiFetch(`/applied-jobs/${idx}`, { method: "DELETE" }); await fetchJobs(); }
    catch (e: any) { alert(e.message); }
  };

  const clearLogs = async () => {
    if (!confirm("Are you sure you want to clear the logs?")) return;
    try {
      await apiFetch("/logs/clear", { method: "POST" });
      setLogs([]);
    } catch (e: any) {
      alert(e.message);
    }
  };

  const saveConfig = async () => {
    if (!config) return;
    setActionLoading("save");
    try {
      await apiFetch("/config", { method: "PUT", body: JSON.stringify(config) });
      setConfigDirty(false); setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (e: any) { alert(e.message); }
    finally { setActionLoading(null); }
  };

  const updateConfig = (updates: Partial<BotConfig>) => {
    setConfig(prev => prev ? { ...prev, ...updates } : null);
    setConfigDirty(true);
  };

  const togglePlatform = (platform: string) => {
    if (!config) return;
    const current = config.platforms?.[platform]?.enabled ?? false;
    updateConfig({ platforms: { ...config.platforms, [platform]: { enabled: !current } } });
  };

  // ── Derived ───────────────────────────────────────────────────────────────
  const isRunning = status?.status === "running";

  const isAppliedStatus = (statusVal: string) => statusVal === "Submitted" || statusVal === "Manually Applied";

  const filteredJobs = jobs.filter(job => {
    if (filter !== "all" && job.status !== filter) return false;
    if (portalFilter !== "all" && job.platform?.toLowerCase() !== portalFilter.toLowerCase()) return false;
    if (appliedFilter !== "all") {
      const applied = isAppliedStatus(job.status);
      if (appliedFilter === "applied" && !applied) return false;
      if (appliedFilter === "not_applied" && applied) return false;
    }
    return true;
  });

  const uniqueStatuses = [...new Set(jobs.map(j => j.status))];
  const hasAnyCreds = credStatus && (
    credStatus.linkedin.has_password || credStatus.naukri.has_password || credStatus.ycombinator.has_password
  );

  return (
    <DashboardLayout>
      <div className="space-y-5 animate-fade-in relative">

        {/* ── Floating Background Glow Orbs ── */}
        <div className="absolute top-0 right-10 w-[500px] h-[500px] rounded-full bg-[#FF6600]/4 blur-[140px] pointer-events-none -z-10 animate-orb-drift" />
        <div className="absolute top-60 left-0 w-[450px] h-[450px] rounded-full bg-indigo-500/5 blur-[150px] pointer-events-none -z-10 animate-orb-drift" style={{ animationDelay: "-4s" }} />
        <div className="absolute top-20 left-1/2 w-72 h-72 rounded-full bg-cyan-500/3 blur-[100px] pointer-events-none -z-10 animate-orb-drift" style={{ animationDelay: "-8s" }} />

        {/* ── Header ── */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            {/* Animated Bot Icon */}
            <motion.div
              animate={{ rotate: [0, 5, -5, 0], scale: [1, 1.05, 1] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="relative w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{
                background: "linear-gradient(135deg, rgba(255,102,0,0.15) 0%, rgba(255,102,0,0.05) 100%)",
                border: "1px solid rgba(255,102,0,0.25)",
                boxShadow: "0 0 30px rgba(255,102,0,0.1), inset 0 1px 0 rgba(255,255,255,0.05)"
              }}
            >
              <Cpu className="w-7 h-7" style={{ color: "#FF6600" }} />
              <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-[#FF6600] flex items-center justify-center">
                <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              </div>
            </motion.div>

            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <span className="w-1 h-1 rounded-full bg-[#FF6600] animate-pulse inline-block" />
                <p className="text-[10px] font-mono tracking-[0.2em]" style={{ color: "rgba(255,102,0,0.7)" }}>SYSTEM / AUTOBOT</p>
              </div>
              <h1 style={{ fontFamily: "Syne, sans-serif", fontSize: 30, fontWeight: 800, lineHeight: 1.1, background: "linear-gradient(135deg, #ffffff 0%, #FF6600 60%, #ff8c42 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                Auto Job Bot
              </h1>
              <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                <span style={{ color: "var(--text-muted)", fontSize: 12 }}>Automates job applications on</span>
                {["🔵 LinkedIn", "🟠 Naukri", "🟡 YC"].map(p => (
                  <span key={p} className="px-2 py-0.5 rounded-full text-[11px] font-semibold" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "var(--text-secondary)" }}>{p}</span>
                ))}
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <motion.button
              whileHover={{ scale: 1.05, rotate: 90 }}
              whileTap={{ scale: 0.95 }}
              onClick={connectLogs}
              className="glow-btn text-sm py-2 px-3 cursor-pointer"
              title="Reconnect log stream"
            >
              <RefreshCw className="w-4 h-4" />
            </motion.button>
            <AnimatePresence mode="wait">
              {isRunning ? (
                <motion.button
                  key="stop-btn"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  whileHover={{ scale: 1.03, boxShadow: "0 0 25px rgba(239,68,68,0.4)" }}
                  whileTap={{ scale: 0.97 }}
                  onClick={stopBot}
                  disabled={actionLoading === "stop"}
                  style={{ background: "rgba(239,68,68,0.12)", borderColor: "rgba(239,68,68,0.35)", color: "#f87171", borderRadius: 10 }}
                >
                  {actionLoading === "stop" ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Square className="w-4 h-4" />}
                  Stop Bot
                </motion.button>
              ) : (
                <motion.button
                  key="start-btn"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  whileHover={{ scale: 1.03, boxShadow: "0 0 30px rgba(255,102,0,0.45)" }}
                  whileTap={{ scale: 0.97 }}
                  onClick={startBot}
                  disabled={actionLoading === "start"}
                  className="glow-btn glow-btn-primary text-sm py-2.5 px-6 flex items-center gap-2 cursor-pointer font-bold"
                  style={{ background: "linear-gradient(135deg, #FF6600, #ff8c42)", borderColor: "#FF6600", color: "#ffffff", borderRadius: 10, boxShadow: "0 4px 15px rgba(255,102,0,0.3)" }}
                >
                  {actionLoading === "start" ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-current" />}
                  Start Bot
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* ── Status Bar ── */}
        <div className="rounded-2xl relative overflow-hidden"
          style={{ background: "rgba(10,10,10,0.7)", border: "1px solid rgba(255,255,255,0.06)", backdropFilter: "blur(24px)", boxShadow: "0 8px 32px rgba(0,0,0,0.4)" }}
        >
          <motion.div
            className="absolute top-0 left-0 right-0 h-[2px]"
            style={{ backgroundImage: isRunning ? "linear-gradient(90deg,#22c55e,#10b981,#06b6d4,#22c55e)" : "linear-gradient(90deg,#27272a,#3f3f46,#27272a)", backgroundSize: "200% 100%" }}
            animate={{ backgroundPosition: isRunning ? ["0% 50%", "100% 50%", "0% 50%"] : "0% 50%" }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          />

          {isRunning && (
            <>
              <div className="absolute -top-10 -left-10 w-32 h-32 rounded-full bg-emerald-500/8 blur-2xl animate-orb-drift pointer-events-none" />
              <div className="absolute -bottom-10 -right-10 w-32 h-32 rounded-full bg-sky-500/8 blur-2xl animate-orb-drift pointer-events-none" style={{ animationDelay: "-2s" }} />
            </>
          )}

          <div className="flex flex-wrap items-center gap-2 p-3 pt-4">
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl"
              style={{
                background: isRunning ? "rgba(34,197,94,0.08)" : "rgba(113,113,122,0.08)",
                border: isRunning ? "1px solid rgba(34,197,94,0.2)" : "1px solid rgba(113,113,122,0.15)",
              }}
            >
              <div className="relative w-2.5 h-2.5">
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: isRunning ? "#22c55e" : "#52525b" }} />
                {isRunning && <div className="absolute inset-0 rounded-full animate-ping" style={{ background: "#22c55e", opacity: 0.5 }} />}
              </div>
              <span style={{ color: isRunning ? "#4ade80" : "#71717a", fontWeight: 700, fontSize: 13, letterSpacing: "0.08em" }}>
                {isRunning ? "RUNNING" : "IDLE"}
              </span>
              {isRunning && status?.pid && (
                <span className="font-mono text-[10px] px-1.5 py-0.5 rounded" style={{ background: "rgba(34,197,94,0.12)", color: "#22c55e" }}>PID {status.pid}</span>
              )}
            </motion.div>

            <div className="hidden lg:block w-px h-9 mx-1" style={{ background: "rgba(255,255,255,0.06)" }} />

            <div className="flex flex-wrap items-center gap-2 flex-1">
              {[
                { icon: <Zap className="w-3.5 h-3.5" />, label: "Today",        value: status?.today_applied ?? 0,   color: "#fbbf24", bg: "rgba(251,191,36,0.08)",   border: "rgba(251,191,36,0.18)" },
                { icon: <BarChart2 className="w-3.5 h-3.5" />, label: "Total Applied", value: status?.total_applied ?? 0,  color: "#a78bfa", bg: "rgba(167,139,250,0.08)", border: "rgba(167,139,250,0.18)" },
                { icon: <Globe className="w-3.5 h-3.5" />, label: "Externals",   value: status?.external_pending ?? 0, color: "#38bdf8", bg: "rgba(56,189,248,0.08)",  border: "rgba(56,189,248,0.18)" },
                { icon: <Clock className="w-3.5 h-3.5" />, label: "Uptime",      value: isRunning ? formatUptime(status?.uptime_seconds ?? 0) : "—", color: "#34d399", bg: "rgba(52,211,153,0.08)", border: "rgba(52,211,153,0.18)" },
              ].map((s, idx) => (
                <motion.div
                  key={s.label}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.05 + idx * 0.07 }}
                  whileHover={{ y: -2, scale: 1.04 }}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl cursor-default"
                  style={{ background: s.bg, border: `1px solid ${s.border}` }}
                >
                  <div style={{ color: s.color }}>{s.icon}</div>
                  <div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: s.color, lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>{s.value}</div>
                    <div style={{ fontSize: 9, color: "rgba(255,255,255,0.35)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", marginTop: 1 }}>{s.label}</div>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="text-right hidden sm:block ml-auto pr-1">
              <div style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em" }}>Last Run</div>
              <div style={{ fontSize: 13, color: "var(--text-secondary)", fontWeight: 600, marginTop: 2 }}>{formatTime(status?.last_run || null)}</div>
              {status?.last_country && <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 2 }}>📍 {status.last_country}</div>}
            </div>
          </div>
        </div>

        {/* ── Tabs ── */}
        <div className="relative z-10 p-1 rounded-2xl flex gap-1"
          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
        >
          {[
            { id: "dashboard",   label: "Dashboard",      icon: <Briefcase className="w-4 h-4" /> },
            { id: "credentials", label: "Credentials",    icon: <Lock className="w-4 h-4" />,     badge: !hasAnyCreds },
            { id: "config",      label: "Configuration",  icon: <Settings className="w-4 h-4" /> },
          ].map(tab => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold transition-colors duration-200 relative cursor-pointer select-none flex-1 justify-center rounded-xl"
                style={{ color: isActive ? "#ffffff" : "var(--text-muted)", zIndex: 1 }}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeTabBg"
                    className="absolute inset-0 rounded-xl"
                    style={{ background: "linear-gradient(135deg, #FF6600, #ff8c42)", boxShadow: "0 4px 15px rgba(255,102,0,0.3)" }}
                    transition={{ type: "spring", stiffness: 350, damping: 35 }}
                  />
                )}
                <span className="relative flex items-center gap-2">
                  {tab.icon} {tab.label}
                  {tab.badge && (
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block ml-0.5" />
                  )}
                </span>
              </button>
            );
          })}
        </div>

        {/* ��������������������������������������������������������������������
            TAB: DASHBOARD
        �������������������������������������������������������������������� */}
        {activeTab === "dashboard" && (
          <div className="space-y-4">
            {/* Live Logs */}
            <div className="glass-card rounded-2xl border border-[var(--border-default)] overflow-hidden shadow-2xl bg-[#030303]/40 backdrop-blur-md">
              <div className="flex items-center justify-between px-5 py-3.5 cursor-pointer select-none"
                style={{ borderBottom: "1px solid var(--border-default)", background: "rgba(255,255,255,0.01)" }}
                onClick={() => setShowLogs(v => !v)}>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 mr-2">
                    <div className="w-3 h-3 rounded-full bg-rose-500/80" />
                    <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                    <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                  </div>
                  <Terminal className="w-4 h-4" style={{ color: "#22c55e" }} />
                  <span style={{ fontWeight: 600, color: "var(--text-primary)", fontSize: 14 }}>Live Logs</span>
                  {isRunning && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold"
                      style={{ background: "rgba(34,197,94,0.1)", color: "#22c55e", border: "1px solid rgba(34,197,94,0.3)" }}>
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block" />
                      LIVE
                    </span>
                  )}
                  <span style={{ color: "var(--text-muted)", fontSize: 12 }}>{logs.length} lines</span>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={async (e) => {
                      e.stopPropagation();
                      await clearLogs();
                    }}
                    className="p-1 px-2.5 rounded-lg hover:bg-white/10 text-[var(--text-muted)] hover:text-red-400 transition-all flex items-center gap-1.5 text-xs font-semibold cursor-pointer border border-transparent hover:border-red-500/10"
                    title="Clear logs"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Clear Logs</span>
                  </button>
                  {showLogs ? <ChevronUp className="w-4 h-4" style={{ color: "var(--text-muted)" }} />
                    : <ChevronDown className="w-4 h-4" style={{ color: "var(--text-muted)" }} />}
                </div>
              </div>

              <AnimatePresence initial={false}>
                {showLogs && (
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: 260 }}
                    exit={{ height: 0 }}
                    transition={{ type: "spring", stiffness: 350, damping: 30 }}
                    className="overflow-hidden"
                  >
                    <div ref={logRef} className="overflow-y-auto p-4 h-full custom-scrollbar"
                      style={{ background: "rgba(0,0,0,0.6)", fontFamily: "var(--font-mono)", fontSize: 12, lineHeight: 1.6, boxShadow: "inset 0 10px 30px rgba(0,0,0,0.9)" }}>
                      {logs.length === 0 ? (
                        <div style={{ color: "var(--text-muted)" }}>
                          {isRunning ? "Waiting for bot output..." : "Start the bot to see live logs here."}
                        </div>
                      ) : (
                        logs.map((line, i) => {
                          const color =
                            line.includes("OK") || line.includes("SUBMITTED") || line.includes("Applied") ? "#22c55e" :
                              line.includes("Error") || line.includes("failed") || line.includes("FAIL") ? "#ef4444" :
                                line.includes("Stuck") || line.includes("Warning") || line.includes("warn") ? "#f59e0b" :
                                  line.includes("SESSION") || line.includes("starting") ? "#818cf8" :
                                    line.includes("Info") ? "#38bdf8" : "#9ca3af";
                          return <div key={i} style={{ color, paddingBottom: 1 }}>{line}</div>;
                        })
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Applied Jobs Table */}
            <div className="glass-card rounded-2xl border border-[var(--border-default)] overflow-hidden">
              <div className="flex items-center justify-between flex-wrap gap-4 px-5 py-4"
                style={{ borderBottom: "1px solid var(--border-default)" }}>
                <div className="flex items-center gap-2">
                  <Briefcase className="w-4 h-4" style={{ color: "#6366f1" }} />
                  <span style={{ fontWeight: 600, color: "var(--text-primary)", fontSize: 14 }}>
                    Applied Jobs <span style={{ color: "var(--text-muted)", fontWeight: 400, fontSize: 13 }}>({filteredJobs.length})</span>
                  </span>
                </div>

                <div className="flex items-center gap-4 flex-wrap">
                  {/* Portal Filter */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px]" style={{ color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>Portal:</span>
                    <select
                      value={portalFilter}
                      onChange={e => setPortalFilter(e.target.value)}
                      className="px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all"
                      style={{ background: "var(--bg-card)", borderColor: "var(--border-default)", color: "var(--text-primary)", cursor: "pointer" }}
                    >
                      <option value="all">All Portals</option>
                      <option value="linkedin">LinkedIn</option>
                      <option value="naukri">Naukri</option>
                      <option value="ycombinator">YCombinator</option>
                    </select>
                  </div>

                  {/* Applied State Filter */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px]" style={{ color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>State:</span>
                    <select
                      value={appliedFilter}
                      onChange={e => setAppliedFilter(e.target.value)}
                      className="px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all"
                      style={{ background: "var(--bg-card)", borderColor: "var(--border-default)", color: "var(--text-primary)", cursor: "pointer" }}
                    >
                      <option value="all">All States</option>
                      <option value="applied">Applied Only</option>
                      <option value="not_applied">Not Applied</option>
                    </select>
                  </div>

                  {/* Detailed Status Filter */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px]" style={{ color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>Status:</span>
                    <select
                      value={filter}
                      onChange={e => setFilter(e.target.value)}
                      className="px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all"
                      style={{ background: "var(--bg-card)", borderColor: "var(--border-default)", color: "var(--text-primary)", cursor: "pointer" }}
                    >
                      <option value="all">All Statuses</option>
                      {uniqueStatuses.map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                {filteredJobs.length === 0 ? (
                  <div className="py-12 text-center" style={{ color: "var(--text-muted)" }}>
                    <Briefcase className="w-10 h-10 mx-auto mb-3 opacity-30" />
                    <p>No applications yet. Start the bot to see results here.</p>
                  </div>
                ) : (
                  <table className="w-full">
                    <thead>
                      <tr style={{ borderBottom: "1px solid var(--border-default)" }}>
                        <th className="text-left px-4 py-3"
                          style={{ color: "var(--text-muted)", fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", width: 80 }}>
                          Applied
                        </th>
                        {["Platform", "Title", "Company", "Status", "Applied At", "Actions"].map(h => (
                          <th key={h} className="text-left px-4 py-3"
                            style={{ color: "var(--text-muted)", fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <LayoutGroup id="jobs-table-rows">
                      <tbody className="divide-y divide-[var(--border-default)]">
                        <AnimatePresence initial={false} mode="popLayout">
                          {filteredJobs.map((job, i) => (
                            <motion.tr
                              key={job.id || `${job.original_index}-${job.platform}-${job.applied_at}`}
                              layout
                              initial={{ opacity: 0, y: 12 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, x: -10, scale: 0.98 }}
                              transition={{ type: "spring", stiffness: 400, damping: 35 }}
                              className="transition-colors duration-150 hover:bg-white/[0.01]"
                              style={{ borderBottom: "1px solid var(--border-default)" }}
                            >
                              <td className="px-4 py-3">
                                <input
                                  type="checkbox"
                                  checked={job.status === "Submitted" || job.status === "Manually Applied"}
                                  onChange={() => markJob(job.original_index)}
                                  className="w-4 h-4 rounded border-gray-300 text-orange-500 focus:ring-orange-500 cursor-pointer"
                                  style={{ accentColor: "#FF6600" }}
                                />
                              </td>
                              <td className="px-4 py-3"><span style={{ fontSize: 18 }}>{PLATFORM_ICONS[job.platform?.toLowerCase()] || "�"}</span></td>
                              <td className="px-4 py-3"><div style={{ color: "var(--text-primary)", fontWeight: 500, fontSize: 13 }}>{job.title || "Unknown"}</div></td>
                              <td className="px-4 py-3"><div style={{ color: "var(--text-secondary)", fontSize: 13 }}>{job.company || "—"}</div></td>
                              <td className="px-4 py-3">
                                <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold border ${STATUS_COLORS[job.status] || "bg-gray-500/20 text-gray-300 border-gray-500/30"}`}>
                                  {job.status}
                                </span>
                              </td>
                              <td className="px-4 py-3"><div style={{ color: "var(--text-muted)", fontSize: 12 }}>{formatTime(job.applied_at)}</div></td>
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-2">
                                  {job.external_url && (
                                    <motion.a
                                      whileHover={{ scale: 1.15 }}
                                      whileTap={{ scale: 0.9 }}
                                      href={job.external_url} target="_blank" rel="noopener noreferrer"
                                      className="p-1.5 rounded-lg transition-colors hover:bg-white/10"
                                    >
                                      <ExternalLink className="w-3.5 h-3.5" style={{ color: "var(--text-muted)" }} />
                                    </motion.a>
                                  )}
                                  <motion.button
                                    whileHover={{ scale: 1.15 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => markJob(job.original_index)}
                                    className="p-1.5 rounded-lg transition-colors hover:bg-white/10 cursor-pointer"
                                  >
                                    {job.status === "Manually Applied"
                                      ? <XCircle className="w-3.5 h-3.5" style={{ color: "#f59e0b" }} />
                                      : <CheckCircle className="w-3.5 h-3.5" style={{ color: "#22c55e" }} />}
                                  </motion.button>
                                  <motion.button
                                    whileHover={{ scale: 1.15, color: "#ef4444" }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => deleteJob(job.original_index)}
                                    className="p-1.5 rounded-lg transition-colors hover:bg-red-500/10 cursor-pointer"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" style={{ color: "#6b7280" }} />
                                  </motion.button>
                                </div>
                              </td>
                            </motion.tr>
                          ))}
                        </AnimatePresence>
                      </tbody>
                    </LayoutGroup>
                  </table>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ��������������������������������������������������������������������
            TAB: CREDENTIALS
        �������������������������������������������������������������������� */}
        {activeTab === "credentials" && (
          <div className="space-y-5">

            {/* ── Sync from Resume ── */}
            <div className="glass-card rounded-2xl border border-[var(--border-default)] p-5">
              <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                <div>
                  <h2 style={{ fontWeight: 700, color: "var(--text-primary)", fontSize: 16 }}>
                    <Sparkles className="w-4 h-4 inline mr-2 text-amber-400" />
                    Sync Profile from Resume AI
                  </h2>
                  <p style={{ color: "var(--text-secondary)", fontSize: 13, marginTop: 4 }}>
                    Auto-extract your name, skills, title, education, and summary from your latest parsed resume.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {!isEditingProfile && resumeProfile && (
                    <motion.button
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={startEditingProfile}
                      className="glow-btn text-sm py-2 px-5 flex items-center gap-2 cursor-pointer"
                      style={{ borderColor: "rgba(255,102,0,0.4)", color: "#FF6600" }}
                    >
                      <Settings className="w-4 h-4" />
                      Edit Profile
                    </motion.button>
                  )}
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={syncFromResume}
                    disabled={syncLoading}
                    className="glow-btn glow-btn-primary text-sm py-2 px-5 flex items-center gap-2 cursor-pointer"
                    style={{ background: "#FF6600", borderColor: "#FF6600", color: "#ffffff" }}
                  >
                    {syncLoading
                      ? <RefreshCw className="w-4 h-4 animate-spin" />
                      : <Download className="w-4 h-4" />}
                    {syncLoading ? "Syncing..." : "Sync from Resume"}
                  </motion.button>
                </div>
              </div>

              {syncError && (
                <div className="rounded-xl p-3 flex items-center gap-2 mb-4"
                  style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" style={{ color: "#ef4444" }} />
                  <span style={{ color: "#ef4444", fontSize: 13 }}>{syncError}</span>
                </div>
              )}

              <AnimatePresence mode="wait">
                {resumeProfile ? (
                  isEditingProfile ? (
                    <motion.div
                      key="editing-profile"
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -15 }}
                      transition={{ duration: 0.25 }}
                      className="rounded-xl border border-[var(--border-default)] overflow-hidden"
                    >
                      <div className="px-4 py-2.5 flex items-center gap-2"
                        style={{ borderBottom: "1px solid var(--border-default)", background: "rgba(255,102,0,0.05)" }}>
                        <Settings className="w-4 h-4" style={{ color: "#FF6600" }} />
                        <span style={{ color: "#FF6600", fontWeight: 600, fontSize: 13 }}>
                          Editing Bot Profile Details
                        </span>
                      </div>
                      <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4 bg-[var(--bg-card)]/10">
                        <div>
                          <label className="block mb-1.5" style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 500 }}>
                            Full Name
                          </label>
                          <input
                            type="text"
                            value={profileForm.full_name}
                            onChange={e => setProfileForm(prev => ({ ...prev, full_name: e.target.value }))}
                            className="w-full px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#FF6600]/50 transition-all"
                            style={{ background: "var(--bg-card)", border: "1px solid var(--border-default)", color: "var(--text-primary)" }}
                          />
                        </div>

                        <div>
                          <label className="block mb-1.5" style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 500 }}>
                            Personal Email
                          </label>
                          <input
                            type="email"
                            value={profileForm.email}
                            onChange={e => setProfileForm(prev => ({ ...prev, email: e.target.value }))}
                            className="w-full px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#FF6600]/50 transition-all"
                            style={{ background: "var(--bg-card)", border: "1px solid var(--border-default)", color: "var(--text-primary)" }}
                          />
                        </div>

                        <div>
                          <label className="block mb-1.5" style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 500 }}>
                            Phone
                          </label>
                          <input
                            type="text"
                            value={profileForm.phone}
                            onChange={e => setProfileForm(prev => ({ ...prev, phone: e.target.value }))}
                            className="w-full px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#FF6600]/50 transition-all"
                            style={{ background: "var(--bg-card)", border: "1px solid var(--border-default)", color: "var(--text-primary)" }}
                          />
                        </div>

                        <div>
                          <label className="block mb-1.5" style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 500 }}>
                            Current Title
                          </label>
                          <input
                            type="text"
                            value={profileForm.current_title}
                            onChange={e => setProfileForm(prev => ({ ...prev, current_title: e.target.value }))}
                            className="w-full px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#FF6600]/50 transition-all"
                            style={{ background: "var(--bg-card)", border: "1px solid var(--border-default)", color: "var(--text-primary)" }}
                          />
                        </div>

                        <div>
                          <label className="block mb-1.5" style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 500 }}>
                            City
                          </label>
                          <input
                            type="text"
                            value={profileForm.city}
                            onChange={e => setProfileForm(prev => ({ ...prev, city: e.target.value }))}
                            className="w-full px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#FF6600]/50 transition-all"
                            style={{ background: "var(--bg-card)", border: "1px solid var(--border-default)", color: "var(--text-primary)" }}
                          />
                        </div>

                        <div>
                          <label className="block mb-1.5" style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 500 }}>
                            Country
                          </label>
                          <input
                            type="text"
                            value={profileForm.country}
                            onChange={e => setProfileForm(prev => ({ ...prev, country: e.target.value }))}
                            className="w-full px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#FF6600]/50 transition-all"
                            style={{ background: "var(--bg-card)", border: "1px solid var(--border-default)", color: "var(--text-primary)" }}
                          />
                        </div>

                        <div>
                          <label className="block mb-1.5" style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 500 }}>
                            Years of Experience
                          </label>
                          <input
                            type="number"
                            value={profileForm.years_of_experience}
                            onChange={e => setProfileForm(prev => ({ ...prev, years_of_experience: parseInt(e.target.value) || 0 }))}
                            className="w-full px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#FF6600]/50 transition-all"
                            style={{ background: "var(--bg-card)", border: "1px solid var(--border-default)", color: "var(--text-primary)" }}
                          />
                        </div>

                        <div>
                          <label className="block mb-1.5" style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 500 }}>
                            Education
                          </label>
                          <input
                            type="text"
                            value={profileForm.education}
                            onChange={e => setProfileForm(prev => ({ ...prev, education: e.target.value }))}
                            className="w-full px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#FF6600]/50 transition-all"
                            style={{ background: "var(--bg-card)", border: "1px solid var(--border-default)", color: "var(--text-primary)" }}
                          />
                        </div>

                        <div>
                          <label className="block mb-1.5" style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 500 }}>
                            LinkedIn Profile URL
                          </label>
                          <input
                            type="text"
                            value={profileForm.linkedin_url}
                            onChange={e => setProfileForm(prev => ({ ...prev, linkedin_url: e.target.value }))}
                            className="w-full px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#FF6600]/50 transition-all"
                            style={{ background: "var(--bg-card)", border: "1px solid var(--border-default)", color: "var(--text-primary)" }}
                          />
                        </div>

                        <div>
                          <label className="block mb-1.5" style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 500 }}>
                            GitHub Profile URL
                          </label>
                          <input
                            type="text"
                            value={profileForm.github_url}
                            onChange={e => setProfileForm(prev => ({ ...prev, github_url: e.target.value }))}
                            className="w-full px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#FF6600]/50 transition-all"
                            style={{ background: "var(--bg-card)", border: "1px solid var(--border-default)", color: "var(--text-primary)" }}
                          />
                        </div>

                        <div className="md:col-span-2">
                          <label className="block mb-1.5" style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 500 }}>
                            Portfolio / Website URL
                          </label>
                          <input
                            type="text"
                            value={profileForm.portfolio_url}
                            onChange={e => setProfileForm(prev => ({ ...prev, portfolio_url: e.target.value }))}
                            className="w-full px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#FF6600]/50 transition-all"
                            style={{ background: "var(--bg-card)", border: "1px solid var(--border-default)", color: "var(--text-primary)" }}
                          />
                        </div>

                        <div className="md:col-span-2">
                          <label className="block mb-1.5" style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 500 }}>
                            Skills (comma-separated)
                          </label>
                          <textarea
                            value={profileForm.skills.join(", ")}
                            onChange={e => setProfileForm(prev => ({ ...prev, skills: e.target.value.split(",").map(s => s.trim()).filter(Boolean) }))}
                            className="w-full px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#FF6600]/50 transition-all"
                            rows={3}
                            style={{ background: "var(--bg-card)", border: "1px solid var(--border-default)", color: "var(--text-primary)", resize: "vertical" }}
                          />
                        </div>
                      </div>

                      <div className="flex justify-end gap-3 px-4 py-3" style={{ background: "rgba(0,0,0,0.2)", borderTop: "1px solid var(--border-default)" }}>
                        <button
                          onClick={() => setIsEditingProfile(false)}
                          disabled={profileSaving}
                          className="px-4 py-2 rounded-lg text-sm font-semibold border transition-all cursor-pointer"
                          style={{ background: "transparent", borderColor: "var(--border-default)", color: "var(--text-muted)" }}
                        >
                          Cancel
                        </button>
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={saveProfile}
                          disabled={profileSaving}
                          className="glow-btn glow-btn-primary text-sm py-2 px-5 flex items-center gap-2 cursor-pointer"
                        >
                          {profileSaving && <RefreshCw className="w-4 h-4 animate-spin" />}
                          {profileSaving ? "Saving..." : "Save Details"}
                        </motion.button>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="view-profile"
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -15 }}
                      transition={{ duration: 0.25 }}
                      className="rounded-xl border border-[var(--border-default)] overflow-hidden"
                    >
                      <div className="px-4 py-2.5 flex items-center gap-2 bg-[var(--bg-card)]/50"
                        style={{ borderBottom: "1px solid var(--border-default)" }}>
                        <CheckCircle className="w-4 h-4" style={{ color: "#22c55e" }} />
                        <span className="font-semibold flex items-center gap-2" style={{ color: "#22c55e", fontSize: 13 }}>
                          {resumeProfile.resume_name ? `Synced from: ${resumeProfile.resume_name}` : "Profile Configured"}
                          {resumeProfile.ats_score != null && (
                            <span className="ml-3 px-2 py-0.5 rounded-full text-xs"
                              style={{ background: "rgba(99,102,241,0.1)", color: "#818cf8" }}>
                              ATS: {resumeProfile.ats_score}
                            </span>
                          )}
                        </span>
                      </div>
                      <div className="p-4 grid grid-cols-2 gap-4 bg-[var(--bg-card)]/10">
                        {[
                          { label: "Full Name", value: resumeProfile.full_name },
                          { label: "Email", value: resumeProfile.email },
                          { label: "Phone", value: (resumeProfile as any).phone || "—" },
                          { label: "City", value: (resumeProfile as any).city || "—" },
                          { label: "Country", value: (resumeProfile as any).country || "—" },
                          { label: "Current Title", value: resumeProfile.current_title || "—" },
                          { label: "Years of Exp.", value: resumeProfile.years_of_experience ?? "—" },
                          { label: "Education", value: resumeProfile.education || "—" },
                          { label: "LinkedIn URL", value: (resumeProfile as any).linkedin_url || "—", isLink: true },
                          { label: "GitHub URL", value: (resumeProfile as any).github_url || "—", isLink: true },
                          { label: "Portfolio URL", value: (resumeProfile as any).portfolio_url || "—", isLink: true },
                        ].map((f, idx) => (
                          <motion.div
                            key={f.label}
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.02 }}
                            className="col-span-2 sm:col-span-1"
                          >
                            <div style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 500, marginBottom: 2, textTransform: "uppercase" }}>{f.label}</div>
                            {f.isLink && f.value && f.value !== "—" ? (
                              <a href={f.value.startsWith("http") ? f.value : `https://${f.value}`} target="_blank" rel="noopener noreferrer"
                                className="text-sky-400 hover:text-sky-300 transition-colors flex items-center gap-1 text-sm font-medium">
                                {f.value} <ExternalLink className="w-3 h-3" />
                              </a>
                            ) : (
                              <div style={{ fontSize: 14, color: "var(--text-primary)", fontWeight: 500 }}>{String(f.value)}</div>
                            )}
                          </motion.div>
                        ))}
                        {resumeProfile.skills && resumeProfile.skills.length > 0 && (
                          <div className="col-span-2">
                            <div style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 500, marginBottom: 6, textTransform: "uppercase" }}>Skills</div>
                            <div className="flex flex-wrap gap-1.5">
                              {resumeProfile.skills.slice(0, 30).map((s, sIdx) => (
                                <motion.span
                                  key={s}
                                  initial={{ scale: 0, opacity: 0 }}
                                  animate={{ scale: 1, opacity: 1 }}
                                  transition={{ type: "spring", stiffness: 300, damping: 20, delay: sIdx * 0.015 }}
                                  whileHover={{ scale: 1.1, rotate: 2 }}
                                  className="px-2.5 py-0.5 rounded-full text-xs font-semibold cursor-default select-none transition-shadow"
                                  style={{ background: "rgba(99,102,241,0.1)", color: "#818cf8", border: "1px solid rgba(99,102,241,0.2)" }}
                                >
                                  {s}
                                </motion.span>
                              ))}
                              {resumeProfile.skills.length > 30 && (
                                <span style={{ color: "var(--text-muted)", fontSize: 12, alignSelf: "center" }}>
                                  +{resumeProfile.skills.length - 30} more
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )
                ) : (
                  <motion.div
                    key="no-profile"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="py-8 text-center"
                    style={{ color: "var(--text-muted)" }}
                  >
                    <User className="w-10 h-10 mx-auto mb-3 opacity-30" />
                    <p>No profile synced yet. Click &ldquo;Sync from Resume&rdquo; to get started.</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Platform Credentials */}
            <div className="glass-card rounded-2xl border border-[var(--border-default)] p-5">
              <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
                <div>
                  <h2 style={{ fontWeight: 700, color: "var(--text-primary)", fontSize: 16 }}>
                    <Lock className="w-4 h-4 inline mr-2 opacity-70" />
                    Platform Login Credentials
                  </h2>
                  <p style={{ color: "var(--text-secondary)", fontSize: 13, marginTop: 4 }}>
                    Stored securely on the server — never sent back to the browser. Used to log into job portals.
                  </p>
                </div>
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={saveCredentials}
                  disabled={credSaving}
                  className="glow-btn glow-btn-primary text-sm py-2 px-5 flex items-center gap-2 cursor-pointer"
                  style={{ background: "#FF6600", borderColor: "#FF6600", color: "#ffffff" }}
                >
                  {credSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />}
                  {credSaved ? "Saved!" : "Save Credentials"}
                </motion.button>
              </div>

              <div className="space-y-4">
                {[
                  { platform: "linkedin", icon: "🔵", label: "LinkedIn", credKey: "linkedin", formPrefix: "linkedin" },
                  { platform: "naukri", icon: "🟠", label: "Naukri", credKey: "naukri", formPrefix: "naukri" },
                  { platform: "ycombinator", icon: "🟡", label: "YCombinator / Work at a Startup", credKey: "ycombinator", formPrefix: "yc" },
                ].map(({ platform, icon, label, credKey, formPrefix }) => (
                  <CredRow
                    key={platform}
                    platform={platform}
                    icon={icon}
                    label={label}
                    email={credStatus?.[credKey as keyof CredStatus]?.email || ""}
                    hasPassword={credStatus?.[credKey as keyof CredStatus]?.has_password || false}
                    isSso={ssoMap[platform] || false}
                    formEmail={credForm[`${formPrefix}_email` as keyof typeof credForm] ?? ""}
                    formPassword={credForm[`${formPrefix}_password` as keyof typeof credForm] ?? ""}
                    showPass={showPassMap[platform] || false}
                    onEmailChange={v => setCredForm(prev => ({ ...prev, [`${formPrefix}_email`]: v }))}
                    onPasswordChange={v => setCredForm(prev => ({ ...prev, [`${formPrefix}_password`]: v }))}
                    onToggleShow={() => setShowPassMap(prev => ({ ...prev, [platform]: !prev[platform] }))}
                    onToggleSso={() => setSsoMap(prev => ({ ...prev, [platform]: !prev[platform] }))}
                  />
                ))}
              </div>

              <div className="mt-4 rounded-xl p-4 flex items-start gap-3"
                style={{ background: "rgba(245,158,11,0.05)", border: "1px solid rgba(245,158,11,0.2)" }}>
                <Shield className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: "#f59e0b" }} />
                <p style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.6 }}>
                  <span style={{ fontWeight: 600, color: "#f59e0b" }}>Security Note:</span>{" "}
                  Passwords are stored in an encrypted JSON file on the server and are never returned via any API response.
                  They are injected as environment variables only when the bot subprocess starts.
                  You only need to enter a password once — subsequent bot runs use the saved value.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* TAB: CONFIGURATION */}
        {activeTab === "config" && config && (
          <div className="space-y-5">
            <div className="glass-card rounded-2xl border border-[var(--border-default)] p-5">
              <div className="flex items-center justify-between mb-5">
                <h2 style={{ fontWeight: 700, color: "var(--text-primary)", fontSize: 16 }}>
                  <Settings className="w-4 h-4 inline mr-2 opacity-70" />
                  Job Preferences
                </h2>
                <motion.button
                  whileHover={{ scale: configDirty ? 1.02 : 1 }}
                  whileTap={{ scale: configDirty ? 0.98 : 1 }}
                  onClick={saveConfig}
                  disabled={!configDirty || actionLoading === "save"}
                  className="glow-btn glow-btn-primary text-sm py-2 px-5 flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  style={configDirty ? { background: "#FF6600", borderColor: "#FF6600", color: "#ffffff" } : undefined}
                >
                  {actionLoading === "save" ? <RefreshCw className="w-4 h-4 animate-spin" /> : null}
                  {saveSuccess ? "Saved!" : "Save Changes"}
                </motion.button>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block mb-3" style={{ fontSize: 13, fontWeight: 600, color: "var(--text-secondary)" }}>PLATFORMS</label>
                  <div className="flex flex-wrap gap-3">
                    {["linkedin", "naukri", "ycombinator"].map(p => {
                      const enabled = config.platforms?.[p]?.enabled ?? false;
                      return (
                        <motion.button
                          key={p}
                          whileHover={{ scale: 1.02, borderColor: enabled ? "rgba(255,102,0,0.5)" : "rgba(255,255,255,0.12)" }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => togglePlatform(p)}
                          className="flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-300 border cursor-pointer select-none"
                          style={{
                            background: enabled ? "rgba(255,102,0,0.06)" : "var(--bg-card)",
                            borderColor: enabled ? "rgba(255,102,0,0.3)" : "var(--border-default)",
                            color: enabled ? "#FF6600" : "var(--text-muted)",
                          }}>
                          <span style={{ fontSize: 18 }}>{PLATFORM_ICONS[p]}</span>
                          <span style={{ fontWeight: 600, fontSize: 14, textTransform: "capitalize" }}>{p}</span>
                          <div className="w-8 h-4 bg-zinc-800 rounded-full p-0.5 transition-colors duration-300 flex items-center ml-2" style={{ background: enabled ? "#FF6600" : "" }}>
                            <motion.div
                              layout
                              className="w-3 h-3 bg-white rounded-full shadow-lg"
                              animate={{ x: enabled ? 14 : 0 }}
                              transition={{ type: "spring", stiffness: 500, damping: 30 }}
                            />
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label style={{ fontSize: 13, fontWeight: 600, color: "var(--text-secondary)" }}>
                      KEYWORDS (one per line)
                    </label>
                    <div className="flex gap-2">
                      <motion.button
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        type="button"
                        onClick={() => {
                          const merged = [...new Set([...(config.keywords || []), ...DEFAULT_KEYWORD_SUITE])];
                          updateConfig({ keywords: merged });
                        }}
                        className="px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all duration-200 cursor-pointer"
                        style={{ background: "rgba(99,102,241,0.08)", borderColor: "rgba(99,102,241,0.3)", color: "#818cf8" }}
                      >
                        📋 Load Suite
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: resumeProfile ? 1.03 : 1 }}
                        whileTap={{ scale: resumeProfile ? 0.97 : 1 }}
                        type="button"
                        disabled={!resumeProfile}
                        onClick={() => {
                          if (!resumeProfile) return;
                          const autoKeywords = generateKeywordsFromProfile(resumeProfile);
                          const merged = [...new Set([...(config.keywords || []), ...autoKeywords])];
                          updateConfig({ keywords: merged });
                        }}
                        className="px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                        style={{ background: "rgba(255,102,0,0.08)", borderColor: "rgba(255,102,0,0.3)", color: "#FF6600" }}
                      >
                        ✨ Auto-Generate from Resume
                      </motion.button>
                    </div>
                  </div>
                  <textarea className="w-full rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-[#FF6600]/50 transition-all" rows={8}
                    style={{ background: "var(--bg-card)", border: "1px solid var(--border-default)", color: "var(--text-primary)", fontFamily: "var(--font-mono)", resize: "vertical" }}
                    value={(config.keywords || []).join("\n")}
                    onChange={e => updateConfig({ keywords: e.target.value.split("\n").map(k => k.trim()).filter(Boolean) })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-5">
                  <div>
                    <label className="block mb-2" style={{ fontSize: 13, fontWeight: 600, color: "var(--text-secondary)" }}>MAX APPLICATIONS / DAY</label>
                    <input type="number" className="w-full rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#FF6600]/50 transition-all"
                      style={{ background: "var(--bg-card)", border: "1px solid var(--border-default)", color: "var(--text-primary)" }}
                      value={config.max_applications_per_day}
                      onChange={e => updateConfig({ max_applications_per_day: parseInt(e.target.value) || 0 })} />
                  </div>
                  <div>
                    <label className="block mb-2" style={{ fontSize: 13, fontWeight: 600, color: "var(--text-secondary)" }}>JOBS PER SEARCH</label>
                    <input type="number" className="w-full rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#FF6600]/50 transition-all"
                      style={{ background: "var(--bg-card)", border: "1px solid var(--border-default)", color: "var(--text-primary)" }}
                      value={config.search_limit}
                      onChange={e => updateConfig({ search_limit: parseInt(e.target.value) || 0 })} />
                  </div>
                </div>

                <div>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => updateConfig({ remote_only: !config.remote_only })}
                    className="flex items-center gap-3 px-4 py-2.5 rounded-xl border transition-all duration-300 cursor-pointer select-none"
                    style={{
                      background: config.remote_only ? "rgba(99,102,241,0.06)" : "var(--bg-card)",
                      borderColor: config.remote_only ? "rgba(99,102,241,0.3)" : "var(--border-default)",
                      color: config.remote_only ? "#818cf8" : "var(--text-muted)",
                    }}>
                    <Globe className="w-4 h-4" />
                    <span style={{ fontWeight: 600, fontSize: 14 }}>Remote Only</span>
                    <div className="w-8 h-4 bg-zinc-800 rounded-full p-0.5 transition-colors duration-300 flex items-center ml-2" style={{ background: config.remote_only ? "#818cf8" : "" }}>
                      <motion.div
                        layout
                        className="w-3 h-3 bg-white rounded-full shadow-lg"
                        animate={{ x: config.remote_only ? 14 : 0 }}
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                      />
                    </div>
                  </motion.button>
                </div>

                <div>
                  <label className="block mb-3" style={{ fontSize: 13, fontWeight: 600, color: "var(--text-secondary)" }}>TARGET LOCATIONS</label>
                  <div className="flex flex-wrap gap-2">
                    {(config.countries || []).map((c, i) => (
                      <motion.button
                        key={c.country}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => {
                          const updated = [...config.countries];
                          updated[i] = { ...updated[i], active: !updated[i].active };
                          updateConfig({ countries: updated });
                        }}
                        className="px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all duration-300 cursor-pointer select-none"
                        style={{
                          background: c.active ? "rgba(6,182,212,0.08)" : "var(--bg-card)",
                          borderColor: c.active ? "rgba(6,182,212,0.3)" : "var(--border-default)",
                          color: c.active ? "#38bdf8" : "var(--text-muted)",
                        }}>
                        {c.active ? "✓ " : ""} {c.country}
                      </motion.button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
}
