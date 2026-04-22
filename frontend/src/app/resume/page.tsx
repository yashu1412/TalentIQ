"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useDropzone } from "react-dropzone";
import { useAuth } from "@clerk/nextjs";
import DashboardLayout from "@/components/DashboardLayout";
import dynamic from "next/dynamic";
import { Upload, FileText, CheckCircle, AlertCircle, Zap, ArrowRight, Sparkles, Trash2 } from "lucide-react";
import axios from "axios";
import AITyping from "@/components/ui/AITyping";
import { copilotApi } from "@/lib/api";

const ResumeOrb = dynamic(() => import("@/components/3d/ResumeOrb"), { ssr: false });

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/v1";
type ParseStatus = "idle" | "processing" | "done" | "error";

const AI_SUGGESTIONS = [
  "Tip: Quantify your impact — try '20+ concurrent workflow runs improved throughput by 35%'",
  "Tip: Add Docker Compose explicitly to your skills — it shows up in 78% of matched JDs",
  "Tip: Your summary section is missing. A 2–3 line summary improves ATS score by ~12 points",
  "Tip: Move your GitHub URL to the header — recruiters scan the top 30% of resume first",
];

const RESUME_KEY = "talentiq_resume_data";

export default function ResumePage() {
  const router = useRouter();
  const { getToken } = useAuth();
  const [status, setStatus] = useState<ParseStatus>("idle");
  const [progress, setProgress] = useState(0);
  const [resumeData, setResumeData] = useState<any>(() => {
    if (typeof window === "undefined") return null;
    try { const s = localStorage.getItem(RESUME_KEY); return s ? JSON.parse(s) : null; } catch { return null; }
  });
  const [activeTab, setActiveTab] = useState<"skills" | "experience" | "education" | "projects">("skills");
  const [suggestionIdx, setSuggestionIdx] = useState(0);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [quickWins, setQuickWins] = useState<string[]>([]);
  const [linkedinSummary, setLinkedinSummary] = useState("");

  // Restore done state if resume was previously parsed
  useEffect(() => {
    if (resumeData) { setStatus("done"); setProgress(100); setShowSuggestions(true); }
  }, []);

  const clearResume = () => {
    try { localStorage.removeItem(RESUME_KEY); } catch {}
    setResumeData(null); setStatus("idle"); setProgress(0); setShowSuggestions(false); setSuggestionIdx(0);
  };

  const onDrop = useCallback(async (files: File[]) => {
    const file = files[0];
    if (!file) return;
    setStatus("processing");
    setProgress(10);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const token = await getToken();
      if (!token) { setStatus("error"); return; }  // guard: Clerk not ready
      const resp = await axios.post(`${API}/resumes/upload`, formData, {
        headers: { 
          "Content-Type": "multipart/form-data",
          "Authorization": `Bearer ${token}`,
        },
      });
      const id = resp.data.resume_id;
      setProgress(40);
      const poll = setInterval(async () => {
        try {
          const freshToken = await getToken();  // always get fresh token on each poll
          if (!freshToken) { clearInterval(poll); setStatus("error"); return; }
          const detail = await axios.get(`${API}/resumes/${id}`, {
            headers: { Authorization: `Bearer ${freshToken}` }
          });
          if (detail.data.parse_status === "done") {
            clearInterval(poll);
            setResumeData(detail.data);
            try { localStorage.setItem(RESUME_KEY, JSON.stringify(detail.data)); } catch {}
            setProgress(100);
            setStatus("done");
            setTimeout(() => setShowSuggestions(true), 800);
          } else if (detail.data.parse_status === "failed") {
            clearInterval(poll);
            setStatus("error");
          } else {
            setProgress(prev => Math.min(prev + 12, 90));
          }
        } catch { clearInterval(poll); setStatus("error"); }
      }, 2000);
    } catch { setStatus("error"); }
  }, [getToken]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"] },
    maxFiles: 1,
  });

  const parsed = resumeData?.parsed_json;

  const generateQuickWins = async () => {
    try {
      const token = await getToken();
      const context = `ATS score: ${resumeData?.ats_score}. Skills: ${(parsed?.skills || []).join(", ")}`;
      const resp = await copilotApi.writingAssistant("quick_wins_before_applying", context, token || "");
      const lines = String(resp.data?.output || "").split("\n").map((line: string) => line.trim()).filter(Boolean);
      setQuickWins(lines.slice(0, 5));
    } catch {}
  };

  const generateLinkedinSummary = async () => {
    try {
      const token = await getToken();
      const context = JSON.stringify(parsed || {}).slice(0, 3000);
      const resp = await copilotApi.writingAssistant("linkedin_summary", context, token || "");
      setLinkedinSummary(resp.data?.output || "");
    } catch {}
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <p className="text-xs font-mono" style={{ color: "#378ADD", letterSpacing: "0.15em" }}>SYSTEM / RESUME AI</p>
            <h1 style={{ fontFamily: "Syne, sans-serif", fontSize: 30, fontWeight: 800, color: "var(--text-primary)" }}>Resume Intelligence</h1>
          </div>
          <div className="flex items-center gap-3">
            {status === "done" && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold"
                style={{ background: "rgba(55,138,221,0.15)", border: "1px solid #378ADD", color: "#60A5FA" }}>
                <CheckCircle className="w-3.5 h-3.5" /> ATS: {resumeData?.ats_score ?? "—"}/100
              </div>
            )}
            {status === "done" && (
              <button onClick={clearResume} className="glow-btn text-sm py-2 px-4" style={{ borderColor: "#F43F5E", color: "#F43F5E" }}>
                <Trash2 className="w-3.5 h-3.5" /> Clear
              </button>
            )}
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Left: Orb + Upload */}
          <div className="space-y-4">
            <div className="glass-card p-5 flex flex-col items-center">
              <ResumeOrb status={status} progress={progress} />

              {status === "done" && resumeData && (
                <div className="mt-5 flex gap-8 text-center w-full justify-center">
                  <div>
                    <div style={{ fontFamily: "Syne, sans-serif", fontSize: 30, fontWeight: 800, color: "#60A5FA" }}>{resumeData.ats_score ?? "—"}</div>
                    <div className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>ATS Score</div>
                  </div>
                  <div style={{ width: 1, background: "var(--border-default)" }} />
                  <div>
                    <div style={{ fontFamily: "Syne, sans-serif", fontSize: 30, fontWeight: 800, color: "#8B5CF6" }}>{resumeData.quality_score ?? "—"}</div>
                    <div className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>Quality Score</div>
                  </div>
                </div>
              )}
            </div>

            {status === "idle" && (
              <div
                {...getRootProps()}
                className="glass-card p-10 text-center cursor-pointer transition-all"
                style={{ borderStyle: "dashed", borderWidth: 2, borderColor: isDragActive ? "#378ADD" : "var(--border-default)" }}
              >
                <input {...getInputProps()} />
                <Upload className="w-12 h-12 mx-auto mb-4" style={{ color: isDragActive ? "#378ADD" : "var(--text-muted)" }} />
                <p style={{ color: "var(--text-primary)", fontWeight: 600, marginBottom: 4 }}>
                  {isDragActive ? "Drop your resume here" : "Upload your resume"}
                </p>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>PDF · max 5 MB</p>
              </div>
            )}

            {status === "processing" && (
              <div className="glass-card p-6 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="animate-spin w-5 h-5 border-2 border-[#378ADD] border-t-transparent rounded-full" />
                  <span style={{ color: "#60A5FA", fontSize: 14 }}>Analyzing your resume with AI…</span>
                </div>
                <div className="w-full h-2 rounded-full" style={{ background: "var(--border-default)" }}>
                  <div className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${progress}%`, background: "linear-gradient(90deg, #378ADD, #60A5FA)" }} />
                </div>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>Extracting skills, experience, education…</p>
              </div>
            )}

            {status === "error" && (
              <div className="glass-card p-6 flex items-center gap-3" style={{ borderColor: "#F43F5E" }}>
                <AlertCircle className="w-5 h-5 flex-shrink-0" style={{ color: "#F43F5E" }} />
                <div>
                  <p style={{ color: "#FDA4AF", fontWeight: 600 }}>Parse failed</p>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>Try a different PDF or check the file isn't password protected.</p>
                </div>
              </div>
            )}
          </div>

          {/* Right: Parsed data */}
          <div className="glass-card p-5">
            {!parsed ? (
              <div className="flex flex-col items-center justify-center h-64 text-center">
                <FileText className="w-14 h-14 mb-4" style={{ color: "var(--text-muted)" }} />
                <p style={{ color: "var(--text-primary)", fontWeight: 600, marginBottom: 4 }}>No resume parsed yet</p>
                <p className="text-sm" style={{ color: "var(--text-muted)" }}>Upload your PDF to see AI analysis</p>
              </div>
            ) : (
              <>
                <div className="flex gap-2 mb-5 flex-wrap">
                  {(["skills", "experience", "education", "projects"] as const).map(tab => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all"
                      style={{
                        background: activeTab === tab ? "#378ADD" : "var(--bg-deep)",
                        border: `1px solid ${activeTab === tab ? "#378ADD" : "var(--border-default)"}`,
                        color: activeTab === tab ? "#fff" : "var(--text-muted)",
                      }}
                    >
                      {tab}
                    </button>
                  ))}
                </div>

                {activeTab === "skills" && (
                  <div className="flex flex-wrap gap-2">
                    {(parsed.skills as string[] || []).map((sk, i) => (
                      <span key={i} className="skill-badge-matched">{sk}</span>
                    ))}
                  </div>
                )}

                {activeTab === "experience" && (
                  <div className="space-y-4">
                    {(parsed.experience as any[] || []).map((exp: any, i: number) => (
                      <div key={i} className="p-4 rounded-xl" style={{ background: "var(--bg-deep)", border: "1px solid var(--border-default)" }}>
                        <div className="flex justify-between items-start mb-1">
                          <div>
                            <p style={{ fontWeight: 600, color: "var(--text-primary)" }}>{exp.role}</p>
                            <p className="text-sm" style={{ color: "#378ADD" }}>{exp.company}</p>
                          </div>
                          <span className="text-xs" style={{ color: "var(--text-muted)" }}>{exp.duration}</span>
                        </div>
                        <ul className="mt-2 space-y-1">
                          {(exp.bullets as string[] || []).slice(0, 3).map((b: string, j: number) => (
                            <li key={j} className="text-xs" style={{ color: "var(--text-muted)" }}>• {b}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                )}

                {activeTab === "education" && (
                  <div className="space-y-3">
                    {(parsed.education as any[] || []).map((edu: any, i: number) => (
                      <div key={i} className="p-4 rounded-xl" style={{ background: "var(--bg-deep)", border: "1px solid var(--border-default)" }}>
                        <p style={{ fontWeight: 600, color: "var(--text-primary)" }}>{edu.school}</p>
                        <p className="text-sm" style={{ color: "#378ADD" }}>{edu.degree}</p>
                        <p className="text-xs" style={{ color: "var(--text-muted)" }}>{edu.year}</p>
                      </div>
                    ))}
                  </div>
                )}

                {activeTab === "projects" && (
                  <div className="space-y-3">
                    {(parsed.projects as any[] || []).map((p: any, i: number) => (
                      <div key={i} className="p-4 rounded-xl" style={{ background: "var(--bg-deep)", border: "1px solid var(--border-default)" }}>
                        <p style={{ fontWeight: 600, color: "var(--text-primary)", marginBottom: 4 }}>{p.name}</p>
                        <p className="text-xs mb-3" style={{ color: "var(--text-muted)" }}>{p.description}</p>
                        <div className="flex flex-wrap gap-1.5">
                          {(p.tech as string[] || []).map((t: string, j: number) => (
                            <span key={j} className="skill-badge-bonus">{t}</span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* AI Suggestions (streaming typewriter) */}
        {showSuggestions && (
          <div className="glass-card p-5" style={{ borderColor: "rgba(245,158,11,0.3)" }}>
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-4 h-4" style={{ color: "#F59E0B" }} />
              <h2 style={{ fontFamily: "Syne, sans-serif", fontSize: 13, fontWeight: 700, color: "var(--text-muted)", letterSpacing: "0.1em" }}>
                AI SUGGESTIONS
              </h2>
            </div>
            <div className="space-y-3">
              {AI_SUGGESTIONS.map((tip, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-xl" style={{ background: "var(--bg-deep)", border: "1px solid var(--border-default)" }}>
                  <span style={{ color: "#F59E0B", fontWeight: 700, fontSize: 13, flexShrink: 0 }}>{i + 1}.</span>
                  {i === suggestionIdx ? (
                    <AITyping
                      text={tip}
                      speed={16}
                      onComplete={() => setSuggestionIdx(prev => prev + 1)}
                      style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.6 }}
                    />
                  ) : i < suggestionIdx ? (
                    <p style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.6 }}>{tip}</p>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action buttons */}
        {status === "done" && (
          <div className="flex gap-4 flex-wrap">
            <button
              onClick={() => router.push("/copilot?context=resume")}
              className="glow-btn"
            >
              <Sparkles className="w-4 h-4" /> Improve with AI
            </button>
            <button onClick={generateQuickWins} className="glow-btn">
              Top 5 Improvements
            </button>
            <button onClick={generateLinkedinSummary} className="glow-btn">
              LinkedIn Summary
            </button>
            <button
              onClick={() => router.push("/job-analysis")}
              className="glow-btn"
            >
              Match Against Job <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
        {(quickWins.length > 0 || linkedinSummary) && (
          <div className="glass-card p-5 space-y-4">
            {quickWins.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold mb-2" style={{ color: "#F59E0B" }}>Top 5 Improvements Before Applying</h3>
                <ul className="list-disc pl-5 text-xs space-y-1" style={{ color: "var(--text-muted)" }}>
                  {quickWins.map((w, i) => <li key={i}>{w}</li>)}
                </ul>
              </div>
            )}
            {linkedinSummary && (
              <div>
                <h3 className="text-sm font-semibold mb-2" style={{ color: "#378ADD" }}>LinkedIn Summary</h3>
                <p className="text-xs whitespace-pre-wrap" style={{ color: "var(--text-muted)" }}>{linkedinSummary}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
