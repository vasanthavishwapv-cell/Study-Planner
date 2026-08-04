import { useState, useEffect } from "react";
import { format, addDays, subDays, parseISO } from "date-fns";
import { api } from "../utils/api";

function TaskModal({ task, subjects, onClose, onSave }) {
  const [form, setForm] = useState({
    title: task?.title || "",
    subject: task?.subject?._id || task?.subject || "",
    subjectName: task?.subjectName || "",
    startTime: task?.startTime || "",
    endTime: task?.endTime || "",
    priority: task?.priority || "medium",
    notes: task?.notes || "",
  });

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubjectChange = (e) => {
    const id = e.target.value;
    const sub = subjects.find((s) => s._id === id);
    setForm((f) => ({ ...f, subject: id, subjectName: sub?.name || "" }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    onSave(form);
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h2 className="modal-title">{task ? "Edit Task" : "Add Task"}</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Task Title *</label>
            <input className="form-input" value={form.title} onChange={set("title")} placeholder="What will you study?" required />
          </div>
          <div className="form-group">
            <label className="form-label">Subject</label>
            <select className="form-select" value={form.subject} onChange={handleSubjectChange}>
              <option value="">No subject</option>
              {subjects.map((s) => <option key={s._id} value={s._id}>{s.icon} {s.name}</option>)}
            </select>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Start Time</label>
              <input className="form-input" type="time" value={form.startTime} onChange={set("startTime")} />
            </div>
            <div className="form-group">
              <label className="form-label">End Time</label>
              <input className="form-input" type="time" value={form.endTime} onChange={set("endTime")} />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Priority</label>
            <select className="form-select" value={form.priority} onChange={set("priority")}>
              <option value="high">🔴 High</option>
              <option value="medium">🟡 Medium</option>
              <option value="low">🟢 Low</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Notes</label>
            <textarea className="form-textarea" value={form.notes} onChange={set("notes")} placeholder="Any notes..." />
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary">💾 Save</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function DailyPlanner({ addToast }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [tasks, setTasks] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editTask, setEditTask] = useState(null);

  const dateStr = format(currentDate, "yyyy-MM-dd");

  const load = async () => {
    setLoading(true);
    try {
      const [t, s] = await Promise.all([
        api.getTasks({ date: dateStr }),
        api.getSubjects(),
      ]);
      setTasks(t);
      setSubjects(s);
    } catch {
      addToast("Failed to load tasks", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [dateStr]);

  const handleSave = async (form) => {
    try {
      if (editTask) {
        await api.updateTask(editTask._id, { ...form, date: dateStr });
        addToast("Task updated!", "success");
      } else {
        await api.createTask({ ...form, date: dateStr });
        addToast("Task added!", "success");
      }
      setShowModal(false);
      setEditTask(null);
      load();
    } catch (e) {
      addToast(e.message, "error");
    }
  };

  const toggleTask = async (id) => {
    try {
      const updated = await api.toggleTask(id);
      setTasks((prev) => prev.map((t) => t._id === id ? updated : t));
    } catch {
      addToast("Failed to update task", "error");
    }
  };

  const deleteTask = async (id) => {
    if (!confirm("Delete this task?")) return;
    try {
      await api.deleteTask(id);
      addToast("Task deleted", "success");
      load();
    } catch {
      addToast("Failed to delete", "error");
    }
  };

  const completed = tasks.filter((t) => t.completed).length;
  const isToday = format(new Date(), "yyyy-MM-dd") === dateStr;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Daily Planner</h1>
        <p className="page-subtitle">Plan and track your study sessions</p>
      </div>

      <div className="planner-header">
        <div className="date-nav">
          <button className="date-nav-btn" onClick={() => setCurrentDate((d) => subDays(d, 1))}>◀</button>
          <div>
            <div className="date-display">{format(currentDate, "EEEE, MMMM d")}</div>
            {isToday && <div style={{ textAlign: "center", fontSize: 11, color: "var(--accent-primary)", fontWeight: 600, letterSpacing: 1 }}>TODAY</div>}
          </div>
          <button className="date-nav-btn" onClick={() => setCurrentDate((d) => addDays(d, 1))}>▶</button>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {tasks.length > 0 && (
            <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>
              {completed}/{tasks.length} done
            </div>
          )}
          <button className="btn btn-secondary btn-sm" onClick={() => setCurrentDate(new Date())}>Today</button>
          <button className="btn btn-primary" onClick={() => { setEditTask(null); setShowModal(true); }}>
            ＋ Add Task
          </button>
        </div>
      </div>

      {/* Progress bar */}
      {tasks.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <div className="progress-bar-container" style={{ height: 6 }}>
            <div className="progress-bar-fill" style={{ width: `${(completed / tasks.length) * 100}%`, background: "linear-gradient(90deg, var(--accent-primary), var(--accent-emerald))" }} />
          </div>
          <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4, textAlign: "right" }}>{Math.round((completed / tasks.length) * 100)}% complete</div>
        </div>
      )}

      {loading ? (
        <div className="loading-full"><div className="loading-spinner" /><span>Loading tasks...</span></div>
      ) : tasks.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📋</div>
          <div className="empty-state-title">No tasks for this day</div>
          <div className="empty-state-desc">Add study tasks to plan your day effectively.</div>
          <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => setShowModal(true)}>＋ Add First Task</button>
        </div>
      ) : (
        <div className="task-list">
          {tasks
            .sort((a, b) => {
              const pri = { high: 0, medium: 1, low: 2 };
              if (a.completed !== b.completed) return a.completed ? 1 : -1;
              return (pri[a.priority] || 1) - (pri[b.priority] || 1);
            })
            .map((task) => (
              <div key={task._id} className="task-item" style={{ opacity: task.completed ? 0.7 : 1 }}>
                <div className={`task-checkbox${task.completed ? " checked" : ""}`} onClick={() => toggleTask(task._id)}>
                  {task.completed && <span style={{ color: "white", fontSize: 12, fontWeight: 700 }}>✓</span>}
                </div>
                <div className="task-content">
                  <div className={`task-title${task.completed ? " completed" : ""}`}>{task.title}</div>
                  <div className="task-meta">
                    <div className={`priority-dot priority-${task.priority}`} />
                    <span className="task-meta-item" style={{ textTransform: "capitalize" }}>{task.priority}</span>
                    {task.subjectName && <span className="task-meta-item">📚 {task.subjectName}</span>}
                    {task.startTime && <span className="task-meta-item">🕐 {task.startTime}{task.endTime ? ` - ${task.endTime}` : ""}</span>}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  <button className="btn btn-icon btn-sm" onClick={() => { setEditTask(task); setShowModal(true); }}>✏️</button>
                  <button className="btn btn-icon btn-sm" onClick={() => deleteTask(task._id)}>🗑️</button>
                </div>
              </div>
            ))}
        </div>
      )}

      {showModal && (
        <TaskModal
          task={editTask}
          subjects={subjects}
          onClose={() => { setShowModal(false); setEditTask(null); }}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
