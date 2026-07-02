import axios from "axios";

const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || "http://localhost:3001" })

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const getLeads = () => api.get("/api/leads").then(r => r.data);
export const getDashboard = () => api.get("/api/dashboard").then(r => r.data);
export const analyzeTranscript = (transcript: string) =>
  api.post("/api/analyze", { transcript }).then(r => r.data);
export const draftFollowUp = (id: number) =>
  api.post(`/api/draft-followup/${id}`).then(r => r.data);
export const addNote = (id: number, note: string, newPromises?: string[]) =>
  api.post(`/api/leads/${id}/note`, { note, newPromises }).then(r => r.data);
export const markPromiseDone = (id: number, promise: string) =>
  api.post(`/api/leads/${id}/promise-done`, { promise }).then(r => r.data);
export const createLead = (data: any) =>
  api.post("/api/leads", data).then(r => r.data);
export default api;
export const closeDeal = (id: number, outcome: string, closeReason: string) =>
  api.post(`/api/leads/${id}/close`, { outcome, closeReason }).then(r => r.data);
export const getArchive = () =>
  api.get("/api/archive").then(r => r.data);
export const getArchiveStats = () =>
  api.get("/api/archive/stats").then(r => r.data);
export const recallPromises = (id: number) =>
  api.post(`/api/leads/${id}/recall-promises`).then(r => r.data);
export const getAlerts = () =>
  api.get("/api/alerts").then(r => r.data);
export const draftReengagement = (id: number) =>
  api.post(`/api/alerts/${id}/draft-reengagement`).then(r => r.data);
export const getPreCallBrief = (id: number) =>
  api.post(`/api/leads/${id}/pre-call-brief`).then(r => r.data);
export const reopenLead = (id: number) =>
  api.post(`/api/leads/${id}/reopen`).then(r => r.data);
export const searchLeads = (query: string) =>
  api.post("/api/search", { query }).then(r => r.data);
export const getBackendSettings = () =>
  api.get("/api/settings").then(r => r.data);
export const saveBackendSettings = (data: any) =>
  api.post("/api/settings", data).then(r => r.data);