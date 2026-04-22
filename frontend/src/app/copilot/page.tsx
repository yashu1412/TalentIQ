"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import DashboardLayout from "@/components/DashboardLayout";
import { Bot, Send, Sparkles, RotateCcw } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { copilotApi } from "@/lib/api";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/v1";
type Message = { role: "user" | "assistant"; content: string; intent?: string };

const INTENT_MAP: Record<string, { label: string; color: string }> = {
  resume_improve:  { label: "Resume Improve",  color: "#378ADD" },
  cover_letter:    { label: "Cover Letter",    color: "#8B5CF6" },
  interview_prep:  { label: "Interview Prep",  color: "#F59E0B" },
  roadmap:         { label: "Roadmap",         color: "#378ADD" },
  linkedin_summary:{ label: "LinkedIn",        color: "#0EA5E9" },
  networking_message:{ label: "Networking",    color: "#14B8A6" },
  negotiation_script:{ label: "Negotiation",   color: "#F59E0B" },
  company_prep:    { label: "Company Prep",    color: "#8B5CF6" },
  general:         { label: "Mentor Chat",     color: "#60A5FA" },
};

const QUICK_PROMPTS = [
  "Improve my resume experience section",
  "Write me a cover letter for a senior engineer role",
  "Create a 12-week learning roadmap for ML Engineer",
  "What are my biggest skill gaps?",
  "How should I answer 'Tell me about yourself'?",
  "Write a concise LinkedIn summary from my resume",
  "Draft a referral request DM for a product company",
  "Create a salary negotiation script for an offer call",
  "Prepare me for a company-specific frontend interview",
];

const STORAGE_KEY = "talentiq_copilot_messages";

const DEFAULT_MSG: Message = {
  role: "assistant",
  content: "👋 Hey! I'm your TalentIQ Career Copilot. Ask me to improve your resume, generate cover letters, create roadmaps, or prepare for interviews.",
  intent: "general",
};

function CopilotInner() {
  const searchParams = useSearchParams();
  const { getToken } = useAuth();
  const contextParam = searchParams.get("context");

  const [messages, setMessages] = useState<Message[]>(() => {
    if (typeof window === "undefined") return [DEFAULT_MSG];
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [DEFAULT_MSG];
    } catch { return [DEFAULT_MSG]; }
  });
  const [input, setInput] = useState(contextParam === "cover_letter" ? "Write me a cover letter for my resume" : contextParam === "resume" ? "Improve my resume's experience section" : "");
  const [streaming, setStreaming] = useState(false);
  const [portfolioInput, setPortfolioInput] = useState("");
  const [portfolioEvaluation, setPortfolioEvaluation] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  // Persist messages to localStorage whenever they change
  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(messages)); } catch {}
  }, [messages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (text?: string) => {
    const msg = text || input;
    if (!msg.trim() || streaming) return;
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: msg }]);
    setStreaming(true);

    try {
      const token = await getToken();
      const resp = await fetch(`${API}/copilot/chat`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}` 
        },
        body: JSON.stringify({ message: msg }),
      });
      if (!resp.body) throw new Error("No stream");
      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let full = "";
      let detectedIntent = "general";

      setMessages(prev => [...prev, { role: "assistant", content: "", intent: detectedIntent }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        for (const line of chunk.split("\n")) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (data === "[DONE]") break;
            try {
              const parsed = JSON.parse(data);
              if (parsed.delta) {
                full += parsed.delta;
                if (parsed.intent) detectedIntent = parsed.intent;
                setMessages(prev => {
                  const updated = [...prev];
                  updated[updated.length - 1] = { role: "assistant", content: full, intent: detectedIntent };
                  return updated;
                });
              }
            } catch {}
          }
        }
      }
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "Sorry, I encountered an error. Please try again.", intent: "general" }]);
    } finally {
      setStreaming(false);
    }
  };

  const clearChat = () => {
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
    setMessages([{ role: "assistant", content: "Chat cleared. How can I help you?", intent: "general" }]);
  };

  const savePortfolioArtifact = async () => {
    if (!portfolioInput.trim()) return;
    const token = await getToken();
    await copilotApi.ingestPortfolio(portfolioInput, "copilot_manual", token || "");
    setPortfolioInput("");
  };

  const runPortfolioEvaluation = async () => {
    const token = await getToken();
    const resp = await copilotApi.evaluatePortfolio("Software Engineer", token || "");
    setPortfolioEvaluation(resp.data?.evaluation || "");
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col animate-fade-in" style={{ height: "calc(100vh - 120px)" }}>
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <div>
            <p className="text-xs font-mono" style={{ color: "#378ADD", letterSpacing: "0.15em" }}>SYSTEM / AI COPILOT</p>
            <h1 style={{ fontFamily: "Syne, sans-serif", fontSize: 30, fontWeight: 800, color: "var(--text-primary)" }}>Career Copilot</h1>
          </div>
          <button onClick={clearChat} className="glow-btn text-sm py-2 px-4">
            <RotateCcw className="w-3.5 h-3.5" /> Clear Chat
          </button>
        </div>

        {/* Chat window */}
        <div className="flex-1 glass-card overflow-hidden flex flex-col min-h-0">
          {/* Header bar */}
          <div className="flex items-center gap-3 px-5 py-4" style={{ borderBottom: "1px solid var(--border-default)", flexShrink: 0 }}>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(55,138,221,0.15)", border: "1px solid rgba(55,138,221,0.3)" }}>
              <Bot className="w-4 h-4" style={{ color: "#378ADD" }} />
            </div>
            <div>
              <p style={{ fontWeight: 700, color: "var(--text-primary)", fontSize: 14 }}>TalentIQ AI</p>
              <p className="text-xs" style={{ color: streaming ? "#60A5FA" : "var(--text-muted)" }}>
                {streaming ? "Streaming response…" : "Online · Powered by GPT-4o"}
              </p>
            </div>
          </div>

          <div className="px-5 py-3 space-y-2" style={{ borderTop: "1px solid var(--border-default)", flexShrink: 0 }}>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>Portfolio Evaluator (RAG Context)</p>
            <div className="flex gap-2">
              <input
                value={portfolioInput}
                onChange={(e) => setPortfolioInput(e.target.value)}
                placeholder="Paste project summary, portfolio bullet, or GitHub readme excerpt"
                className="flex-1 rounded-lg px-3 py-2 text-xs"
                style={{ background: "var(--bg-deep)", border: "1px solid var(--border-default)", color: "var(--text-primary)" }}
              />
              <button onClick={savePortfolioArtifact} className="glow-btn text-xs py-2 px-3">Add</button>
              <button onClick={runPortfolioEvaluation} className="glow-btn text-xs py-2 px-3">Evaluate</button>
            </div>
            {portfolioEvaluation && (
              <p className="text-xs whitespace-pre-wrap" style={{ color: "var(--text-muted)" }}>{portfolioEvaluation}</p>
            )}
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar">
            {messages.map((m, i) => {
              const intentInfo = m.intent ? INTENT_MAP[m.intent] : null;
              return (
                <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"} gap-2`}>
                  {m.role === "assistant" && (
                    <div className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center mt-1" style={{ background: "rgba(55,138,221,0.15)" }}>
                      <Sparkles className="w-3.5 h-3.5" style={{ color: "#378ADD" }} />
                    </div>
                  )}
                  <div className={`max-w-[75%] space-y-1.5`}>
                    {m.role === "assistant" && intentInfo && (
                      <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: `${intentInfo.color}20`, color: intentInfo.color, border: `1px solid ${intentInfo.color}40` }}>
                        {intentInfo.label}
                      </span>
                    )}
                    <div
                      className="px-4 py-3 text-sm leading-relaxed"
                      style={m.role === "user"
                        ? { background: "rgba(55,138,221,0.16)", border: "1px solid rgba(55,138,221,0.34)", color: "var(--text-primary)", borderRadius: "18px 18px 4px 18px" }
                        : { background: "var(--bg-deep)", border: "1px solid var(--border-default)", color: "var(--text-muted)", borderRadius: "18px 18px 18px 4px", overflowWrap: "anywhere" }
                      }
                    >
                      {m.role === "user" ? (
                        m.content
                      ) : (
                        <div className="space-y-2">
                          <ReactMarkdown
                            components={{
                              p: ({node, ...props}) => <p className="mb-2 last:mb-0" {...props} />,
                              ul: ({node, ...props}) => <ul className="list-disc ml-4 mb-2 space-y-1" {...props} />,
                              ol: ({node, ...props}) => <ol className="list-decimal ml-4 mb-2 space-y-1" {...props} />,
                              li: ({node, ...props}) => <li className="" {...props} />,
                              h1: ({node, ...props}) => <h1 className="text-xl font-bold mb-2 mt-4 text-[var(--text-primary)]" {...props} />,
                              h2: ({node, ...props}) => <h2 className="text-lg font-bold mb-2 mt-3 text-[var(--text-primary)]" {...props} />,
                              h3: ({node, ...props}) => <h3 className="text-base font-bold mb-2 mt-2 text-[var(--text-primary)]" {...props} />,
                              strong: ({node, ...props}) => <strong className="font-bold text-[var(--text-primary)]" {...props} />,
                              em: ({node, ...props}) => <em className="italic" {...props} />,
                              a: ({node, ...props}) => <a className="text-[#378ADD] hover:underline" {...props} />,
                              code: ({node, ...props}) => <code className="px-1.5 py-0.5 rounded text-[13px] font-mono border border-[var(--border-default)] bg-[var(--bg-primary)]" {...props} />
                            }}
                          >
                            {m.content}
                          </ReactMarkdown>
                        </div>
                      )}
                      {streaming && i === messages.length - 1 && m.role === "assistant" && (
                        <span className="inline-block w-0.5 h-4 ml-1 align-middle animate-pulse" style={{ background: "#60A5FA" }} />
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>

          {/* Quick prompts */}
          <div className="px-5 py-3" style={{ borderTop: "1px solid var(--border-default)", flexShrink: 0 }}>
            <div className="flex gap-2 overflow-x-auto pb-1 custom-scrollbar">
              {QUICK_PROMPTS.map((p, i) => (
                <button key={i} onClick={() => sendMessage(p)} disabled={streaming}
                  className="text-xs px-3 py-1.5 rounded-full whitespace-nowrap flex-shrink-0 transition-all hover:border-[#378ADD]"
                  style={{ background: "var(--bg-deep)", border: "1px solid var(--border-default)", color: "var(--text-muted)" }}>
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Input */}
          <div className="p-4" style={{ borderTop: "1px solid var(--border-default)", flexShrink: 0 }}>
            <div className="flex items-end gap-3 rounded-xl p-3" style={{ background: "var(--bg-deep)", border: "1px solid var(--border-default)" }}>
              <textarea
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                rows={2}
                placeholder="Ask about your resume, cover letters, roadmaps… (Enter to send, Shift+Enter for new line)"
                className="flex-1 outline-none resize-none text-sm custom-scrollbar"
                style={{ background: "transparent", color: "var(--text-primary)", fontFamily: "DM Sans, sans-serif" }}
              />
              <button onClick={() => sendMessage()} disabled={streaming || !input.trim()}
                className="glow-btn glow-btn-primary p-2.5 rounded-xl flex-shrink-0"
                style={{ opacity: streaming || !input.trim() ? 0.5 : 1 }}>
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default function CopilotPage() {
  return (
    <Suspense>
      <CopilotInner />
    </Suspense>
  );
}
