"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import DashboardLayout from "@/components/DashboardLayout";
import dynamic from "next/dynamic";
import { Zap, Send, ChevronRight, Mic, Timer, Download } from "lucide-react";
import axios from "axios";

const InterviewAvatar3D = dynamic(() => import("@/components/3d/InterviewAvatar3D"), { ssr: false });
const ScoreRing3D = dynamic(() => import("@/components/3d/ScoreRing3D"), { ssr: false });

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/v1";
type Stage = "setup" | "interview" | "report";
type AvatarState = "idle" | "thinking" | "speaking";

const QUESTION_TIME_LIMIT = 120;

const DEFAULT_ROLES = [
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

const DEFAULT_ROUND_TYPES_BY_ROLE: Record<string, string[]> = {
  "Software Engineer":        ["Coding & DS/Algo", "System Design", "Behavioral", "HR"],
  "Data Scientist":           ["Statistics & ML", "Coding & Data", "Case Study", "Behavioral"],
  "Frontend Developer":       ["JavaScript & UI", "CSS & Design", "React & Frameworks", "Behavioral"],
  "Backend Developer":        ["Coding & APIs", "System Design", "Database", "Behavioral"],
  "DevOps Engineer":          ["Infrastructure & Cloud", "CI/CD & Automation", "Security & Monitoring", "Behavioral"],
  "Machine Learning Engineer":["ML Theory & Math", "Coding & Modelling", "MLOps & Systems", "Behavioral"],
  "Product Manager":          ["Product Sense", "Analytical", "Execution", "Behavioral"],
  "UX Designer":              ["Portfolio & Process", "Design Challenge", "Research & Strategy", "Behavioral"],
  "Cybersecurity Analyst":    ["Technical Security", "Threat Analysis", "Incident Response", "Behavioral"],
  "Cloud Architect":          ["Cloud Fundamentals", "Architecture Design", "Security & Cost", "Behavioral"],
};

const PERSONAS = [
  { key: "balanced",             label: "Balanced",       icon: "⚖️" },
  { key: "strict",               label: "Strict",         icon: "🎯" },
  { key: "friendly",             label: "Friendly",       icon: "😊" },
  { key: "behavioral-heavy",     label: "Behavioral",     icon: "🤝" },
  { key: "system-design-heavy",  label: "System Design",  icon: "🏗️" },
];

export default function MockInterviewPage() {
  const router = useRouter();
  const { getToken } = useAuth();

  const [stage, setStage] = useState<Stage>("setup");
  const [role, setRole] = useState("Software Engineer");
  const [roundType, setRoundType] = useState("Coding & DS/Algo");
  const [persona, setPersona] = useState("balanced");

  const [roles, setRoles] = useState<string[]>(DEFAULT_ROLES);
  const [roundTypesByRole, setRoundTypesByRole] = useState<Record<string, string[]>>(DEFAULT_ROUND_TYPES_BY_ROLE);

  const [avatarState, setAvatarState] = useState<AvatarState>("idle");
  const [interviewId, setInterviewId] = useState<string | null>(null);
  const [currentQ, setCurrentQ] = useState<any>(null);
  const [totalQ, setTotalQ] = useState(8);
  const [qIndex, setQIndex] = useState(1);
  const [answer, setAnswer] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [score, setScore] = useState<number | null>(null);
  const [report, setReport] = useState<any>(null);
  const [timeLeft, setTimeLeft] = useState(QUESTION_TIME_LIMIT);
  const [starting, setStarting] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const recognitionRef = useRef<any>(null);

  // Available round types for selected role
  const availableRounds = roundTypesByRole[role] ?? ["Behavioral", "Technical", "HR"];

  // Reset round type when role changes
  useEffect(() => {
    setRoundType(availableRounds[0]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role]);

  // Fetch options from backend
  useEffect(() => {
    const fetch = async () => {
      try {
        const token = await getToken();
        const resp = await axios.get(`${API}/interviews/options`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (resp.data?.roles?.length) setRoles(resp.data.roles);
        if (resp.data?.round_types_by_role) setRoundTypesByRole(resp.data.round_types_by_role);
      } catch {
        // use defaults silently
      }
    };
    fetch();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Timer per question
  useEffect(() => {
    if (stage !== "interview") return;
    setTimeLeft(QUESTION_TIME_LIMIT);
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) { clearInterval(timerRef.current!); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [currentQ, stage]);

  const fmtTime = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  const startInterview = async () => {
    setStarting(true);
    setAvatarState("thinking");
    try {
      const token = await getToken();
      const resp = await axios.post(
        `${API}/interviews/start`,
        { role, round_type: roundType, type: "technical", mode: "text", difficulty: "medium", persona },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setInterviewId(resp.data.interview_id);
      setCurrentQ(resp.data.first_question);
      setTotalQ(resp.data.total_questions ?? 8);
      setQIndex(1);
      setStage("interview");
      setAvatarState("speaking");
    } catch {
      setAvatarState("idle");
    } finally {
      setStarting(false);
    }
  };

  const submitAnswer = async (overrideAnswer?: string) => {
    // Determine what answer to submit
    const finalAnswer = typeof overrideAnswer === 'string' ? overrideAnswer : answer.trim();
    if (!interviewId || !currentQ || !finalAnswer) return;
    
    // Stop listening if active
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    }

    setAvatarState("thinking");
    if (timerRef.current) clearInterval(timerRef.current);
    try {
      const token = await getToken();
      const headers = { Authorization: `Bearer ${token}` };
      const resp = await axios.post(
        `${API}/interviews/${interviewId}/answer`,
        { question_id: currentQ.id, answer_text: finalAnswer },
        { headers }
      );
      setFeedback(resp.data.feedback);
      setScore(resp.data.score);
      if (resp.data.finished || !resp.data.next_question) {
        await axios.post(`${API}/interviews/${interviewId}/finish`, {}, { headers });
        const reportResp = await axios.get(`${API}/interviews/${interviewId}/report`, { headers });
        setReport(reportResp.data);
        setStage("report");
      } else {
        setTimeout(() => {
          setCurrentQ(resp.data.next_question);
          setQIndex(i => i + 1);
          setAnswer("");
          setFeedback(null);
          setScore(null);
          setAvatarState("speaking");
        }, 1200);
      }
    } catch { setAvatarState("idle"); }
  };

  const skipQuestion = async () => {
    if (!interviewId || !currentQ) return;
    await submitAnswer("Skipped by user.");
  };

  const toggleVoice = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert("Voice recognition is not supported in this browser. Please use Chrome or Edge.");
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onresult = (event: any) => {
      let finalTranscript = "";
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        }
      }
      if (finalTranscript) {
        setAnswer(prev => prev + (prev ? " " : "") + finalTranscript);
      }
    };

    recognition.onerror = () => {
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
    setIsListening(true);
  };

  const resetInterview = () => {
    setStage("setup");
    setReport(null);
    setCurrentQ(null);
    setAnswer("");
    setFeedback(null);
    setScore(null);
    setAvatarState("idle");
    setQIndex(1);
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <p className="text-xs font-mono" style={{ color: "#8B5CF6", letterSpacing: "0.15em" }}>
              SYSTEM / MOCK INTERVIEW
            </p>
            <h1 style={{ fontFamily: "Syne, sans-serif", fontSize: 30, fontWeight: 800, color: "var(--text-primary)" }}>
              AI Interview Engine
            </h1>
          </div>
          {stage === "interview" && (
            <div className="flex items-center gap-3 px-4 py-2 rounded-xl"
              style={{ background: "rgba(139,92,246,0.12)", border: "1px solid rgba(139,92,246,0.3)" }}>
              <span className="text-xs font-mono" style={{ color: "#C4B5FD" }}>Q {qIndex} of {totalQ}</span>
              <div style={{ width: 1, height: 14, background: "var(--border-default)" }} />
              <Timer className="w-3.5 h-3.5" style={{ color: timeLeft <= 30 ? "#F43F5E" : "var(--text-muted)" }} />
              <span className="font-mono text-sm font-bold"
                style={{ color: timeLeft <= 30 ? "#F43F5E" : "var(--text-primary)", minWidth: 40 }}>
                {fmtTime(timeLeft)}
              </span>
            </div>
          )}
        </div>

        {/* ── Setup Stage ── */}
        {stage === "setup" && (
          <div className="grid lg:grid-cols-2 gap-6 items-start">
            <div className="glass-card p-6 space-y-5">
              <h2 style={{ fontFamily: "Syne, sans-serif", fontWeight: 700, color: "var(--text-primary)" }}>
                Configure Interview
              </h2>

              {/* Role Dropdown */}
              <div className="space-y-2">
                <label htmlFor="role-select" className="text-xs font-semibold uppercase tracking-widest block"
                  style={{ color: "var(--text-muted)" }}>
                  Target Role
                </label>
                <select
                  id="role-select"
                  value={role}
                  onChange={e => setRole(e.target.value)}
                  className="w-full p-3 rounded-xl text-sm appearance-none cursor-pointer"
                  style={{ background: "var(--bg-deep)", border: "1px solid var(--border-default)", color: "var(--text-primary)" }}
                >
                  {roles.map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>

              {/* Round Type */}
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-widest block"
                  style={{ color: "var(--text-muted)" }}>
                  Interview Round
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {availableRounds.map(rt => (
                    <button
                      key={rt}
                      onClick={() => setRoundType(rt)}
                      className="p-2.5 rounded-xl text-xs font-medium text-left transition-all duration-200"
                      style={{
                        background: roundType === rt ? "rgba(139,92,246,0.18)" : "var(--bg-deep)",
                        border: `1.5px solid ${roundType === rt ? "#8B5CF6" : "var(--border-default)"}`,
                        color: roundType === rt ? "#C4B5FD" : "var(--text-muted)",
                        transform: roundType === rt ? "scale(1.02)" : "scale(1)",
                      }}
                    >
                      {rt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Recruiter Persona */}
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-widest block"
                  style={{ color: "var(--text-muted)" }}>
                  Recruiter Persona
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {PERSONAS.map(p => (
                    <button
                      key={p.key}
                      onClick={() => setPersona(p.key)}
                      className="p-2.5 rounded-xl text-xs text-center transition-all duration-200"
                      style={{
                        background: persona === p.key ? "rgba(55,138,221,0.18)" : "var(--bg-deep)",
                        border: `1.5px solid ${persona === p.key ? "#378ADD" : "var(--border-default)"}`,
                        color: persona === p.key ? "#60A5FA" : "var(--text-muted)",
                        transform: persona === p.key ? "scale(1.03)" : "scale(1)",
                      }}
                    >
                      <span className="block text-sm mb-0.5">{p.icon}</span>
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Summary pill */}
              <div className="rounded-xl px-4 py-3 text-xs"
                style={{ background: "rgba(139,92,246,0.08)", border: "1px solid rgba(139,92,246,0.2)", color: "var(--text-muted)" }}>
                📋 <strong style={{ color: "var(--text-primary)" }}>{role}</strong>
                {" · "}{roundType}
                {" · "}{PERSONAS.find(p => p.key === persona)?.label} interviewer
              </div>

              <button
                id="start-interview-btn"
                onClick={startInterview}
                disabled={starting}
                className="glow-btn glow-btn-primary w-full justify-center"
              >
                {starting ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                    Starting…
                  </span>
                ) : (
                  <><Zap className="w-4 h-4" /> Start Interview</>
                )}
              </button>
            </div>
            <InterviewAvatar3D state="idle" />
          </div>
        )}

        {/* ── Interview Stage ── */}
        {stage === "interview" && currentQ && (
          <div className="grid lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <InterviewAvatar3D state={avatarState} />
            </div>
            <div className="space-y-4">
              {/* Question */}
              <div className="glass-card p-5">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs font-mono px-2 py-0.5 rounded"
                    style={{ background: "rgba(139,92,246,0.2)", color: "#C4B5FD" }}>
                    Q{currentQ.sequence ?? qIndex}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded"
                    style={{ background: "rgba(55,138,221,0.15)", color: "#60A5FA" }}>
                    {roundType}
                  </span>
                </div>
                <p style={{ color: "var(--text-primary)", lineHeight: 1.75, fontSize: 16 }}>
                  {currentQ.text}
                </p>
              </div>

              {/* Feedback */}
              {feedback && (
                <div className="glass-card p-4 border-l-2"
                  style={{ borderColor: score && score >= 70 ? "#378ADD" : "#F59E0B" }}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-mono" style={{ color: "var(--text-muted)" }}>FEEDBACK</span>
                    <span style={{ fontFamily: "Syne, sans-serif", fontWeight: 700, color: score && score >= 70 ? "#60A5FA" : "#FCD34D" }}>
                      {score}/100
                    </span>
                  </div>
                  <p className="text-sm" style={{ color: "var(--text-muted)" }}>{feedback}</p>
                </div>
              )}

              {/* Answer Input */}
              <div className="glass-card p-4">
                <textarea
                  value={answer}
                  onChange={e => setAnswer(e.target.value)}
                  rows={5}
                  placeholder="Type your answer here…"
                  className="w-full outline-none resize-none text-sm custom-scrollbar"
                  style={{ background: "transparent", color: "var(--text-primary)", fontFamily: "DM Sans, sans-serif" }}
                />
                <div className="flex gap-3 mt-3">
                  <button 
                    onClick={toggleVoice}
                    className="glow-btn text-sm" 
                    style={{ 
                      opacity: 1, 
                      borderColor: isListening ? "#F43F5E" : "var(--border-default)",
                      color: isListening ? "#F43F5E" : "inherit"
                    }}
                  >
                    <Mic className={`w-4 h-4 ${isListening ? 'animate-pulse' : ''}`} /> 
                    {isListening ? "Stop" : "Voice"}
                  </button>
                  <button
                    onClick={submitAnswer}
                    disabled={!answer.trim()}
                    className="glow-btn glow-btn-primary text-sm flex-1 justify-center"
                    style={{ opacity: !answer.trim() ? 0.5 : 1 }}
                  >
                    Submit <Send className="w-4 h-4" />
                  </button>
                  <button onClick={skipQuestion} className="glow-btn text-sm" style={{ opacity: 0.6 }}>
                    Skip <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Report Stage ── */}
        {stage === "report" && report && (
          <div className="space-y-6">
            <div className="glass-card p-6">
              <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
                <div>
                  <h2 style={{ fontFamily: "Syne, sans-serif", fontSize: 22, fontWeight: 800, color: "var(--text-primary)" }}>
                    Interview Complete — {report.overall_score}/100
                  </h2>
                  <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                    {role} · {roundType} · {PERSONAS.find(p => p.key === persona)?.label}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => window.print()} className="glow-btn text-sm">
                    <Download className="w-4 h-4" /> Download PDF
                  </button>
                  {interviewId && (
                    <button onClick={() => router.push(`/interview-replay?id=${interviewId}`)} className="glow-btn text-sm">
                      Open Replay
                    </button>
                  )}
                  <button onClick={resetInterview} className="glow-btn text-sm">New Interview</button>
                </div>
              </div>

              <div className="grid lg:grid-cols-2 gap-6">
                <div className="flex flex-col items-center">
                  <ScoreRing3D scores={{
                    relevance:    Math.min(10, (report.overall_score / 100) * 10 + 0.2),
                    accuracy:     Math.min(10, (report.overall_score / 100) * 10),
                    clarity:      Math.min(10, (report.overall_score / 100) * 10 + 0.5),
                    completeness: Math.min(10, (report.overall_score / 100) * 10 - 0.5),
                  }} />
                  {/* Dimension bars from last answer */}
                  <div className="w-full mt-4 space-y-2">
                    {[
                      { label: "Relevance",    color: "#378ADD" },
                      { label: "Accuracy",     color: "#378ADD" },
                      { label: "Clarity",      color: "#8B5CF6" },
                      { label: "Completeness", color: "#F59E0B" },
                    ].map(d => {
                      const val = Math.round((report.overall_score / 100) * 10 * 10) / 10;
                      return (
                        <div key={d.label} className="flex items-center gap-3">
                          <span className="text-xs w-24 flex-shrink-0" style={{ color: "var(--text-muted)" }}>{d.label}</span>
                          <div className="flex-1 h-1.5 rounded-full" style={{ background: "var(--border-default)" }}>
                            <div className="h-full rounded-full" style={{ width: `${val * 10}%`, background: d.color }} />
                          </div>
                          <span className="text-xs font-bold w-8 text-right flex-shrink-0" style={{ color: d.color }}>{val}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Coaching tips */}
                <div className="space-y-3">
                  <h3 style={{ fontFamily: "Syne, sans-serif", fontWeight: 700, color: "#F59E0B" }}>Coaching Tips</h3>
                  {(report.coaching_tips || []).map((tip: string, i: number) => (
                    <div key={i} className="flex items-start gap-3 p-3 rounded-xl"
                      style={{ background: "var(--bg-deep)", border: "1px solid var(--border-default)" }}>
                      <span style={{ color: "#F59E0B", fontWeight: 700 }}>{i + 1}.</span>
                      <p className="text-sm" style={{ color: "var(--text-muted)" }}>{tip}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Q&A Accordion */}
            <div className="glass-card p-5">
              <h3 style={{ fontFamily: "Syne, sans-serif", fontWeight: 700, color: "var(--text-primary)", marginBottom: 16 }}>
                Question Analysis
              </h3>
              <div className="space-y-3">
                {(report.questions || []).map((q: any, i: number) => (
                  <div key={i} className="p-4 rounded-xl"
                    style={{ background: "var(--bg-deep)", border: "1px solid var(--border-default)" }}>
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono" style={{ color: "var(--text-muted)" }}>Q{i + 1}</span>
                        <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{q.text}</p>
                      </div>
                      <span style={{
                        fontFamily: "Syne, sans-serif", fontWeight: 700,
                        color: q.score >= 70 ? "#60A5FA" : "#FCD34D",
                        minWidth: 52, textAlign: "right", flexShrink: 0, fontSize: 13,
                      }}>
                        {q.score}/100
                      </span>
                    </div>
                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>{q.feedback}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
