import axios from "axios";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000",
});

export const authApi = {
  getMe: (token: string) => 
    api.get("/auth/me", { headers: { Authorization: `Bearer ${token}` } }),
};

export const resumeApi = {
  upload: (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return api.post("/resumes/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
  analyze: (resumeId: string) => api.post(`/resumes/${resumeId}/analyze`),
  get: (resumeId: string) => api.get(`/resumes/${resumeId}`),
};

export const jobApi = {
  analyze: (jdText: string) => api.post("/jobs/analyze", { jd_text: jdText }),
  match: (resumeId: string, jobId: string) => api.post("/matches/create", { resume_id: resumeId, job_id: jobId }),
};

export const interviewApi = {
  generateQuestions: (role: string, resumeId: string) => api.post("/interviews/questions", { role, resume_id: resumeId }),
  evaluateAnswer: (question: string, answer: string, role: string) => api.post("/interviews/evaluate", { question, answer, role }),
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
