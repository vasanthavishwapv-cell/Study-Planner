// Unified API client with automatic LocalStorage offline failover
const BASE = "/api";

const LS_KEYS = {
  SUBJECTS: "studyflow_subjects",
  TASKS: "studyflow_tasks",
  POMODORO: "studyflow_pomodoro",
};

const defaultSubjects = [
  { _id: "sub_1", name: "Mathematics", color: "#6366f1", icon: "🧮", goalHours: 40, totalStudied: 12.5, description: "Calculus & Algebra" },
  { _id: "sub_2", name: "Physics", color: "#06b6d4", icon: "🔬", goalHours: 30, totalStudied: 8, description: "Mechanics & Electromagnetism" },
  { _id: "sub_3", name: "Computer Science", color: "#10b981", icon: "💻", goalHours: 50, totalStudied: 22, description: "Data Structures & Algorithms" },
];

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

if (!localStorage.getItem(LS_KEYS.SUBJECTS)) {
  setLS(LS_KEYS.SUBJECTS, defaultSubjects);
}
if (!localStorage.getItem(LS_KEYS.TASKS)) {
  const today = new Date().toISOString().split("T")[0];
  setLS(LS_KEYS.TASKS, [
    { _id: "task_1", title: "Solve Calculus Problem Set 4", subject: "sub_1", subjectName: "Mathematics", date: today, startTime: "09:00", endTime: "10:30", completed: true, priority: "high" },
    { _id: "task_2", title: "Review Binary Search Trees", subject: "sub_3", subjectName: "Computer Science", date: today, startTime: "11:00", endTime: "12:30", completed: false, priority: "high" },
    { _id: "task_3", title: "Read Physics Ch. 3", subject: "sub_2", subjectName: "Physics", date: today, startTime: "14:00", endTime: "15:00", completed: false, priority: "medium" },
  ]);
}
if (!localStorage.getItem(LS_KEYS.POMODORO)) {
  const today = new Date().toISOString().split("T")[0];
  setLS(LS_KEYS.POMODORO, [
    { _id: "pom_1", subjectName: "Mathematics", duration: 25, type: "work", date: today, completedAt: new Date().toISOString() },
    { _id: "pom_2", subjectName: "Computer Science", duration: 25, type: "work", date: today, completedAt: new Date().toISOString() },
  ]);
}

async function request(path, options = {}, fallbackFn) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);
    const res = await fetch(`${BASE}${path}`, {
      headers: { "Content-Type": "application/json", ...options.headers },
      signal: controller.signal,
      ...options,
      body: options.body ? JSON.stringify(options.body) : undefined,
    });
    clearTimeout(timeoutId);
    if (!res.ok) throw new Error("API response error");
    return await res.json();
  } catch (err) {
    return fallbackFn();
  }
}

export const api = {
  // Subjects
  getSubjects: () =>
    request("/subjects", {}, () => getLS(LS_KEYS.SUBJECTS, [])),

  createSubject: (data) =>
    request("/subjects", { method: "POST", body: data }, () => {
      const list = getLS(LS_KEYS.SUBJECTS, []);
      const newItem = { _id: "sub_" + Date.now(), totalStudied: 0, ...data };
      list.push(newItem);
      setLS(LS_KEYS.SUBJECTS, list);
      return newItem;
    }),

  updateSubject: (id, data) =>
    request(`/subjects/${id}`, { method: "PUT", body: data }, () => {
      let list = getLS(LS_KEYS.SUBJECTS, []);
      list = list.map((s) => (s._id === id ? { ...s, ...data } : s));
      setLS(LS_KEYS.SUBJECTS, list);
      return list.find((s) => s._id === id);
    }),

  deleteSubject: (id) =>
    request(`/subjects/${id}`, { method: "DELETE" }, () => {
      let list = getLS(LS_KEYS.SUBJECTS, []);
      list = list.filter((s) => s._id !== id);
      setLS(LS_KEYS.SUBJECTS, list);
      return { message: "Subject deleted" };
    }),

  // Tasks
  getTasks: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/tasks${qs ? "?" + qs : ""}`, {}, () => {
      let tasks = getLS(LS_KEYS.TASKS, []);
      if (params.date) tasks = tasks.filter((t) => t.date === params.date);
      if (params.subject) tasks = tasks.filter((t) => t.subject === params.subject);
      return tasks;
    });
  },

  createTask: (data) =>
    request("/tasks", { method: "POST", body: data }, () => {
      const list = getLS(LS_KEYS.TASKS, []);
      const newItem = { _id: "task_" + Date.now(), completed: false, ...data };
      list.push(newItem);
      setLS(LS_KEYS.TASKS, list);
      return newItem;
    }),

  updateTask: (id, data) =>
    request(`/tasks/${id}`, { method: "PUT", body: data }, () => {
      let list = getLS(LS_KEYS.TASKS, []);
      list = list.map((t) => (t._id === id ? { ...t, ...data } : t));
      setLS(LS_KEYS.TASKS, list);
      return list.find((t) => t._id === id);
    }),

  toggleTask: (id) =>
    request(`/tasks/${id}/toggle`, { method: "PATCH" }, () => {
      let list = getLS(LS_KEYS.TASKS, []);
      let updated;
      list = list.map((t) => {
        if (t._id === id) {
          updated = { ...t, completed: !t.completed };
          return updated;
        }
        return t;
      });
      setLS(LS_KEYS.TASKS, list);
      return updated;
    }),

  deleteTask: (id) =>
    request(`/tasks/${id}`, { method: "DELETE" }, () => {
      let list = getLS(LS_KEYS.TASKS, []);
      list = list.filter((t) => t._id !== id);
      setLS(LS_KEYS.TASKS, list);
      return { message: "Task deleted" };
    }),

  getTaskStats: () =>
    request("/tasks/stats/summary", {}, () => {
      const tasks = getLS(LS_KEYS.TASKS, []);
      const today = new Date().toISOString().split("T")[0];
      return {
        total: tasks.length,
        completed: tasks.filter((t) => t.completed).length,
        todayTotal: tasks.filter((t) => t.date === today).length,
        todayCompleted: tasks.filter((t) => t.date === today && t.completed).length,
      };
    }),

  // Pomodoro
  getSessions: (params = {}) =>
    request(`/pomodoro${params.date ? "?date=" + params.date : ""}`, {}, () => {
      let sessions = getLS(LS_KEYS.POMODORO, []);
      if (params.date) sessions = sessions.filter((s) => s.date === params.date);
      return sessions;
    }),

  saveSession: (data) =>
    request("/pomodoro", { method: "POST", body: data }, () => {
      const sessions = getLS(LS_KEYS.POMODORO, []);
      const newSession = { _id: "pom_" + Date.now(), completedAt: new Date().toISOString(), ...data };
      sessions.unshift(newSession);
      setLS(LS_KEYS.POMODORO, sessions);

      if (data.subject || data.subjectName) {
        let subs = getLS(LS_KEYS.SUBJECTS, []);
        subs = subs.map((s) => {
          if (s._id === data.subject || s.name === data.subjectName) {
            return { ...s, totalStudied: (s.totalStudied || 0) + (data.duration || 25) / 60 };
          }
          return s;
        });
        setLS(LS_KEYS.SUBJECTS, subs);
      }

      return newSession;
    }),

  getPomodoroStats: () =>
    request("/pomodoro/stats", {}, () => {
      const sessions = getLS(LS_KEYS.POMODORO, []).filter((s) => s.type === "work");
      const totalSessions = sessions.length;
      const totalMinutes = sessions.reduce((sum, s) => sum + (s.duration || 25), 0);

      const byDate = {};
      sessions.forEach((s) => {
        byDate[s.date] = (byDate[s.date] || 0) + (s.duration || 25);
      });

      const last7Days = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split("T")[0];
        last7Days.push({ date: dateStr, minutes: byDate[dateStr] || 0 });
      }

      return { totalSessions, totalMinutes, last7Days };
    }),
};