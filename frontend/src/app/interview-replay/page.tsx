"use client";

import { useEffect, useState, Suspense } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import DashboardLayout from "@/components/DashboardLayout";
import { interviewApi } from "@/lib/api";
import { Search, RotateCcw } from "lucide-react";

function InterviewReplayContent() {
  const { getToken } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const queryInterviewId = params.get("id") || "";
  const [interviewId, setInterviewId] = useState(queryInterviewId);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [interviews, setInterviews] = useState<any[]>([]);

  useEffect(() => {
    const loadList = async () => {
      try {
        const token = await getToken();
        const resp = await interviewApi.list(token || "");
        setInterviews(resp.data.interviews || []);
      } catch (err) {
        console.error("Failed to load past interviews", err);
      }
    };
    loadList();
  }, [getToken]);

  const loadReplay = async (id: string) => {
    if (!id.trim()) {
      setError("Enter an interview ID to view replay.");
      setData(null);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const token = await getToken();
      const resp = await interviewApi.replay(id.trim(), token || "");
      setData(resp.data);
    } catch {
      setData(null);
      setError("Replay unavailable for this ID. Complete an interview and try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setInterviewId(queryInterviewId);
    if (queryInterviewId) loadReplay(queryInterviewId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryInterviewId]);

  const handleLoad = async (overrideId?: string) => {
    const id = (overrideId || interviewId).trim();
    if (!id) return;
    setInterviewId(id);
    const nextUrl = `${pathname}?id=${encodeURIComponent(id)}`;
    router.replace(nextUrl);
    await loadReplay(id);
  };

  const reset = () => {
    setInterviewId("");
    setData(null);
    setError("");
    router.replace(pathname);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-xs font-mono" style={{ color: "#8B5CF6", letterSpacing: "0.15em" }}>SYSTEM / INTERVIEW REPLAY</p>
            <h1 style={{ fontFamily: "Syne, sans-serif", fontSize: 30, fontWeight: 800, color: "var(--text-primary)" }}>Interview Replay</h1>
          </div>
          {data && (
             <button onClick={reset} className="glow-btn text-sm py-2 px-4">
               <RotateCcw className="w-4 h-4" /> Reset
             </button>
          )}
        </div>

        {!data && interviews.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Your Past Interviews</h3>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {interviews.map(inv => (
                <button 
                  key={inv.id} 
                  onClick={() => handleLoad(inv.id)}
                  className="p-4 rounded-xl text-left transition-all hover:border-[#378ADD]"
                  style={{ background: "var(--bg-deep)", border: "1px solid var(--border-default)" }}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-semibold text-[var(--text-primary)] capitalize">{inv.type} Interview</span>
                    <span className="text-xs font-mono text-[#378ADD]">{inv.overall_score ?? 0}/100</span>
                  </div>
                  <div className="text-xs text-[var(--text-muted)]">
                    Persona: {inv.persona} • {inv.created_at ? new Date(inv.created_at).toLocaleDateString() : 'Unknown Date'}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {error && <div className="glass-card p-6 text-sm" style={{ color: "#be123c" }}>{error}</div>}
        {data && (
          <div className="glass-card p-5 space-y-4">
            <div className="flex gap-4 text-sm flex-wrap" style={{ color: "var(--text-muted)" }}>
              <span>Interview ID: <strong style={{ color: "var(--text-primary)" }}>{data.interview_id}</strong></span>
              <span>Persona: <strong style={{ color: "var(--text-primary)" }}>{data.persona}</strong></span>
              <span>Overall: <strong style={{ color: "var(--text-primary)" }}>{data.overall_score ?? 0}/100</strong></span>
            </div>
            {(data.timeline || []).length === 0 ? (
              <div className="rounded-xl p-4 text-sm" style={{ background: "var(--bg-deep)", border: "1px solid var(--border-default)", color: "var(--text-muted)" }}>
                No timeline found for this replay.
              </div>
            ) : (
              <div className="space-y-3">
                {(data.timeline || []).map((step: any) => (
                  <div key={step.sequence} className="rounded-xl p-3" style={{ background: "var(--bg-deep)", border: "1px solid var(--border-default)" }}>
                    <p className="text-xs mb-1" style={{ color: "#2563eb" }}>
                      Q{step.sequence} · Score {step.score} · Delta {step.delta >= 0 ? `+${step.delta}` : step.delta}
                    </p>
                    <p className="text-sm mb-2" style={{ color: "var(--text-primary)" }}>{step.question}</p>
                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>{step.answer || "No answer submitted."}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

export default function InterviewReplayPage() {
  return (
    <Suspense fallback={<DashboardLayout><div className="p-8 text-center text-sm font-mono" style={{ color: "var(--text-muted)" }}>Loading replay...</div></DashboardLayout>}>
      <InterviewReplayContent />
    </Suspense>
  );
}
