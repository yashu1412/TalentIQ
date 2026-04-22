"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import DashboardLayout from "@/components/DashboardLayout";
import { Plus, CheckCircle, Clock, XCircle, Award, Briefcase, X } from "lucide-react";
import axios from "axios";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/v1";

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  saved:      { label: "Saved",      color: "#71717a", icon: Clock         },
  applied:    { label: "Applied",    color: "#378ADD", icon: CheckCircle   },
  screening:  { label: "Screening",  color: "#F59E0B", icon: Clock         },
  interview:  { label: "Interview",  color: "#8B5CF6", icon: Briefcase     },
  offer:      { label: "Offer",      color: "#378ADD", icon: Award         },
  rejected:   { label: "Rejected",   color: "#F43F5E", icon: XCircle       },
};

export default function TrackerPage() {
  const { getToken } = useAuth();
  const [applications, setApplications] = useState<any[]>([]);
  const [timeline, setTimeline]     = useState<Record<string, any[]>>({});
  const [loading, setLoading]       = useState(true);
  const [showModal, setShowModal]   = useState(false);
  const [form, setForm]             = useState({ title: "", company: "", status: "saved", next_step: "", reminder_at: "" });
  const [saving, setSaving]         = useState(false);
  const [analytics, setAnalytics]   = useState<any>(null);

  const load = async () => {
    try {
      const token = await getToken();
      const headers = { Authorization: `Bearer ${token}` };
      const [appResp, tlResp, analyticsResp] = await Promise.all([
        axios.get(`${API}/applications`, { headers }),
        axios.get(`${API}/applications/timeline`, { headers }),
        axios.get(`${API}/applications/analytics`, { headers }),
      ]);
      setApplications(appResp.data);
      setTimeline(tlResp.data);
      setAnalytics(analyticsResp.data);
    } catch {}
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const updateStatus = async (id: string, status: string) => {
    try {
      const token = await getToken();
      await axios.patch(`${API}/applications/${id}`, { status }, { headers: { Authorization: `Bearer ${token}` } });
      setApplications(prev => prev.map(a => a.id === id ? { ...a, status } : a));
    } catch {}
  };

  const addApplication = async () => {
    if (!form.title || !form.company) return;
    setSaving(true);
    try {
      const token = await getToken();
      const headers = { Authorization: `Bearer ${token}` };
      // Create a placeholder job then application
      const jobResp = await axios.post(`${API}/jobs/analyze`, { jd_text: `${form.title} at ${form.company}` }, { headers });
      await axios.post(`${API}/applications`, {
        job_id: jobResp.data.job_id,
        title: form.title,
        company: form.company,
        status: form.status,
        next_step: form.next_step,
        reminder_at: form.reminder_at || null,
      }, { headers });
      setShowModal(false);
      setForm({ title: "", company: "", status: "saved", next_step: "", reminder_at: "" });
      await load();
    } catch {}
    finally { setSaving(false); }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">

        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <p className="text-xs font-mono" style={{ color: "#378ADD", letterSpacing: "0.15em" }}>SYSTEM / TRACKER</p>
            <h1 style={{ fontFamily: "Syne, sans-serif", fontSize: 30, fontWeight: 800, color: "var(--text-primary)" }}>Application Tracker</h1>
          </div>
          <button onClick={() => setShowModal(true)} className="glow-btn glow-btn-primary text-sm py-2 px-4">
            <Plus className="w-4 h-4" /> Add Application
          </button>
        </div>

        {/* Add Application Modal */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }}>
            <div className="glass-card p-6 w-full max-w-md animate-scale-in">
              <div className="flex items-center justify-between mb-5">
                <h2 style={{ fontFamily: "Syne, sans-serif", fontWeight: 700, color: "var(--text-primary)" }}>Add Application</h2>
                <button onClick={() => setShowModal(false)} style={{ color: "var(--text-muted)" }}><X className="w-5 h-5" /></button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-xs mb-1.5 block" style={{ color: "var(--text-muted)" }}>Job Title</label>
                  <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                    placeholder="Senior Backend Engineer"
                    className="w-full p-3 rounded-xl text-sm outline-none"
                    style={{ background: "var(--bg-deep)", border: "1px solid var(--border-default)", color: "var(--text-primary)" }} />
                </div>
                <div>
                  <label className="text-xs mb-1.5 block" style={{ color: "var(--text-muted)" }}>Company</label>
                  <input value={form.company} onChange={e => setForm(f => ({ ...f, company: e.target.value }))}
                    placeholder="Razorpay"
                    className="w-full p-3 rounded-xl text-sm outline-none"
                    style={{ background: "var(--bg-deep)", border: "1px solid var(--border-default)", color: "var(--text-primary)" }} />
                </div>
                <div>
                  <label className="text-xs mb-1.5 block" style={{ color: "var(--text-muted)" }}>Status</label>
                  <select value={form.status || "saved"} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                    className="w-full p-3 rounded-xl text-sm outline-none"
                    style={{ background: "var(--bg-deep)", border: "1px solid var(--border-default)", color: "var(--text-primary)" }}>
                    {Object.entries(STATUS_CONFIG).map(([s, c]) => (
                      <option key={s} value={s} style={{ background: "var(--bg-deep)", color: "var(--text-primary)" }}>{c.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs mb-1.5 block" style={{ color: "var(--text-muted)" }}>Next Step</label>
                  <input value={form.next_step} onChange={e => setForm(f => ({ ...f, next_step: e.target.value }))}
                    placeholder="Schedule follow-up / prepare assignment"
                    className="w-full p-3 rounded-xl text-sm outline-none"
                    style={{ background: "var(--bg-deep)", border: "1px solid var(--border-default)", color: "var(--text-primary)" }} />
                </div>
                <div>
                  <label className="text-xs mb-1.5 block" style={{ color: "var(--text-muted)" }}>Reminder Time</label>
                  <input type="datetime-local" value={form.reminder_at} onChange={e => setForm(f => ({ ...f, reminder_at: e.target.value }))}
                    className="w-full p-3 rounded-xl text-sm outline-none"
                    style={{ background: "var(--bg-deep)", border: "1px solid var(--border-default)", color: "var(--text-primary)" }} />
                </div>
                <div className="flex gap-3 pt-2">
                  <button onClick={() => setShowModal(false)} className="glow-btn flex-1 justify-center text-sm py-2">Cancel</button>
                  <button onClick={addApplication} disabled={saving || !form.title || !form.company}
                    className="glow-btn glow-btn-primary flex-1 justify-center text-sm py-2"
                    style={{ opacity: saving || !form.title || !form.company ? 0.6 : 1 }}>
                    {saving ? "Adding…" : "Add"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Status Summary */}
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
          {Object.entries(STATUS_CONFIG).map(([status, cfg]) => {
            const Icon = cfg.icon;
            const count = (timeline[status] || applications.filter(a => a.status === status)).length;
            return (
              <div key={status} className="stat-card text-center">
                <Icon className="w-5 h-5 mx-auto mb-2" style={{ color: cfg.color }} />
                <div style={{ fontFamily: "Syne, sans-serif", fontWeight: 800, fontSize: 22, color: "var(--text-primary)" }}>{count}</div>
                <div className="text-xs mt-1" style={{ color: cfg.color }}>{cfg.label}</div>
              </div>
            );
          })}
        </div>
        {analytics && (
          <div className="glass-card p-4 text-sm flex flex-wrap gap-5">
            <span style={{ color: "var(--text-muted)" }}>Active Pipeline: <strong style={{ color: "var(--text-primary)" }}>{analytics.active_pipeline}</strong></span>
            <span style={{ color: "var(--text-muted)" }}>Due Reminders: <strong style={{ color: "#F59E0B" }}>{analytics.due_reminders}</strong></span>
            <span style={{ color: "var(--text-muted)" }}>Total Tracked: <strong style={{ color: "var(--text-primary)" }}>{analytics.total}</strong></span>
          </div>
        )}

        {/* Kanban Board */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {Object.entries(STATUS_CONFIG).map(([status, cfg]) => {
            const cards = applications.filter(a => a.status === status);
            return (
              <div key={status} className="glass-card p-3">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: cfg.color }} />
                  <span className="text-xs font-semibold" style={{ color: cfg.color }}>{cfg.label}</span>
                  <span className="ml-auto text-xs" style={{ color: "var(--text-muted)" }}>{cards.length}</span>
                </div>
                <div className="space-y-2">
                  {cards.map((app: any) => (
                    <div key={app.id} className="p-2.5 rounded-xl" style={{ background: "var(--bg-deep)", border: `1px solid ${cfg.color}30` }}>
                      <p className="text-xs font-semibold" style={{ color: "var(--text-primary)", marginBottom: 2 }}>
                        {app.title || app.job?.title || `Job #${app.job_id?.slice(0, 6)}`}
                      </p>
                      <p className="text-xs" style={{ color: "var(--text-muted)" }}>{app.company || app.job?.company || "—"}</p>
                      <p className="text-xs" style={{ color: "var(--text-muted)", marginTop: 2 }}>{app.updated_at?.slice(0, 10)}</p>
                    </div>
                  ))}
                  {cards.length === 0 && (
                    <p className="text-xs text-center py-3" style={{ color: "var(--text-muted)" }}>Empty</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Applications List */}
        <div className="glass-card overflow-hidden">
          <div className="px-5 py-4" style={{ borderBottom: "1px solid var(--border-default)" }}>
            <h2 style={{ fontFamily: "Syne, sans-serif", fontWeight: 700, color: "var(--text-primary)" }}>All Applications</h2>
          </div>
          {loading ? (
            <div className="p-8 text-center space-y-3">
              {[1,2,3].map(i => <div key={i} className="shimmer h-14 rounded-xl mx-5" />)}
            </div>
          ) : applications.length === 0 ? (
            <div className="p-10 text-center">
              <Briefcase className="w-10 h-10 mx-auto mb-3" style={{ color: "var(--text-muted)" }} />
              <p style={{ color: "var(--text-muted)" }}>No applications tracked yet.</p>
              <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>Add your first application or match against a job.</p>
            </div>
          ) : (
            <div className="divide-y" style={{ borderColor: "var(--border-default)" }}>
              {applications.map((app) => {
                const cfg = STATUS_CONFIG[app.status] || STATUS_CONFIG.saved;
                const Icon = cfg.icon;
                return (
                  <div key={app.id} className="flex items-center justify-between px-5 py-4 transition-colors hover:bg-[var(--bg-deep)]">
                    <div className="flex items-center gap-3">
                      <Icon className="w-5 h-5 flex-shrink-0" style={{ color: cfg.color }} />
                      <div>
                        <p style={{ fontWeight: 600, color: "var(--text-primary)" }}>{app.job?.title || `Job #${app.job_id?.slice(0, 8)}`}</p>
                        <p className="text-xs" style={{ color: "var(--text-muted)" }}>{app.company || app.job?.company || "Unknown Company"} · {app.updated_at?.slice(0, 10)}</p>
                        {app.next_step && <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>Next: {app.next_step}</p>}
                      </div>
                    </div>
                    <select value={app.status || "saved"} onChange={e => updateStatus(app.id, e.target.value)}
                      className="bg-transparent text-sm outline-none border-none cursor-pointer"
                      style={{ color: cfg.color, fontWeight: 600 }}>
                      {Object.entries(STATUS_CONFIG).map(([s, c]) => (
                        <option key={s} value={s} style={{ background: "var(--bg-deep)", color: "var(--text-primary)" }}>{c.label}</option>
                      ))}
                    </select>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
