"use client";

import { useState, useEffect, useRef } from "react";
import { groupApi, authApi } from "@/lib/api";
import { useAuth, useUser } from "@clerk/nextjs";
import { 
  Users, Plus, Send, MessageSquare, Video, Phone, 
  Paperclip, Code, Settings, X, UserMinus, UserPlus, Play, Terminal, Trash2
} from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { GlowButton } from "@/components/ui/GlowButton";
import DashboardLayout from "@/components/DashboardLayout";
import MonacoEditor from "@monaco-editor/react";

interface Member {
  id: string;
  email: string;
  full_name: string;
}

interface Group {
  id: string;
  name: string;
  description: string;
  creator_id: string;
  creator_clerk_id?: string;
  shared_code?: string;
  shared_language?: string;
  members: Member[];
}

interface Message {
  id: string;
  content: string;
  sender_id: string;
  sender_name: string;
  sender_email: string;
  created_at: string;
}

interface GroupFile {
  id: string;
  file_name: string;
  file_url: string;
  file_type: string;
  sender_name: string;
  created_at: string;
}

export default function GroupsPage() {
  const { getToken } = useAuth();
  const { user: clerkUser } = useUser();
  const [mounted, setMounted] = useState(false);
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [files, setFiles] = useState<GroupFile[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [currentUserRole, setCurrentUserRole] = useState<string>("candidate");
  
  // Modals & Panels
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showCodeEditor, setShowCodeEditor] = useState(false);
  const [showFiles, setShowFiles] = useState(false);
  
  // Forms
  const [groupName, setGroupName] = useState("");
  const [groupDesc, setGroupDesc] = useState("");
  const [memberEmails, setMemberEmails] = useState("");
  
  // Code Editor
  const [code, setCode] = useState("# Start coding...");
  const [language, setLanguage] = useState("python");
  const [codeOutput, setCodeOutput] = useState("");
  const [isRunning, setIsRunning] = useState(false);

  // Refs for state to avoid stale closures in intervals
  const codeRef = useRef(code);
  const languageRef = useRef(language);
  const selectedGroupRef = useRef(selectedGroup);

  useEffect(() => {
    codeRef.current = code;
  }, [code]);

  useEffect(() => {
    languageRef.current = language;
  }, [language]);

  useEffect(() => {
    selectedGroupRef.current = selectedGroup;
  }, [selectedGroup]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const codeUpdateTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setMounted(true);
    fetchGroups();
    fetchUserRole();
  }, []);

  const fetchUserRole = async () => {
    try {
      const token = await getToken();
      const resp = await authApi.getMe(token as string);
      setCurrentUserRole(resp.data.role);
    } catch (err) {
      console.error("Failed to fetch user role", err);
    }
  };

  useEffect(() => {
    if (selectedGroup) {
      setCode(selectedGroup.shared_code || "# Start coding...");
      setLanguage(selectedGroup.shared_language || "python");
      fetchMessages(selectedGroup.id);
      fetchFiles(selectedGroup.id);
      const interval = setInterval(() => {
        fetchMessages(selectedGroup.id);
        fetchFiles(selectedGroup.id);
        fetchGroupDetails(selectedGroup.id);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [selectedGroup]);

  const fetchGroupDetails = async (groupId: string) => {
    try {
      const token = await getToken();
      const resp = await groupApi.list(token as string);
      const updated = resp.data.find((g: Group) => g.id === groupId);
      if (updated) {
        // Only update local code if it's different from the server (simple sync)
        // This avoids cursor jumps while the user is typing
        if (!codeUpdateTimer.current) {
          if (updated.shared_code !== codeRef.current) setCode(updated.shared_code);
          if (updated.shared_language !== languageRef.current) setLanguage(updated.shared_language);
        }
      }
    } catch (err) {
      console.error("Failed to fetch group details", err);
    }
  };

  const handleCodeChange = (newCode: string | undefined) => {
    const val = newCode || "";
    setCode(val);
    
    // Debounce code update to server
    if (codeUpdateTimer.current) clearTimeout(codeUpdateTimer.current);
    codeUpdateTimer.current = setTimeout(async () => {
      if (!selectedGroup) return;
      try {
        const token = await getToken();
        await groupApi.updateCode(selectedGroup.id, val, language, token as string);
      } catch (err) {
        console.error("Failed to sync code", err);
      } finally {
        codeUpdateTimer.current = null;
      }
    }, 1000);
  };

  const fetchGroups = async () => {
    try {
      const token = await getToken();
      const resp = await groupApi.list(token as string);
      setGroups(resp.data);
    } catch (err) {
      console.error("Failed to fetch groups", err);
    }
  };

  const fetchMessages = async (groupId: string) => {
    try {
      const token = await getToken();
      const resp = await groupApi.getMessages(groupId, token as string);
      setMessages(resp.data);
    } catch (err) {
      console.error("Failed to fetch messages", err);
    }
  };

  const fetchFiles = async (groupId: string) => {
    try {
      const token = await getToken();
      const resp = await groupApi.getFiles(groupId, token as string);
      // Ensure file URLs are absolute
      const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace("/v1", "") || "http://localhost:8000";
      const filesWithUrls = resp.data.map((f: any) => ({
        ...f,
        file_url: f.file_url.startsWith("http") ? f.file_url : `${baseUrl}${f.file_url}`
      }));
      setFiles(filesWithUrls);
    } catch (err) {
      console.error("Failed to fetch files", err);
    }
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = await getToken();
      const emails = memberEmails.split(",").map(e => e.trim()).filter(e => e);
      await groupApi.create(groupName, groupDesc, emails, token as string);
      setShowCreateModal(false);
      setGroupName("");
      setGroupDesc("");
      setMemberEmails("");
      fetchGroups();
    } catch (err) {
      alert("Failed to create group");
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGroup || !newMessage.trim()) return;
    try {
      const token = await getToken();
      await groupApi.sendMessage(selectedGroup.id, newMessage, token as string);
      setNewMessage("");
      fetchMessages(selectedGroup.id);
    } catch (err) {
      console.error("Failed to send message", err);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedGroup || !e.target.files?.[0]) return;
    const file = e.target.files[0];
    console.log(`Uploading file: ${file.name} (${file.size} bytes)`);
    try {
      const token = await getToken();
      await groupApi.uploadFile(selectedGroup.id, file, token as string);
      fetchFiles(selectedGroup.id);
      // Reset input so same file can be selected again
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err) {
      console.error("Upload failed", err);
      alert("File upload failed");
    }
  };

  const handleRunCode = async () => {
    if (!selectedGroup) return;
    setIsRunning(true);
    setCodeOutput("Running...");
    try {
      const token = await getToken();
      const resp = await groupApi.executeCode(selectedGroup.id, language, code, token as string);
      setCodeOutput(resp.data.stdout || resp.data.stderr || "No output");
    } catch (err) {
      setCodeOutput("Execution failed");
    } finally {
      setIsRunning(false);
    }
  };

  const handleAddMember = async () => {
    if (!selectedGroup) return;
    const email = prompt("Enter member email:");
    if (!email) return;
    try {
      const token = await getToken();
      await groupApi.addMembers(selectedGroup.id, [email], token as string);
      fetchGroups();
    } catch (err) {
      alert("Failed to add member");
    }
  };

  const handleRemoveMember = async (email: string) => {
    if (!selectedGroup) return;
    if (!confirm(`Are you sure you want to remove ${email}?`)) return;
    try {
      const token = await getToken();
      await groupApi.removeMember(selectedGroup.id, email, token as string);
      fetchGroups();
    } catch (err) {
      alert("Failed to remove member");
    }
  };

  const handleDeleteGroup = async () => {
    if (!selectedGroup) return;
    if (!confirm("CRITICAL: Are you sure you want to delete this group? All messages, files, and shared code will be permanently removed.")) return;
    try {
      const token = await getToken();
      await groupApi.deleteGroup(selectedGroup.id, token as string);
      setSelectedGroup(null);
      fetchGroups();
    } catch (err) {
      alert("Failed to delete group");
    }
  };

  if (!mounted) return null;

  const isCreator = selectedGroup?.creator_clerk_id === clerkUser?.id;

  return (
    <DashboardLayout>
      <div className="flex h-[calc(100vh-64px)] p-6 gap-6" suppressHydrationWarning>
        {/* Sidebar: Group List */}
        <div className="w-80 flex flex-col gap-4 overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-400" />
              Groups
            </h2>
            <button 
              onClick={() => setShowCreateModal(true)}
              className="p-2 bg-blue-600/20 hover:bg-blue-600/40 rounded-full transition-colors"
            >
              <Plus className="w-4 h-4 text-blue-400" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
            {groups.map(g => (
              <div
                key={g.id}
                onClick={() => setSelectedGroup(g)}
                className={`p-4 rounded-xl cursor-pointer transition-all border ${
                  selectedGroup?.id === g.id 
                  ? "bg-blue-600/20 border-blue-500/50" 
                  : "bg-white/5 border-white/10 hover:bg-white/10"
                }`}
              >
                <h3 className="font-semibold text-white truncate">{g.name}</h3>
                <p className="text-[10px] text-blue-400/50 truncate font-mono mt-1">Creator: {g.members.find(m => m.id === g.creator_id)?.email || "Loading..."}</p>
                <p className="text-xs text-slate-400 truncate mt-1">{g.description || "No description"}</p>
                <div className="mt-2 flex items-center justify-between">
                  <div className="text-[10px] text-blue-400/70 font-mono">
                    {g.members.length} members
                  </div>
                  {g.creator_clerk_id === clerkUser?.id && (
                    <span className="text-[8px] bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded border border-blue-500/30">CREATOR</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Main: Chat Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {selectedGroup ? (
            <GlassCard className="flex-1 flex flex-col p-0 overflow-hidden border-white/10 h-full">
              {/* Chat Header */}
              <div className="p-4 border-b border-white/10 bg-white/5 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-white">{selectedGroup.name}</h3>
                  <div className="flex items-center gap-2">
                    <p className="text-xs text-slate-400 truncate max-w-[200px]">{selectedGroup.description}</p>
                    <span className="text-[10px] text-slate-600">•</span>
                    <p className="text-[10px] text-blue-400/60 uppercase tracking-wider">
                      {selectedGroup.members.map(m => m.email).join(", ")}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <button onClick={() => alert("Starting video call...")} className="p-2 hover:bg-white/5 rounded-lg text-slate-400 hover:text-blue-400 transition-colors">
                    <Video className="w-5 h-5" />
                  </button>
                  <button onClick={() => alert("Starting voice call...")} className="p-2 hover:bg-white/5 rounded-lg text-slate-400 hover:text-blue-400 transition-colors">
                    <Phone className="w-5 h-5" />
                  </button>
                  <div className="w-px h-4 bg-white/10 mx-1" />
                  <button onClick={() => setShowCodeEditor(!showCodeEditor)} className={`p-2 rounded-lg transition-colors ${showCodeEditor ? 'bg-blue-600/20 text-blue-400' : 'hover:bg-white/5 text-slate-400'}`}>
                    <Code className="w-5 h-5" />
                  </button>
                  <button onClick={() => setShowFiles(!showFiles)} className={`p-2 rounded-lg transition-colors ${showFiles ? 'bg-blue-600/20 text-blue-400' : 'hover:bg-white/5 text-slate-400'}`} title="Toggle Files Panel">
                    <Paperclip className="w-5 h-5" />
                  </button>
                  <button onClick={() => setShowSettings(!showSettings)} className={`p-2 rounded-lg transition-colors ${showSettings ? 'bg-blue-600/20 text-blue-400' : 'hover:bg-white/5 text-slate-400'}`}>
                    <Settings className="w-5 h-5" />
                  </button>
                  <div className="w-px h-4 bg-white/10 mx-1" />
                  <button onClick={() => setSelectedGroup(null)} className="p-2 hover:bg-rose-500/10 rounded-lg text-slate-400 hover:text-rose-400 transition-colors" title="Close Chat">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="flex-1 flex overflow-hidden">
                {/* Chat Messages */}
                <div className="flex-1 flex flex-col overflow-hidden">
                  <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                    {messages.map(m => (
                      <div key={m.id} className={`flex flex-col gap-1 ${m.sender_id === clerkUser?.id ? 'items-end' : ''}`}>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-blue-400">{m.sender_name}</span>
                          <span className="text-[9px] text-slate-500 font-mono">({m.sender_email})</span>
                          <span className="text-[10px] text-slate-500">
                            {new Date(m.created_at).toLocaleTimeString()}
                          </span>
                        </div>
                        <div className={`border rounded-2xl p-3 max-w-[80%] text-sm break-words ${
                          m.sender_id === clerkUser?.id 
                          ? 'bg-blue-600/20 border-blue-500/30 rounded-tr-none text-blue-50' 
                          : 'bg-white/5 border-white/5 rounded-tl-none text-slate-200'
                        }`}>
                          {m.content}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Input Area */}
                  <form onSubmit={handleSendMessage} className="p-4 border-t border-white/10 bg-white/5 flex gap-3">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type your message..."
                      className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-blue-500/50 transition-colors"
                    />
                    <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
                    <button type="button" onClick={() => fileInputRef.current?.click()} className="p-2 hover:bg-white/5 text-slate-400 rounded-xl transition-colors">
                      <Paperclip className="w-5 h-5" />
                    </button>
                    <button
                      type="submit"
                      disabled={!newMessage.trim()}
                      className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white p-2 rounded-xl transition-all"
                    >
                      <Send className="w-5 h-5" />
                    </button>
                  </form>
                </div>

                {/* Side Panels */}
                {showCodeEditor && (
                  <div className="w-[400px] border-l border-white/10 bg-[#1e1e1e] flex flex-col">
                    <div className="p-3 border-b border-white/5 flex items-center justify-between bg-white/5">
                      <div className="flex items-center gap-3">
                        <select 
                          value={language || "python"} 
                          onChange={(e) => setLanguage(e.target.value)}
                          className="bg-transparent text-xs text-blue-400 font-mono outline-none border-none"
                        >
                          <option value="python">python</option>
                          <option value="javascript">javascript</option>
                          <option value="cpp">cpp</option>
                        </select>
                        <button onClick={handleRunCode} disabled={isRunning} className="flex items-center gap-1.5 text-[10px] font-bold bg-green-600/20 text-green-400 px-2 py-1 rounded hover:bg-green-600/30 transition-colors uppercase tracking-widest">
                          {isRunning ? '...' : <><Play className="w-3 h-3" /> Run</>}
                        </button>
                      </div>
                      <button onClick={() => setShowCodeEditor(false)} className="p-1 hover:bg-white/5 rounded text-slate-500">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="flex-1">
                      <MonacoEditor
                        height="100%"
                        language={language}
                        theme="vs-dark"
                        value={code}
                        onChange={handleCodeChange}
                        options={{ fontSize: 13, minimap: { enabled: false } }}
                      />
                    </div>
                    {codeOutput && (
                      <div className="h-32 border-t border-white/10 bg-black/50 p-3 font-mono text-[11px] overflow-y-auto">
                        <div className="flex items-center gap-2 text-slate-500 mb-1">
                          <Terminal className="w-3 h-3" />
                          <span>CONSOLE</span>
                        </div>
                        <pre className="text-green-400/80">{codeOutput}</pre>
                      </div>
                    )}
                  </div>
                )}

                {showFiles && (
                  <div className="w-64 border-l border-white/10 bg-white/5 flex flex-col">
                    <div className="p-4 border-b border-white/10 flex items-center justify-between">
                      <h4 className="text-sm font-bold text-white flex items-center gap-2">
                        <Paperclip className="w-4 h-4 text-blue-400" /> Files
                      </h4>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => fileInputRef.current?.click()}
                          className="p-1 hover:bg-blue-500/20 text-blue-400 rounded transition-colors"
                          title="Upload File"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                        <button onClick={() => setShowFiles(false)}><X className="w-4 h-4 text-slate-500" /></button>
                      </div>
                    </div>
                    <div className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar">
                      {files.map(f => (
                        <a key={f.id} href={f.file_url} target="_blank" className="block p-2 rounded bg-white/5 border border-white/5 hover:border-blue-500/30 transition-all group">
                          <p className="text-xs text-white truncate font-medium">{f.file_name}</p>
                          <div className="flex items-center justify-between mt-1">
                            <span className="text-[9px] text-slate-500 uppercase">{f.file_type.split('/')[1]}</span>
                            <span className="text-[9px] text-blue-400/50 group-hover:text-blue-400 transition-colors">DOWNLOAD</span>
                          </div>
                        </a>
                      ))}
                      {files.length === 0 && (
                        <div className="h-full flex flex-col items-center justify-center text-slate-500 py-10 px-4 text-center">
                          <Paperclip className="w-8 h-8 opacity-20 mb-2" />
                          <p className="text-[10px] uppercase tracking-widest mb-4">No shared files</p>
                          <button 
                            onClick={() => fileInputRef.current?.click()}
                            className="text-[10px] font-bold bg-blue-600/20 text-blue-400 px-3 py-1.5 rounded hover:bg-blue-600/30 transition-all uppercase tracking-widest"
                          >
                            Upload Now
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {showSettings && (
                  <div className="w-64 border-l border-white/10 bg-white/5 flex flex-col">
                    <div className="p-4 border-b border-white/10 flex items-center justify-between">
                      <h4 className="text-sm font-bold text-white flex items-center gap-2">
                        <Settings className="w-4 h-4 text-blue-400" /> Settings
                      </h4>
                      <button onClick={() => setShowSettings(false)}><X className="w-4 h-4 text-slate-500" /></button>
                    </div>
                    <div className="p-4 space-y-6">
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Members</label>
                          {isCreator && (
                            <button onClick={handleAddMember} className="p-1 hover:bg-blue-500/20 text-blue-400 rounded transition-colors">
                              <UserPlus className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                        <div className="space-y-2">
                          {selectedGroup.members.map(m => (
                            <div key={m.id} className="flex items-center justify-between group">
                              <div className="flex flex-col">
                                <span className="text-xs font-bold text-blue-400">{m.email}</span>
                                <span className="text-[9px] text-slate-500 uppercase tracking-tighter">{m.full_name}</span>
                              </div>
                              {isCreator && m.id !== clerkUser?.id && (
                                <button onClick={() => handleRemoveMember(m.email)} className="p-1 opacity-0 group-hover:opacity-100 hover:bg-rose-500/20 text-rose-400 rounded transition-all">
                                  <UserMinus className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>

                      {isCreator && (
                        <div className="pt-4 border-t border-white/10 mt-4">
                          <button 
                            onClick={handleDeleteGroup}
                            className="w-full flex items-center justify-center gap-2 p-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-bold rounded-xl border border-rose-500/20 transition-all uppercase tracking-widest"
                          >
                            <Trash2 className="w-4 h-4" />
                            Delete Group
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </GlassCard>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-500 gap-4 h-full">
              <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center border border-white/10">
                <Users className="w-10 h-10 opacity-20" />
              </div>
              <div className="text-center">
                <h3 className="text-xl font-bold text-white/50">Select a group</h3>
                <p className="text-sm">Pick a group from the sidebar to start chatting</p>
              </div>
            </div>
          )}
        </div>

        {/* Create Group Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <GlassCard className="w-full max-w-md p-6 border-blue-500/30">
              <h2 className="text-2xl font-bold text-white mb-6">Create New Group</h2>
              <form onSubmit={handleCreateGroup} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Group Name</label>
                  <input
                    required
                    type="text"
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-blue-500/50"
                    placeholder="e.g., Engineering Team"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Description</label>
                  <textarea
                    value={groupDesc}
                    onChange={(e) => setGroupDesc(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white h-24 focus:outline-none focus:border-blue-500/50"
                    placeholder="What's this group about?"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Member Emails (comma separated)</label>
                  <input
                    type="text"
                    value={memberEmails}
                    onChange={(e) => setMemberEmails(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-blue-500/50"
                    placeholder="user1@example.com, user2@example.com"
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 px-4 py-2 rounded-xl border border-white/10 hover:bg-white/5 transition-colors"
                  >
                    Cancel
                  </button>
                  <GlowButton type="submit" className="flex-1">
                    Create Group
                  </GlowButton>
                </div>
              </form>
            </GlassCard>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
