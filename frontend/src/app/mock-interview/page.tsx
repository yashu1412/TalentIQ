"use client";

import { useState, useEffect, useRef } from "react";
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

const QUESTION_TIME_LIMIT = 120; // seconds

export default function MockInterviewPage() {
  const { getToken } = useAuth();
  const [stage, setStage] = useState<Stage>("setup");
  const [interviewType, setInterviewType] = useState("technical");
  const [difficulty, setDifficulty] = useState("medium");
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
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Timer
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

  const fmtTime = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  const startInterview = async () => {
    setAvatarState("thinking");
    try {
      const token = await getToken();
      const resp = await axios.post(`${API}/interviews/start`, { type: interviewType, mode: "text", difficulty }, { headers: { Authorization: `Bearer ${token}` } });
      setInterviewId(resp.data.interview_id);
      setCurrentQ(resp.data.first_question);
      setTotalQ(resp.data.total_questions ?? 8);
      setQIndex(1);
      setStage("interview");
      setAvatarState("speaking");
    } catch { setAvatarState("idle"); }
  };

  const submitAnswer = async () => {
    if (!interviewId || !currentQ || !answer.trim()) return;
    setAvatarState("thinking");
    if (timerRef.current) clearInterval(timerRef.current);
    try {
      const token = await getToken();
      const headers = { Authorization: `Bearer ${token}` };
      const resp = await axios.post(`${API}/interviews/${interviewId}/answer`, {
        question_id: currentQ.id,
        answer_text: answer,
      }, { headers });
      setFeedback(resp.data.feedback);
      setScore(resp.data.score);
      if (resp.data.finished || !resp.data.next_question) {
        const finish = await axios.post(`${API}/interviews/${interviewId}/finish`, {}, { headers });
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
    await submitAnswer();
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
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <p className="text-xs font-mono" style={{ color: "#8B5CF6", letterSpacing: "0.15em" }}>SYSTEM / MOCK INTERVIEW</p>
            <h1 style={{ fontFamily: "Syne, sans-serif", fontSize: 30, fontWeight: 800, color: "#FFFFFF" }}>AI Interview Engine</h1>
          </div>
          {stage === "interview" && (
            <div className="flex items-center gap-3 px-4 py-2 rounded-xl" style={{ background: "rgba(139,92,246,0.12)", border: "1px solid rgba(139,92,246,0.3)" }}>
              <span className="text-xs font-mono" style={{ color: "#C4B5FD" }}>Q {qIndex} of {totalQ}</span>
              <div style={{ width: 1, height: 14, background: "#262626" }} />
              <Timer className="w-3.5 h-3.5" style={{ color: timeLeft <= 30 ? "#F43F5E" : "#71717a" }} />
              <span className="font-mono text-sm font-bold" style={{ color: timeLeft <= 30 ? "#F43F5E" : "#FFFFFF", minWidth: 40 }}>
                {fmtTime(timeLeft)}
              </span>
            </div>
          )}
        </div>

        {/* Setup Stage */}
        {stage === "setup" && (
          <div className="grid lg:grid-cols-2 gap-6 items-start">
            <div className="glass-card p-6 space-y-5">
              <h2 style={{ fontFamily: "Syne, sans-serif", fontWeight: 700, color: "#FFFFFF" }}>Configure Interview</h2>
              <div>
                <label className="text-xs mb-2 block" style={{ color: "#A1A1AA" }}>Interview Type</label>
                <div className="grid grid-cols-2 gap-2">
                  {["hr", "technical", "coding", "system_design"].map(t => (
                    <button key={t} onClick={() => setInterviewType(t)}
                      className="p-3 rounded-xl text-sm capitalize text-left transition-all"
                      style={{
                        background: interviewType === t ? "rgba(139,92,246,0.2)" : "rgba(10,10,10,0.6)",
                        border: `1px solid ${interviewType === t ? "#8B5CF6" : "#262626"}`,
                        color: interviewType === t ? "#C4B5FD" : "#71717a",
                      }}
                    >{t.replace("_", " ")}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs mb-2 block" style={{ color: "#A1A1AA" }}>Difficulty</label>
                <div className="flex gap-2">
                  {["easy", "medium", "hard"].map(d => (
                    <button key={d} onClick={() => setDifficulty(d)}
                      className="flex-1 p-2.5 rounded-xl text-sm capitalize transition-all"
                      style={{
                        background: difficulty === d ? "rgba(55,138,221,0.2)" : "rgba(10,10,10,0.6)",
                        border: `1px solid ${difficulty === d ? "#378ADD" : "#262626"}`,
                        color: difficulty === d ? "#60A5FA" : "#71717a",
                      }}
                    >{d}</button>
                  ))}
                </div>
              </div>
              <button onClick={startInterview} className="glow-btn glow-btn-primary w-full justify-center">
                <Zap className="w-4 h-4" /> Start Interview
              </button>
            </div>
            <InterviewAvatar3D state="idle" />
          </div>
        )}

        {/* Interview Stage */}
        {stage === "interview" && currentQ && (
          <div className="grid lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <InterviewAvatar3D state={avatarState} />
            </div>
            <div className="space-y-4">
              {/* Question */}
              <div className="glass-card p-5">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs font-mono px-2 py-0.5 rounded" style={{ background: "rgba(139,92,246,0.2)", color: "#C4B5FD" }}>
                    Q{currentQ.sequence ?? qIndex}
                  </span>
                  {currentQ.difficulty && (
                    <span className="text-xs px-2 py-0.5 rounded capitalize" style={{ background: "rgba(55,138,221,0.15)", color: "#60A5FA" }}>
                      {currentQ.difficulty}
                    </span>
                  )}
                </div>
                <p style={{ color: "#FFFFFF", lineHeight: 1.75, fontSize: 16 }}>{currentQ.text}</p>
              </div>

              {/* Feedback */}
              {feedback && (
                <div className="glass-card p-4 border-l-2" style={{ borderColor: score && score >= 70 ? "#378ADD" : "#F59E0B" }}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-mono" style={{ color: "#A1A1AA" }}>FEEDBACK</span>
                    <span style={{ fontFamily: "Syne, sans-serif", fontWeight: 700, color: score && score >= 70 ? "#60A5FA" : "#FCD34D" }}>
                      {score}/100
                    </span>
                  </div>
                  <p className="text-sm" style={{ color: "#A1A1AA" }}>{feedback}</p>
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
                  style={{ background: "transparent", color: "#FFFFFF", fontFamily: "DM Sans, sans-serif" }}
                />
                <div className="flex gap-3 mt-3">
                  <button className="glow-btn text-sm" style={{ opacity: 0.5 }}>
                    <Mic className="w-4 h-4" /> Voice
                  </button>
                  <button onClick={submitAnswer} disabled={!answer.trim()}
                    className="glow-btn glow-btn-primary text-sm flex-1 justify-center"
                    style={{ opacity: !answer.trim() ? 0.5 : 1 }}>
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

        {/* Report Stage */}
        {stage === "report" && report && (
          <div className="space-y-6">
            <div className="glass-card p-6">
              <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
                <h2 style={{ fontFamily: "Syne, sans-serif", fontSize: 22, fontWeight: 800, color: "#FFFFFF" }}>
                  Interview Complete — {report.overall_score}/100
                </h2>
                <div className="flex gap-2">
                  <button onClick={() => window.print()} className="glow-btn text-sm">
                    <Download className="w-4 h-4" /> Download PDF
                  </button>
                  <button onClick={resetInterview} className="glow-btn text-sm">
                    New Interview
                  </button>
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
                  {/* Dimension bars */}
                  <div className="w-full mt-4 space-y-2">
                    {[
                      { label: "Relevance",    color: "#378ADD", val: 8.2 },
                      { label: "Accuracy",     color: "#378ADD", val: 7.4 },
                      { label: "Clarity",      color: "#8B5CF6", val: 9.0 },
                      { label: "Completeness", color: "#F59E0B", val: 6.9 },
                    ].map(d => (
                      <div key={d.label} className="flex items-center gap-3">
                        <span className="text-xs w-24 flex-shrink-0" style={{ color: "#71717a" }}>{d.label}</span>
                        <div className="flex-1 h-1.5 rounded-full" style={{ background: "#161616" }}>
                          <div className="h-full rounded-full" style={{ width: `${d.val * 10}%`, background: d.color }} />
                        </div>
                        <span className="text-xs font-bold w-8 text-right flex-shrink-0" style={{ color: d.color }}>{d.val}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Coaching tips */}
                <div className="space-y-3">
                  <h3 style={{ fontFamily: "Syne, sans-serif", fontWeight: 700, color: "#F59E0B" }}>Coaching Tips</h3>
                  {(report.coaching_tips || []).map((tip: string, i: number) => (
                    <div key={i} className="flex items-start gap-3 p-3 rounded-xl" style={{ background: "rgba(10,10,10,0.6)" }}>
                      <span style={{ color: "#F59E0B", fontWeight: 700 }}>{i + 1}.</span>
                      <p className="text-sm" style={{ color: "#A1A1AA" }}>{tip}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Q&A Accordion */}
            <div className="glass-card p-5">
              <h3 style={{ fontFamily: "Syne, sans-serif", fontWeight: 700, color: "#FFFFFF", marginBottom: 16 }}>Question Analysis</h3>
              <div className="space-y-3">
                {(report.questions || []).map((q: any, i: number) => (
                  <div key={i} className="p-4 rounded-xl" style={{ background: "rgba(10,10,10,0.6)" }}>
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono" style={{ color: "#52525b" }}>Q{i + 1}</span>
                        <p className="text-sm font-medium" style={{ color: "#FFFFFF" }}>{q.text}</p>
                      </div>
                      <span style={{ fontFamily: "Syne, sans-serif", fontWeight: 700, color: q.score >= 70 ? "#60A5FA" : "#FCD34D", minWidth: 52, textAlign: "right", flexShrink: 0, fontSize: 13 }}>
                        {q.score}/100
                      </span>
                    </div>
                    <p className="text-xs" style={{ color: "#71717a" }}>{q.feedback}</p>
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
