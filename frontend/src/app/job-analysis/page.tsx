"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import DashboardLayout from "@/components/DashboardLayout";
import dynamic from "next/dynamic";
import { Search, Briefcase, ArrowRight, Lightbulb, BookmarkPlus, FileText, Trash2 } from "lucide-react";
import axios from "axios";
import { matchApi, copilotApi } from "@/lib/api";

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
  const [atsSimulation, setAtsSimulation] = useState<any>(null);
  const [companyPrep, setCompanyPrep] = useState<string>("");
  const [aiRecommLoading, setAiRecommLoading] = useState(false);

  const parseWarnings: string[] = jobData?.parsed_json?.parse_warnings || [];
  const analysisWarning: string | undefined = matchData?.detailedAnalysis?.analysis_warning;

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
      const bestResume =
        resumes.find((r: any) => (r?.parse_status || "").toLowerCase() === "done") || resumes[0];
      if ((bestResume?.parse_status || "").toLowerCase() !== "done") {
        alert("Your latest resume is still parsing. Please wait until status is 'done' and retry.");
        setLoading(false);
        return;
      }
      const resumeId = bestResume.id;
      const matchResp = await axios.post(`${API}/matches/create`, { resume_id: resumeId, job_id: jobId }, { headers });
      const matchId = matchResp.data.match_id;
      const [match, jobDetail] = await Promise.all([
        axios.get(`${API}/matches/${matchId}`, { headers }),
        axios.get(`${API}/jobs/${jobId}`, { headers }),
      ]);
      setJobData(jobDetail.data);
      const parsedMatch = match.data;
      const parsedJob = jobDetail.data?.parsed_json || {};
      const detailedAnalysis = matchResp.data.detailed_analysis || null;
      
      // Extract data from new detailed analysis or fall back to old format
      let newMatch: any = {
        matchScore: parsedMatch.match_score || 0,
        atsScore: parsedMatch.ats_score || 0,
        recommendations: parsedMatch.recommendations || [],
        jobId,
        detailedAnalysis: detailedAnalysis,
      };

      if (detailedAnalysis) {
        // Use new comprehensive matching data
        const skillMatch = detailedAnalysis.skill_match || {};
        const mustHave = skillMatch.must_have || { matched: 0, total: 0, missing: [] };
        const niceToHave = skillMatch.nice_to_have || { matched: 0, total: 0, missing: [] };
        const bonus = skillMatch.bonus || { matched: 0, total: 0, missing: [] };
        
        // Extract matched skills from JD requirements minus missing
        const allMustHaveSkills = (parsedJob.must_have_skills || []);
        const matchedMustHave = allMustHaveSkills.filter((s: string) => 
          !(mustHave.missing || []).some((m: string) => m.toLowerCase() === s.toLowerCase())
        );
        
        const allNiceToHaveSkills = (parsedJob.nice_to_have_skills || []);
        const matchedNiceToHave = allNiceToHaveSkills.filter((s: string) => 
          !(niceToHave.missing || []).some((m: string) => m.toLowerCase() === s.toLowerCase())
        );
        
        // For 3D visualization - ensure matched is an array
        newMatch.matched = matchedMustHave.slice(0, 10);  // Limit for 3D display
        newMatch.missing = (mustHave.missing || []).slice(0, 10);
        newMatch.bonus = matchedNiceToHave.slice(0, 5);
        
        // Store breakdown data
        newMatch.toolsMissing = detailedAnalysis.tools_match?.missing || [];
        newMatch.skillBreakdown = {
          must_have: mustHave,
          nice_to_have: niceToHave,
          bonus: bonus,
        };
        newMatch.experience = detailedAnalysis.experience_match || {};
        newMatch.education = detailedAnalysis.education_match || {};
        // LLM-specific fields
        newMatch.strengths = detailedAnalysis.strengths || [];
        newMatch.summary = detailedAnalysis.summary || "";
        newMatch.recommendations = detailedAnalysis.recommendations || parsedMatch.recommendations || [];
      } else {
        // Fallback to old format
        const mustHave = parsedJob.must_have_skills || parsedJob.must_have || parsedJob.required_skills || parsedJob.skills || [];
        const niceToHave = parsedJob.nice_to_have_skills || parsedJob.nice_to_have || parsedJob.preferred_skills || parsedJob.bonus || [];
        const missingSkillsLower = (parsedMatch.missing_skills || []).map((s: string) => s.toLowerCase());
        newMatch.matched = mustHave.filter((s: string) => !missingSkillsLower.includes(s.toLowerCase()));
        newMatch.missing = parsedMatch.missing_skills || [];
        newMatch.bonus = niceToHave;
      }
      setMatchData(newMatch);
      try {
        const atsResp = await matchApi.atsSimulate(resumeId, jobId, token || "");
        setAtsSimulation(atsResp.data);
      } catch {}
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

  const generateCompanyPrep = async () => {
    if (!jobData?.company || !jobData?.title) return;
    const token = await getToken();
    const resp = await copilotApi.companyPrep(jobData.company, jobData.title, token || "");
    setCompanyPrep(resp.data?.prep || "");
  };

  const generateAiRecommendations = async () => {
    if (!matchData?.jobId) return;
    setAiRecommLoading(true);
    try {
      const token = await getToken();
      // Get match ID from API or use a derived one
      const resumesResp = await axios.get(`${API}/resumes`, { headers: { Authorization: `Bearer ${token}` } });
      const matchesResp = await axios.get(`${API}/matches/user/${token}`, { headers: { Authorization: `Bearer ${token}` } }).catch(() => ({ data: [] }));
      
      const recentMatch = matchesResp.data?.[0];
      if (!recentMatch?.id) {
        console.error("Could not find match ID");
        return;
      }
      
      const resp = await axios.post(
        `${API}/matches/${recentMatch.id}/ai-recommendations`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Update recommendations with AI-generated ones
      if (resp.data?.recommendations && matchData) {
        const updated = { ...matchData, recommendations: resp.data.recommendations };
        setMatchData(updated);
        try { localStorage.setItem(JD_KEY, JSON.stringify(updated)); } catch {}
      }
    } catch (e) {
      console.error("Failed to generate AI recommendations:", e);
    } finally {
      setAiRecommLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <div>
          <p className="text-xs font-mono" style={{ color: "#378ADD", letterSpacing: "0.15em" }}>SYSTEM / JOB MATCH</p>
          <h1 style={{ fontFamily: "Syne, sans-serif", fontSize: 30, fontWeight: 800, color: "var(--text-primary)" }}>Job Match Engine</h1>
        </div>
        {matchData && (
          <button onClick={clearAnalysis} className="glow-btn text-sm py-2 px-4" style={{ borderColor: "#F43F5E", color: "#F43F5E" }}>
            <Trash2 className="w-3.5 h-3.5" /> Clear Results
          </button>
        )}

        {/* JD Input */}
        <div className="glass-card p-5">
          <h2 className="text-sm font-semibold mb-3" style={{ color: "var(--text-muted)" }}>Paste Job Description</h2>
          <p className="text-xs mb-2" style={{ color: "var(--text-muted)" }}>
            Paste only the job description. Do not include your resume text here.
          </p>
          <textarea
            value={jdText}
            onChange={e => setJdText(e.target.value)}
            rows={6}
            placeholder="Paste a job description here to analyze compatibility with your resume…"
            className="w-full rounded-xl p-4 text-sm resize-none outline-none transition-all custom-scrollbar"
            style={{ background: "var(--bg-deep)", border: "1px solid var(--border-default)", color: "var(--text-primary)", fontFamily: "DM Sans, sans-serif" }}
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
            {parseWarnings.length > 0 && (
              <div className="glass-card p-4 border-l-2" style={{ borderLeftColor: "#F59E0B" }}>
                <h3 className="text-sm font-semibold mb-2" style={{ color: "#F59E0B" }}>
                  Parsing Warnings
                </h3>
                <ul className="space-y-1">
                  {parseWarnings.map((warning, index) => (
                    <li key={index} className="text-xs" style={{ color: "var(--text-muted)" }}>
                      - {warning}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {analysisWarning && (
              <div className="glass-card p-4 border-l-2" style={{ borderLeftColor: "#F43F5E" }}>
                <h3 className="text-sm font-semibold mb-2" style={{ color: "#F43F5E" }}>
                  Match Confidence Warning
                </h3>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>{analysisWarning}</p>
              </div>
            )}
            {/* Job Requirements Overview */}
            {jobData?.parsed_json && (
              <div className="glass-card p-4 border-l-2" style={{ borderLeftColor: "#378ADD" }}>
                <h3 className="text-sm font-semibold mb-3" style={{ color: "var(--text-primary)" }}>Job Requirements</h3>
                <div className="grid md:grid-cols-4 gap-3 text-xs">
                  {jobData.parsed_json.job_level && (
                    <div>
                      <p style={{ color: "var(--text-muted)" }}>Level</p>
                      <p className="font-semibold mt-1" style={{ color: "#378ADD" }}>{jobData.parsed_json.job_level}</p>
                    </div>
                  )}
                  {jobData.parsed_json.years_required !== null && jobData.parsed_json.years_required !== undefined && (
                    <div>
                      <p style={{ color: "var(--text-muted)" }}>Years Required</p>
                      <p className="font-semibold mt-1" style={{ color: "#378ADD" }}>{jobData.parsed_json.years_required}+ years</p>
                    </div>
                  )}
                  {jobData.parsed_json.required_education && jobData.parsed_json.required_education.length > 0 && (
                    <div>
                      <p style={{ color: "var(--text-muted)" }}>Education</p>
                      <p className="font-semibold mt-1" style={{ color: "#378ADD" }}>{jobData.parsed_json.required_education[0]}</p>
                    </div>
                  )}
                  {jobData.location && (
                    <div>
                      <p style={{ color: "var(--text-muted)" }}>Location</p>
                      <p className="font-semibold mt-1" style={{ color: "#378ADD" }}>{jobData.location}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
            {/* 3D Skill Graph */}
            <div className="glass-card overflow-hidden">
              <div className="p-4 border-b border-[var(--border-default)] flex items-center justify-between flex-wrap gap-3">
                <div>
                  <h2 style={{ fontFamily: "Syne, sans-serif", fontWeight: 700, color: "var(--text-primary)" }}>
                    {jobData?.title} {jobData?.company ? `@ ${jobData.company}` : ""}
                  </h2>
                  <div className="flex gap-6 mt-1.5 flex-wrap">
                    <span className="text-sm" style={{ color: "#60A5FA" }}>Match: <strong>{matchData.matchScore}%</strong></span>
                    <span className="text-sm" style={{ color: "#378ADD" }}>ATS: <strong>{matchData.atsScore}%</strong></span>
                    <span className="text-sm" style={{ color: "#F43F5E" }}>
                      {matchData.detailedAnalysis 
                        ? `Skills: ${matchData.skillBreakdown?.must_have?.matched}/${matchData.skillBreakdown?.must_have?.total}`
                        : `Gaps: ${matchData.missing.length}`
                      }
                    </span>
                    {matchData.experience && (
                      <span className="text-sm" style={{ color: matchData.experience.meets_requirement ? "#22C55E" : "#F59E0B" }}>
                        Experience: {matchData.experience.meets_requirement ? "✓" : "⚠"} {matchData.experience.resume_years}y / {matchData.experience.required_years}y
                      </span>
                    )}
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
                  <button onClick={() => router.push("/roadmap")} className="glow-btn text-sm py-2 px-4">
                    Skill Roadmap
                  </button>
                  <button onClick={generateCompanyPrep} className="glow-btn text-sm py-2 px-4">
                    Company Prep
                  </button>
                </div>
              </div>
              <SkillGraph3D matchData={matchData} />
            </div>

            {/* Bottom row */}
            <div className="grid md:grid-cols-2 gap-4">
              {/* Missing skills & Skill Breakdown */}
              <div className="glass-card p-5">
                <h3 className="font-semibold mb-4" style={{ color: "#F43F5E", fontFamily: "Syne, sans-serif" }}>
                  {matchData.detailedAnalysis ? "Skill Match Analysis" : "Missing Skills"} ({matchData.missing.length})
                </h3>
                {matchData.detailedAnalysis ? (
                  <div className="space-y-4">
                    {/* Must-Have Skills */}
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <p className="text-xs font-semibold" style={{ color: "#F43F5E" }}>Must-Have Skills</p>
                        <span className="text-xs px-2 py-1 rounded" style={{ background: "#F43F5E20", color: "#F43F5E" }}>
                          {matchData.skillBreakdown.must_have.matched}/{matchData.skillBreakdown.must_have.total}
                        </span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-1.5 mb-2">
                        <div 
                          className="bg-red-500 h-1.5 rounded-full transition-all" 
                          style={{ width: `${(matchData.skillBreakdown.must_have.matched / matchData.skillBreakdown.must_have.total) * 100}%` }}
                        />
                      </div>
                      {matchData.skillBreakdown.must_have.missing.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {matchData.skillBreakdown.must_have.missing.slice(0, 3).map((sk: string, i: number) => (
                            <span key={i} className="skill-badge-missing text-xs">{sk}</span>
                          ))}
                          {matchData.skillBreakdown.must_have.missing.length > 3 && (
                            <span className="text-xs" style={{ color: "var(--text-muted)" }}>+{matchData.skillBreakdown.must_have.missing.length - 3} more</span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Nice-to-Have Skills */}
                    {matchData.skillBreakdown.nice_to_have.total > 0 && (
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <p className="text-xs font-semibold" style={{ color: "#F59E0B" }}>Nice-to-Have Skills</p>
                          <span className="text-xs px-2 py-1 rounded" style={{ background: "#F59E0B20", color: "#F59E0B" }}>
                            {matchData.skillBreakdown.nice_to_have.matched}/{matchData.skillBreakdown.nice_to_have.total}
                          </span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-1.5 mb-2">
                          <div 
                            className="bg-yellow-500 h-1.5 rounded-full transition-all" 
                            style={{ width: `${(matchData.skillBreakdown.nice_to_have.matched / matchData.skillBreakdown.nice_to_have.total) * 100}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Tools/Technologies */}
                    {matchData.toolsMissing && matchData.toolsMissing.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold mb-2" style={{ color: "#378ADD" }}>Missing Tools/Tech</p>
                        <div className="flex flex-wrap gap-1">
                          {matchData.toolsMissing.slice(0, 3).map((tool: string, i: number) => (
                            <span key={i} className="skill-badge-missing text-xs">{tool}</span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Experience */}
                    {matchData.experience && (
                      <div className="pt-2 border-t border-gray-700">
                        <p className="text-xs font-semibold mb-1" style={{ color: "#378ADD" }}>Experience</p>
                        <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                          You have <strong>{matchData.experience.resume_years}</strong> years | Required: <strong>{matchData.experience.required_years}</strong> years
                          <span style={{ color: matchData.experience.meets_requirement ? "#22C55E" : "#F43F5E" }}>
                            {matchData.experience.meets_requirement ? " ✓ Meets requirement" : " ⚠ Gap: " + (matchData.experience.required_years - matchData.experience.resume_years) + " years"}
                          </span>
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <>
                    {matchData.missing.length === 0 ? (
                      <p className="text-sm" style={{ color: "var(--text-muted)" }}>No missing skills — perfect match!</p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {matchData.missing.map((sk: string, i: number) => (
                          <span key={i} className="skill-badge-missing">{sk}</span>
                        ))}
                      </div>
                    )}
                    {matchData.matched && matchData.matched.length > 0 && (
                      <div className="mt-4">
                        <p className="text-xs mb-2" style={{ color: "var(--text-muted)" }}>Matched Skills</p>
                        <div className="flex flex-wrap gap-2">
                          {matchData.matched.map((sk: string, i: number) => (
                            <span key={i} className="skill-badge-matched">{sk}</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Recommendations */}
              <div className="glass-card p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold flex items-center gap-2" style={{ color: "#F59E0B", fontFamily: "Syne, sans-serif" }}>
                    <Lightbulb className="w-4 h-4" /> Recommendations
                  </h3>
                  <button
                    onClick={generateAiRecommendations}
                    disabled={aiRecommLoading}
                    className="glow-btn text-xs py-1 px-2"
                    style={{
                      borderColor: "#8B5CF6",
                      color: "#A78BFA",
                      opacity: aiRecommLoading ? 0.6 : 1,
                    }}
                  >
                    {aiRecommLoading ? "Generating AI..." : "✨ AI Insights"}
                  </button>
                </div>
                {matchData.recommendations.length === 0 ? (
                  <p className="text-sm" style={{ color: "var(--text-muted)" }}>No specific recommendations. Click "✨ AI Insights" to generate personalized recommendations.</p>
                ) : (
                  <div className="space-y-3">
                    {matchData.recommendations.slice(0, 5).map((rec: any, i: number) => {
                      const isHighPriority = rec.priority === "high" || rec.priority === "critical";
                      const categoryLabel = rec.category === "must_have" ? "Critical" : 
                                          rec.category === "nice_to_have" ? "Preferred" :
                                          rec.category === "experience" ? "Experience Gap" : "Skill";
                      return (
                        <div 
                          key={i} 
                          className="flex items-start gap-3 p-3 rounded-lg transition-all hover:border-opacity-100"
                          style={{ 
                            background: isHighPriority ? "#F43F5E20" : "var(--bg-deep)", 
                            border: `1px solid ${isHighPriority ? "#F43F5E" : "var(--border-default)"}`,
                          }}
                        >
                          <span className="text-xs font-bold mt-0.5 flex-shrink-0" style={{ color: isHighPriority ? "#F43F5E" : "#F59E0B" }}>
                            {isHighPriority ? "!" : i + 1}
                          </span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{rec.skill}</p>
                              <span className="text-xs px-1.5 py-0.5 rounded" style={{ 
                                background: isHighPriority ? "#F43F5E20" : "#F59E0B20",
                                color: isHighPriority ? "#F43F5E" : "#F59E0B"
                              }}>
                                {rec.category ? categoryLabel : rec.priority}
                              </span>
                              {rec.timeline && (
                                <span className="text-xs px-1.5 py-0.5 rounded" style={{ 
                                  background: "#378ADD20",
                                  color: "#378ADD"
                                }}>
                                  {rec.timeline}
                                </span>
                              )}
                            </div>
                            {rec.reason && (
                              <p className="text-xs mt-1.5" style={{ color: "var(--text-muted)" }}>{rec.reason}</p>
                            )}
                            {rec.action && (
                              <p className="text-xs mt-1" style={{ color: "#A78BFA", fontWeight: 500 }}>→ {rec.action}</p>
                            )}
                            <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>{rec.resource || ""}</p>
                          </div>
                          <span className={`text-xs px-2 py-1 rounded flex-shrink-0 font-semibold ${isHighPriority ? "bg-red-500/20 text-red-400" : "bg-yellow-500/20 text-yellow-400"}`}>
                            {rec.priority}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
                <div className="flex gap-2 mt-4">
                  <button onClick={() => router.push("/resume")} className="glow-btn text-xs flex-1 justify-center py-2">Improve Resume</button>
                  <button onClick={generateCoverLetter} className="glow-btn text-xs flex-1 justify-center py-2">Cover Letter</button>
                </div>
              </div>
            </div>

            {/* AI Summary & Strengths */}
            {(matchData.summary || (matchData.strengths && matchData.strengths.length > 0)) && (
              <div className="glass-card p-5 border-l-2" style={{ borderLeftColor: "#8B5CF6" }}>
                {matchData.summary && (
                  <div className="mb-4">
                    <p className="text-xs font-mono mb-2" style={{ color: "#8B5CF6", letterSpacing: "0.12em" }}>AI ASSESSMENT</p>
                    <p className="text-sm leading-relaxed" style={{ color: "var(--text-primary)" }}>{matchData.summary}</p>
                  </div>
                )}
                {matchData.strengths && matchData.strengths.length > 0 && (
                  <div>
                    <p className="text-xs font-mono mb-2" style={{ color: "#22C55E", letterSpacing: "0.12em" }}>YOUR STRENGTHS FOR THIS ROLE</p>
                    <div className="flex flex-wrap gap-2">
                      {matchData.strengths.map((s: string, i: number) => (
                        <span key={i} className="skill-badge-matched text-xs">{s}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
            {(atsSimulation || companyPrep) && (
              <div className="glass-card p-5 space-y-4">
                {atsSimulation && (
                  <div>
                    <h3 className="font-semibold mb-3" style={{ color: "#378ADD", fontFamily: "Syne, sans-serif" }}>ATS Simulator - Version Comparison</h3>
                    {atsSimulation.comparison && atsSimulation.comparison.length > 0 ? (
                      <div className="space-y-2">
                        {atsSimulation.comparison.map((v: any) => (
                          <div key={v.version} className="p-3 rounded-lg" style={{ background: "var(--bg-deep)", border: "1px solid var(--border-default)" }}>
                            <div className="flex justify-between items-center">
                              <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Resume v{v.version}</span>
                              <div className="flex items-center gap-3">
                                <span className="text-sm" style={{ color: "#378ADD" }}>Match: <strong>{v.overall_match_score}%</strong></span>
                                <span className="text-sm" style={{ color: "#60A5FA" }}>ATS: <strong>{v.ats_score}%</strong></span>
                              </div>
                            </div>
                            <div className="text-xs mt-2" style={{ color: "var(--text-muted)" }}>
                              {v.matched_keywords}/{v.matched_keywords} must-have skills matched
                              {v.missing_critical > 0 && <span> • <strong>{v.missing_critical}</strong> critical skills missing</span>}
                            </div>
                            <div className="w-full bg-gray-700 rounded-full h-1.5 mt-2">
                              <div 
                                className="bg-blue-500 h-1.5 rounded-full transition-all" 
                                style={{ width: `${v.overall_match_score}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {(atsSimulation.comparison || []).map((v: any) => (
                          <span key={v.version} className="skill-badge-bonus">
                            v{v.version}: {v.ats_score}%
                          </span>
                        ))}
                      </div>
                    )}
                    {atsSimulation.best_version && (
                      <div className="mt-3 p-3 rounded-lg" style={{ background: "#22C55E20", border: "1px solid #22C55E" }}>
                        <p className="text-xs font-semibold" style={{ color: "#22C55E" }}>
                          Best Version: v{atsSimulation.best_version.version} ({atsSimulation.best_version.overall_match_score}%)
                        </p>
                      </div>
                    )}
                  </div>
                )}
                {companyPrep && (
                  <div>
                    <h3 className="font-semibold mb-2" style={{ color: "#8B5CF6", fontFamily: "Syne, sans-serif" }}>Company-Specific Prep</h3>
                    <p className="text-xs whitespace-pre-wrap" style={{ color: "var(--text-muted)", lineHeight: 1.7 }}>{companyPrep}</p>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
