"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import DashboardLayout from "@/components/DashboardLayout";
import { interviewApi } from "@/lib/api";
import { Search, RotateCcw } from "lucide-react";

export default function InterviewReplayPage() {
  const { getToken } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const queryInterviewId = params.get("id") || "";
  const [interviewId, setInterviewId] = useState(queryInterviewId);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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

  const handleLoad = async () => {
    const id = interviewId.trim();
    const nextUrl = id ? `${pathname}?id=${encodeURIComponent(id)}` : pathname;
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
        <div>
          <p className="text-xs font-mono" style={{ color: "#8B5CF6", letterSpacing: "0.15em" }}>SYSTEM / INTERVIEW REPLAY</p>
          <h1 style={{ fontFamily: "Syne, sans-serif", fontSize: 30, fontWeight: 800, color: "var(--text-primary)" }}>Interview Replay</h1>
        </div>

        <div className="glass-card p-5 space-y-3">
          <p className="text-xs font-mono" style={{ color: "var(--text-muted)", letterSpacing: "0.1em" }}>
            LOAD INTERVIEW REPLAY
          </p>
          <div className="flex gap-2 flex-wrap">
            <input
              value={interviewId}
              onChange={(e) => setInterviewId(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleLoad(); }}
              placeholder="Enter interview ID"
              className="flex-1 min-w-[280px] p-3 rounded-xl text-sm outline-none"
              style={{ background: "var(--bg-deep)", border: "1px solid var(--border-default)", color: "var(--text-primary)" }}
            />
            <button onClick={handleLoad} disabled={loading} className="glow-btn glow-btn-primary text-sm py-2 px-4">
              <Search className="w-4 h-4" />
              {loading ? "Loading..." : "Load Replay"}
            </button>
            <button onClick={reset} className="glow-btn text-sm py-2 px-4">
              <RotateCcw className="w-4 h-4" /> Reset
            </button>
          </div>
          {!queryInterviewId && !data && !error && (
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              Tip: Paste an interview ID from your completed mock interview report.
            </p>
          )}
        </div>

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
