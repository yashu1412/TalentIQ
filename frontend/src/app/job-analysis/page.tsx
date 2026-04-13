"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import DashboardLayout from "@/components/DashboardLayout";
import dynamic from "next/dynamic";
import { Search, Briefcase, ArrowRight, Lightbulb, BookmarkPlus, FileText, Trash2 } from "lucide-react";
import axios from "axios";

const SkillGraph3D = dynamic(() => import("@/components/3d/SkillGraph3D"), { ssr: false });

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/v1";

const JD_KEY = "talentiq_jd_data";
const JD_TEXT_KEY = "talentiq_jd_text";

export default function JobAnalysisPage() {
  const router = useRouter();
  const { getToken } = useAuth();
  const [jdText, setJdText] = useState(() => {
    if (typeof window === "undefined") return "";
    try { return localStorage.getItem(JD_TEXT_KEY) || ""; } catch { return ""; }
  });
  const [loading, setLoading] = useState(false);
  const [matchData, setMatchData] = useState<any>(() => {
    if (typeof window === "undefined") return null;
    try { const s = localStorage.getItem(JD_KEY); return s ? JSON.parse(s) : null; } catch { return null; }
  });
  const [jobData, setJobData] = useState<any>(() => {
    if (typeof window === "undefined") return null;
    try { const s = localStorage.getItem(JD_KEY + "_job"); return s ? JSON.parse(s) : null; } catch { return null; }
  });
  const [savedToTracker, setSavedToTracker] = useState(false);
  const [savingToTracker, setSavingToTracker] = useState(false);

  const clearAnalysis = () => {
    try { localStorage.removeItem(JD_KEY); localStorage.removeItem(JD_KEY + "_job"); localStorage.removeItem(JD_TEXT_KEY); } catch {}
    setMatchData(null); setJobData(null); setJdText(""); setSavedToTracker(false);
  };

  const handleAnalyze = async () => {
    if (!jdText.trim()) return;
    setLoading(true);
    setSavedToTracker(false);
    try {
      const token = await getToken();
      const headers = { Authorization: `Bearer ${token}` };

      const jobResp = await axios.post(`${API}/jobs/analyze`, { jd_text: jdText }, { headers });
      const jobId = jobResp.data.job_id;

      const resumesResp = await axios.get(`${API}/resumes`, { headers });
      const resumes = resumesResp.data;
      if (!resumes.length) {
        alert("Please upload a resume first.");
        setLoading(false);
        return;
      }
      const resumeId = resumes[0].id;
      const matchResp = await axios.post(`${API}/matches/create`, { resume_id: resumeId, job_id: jobId }, { headers });
      const matchId = matchResp.data.match_id;
      const [match, jobDetail] = await Promise.all([
        axios.get(`${API}/matches/${matchId}`, { headers }),
        axios.get(`${API}/jobs/${jobId}`, { headers }),
      ]);
      setJobData(jobDetail.data);
      const parsedMatch = match.data;
      const parsedJob = jobDetail.data?.parsed_json;
      const newMatch = {
        matched: parsedJob?.must_have?.filter((s: string) => !parsedMatch.missing_skills?.includes(s)) || [],
        missing: parsedMatch.missing_skills || [],
        bonus: parsedJob?.nice_to_have || [],
        matchScore: parsedMatch.match_score || 0,
        atsScore: parsedMatch.ats_score || 0,
        recommendations: parsedMatch.recommendations || [],
        jobId,
      };
      setMatchData(newMatch);
      try {
        localStorage.setItem(JD_KEY, JSON.stringify(newMatch));
        localStorage.setItem(JD_KEY + "_job", JSON.stringify(jobDetail.data));
        localStorage.setItem(JD_TEXT_KEY, jdText);
      } catch {}
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const saveToTracker = async () => {
    if (!matchData?.jobId) return;
    setSavingToTracker(true);
    try {
      const token = await getToken();
      await axios.post(`${API}/applications`, { job_id: matchData.jobId, status: "saved" }, { headers: { Authorization: `Bearer ${token}` } });
      setSavedToTracker(true);
    } catch (e) {
      console.error(e);
    } finally {
      setSavingToTracker(false);
    }
  };

  const generateCoverLetter = () => {
    router.push("/copilot?context=cover_letter");
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <div>
          <p className="text-xs font-mono" style={{ color: "#378ADD", letterSpacing: "0.15em" }}>SYSTEM / JOB MATCH</p>
          <h1 style={{ fontFamily: "Syne, sans-serif", fontSize: 30, fontWeight: 800, color: "#FFFFFF" }}>Job Match Engine</h1>
        </div>
        {matchData && (
          <button onClick={clearAnalysis} className="glow-btn text-sm py-2 px-4" style={{ borderColor: "#F43F5E", color: "#F43F5E" }}>
            <Trash2 className="w-3.5 h-3.5" /> Clear Results
          </button>
        )}

        {/* JD Input */}
        <div className="glass-card p-5">
          <h2 className="text-sm font-semibold mb-3" style={{ color: "#A1A1AA" }}>Paste Job Description</h2>
          <textarea
            value={jdText}
            onChange={e => setJdText(e.target.value)}
            rows={6}
            placeholder="Paste a job description here to analyze compatibility with your resume…"
            className="w-full rounded-xl p-4 text-sm resize-none outline-none transition-all custom-scrollbar"
            style={{ background: "rgba(10,10,10,0.8)", border: "1px solid #262626", color: "#FFFFFF", fontFamily: "DM Sans, sans-serif" }}
          />
          <div className="flex justify-end mt-3">
            <button
              onClick={handleAnalyze}
              disabled={loading || !jdText}
              className="glow-btn glow-btn-primary"
              style={{ opacity: loading || !jdText ? 0.55 : 1 }}
            >
              {loading ? <span className="animate-pulse">Analyzing…</span> : <><Search className="w-4 h-4" /> Analyze Match</>}
            </button>
          </div>
        </div>

        {/* Results */}
        {matchData && (
          <>
            {/* 3D Skill Graph */}
            <div className="glass-card overflow-hidden">
              <div className="p-4 border-b border-[#262626] flex items-center justify-between flex-wrap gap-3">
                <div>
                  <h2 style={{ fontFamily: "Syne, sans-serif", fontWeight: 700, color: "#FFFFFF" }}>
                    {jobData?.title} {jobData?.company ? `@ ${jobData.company}` : ""}
                  </h2>
                  <div className="flex gap-6 mt-1.5">
                    <span className="text-sm" style={{ color: "#60A5FA" }}>Match: <strong>{matchData.matchScore}%</strong></span>
                    <span className="text-sm" style={{ color: "#378ADD" }}>ATS: <strong>{matchData.atsScore}%</strong></span>
                    <span className="text-sm" style={{ color: "#F43F5E" }}>Gaps: <strong>{matchData.missing.length}</strong></span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={saveToTracker}
                    disabled={savedToTracker || savingToTracker}
                    className="glow-btn text-sm py-2 px-4"
                    style={{
                      borderColor: savedToTracker ? "#22C55E" : "#378ADD",
                      color: savedToTracker ? "#4ADE80" : "#67E8F9",
                      opacity: savingToTracker ? 0.7 : 1,
                    }}
                  >
                    <BookmarkPlus className="w-4 h-4" />
                    {savedToTracker ? "Saved!" : savingToTracker ? "Saving…" : "Save to Tracker"}
                  </button>
                  <button onClick={generateCoverLetter} className="glow-btn text-sm py-2 px-4">
                    <FileText className="w-4 h-4" /> Cover Letter <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <SkillGraph3D matchData={matchData} />
            </div>

            {/* Bottom row */}
            <div className="grid md:grid-cols-2 gap-4">
              {/* Missing skills */}
              <div className="glass-card p-5">
                <h3 className="font-semibold mb-4" style={{ color: "#F43F5E", fontFamily: "Syne, sans-serif" }}>
                  Missing Skills ({matchData.missing.length})
                </h3>
                {matchData.missing.length === 0 ? (
                  <p className="text-sm" style={{ color: "#71717a" }}>No missing skills — perfect match!</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {matchData.missing.map((sk: string, i: number) => (
                      <span key={i} className="skill-badge-missing">{sk}</span>
                    ))}
                  </div>
                )}
                {matchData.matched.length > 0 && (
                  <div className="mt-4">
                    <p className="text-xs mb-2" style={{ color: "#71717a" }}>Matched Skills</p>
                    <div className="flex flex-wrap gap-2">
                      {matchData.matched.map((sk: string, i: number) => (
                        <span key={i} className="skill-badge-matched">{sk}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Recommendations */}
              <div className="glass-card p-5">
                <h3 className="font-semibold mb-4 flex items-center gap-2" style={{ color: "#F59E0B", fontFamily: "Syne, sans-serif" }}>
                  <Lightbulb className="w-4 h-4" /> Recommendations
                </h3>
                {matchData.recommendations.length === 0 ? (
                  <p className="text-sm" style={{ color: "#71717a" }}>No specific recommendations.</p>
                ) : (
                  <div className="space-y-3">
                    {matchData.recommendations.slice(0, 4).map((rec: any, i: number) => (
                      <div key={i} className="flex items-start gap-3 p-3 rounded-lg" style={{ background: "rgba(10,10,10,0.6)" }}>
                        <span className="text-xs font-bold mt-0.5 flex-shrink-0" style={{ color: "#F59E0B" }}>{i + 1}.</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium" style={{ color: "#FFFFFF" }}>{rec.skill}</p>
                          <p className="text-xs mt-0.5" style={{ color: "#71717a" }}>{rec.resource}</p>
                        </div>
                        <span className={`text-xs px-2 py-0.5 rounded flex-shrink-0 ${rec.priority === "high" ? "skill-badge-missing" : "skill-badge-bonus"}`}>
                          {rec.priority}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex gap-2 mt-4">
                  <button onClick={() => router.push("/resume")} className="glow-btn text-xs flex-1 justify-center py-2">Improve Resume</button>
                  <button onClick={generateCoverLetter} className="glow-btn text-xs flex-1 justify-center py-2">Cover Letter</button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
