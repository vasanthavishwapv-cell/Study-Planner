// MySQL TiDB Cloud API Client with Authentication & User Scoping

const BASE = "/api";

async function request(path, options = {}) {
  const token = localStorage.getItem("studyflow-token");
  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }


  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: "Request failed" }));
    throw new Error(err.message || "Request failed");
  }
  return res.json();
}

export const api = {
  // Auth API
  login: (data) => request("/auth/login", { method: "POST", body: data }),
  registerRequest: (data) => request("/auth/register-request", { method: "POST", body: data }),
  registerVerify: (data) => request("/auth/register-verify", { method: "POST", body: data }),
  forgotPassword: (data) => request("/auth/forgot-password", { method: "POST", body: data }),
  resetPassword: (data) => request("/auth/reset-password", { method: "POST", body: data }),
  getMe: () => request("/auth/me"),

  // Subjects CRUD
  getSubjects: () => request("/subjects"),
  createSubject: (data) => request("/subjects", { method: "POST", body: data }),
  updateSubject: (id, data) => request(`/subjects/${id}`, { method: "PUT", body: data }),
  deleteSubject: (id) => request(`/subjects/${id}`, { method: "DELETE" }),

  // Tasks CRUD
  getTasks: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/tasks${qs ? "?" + qs : ""}`);
  },
  createTask: (data) => request("/tasks", { method: "POST", body: data }),
  updateTask: (id, data) => request(`/tasks/${id}`, { method: "PUT", body: data }),
  toggleTask: (id) => request(`/tasks/${id}/toggle`, { method: "PATCH" }),
  deleteTask: (id) => request(`/tasks/${id}`, { method: "DELETE" }),
  getTaskStats: () => request("/tasks/stats/summary"),

  // Pomodoro CRUD
  getSessions: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/pomodoro${qs ? "?" + qs : ""}`);
  },
  saveSession: (data) => request("/pomodoro", { method: "POST", body: data }),
  getPomodoroStats: () => request("/pomodoro/stats"),

  // Gemini AI Endpoints
  generateQuiz: (data) => request("/quiz/generate", { method: "POST", body: data }),
  generateNotes: (data) => request("/notes/generate", { method: "POST", body: data }),
  getNotes: () => request("/notes"),
  saveNotes: (data) => request("/notes", { method: "POST", body: data }),
  deleteNote: (id) => request(`/notes/${id}`, { method: "DELETE" }),
};
