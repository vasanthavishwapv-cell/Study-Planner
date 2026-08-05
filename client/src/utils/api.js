// Direct MongoDB Atlas API Client

const BASE = "/api";

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...options.headers },
    ...options,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: "Database request failed" }));
    throw new Error(err.message || "Database request failed");
  }
  return res.json();
}

export const api = {
  // Subjects CRUD -> MongoDB Atlas
  getSubjects: () => request("/subjects"),
  createSubject: (data) => request("/subjects", { method: "POST", body: data }),
  updateSubject: (id, data) => request(`/subjects/${id}`, { method: "PUT", body: data }),
  deleteSubject: (id) => request(`/subjects/${id}`, { method: "DELETE" }),

  // Tasks CRUD -> MongoDB Atlas
  getTasks: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/tasks${qs ? "?" + qs : ""}`);
  },
  createTask: (data) => request("/tasks", { method: "POST", body: data }),
  updateTask: (id, data) => request(`/tasks/${id}`, { method: "PUT", body: data }),
  toggleTask: (id) => request(`/tasks/${id}/toggle`, { method: "PATCH" }),
  deleteTask: (id) => request(`/tasks/${id}`, { method: "DELETE" }),
  getTaskStats: () => request("/tasks/stats/summary"),

  // Pomodoro CRUD -> MongoDB Atlas
  getSessions: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/pomodoro${qs ? "?" + qs : ""}`);
  },
  saveSession: (data) => request("/pomodoro", { method: "POST", body: data }),
  getPomodoroStats: () => request("/pomodoro/stats"),
};