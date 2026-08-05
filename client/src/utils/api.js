// Direct MongoDB Atlas API client with live cache synchronization
const BASE = "/api";

const LS_KEYS = {
  SUBJECTS: "studyflow_subjects",
  TASKS: "studyflow_tasks",
  POMODORO: "studyflow_pomodoro",
};

function getLS(key, defaultVal) {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultVal;
  } catch {
    return defaultVal;
  }
}

function setLS(key, val) {
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch {}
}

async function request(path, options = {}, lsKey) {
  try {
    const res = await fetch(`${BASE}${path}`, {
      headers: { "Content-Type": "application/json", ...options.headers },
      ...options,
      body: options.body ? JSON.stringify(options.body) : undefined,
    });
    if (!res.ok) throw new Error("API error");
    const data = await res.json();
    
    // Sync fresh MongoDB Atlas data to LocalStorage cache
    if (lsKey && Array.isArray(data)) {
      setLS(lsKey, data);
    }
    return data;
  } catch (err) {
    // If backend is unreachable, fallback to cached LocalStorage
    return lsKey ? getLS(lsKey, []) : [];
  }
}

export const api = {
  // Subjects CRUD -> Direct MongoDB Atlas
  getSubjects: () => request("/subjects", {}, LS_KEYS.SUBJECTS),
  createSubject: (data) => request("/subjects", { method: "POST", body: data }),
  updateSubject: (id, data) => request(`/subjects/${id}`, { method: "PUT", body: data }),
  deleteSubject: (id) => request(`/subjects/${id}`, { method: "DELETE" }),

  // Tasks CRUD -> Direct MongoDB Atlas
  getTasks: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/tasks${qs ? "?" + qs : ""}`, {}, LS_KEYS.TASKS);
  },
  createTask: (data) => request("/tasks", { method: "POST", body: data }),
  updateTask: (id, data) => request(`/tasks/${id}`, { method: "PUT", body: data }),
  toggleTask: (id) => request(`/tasks/${id}/toggle`, { method: "PATCH" }),
  deleteTask: (id) => request(`/tasks/${id}`, { method: "DELETE" }),
  getTaskStats: () => request("/tasks/stats/summary"),

  // Pomodoro CRUD -> Direct MongoDB Atlas
  getSessions: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/pomodoro${qs ? "?" + qs : ""}`, {}, LS_KEYS.POMODORO);
  },
  saveSession: (data) => request("/pomodoro", { method: "POST", body: data }),
  getPomodoroStats: () => request("/pomodoro/stats"),
};