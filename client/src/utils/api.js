const LIVE_BACKEND = "https://2d5e652307d950cc-152-57-82-101.serveousercontent.com";

const BASE = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api`
  : window.location.hostname === "localhost"
  ? "/api"
  : `${LIVE_BACKEND}/api`;

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...options.headers },
    ...options,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: "Network error" }));
    throw new Error(err.message || "Request failed");
  }
  return res.json();
}

export const api = {
  // Subjects
  getSubjects: () => request("/subjects"),
  createSubject: (data) => request("/subjects", { method: "POST", body: data }),
  updateSubject: (id, data) => request(`/subjects/${id}`, { method: "PUT", body: data }),
  deleteSubject: (id) => request(`/subjects/${id}`, { method: "DELETE" }),

  // Tasks
  getTasks: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/tasks${qs ? "?" + qs : ""}`);
  },
  createTask: (data) => request("/tasks", { method: "POST", body: data }),
  updateTask: (id, data) => request(`/tasks/${id}`, { method: "PUT", body: data }),
  toggleTask: (id) => request(`/tasks/${id}/toggle`, { method: "PATCH" }),
  deleteTask: (id) => request(`/tasks/${id}`, { method: "DELETE" }),
  getTaskStats: () => request("/tasks/stats/summary"),

  // Pomodoro
  getSessions: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/pomodoro${qs ? "?" + qs : ""}`);
  },
  saveSession: (data) => request("/pomodoro", { method: "POST", body: data }),
  getPomodoroStats: () => request("/pomodoro/stats"),
};