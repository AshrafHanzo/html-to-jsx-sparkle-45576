// src/lib/axios.js
import axios from "axios";

/**
 * FRONTEND: Axios instance for DHI API
 * - Set VITE_API_URL in .env (Vite) e.g. VITE_API_URL="http://localhost:30020"
 * - Exports: api (axios instance) + helper functions for jobs & candidates
 */

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:30020";

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: {
    Accept: "application/json",
  },
});

// Optional: add auth header from localStorage or cookie
api.interceptors.request.use(
  (cfg) => {
    const token = localStorage.getItem("token");
    if (token) cfg.headers.Authorization = `Bearer ${token}`;
    return cfg;
  },
  (err) => Promise.reject(err)
);

api.interceptors.response.use(
  (r) => r,
  (err) => {
    // central error handling, map server errors to friendly messages
    if (err.response) {
      // server responded with status
      // you can do global actions here (logout on 401 etc)
    }
    return Promise.reject(err);
  }
);

/* -------------------------
   Jobs endpoints (route.py)
   ------------------------- */
export const jobs = {
  list: () => api.get("/api/jobs").then((res) => res.data),
  create: (payload) => api.post("/api/jobs", payload).then((res) => res.data),
  updateStatus: (jobId, status) =>
    api.patch(`/api/jobs/${jobId}/status`, { status }).then((res) => res.data),
  delete: (jobId) => api.delete(`/api/jobs/${jobId}`).then((res) => res.data),
  ping: () => api.get("/api/debug/ping-jobs").then((res) => res.data),
};

/* -------------------------
   Candidates endpoints (candidates.py)
   - create expects Form with `data` = JSON string and optional resume file
   ------------------------- */
export const candidates = {
  list: (params) =>
    api.get("/api/candidates", { params }).then((res) => res.data),
  get: (id) => api.get(`/api/candidates/${id}`).then((res) => res.data),
  create: async (candidateObj, resumeFile = null) => {
    // candidateObj -> JS object
    const form = new FormData();
    form.append("data", JSON.stringify(candidateObj));
    if (resumeFile) form.append("resume", resumeFile);
    // axios will set Content-Type: multipart/form-data automatically
    const res = await api.post("/api/candidates", form);
    return res.data;
  },
  update: async (id, updateObj, resumeFile = null) => {
    const form = new FormData();
    form.append("data", JSON.stringify(updateObj));
    if (resumeFile) form.append("resume", resumeFile);
    const res = await api.put(`/api/candidates/${id}`, form);
    return res.data;
  },
  updateStatus: (id, status) =>
    api
      .patch(`/api/candidates/${id}/status`, { status })
      .then((res) => res.data),
  delete: (id) => api.delete(`/api/candidates/${id}`).then((res) => res.data),
  downloadResume: (fileName) =>
    api
      .get(`/api/candidates/resume/${fileName}`, { responseType: "blob" })
      .then((res) => res.data),
};

export default api;
