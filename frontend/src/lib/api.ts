import axios from "axios";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/v1",
});

api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const requestId = crypto?.randomUUID?.() || `${Date.now()}`;
    config.headers["x-request-id"] = requestId;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (typeof window !== "undefined") {
      const url = error?.config?.url || "unknown";
      console.warn("API error", { url, status: error?.response?.status });
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  getMe: (token: string) =>
    api.get("/auth/me", { headers: { Authorization: `Bearer ${token}` } }),
  syncUser: (data: { email?: string; full_name?: string }, token: string) =>
    api.patch("/auth/sync", data, { headers: { Authorization: `Bearer ${token}` } }),
};

export const resumeApi = {
  upload: (file: File, token: string) => {
    const formData = new FormData();
    formData.append("file", file);
    return api.post("/resumes/upload", formData, {
      headers: { "Content-Type": "multipart/form-data", Authorization: `Bearer ${token}` },
    });
  },
  analyze: (resumeId: string, token: string) =>
    api.post(`/resumes/${resumeId}/analyze`, {}, { headers: { Authorization: `Bearer ${token}` } }),
  get: (resumeId: string, token: string) =>
    api.get(`/resumes/${resumeId}`, { headers: { Authorization: `Bearer ${token}` } }),
  list: (token: string) =>
    api.get("/resumes", { headers: { Authorization: `Bearer ${token}` } }),
  improve: (resumeId: string, section: string, token: string) =>
    api.post(`/resumes/${resumeId}/improve`, { section }, { headers: { Authorization: `Bearer ${token}` } }),
  versions: (resumeId: string, token: string) =>
    api.get(`/resumes/${resumeId}/versions`, { headers: { Authorization: `Bearer ${token}` } }),
};

export const jobApi = {
  analyze: (jdText: string, token: string) =>
    api.post("/jobs/analyze", { jd_text: jdText }, { headers: { Authorization: `Bearer ${token}` } }),
  get: (jobId: string, token: string) =>
    api.get(`/jobs/${jobId}`, { headers: { Authorization: `Bearer ${token}` } }),
  match: (resumeId: string, jobId: string, token: string) =>
    api.post("/matches/create", { resume_id: resumeId, job_id: jobId }, { headers: { Authorization: `Bearer ${token}` } }),
};

export const interviewApi = {
  generateQuestions: (role: string, resumeId: string) => api.post("/interviews/questions", { role, resume_id: resumeId }),
  evaluateAnswer: (question: string, answer: string, role: string) => api.post("/interviews/evaluate", { question, answer, role }),
  replay: (interviewId: string, token: string) =>
    api.get(`/interviews/${interviewId}/replay`, { headers: { Authorization: `Bearer ${token}` } }),
  list: (token: string) =>
    api.get("/interviews/", { headers: { Authorization: `Bearer ${token}` } }),
};

export const platformApi = {
  getFlags: () => api.get("/platform/flags"),
};

export const trackerApi = {
  analytics: (token: string) =>
    api.get("/applications/analytics", { headers: { Authorization: `Bearer ${token}` } }),
};

export const copilotApi = {
  writingAssistant: (task: string, context: string, token: string) =>
    api.post("/copilot/writing-assistant", { task, context }, { headers: { Authorization: `Bearer ${token}` } }),
  companyPrep: (company: string, role: string, token: string) =>
    api.post("/copilot/company-prep", { company, role }, { headers: { Authorization: `Bearer ${token}` } }),
  ingestPortfolio: (artifactText: string, source: string, token: string) =>
    api.post("/copilot/portfolio/ingest", { artifact_text: artifactText, source }, { headers: { Authorization: `Bearer ${token}` } }),
  evaluatePortfolio: (targetRole: string, token: string) =>
    api.post("/copilot/portfolio/evaluate", { target_role: targetRole }, { headers: { Authorization: `Bearer ${token}` } }),
};

export const analyticsApi = {
  dashboard: (token: string, days = 30) =>
    api.get(`/analytics/dashboard?days=${days}`, { headers: { Authorization: `Bearer ${token}` } }),
  skills: (token: string, days = 30) =>
    api.get(`/analytics/skills?days=${days}`, { headers: { Authorization: `Bearer ${token}` } }),
  interviews: (token: string, days = 30) =>
    api.get(`/analytics/interviews?days=${days}`, { headers: { Authorization: `Bearer ${token}` } }),
};

export const matchApi = {
  atsSimulate: (resumeId: string, jobId: string, token: string) =>
    api.post("/matches/ats-simulate", { resume_id: resumeId, job_id: jobId }, { headers: { Authorization: `Bearer ${token}` } }),
  generateAiRecommendations: (matchId: string, token: string) =>
    api.post(`/matches/${matchId}/ai-recommendations`, {}, { headers: { Authorization: `Bearer ${token}` } }),
};

export const groupApi = {
  list: (token: string) =>
    api.get("/groups/", { headers: { Authorization: `Bearer ${token}` } }),
  create: (name: string, description: string, memberEmails: string[], token: string) =>
    api.post("/groups/", { name, description, member_emails: memberEmails }, { headers: { Authorization: `Bearer ${token}` } }),
  getMessages: (groupId: string, token: string) =>
    api.get(`/groups/${groupId}/messages`, { headers: { Authorization: `Bearer ${token}` } }),
  sendMessage: (groupId: string, content: string, token: string) =>
    api.post(`/groups/${groupId}/messages`, { content }, { headers: { Authorization: `Bearer ${token}` } }),
  addMembers: (groupId: string, emails: string[], token: string) =>
    api.post(`/groups/${groupId}/members`, { member_emails: emails }, { headers: { Authorization: `Bearer ${token}` } }),
  removeMember: (groupId: string, email: string, token: string) =>
    api.delete(`/groups/${groupId}/members/${email}`, { headers: { Authorization: `Bearer ${token}` } }),
  deleteGroup: (groupId: string, token: string) =>
    api.delete(`/groups/${groupId}`, { headers: { Authorization: `Bearer ${token}` } }),
  uploadFile: (groupId: string, file: File, token: string) => {
    const formData = new FormData();
    formData.append("file", file);
    return api.post(`/groups/${groupId}/files`, formData, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "multipart/form-data"
      },
    });
  },
  getFiles: (groupId: string, token: string) =>
    api.get(`/groups/${groupId}/files`, { headers: { Authorization: `Bearer ${token}` } }),
  updateCode: (groupId: string, code: string, language: string, token: string) =>
    api.patch(`/groups/${groupId}/code`, { code, language }, { headers: { Authorization: `Bearer ${token}` } }),
  executeCode: (groupId: string, language: string, code: string, token: string) =>
    api.post(`/rooms/dev/execute-code`, { language, code }, { headers: { Authorization: `Bearer ${token}` } }),
};

export default api;
