"use client";

import { useState } from "react";
import { useAuth } from "@clerk/nextjs";
import DashboardLayout from "@/components/DashboardLayout";
import dynamic from "next/dynamic";
import MonacoEditor from "@monaco-editor/react";
import CodeOutput from "@/components/ui/CodeOutput";
import { Video, Lock, Play, Copy, Link2, Plus, MessageSquare, StickyNote, X } from "lucide-react";
import axios from "axios";

const RoomParticles = dynamic(() => import("@/components/3d/RoomParticles"), { ssr: false });

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/v1";
const LANGUAGES = ["python", "javascript", "typescript", "java", "cpp", "go", "rust"];

type ChatMsg = { sender: string; text: string; time: string };

export default function LiveInterviewPage() {
  const { getToken } = useAuth();
  const [roomKey, setRoomKey] = useState("");
  const [createdRoom, setCreatedRoom] = useState<any>(null);
  const [joined, setJoined] = useState(false);
  const [language, setLanguage] = useState("python");
  const [code, setCode] = useState("# Write your solution here\ndef solution():\n    pass\n");
  const [output, setOutput] = useState<any>(null);
  const [running, setRunning] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMsg[]>([
    { sender: "System", text: "Room created. Participants can join with the room key.", time: "just now" },
  ]);
  const [chatInput, setChatInput] = useState("");
  const [notes, setNotes] = useState("");
  const [showNotes, setShowNotes] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [roomEnded, setRoomEnded] = useState(false);

  const inRoom = joined || !!createdRoom;

  const createRoom = async () => {
    try {
      const token = await getToken();
      const resp = await axios.post(`${API}/rooms/create`, { participant_limit: 2 }, { headers: { Authorization: `Bearer ${token}` } });
      setCreatedRoom(resp.data);
    } catch { console.error("create room failed"); }
  };

  const joinRoom = async () => {
    if (!roomKey) return;
    setJoined(true);
  };

  const runCode = async () => {
    setRunning(true);
    setOutput(null);
    try {
      const token = await getToken();
      const roomId = createdRoom?.room_id || "dev";
      const resp = await axios.post(`${API}/rooms/${roomId}/execute-code`, { language, code, stdin: "" }, { headers: { Authorization: `Bearer ${token}` } });
      setOutput(resp.data);
    } catch (e) {
      setOutput({ stdout: "", stderr: String(e), exit_code: 1, runtime_ms: 0 });
    } finally {
      setRunning(false);
    }
  };

  const lockRoom = async () => {
    setIsLocked(true);
    try {
      const token = await getToken();
      if (createdRoom?.room_id) await axios.post(`${API}/rooms/${createdRoom.room_id}/lock`, {}, { headers: { Authorization: `Bearer ${token}` } });
    } catch {}
  };

  const endRoom = async () => {
    setRoomEnded(true);
    try {
      const token = await getToken();
      if (createdRoom?.room_id) await axios.post(`${API}/rooms/${createdRoom.room_id}/end`, {}, { headers: { Authorization: `Bearer ${token}` } });
    } catch {}
  };

  const sendChat = () => {
    if (!chatInput.trim()) return;
    setChatMessages(prev => [...prev, { sender: "You", text: chatInput, time: "just now" }]);
    setChatInput("");
  };

  return (
    <div className="relative min-h-screen" style={{ background: "var(--bg-primary)" }}>
      {inRoom && <RoomParticles />}
      <DashboardLayout>
        <div className="space-y-5 animate-fade-in">

          {/* Header */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <p className="text-xs font-mono" style={{ color: "#F59E0B", letterSpacing: "0.15em" }}>SYSTEM / LIVE ROOM</p>
              <h1 style={{ fontFamily: "Syne, sans-serif", fontSize: 30, fontWeight: 800, color: "var(--text-primary)" }}>Live Interview Room</h1>
            </div>
            {createdRoom && (
              <div className="flex items-center gap-3">
                <span className="status-dot-active" />
                <span className="font-mono text-sm" style={{ color: "#60A5FA" }}>ROOM #{createdRoom.room_key}</span>
                {isLocked && <span className="text-xs px-2 py-0.5 rounded" style={{ background: "rgba(244,63,94,0.15)", color: "#FDA4AF", border: "1px solid #F43F5E" }}>LOCKED</span>}
              </div>
            )}
          </div>

          {/* Room Setup */}
          {!inRoom ? (
            <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto">
              <div className="glass-card p-7 text-center space-y-4">
                <div className="w-14 h-14 rounded-2xl mx-auto flex items-center justify-center" style={{ background: "rgba(245,158,11,0.15)", border: "1px solid rgba(245,158,11,0.3)" }}>
                  <Video className="w-6 h-6" style={{ color: "#F59E0B" }} />
                </div>
                <h3 style={{ fontFamily: "Syne, sans-serif", fontWeight: 700, color: "var(--text-primary)" }}>Create Room</h3>
                <p className="text-sm" style={{ color: "var(--text-muted)" }}>Start a new live interview session as recruiter</p>
                <button onClick={createRoom} className="glow-btn w-full justify-center" style={{ borderColor: "#F59E0B", color: "#FCD34D" }}>
                  <Plus className="w-4 h-4" /> Create Room
                </button>
              </div>
              <div className="glass-card p-7 space-y-4">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: "rgba(55,138,221,0.12)", border: "1px solid rgba(55,138,221,0.3)" }}>
                  <Link2 className="w-6 h-6" style={{ color: "#378ADD" }} />
                </div>
                <h3 style={{ fontFamily: "Syne, sans-serif", fontWeight: 700, color: "var(--text-primary)" }}>Join Room</h3>
                <input
                  value={roomKey}
                  onChange={e => setRoomKey(e.target.value.toUpperCase())}
                  placeholder="Enter room key…"
                  className="w-full p-3 rounded-xl outline-none font-mono text-sm"
                  style={{ background: "var(--bg-deep)", border: "1px solid var(--border-default)", color: "var(--text-primary)" }}
                />
                <button onClick={joinRoom} disabled={!roomKey} className="glow-btn w-full justify-center" style={{ opacity: !roomKey ? 0.5 : 1 }}>
                  Join Room
                </button>
              </div>
            </div>
          ) : roomEnded ? (
            <div className="glass-card p-12 text-center max-w-lg mx-auto">
              <div className="w-16 h-16 rounded-2xl mx-auto mb-6 flex items-center justify-center" style={{ background: "rgba(55,138,221,0.15)", border: "1px solid #378ADD" }}>
                <Video className="w-7 h-7" style={{ color: "#378ADD" }} />
              </div>
              <h2 style={{ fontFamily: "Syne, sans-serif", fontWeight: 700, color: "var(--text-primary)", marginBottom: 8 }}>Room Ended</h2>
              <p style={{ color: "var(--text-muted)", marginBottom: 24 }}>The interview session has been closed. Recording (if any) will be available shortly.</p>
              <button onClick={() => { setCreatedRoom(null); setJoined(false); setRoomEnded(false); }} className="glow-btn glow-btn-primary">
                Start New Room
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Info Bar */}
              {createdRoom && (
                <div className="glass-card p-4 flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-3">
                    <span className="text-sm" style={{ color: "var(--text-muted)" }}>Room Key:</span>
                    <span className="font-mono font-bold text-lg" style={{ color: "#60A5FA" }}>{createdRoom.room_key}</span>
                    <button onClick={() => navigator.clipboard.writeText(createdRoom.room_key)} className="transition-colors" style={{ color: "var(--text-muted)" }}>
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <button onClick={() => setShowNotes(v => !v)} className="glow-btn text-sm py-2 px-3">
                      <StickyNote className="w-4 h-4" /> Notes
                    </button>
                    <button onClick={lockRoom} disabled={isLocked} className="glow-btn text-sm py-2 px-3" style={{ opacity: isLocked ? 0.5 : 1 }}>
                      <Lock className="w-4 h-4" /> {isLocked ? "Locked" : "Lock Room"}
                    </button>
                    <button onClick={endRoom} className="glow-btn text-sm py-2 px-3" style={{ borderColor: "#F43F5E", color: "#FDA4AF" }}>
                      End Room
                    </button>
                  </div>
                </div>
              )}

              {/* Interviewer Notes panel */}
              {showNotes && (
                <div className="glass-card p-4" style={{ borderColor: "rgba(245,158,11,0.3)" }}>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-mono" style={{ color: "#F59E0B" }}>INTERVIEWER NOTES</span>
                    <button onClick={() => setShowNotes(false)} style={{ color: "var(--text-muted)" }}><X className="w-4 h-4" /></button>
                  </div>
                  <textarea
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    rows={4}
                    placeholder="Record notes about the candidate's performance…"
                    className="w-full outline-none resize-none text-sm custom-scrollbar"
                    style={{ background: "transparent", color: "var(--text-muted)", fontFamily: "DM Sans, sans-serif" }}
                  />
                </div>
              )}

              {/* Video + Code */}
              <div className="grid lg:grid-cols-2 gap-4">
                {/* Video Panel */}
                <div className="glass-card p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 style={{ fontFamily: "Syne, sans-serif", fontWeight: 700, color: "var(--text-primary)" }}>Video</h3>
                    <span className="text-xs px-2 py-0.5 rounded" style={{ background: "rgba(34,197,94,0.15)", color: "#4ADE80", border: "1px solid #22C55E" }}>
                      2 participants
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {["Recruiter", "Candidate"].map(name => (
                      <div key={name} className="rounded-xl aspect-video flex items-center justify-center relative overflow-hidden" style={{ background: "var(--bg-deep)", border: "1px solid var(--border-default)" }}>
                        <div className="text-center">
                          <div className="w-12 h-12 rounded-full mx-auto mb-2 flex items-center justify-center" style={{ background: "var(--bg-primary)" }}>
                            <Video className="w-5 h-5" style={{ color: "var(--text-muted)" }} />
                          </div>
                          <p className="text-xs" style={{ color: "var(--text-muted)" }}>{name}</p>
                        </div>
                        <div className="absolute bottom-2 left-2">
                          <span className="status-dot-active" style={{ width: 6, height: 6 }} />
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-center" style={{ color: "var(--text-muted)" }}>Stream Video SDK — connect with real-time token</p>
                </div>

                {/* Code Editor */}
                <div className="glass-card overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: "1px solid var(--border-default)" }}>
                    <select value={language || "python"} onChange={e => setLanguage(e.target.value)}
                      className="text-xs outline-none"
                      style={{ background: "transparent", color: "#60A5FA", fontFamily: "JetBrains Mono, monospace" }}>
                      {LANGUAGES.map(l => <option key={l} value={l} style={{ background: "var(--bg-deep)", color: "var(--text-primary)" }}>{l}</option>)}
                    </select>
                    <button onClick={runCode} disabled={running}
                      className="glow-btn glow-btn-primary text-xs py-1.5 px-3"
                      style={{ opacity: running ? 0.7 : 1 }}>
                      <Play className="w-3 h-3" /> {running ? "Running…" : "Run"}
                    </button>
                  </div>
                  <MonacoEditor
                    height={240}
                    language={language}
                    value={code}
                    onChange={v => setCode(v || "")}
                    theme="vs-dark"
                    options={{ fontSize: 13, fontFamily: "JetBrains Mono, monospace", minimap: { enabled: false }, lineNumbers: "on", scrollBeyondLastLine: false, padding: { top: 12 } }}
                  />
                  {output && (
                    <div className="m-3">
                      <CodeOutput stdout={output.stdout} stderr={output.stderr} exitCode={output.exit_code} runtimeMs={output.runtime_ms} />
                    </div>
                  )}
                </div>
              </div>

              {/* Chat Panel */}
              <div className="glass-card overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-3" style={{ borderBottom: "1px solid var(--border-default)" }}>
                  <MessageSquare className="w-4 h-4" style={{ color: "#378ADD" }} />
                  <h3 style={{ fontFamily: "Syne, sans-serif", fontSize: 13, fontWeight: 700, color: "var(--text-muted)", letterSpacing: "0.1em" }}>CHAT</h3>
                </div>
                <div className="p-3 space-y-2 custom-scrollbar" style={{ maxHeight: 160, overflowY: "auto" }}>
                  {chatMessages.map((m, i) => (
                    <div key={i} className={`flex gap-2 text-xs ${m.sender === "You" ? "flex-row-reverse" : ""}`}>
                      <span style={{ color: "var(--text-muted)", flexShrink: 0 }}>{m.sender}:</span>
                      <span style={{ color: "var(--text-primary)" }}>{m.text}</span>
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-2 px-3 py-2" style={{ borderTop: "1px solid var(--border-default)" }}>
                  <input
                    value={chatInput}
                    onChange={e => setChatInput(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter") sendChat(); }}
                    placeholder="Type message…"
                    className="flex-1 outline-none text-sm"
                    style={{ background: "transparent", color: "var(--text-primary)", fontFamily: "DM Sans, sans-serif" }}
                  />
                  <button onClick={sendChat} className="text-xs px-3 py-1.5 rounded-lg" style={{ background: "rgba(55,138,221,0.2)", border: "1px solid #378ADD", color: "#60A5FA" }}>
                    Send
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </DashboardLayout>
    </div>
  );
}
