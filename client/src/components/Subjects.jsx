import { useState, useEffect } from "react";
import { api } from "../utils/api";

const COLORS = ["#6366f1","#8b5cf6","#ec4899","#06b6d4","#10b981","#f59e0b","#f43f5e","#14b8a6","#a855f7","#f97316"];
const ICONS = ["📚","🔬","🧮","🌍","🎨","💻","⚗️","📖","🎵","🏛️","✏️","🧬","🌱","🎭","🔭"];

function SubjectModal({ subject, onClose, onSave }) {
  const [form, setForm] = useState({
    name: subject?.name || "",
    color: subject?.color || COLORS[0],
    icon: subject?.icon || ICONS[0],
    goalHours: subject?.goalHours || 10,
    description: subject?.description || "",
  });

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    onSave(form);
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h2 className="modal-title">{subject ? "Edit Subject" : "Add Subject"}</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Subject Name *</label>
            <input className="form-input" value={form.name} onChange={set("name")} placeholder="e.g. Mathematics" required />
          </div>
          <div className="form-group">
            <label className="form-label">Icon</label>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {ICONS.map((ic) => (
                <button key={ic} type="button" onClick={() => setForm((f) => ({ ...f, icon: ic }))}
                  style={{ width: 36, height: 36, borderRadius: 8, border: `2px solid ${form.icon === ic ? "var(--accent-primary)" : "var(--border)"}`, background: "var(--glass)", cursor: "pointer", fontSize: 18 }}>
                  {ic}
                </button>
              ))}
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Color</label>
            <div className="color-picker-row">
              {COLORS.map((c) => (
                <div key={c} className={`color-swatch${form.color === c ? " selected" : ""}`}
                  style={{ background: c }} onClick={() => setForm((f) => ({ ...f, color: c }))} />
              ))}
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Goal Hours</label>
            <input className="form-input" type="number" min="0" max="9999" value={form.goalHours} onChange={set("goalHours")} />
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea className="form-textarea" value={form.description} onChange={set("description")} placeholder="Brief description..." />
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


const formatStudiedTime = (hours) => {
  const totalMins = Math.round((hours || 0) * 60);
  if (totalMins === 0) return "0m";
  if (totalMins < 60) {
    return totalMins + "m";
  }
  return (totalMins / 60).toFixed(1) + "h";
};

export default function Subjects({ addToast }) {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editSubject, setEditSubject] = useState(null);

  const load = async () => {
    try {
      const data = await api.getSubjects();
      setSubjects(data);
    } catch {
      addToast("Failed to load subjects", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleSave = async (form) => {
    try {
      if (editSubject) {
        await api.updateSubject(editSubject._id, form);
        addToast("Subject updated!", "success");
      } else {
        await api.createSubject(form);
        addToast("Subject added!", "success");
      }
      setShowModal(false);
      setEditSubject(null);
      load();
    } catch (e) {
      addToast(e.message, "error");
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this subject?")) return;
    try {
      await api.deleteSubject(id);
      addToast("Subject deleted", "success");
      load();
    } catch {
      addToast("Failed to delete", "error");
    }
  };

  return (
    <div>
      <div className="page-header" style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <div>
          <h1 className="page-title">Study Subjects</h1>
          <p className="page-subtitle">Manage your subjects and track goals</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setEditSubject(null); setShowModal(true); }}>
          ＋ Add Subject
        </button>
      </div>

      {loading ? (
        <div className="loading-full"><div className="loading-spinner" /><span>Loading subjects...</span></div>
      ) : subjects.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📚</div>
          <div className="empty-state-title">No subjects yet</div>
          <div className="empty-state-desc">Add your first study subject to get started tracking your progress.</div>
          <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => setShowModal(true)}>＋ Add Subject</button>
        </div>
      ) : (
        <div className="subjects-grid">
          {subjects.map((sub) => {
            const pct = sub.goalHours > 0 ? Math.min(100, (sub.totalStudied / sub.goalHours) * 100) : 0;
            return (
              <div key={sub._id} className="subject-card" style={{ "--subject-color": sub.color }}>
                <div className="subject-card-header">
                  <div className="subject-icon" style={{ background: `${sub.color}25` }}>{sub.icon}</div>
                  <div className="subject-actions">
                    <button className="btn btn-icon btn-sm" onClick={() => { setEditSubject(sub); setShowModal(true); }}>✏️</button>
                    <button className="btn btn-icon btn-sm" onClick={() => handleDelete(sub._id)}>🗑️</button>
                  </div>
                </div>
                <div className="subject-name">{sub.name}</div>
                {sub.description && <div className="subject-desc">{sub.description}</div>}
                <div className="subject-progress-label">
                  <span>{formatStudiedTime(sub.totalStudied)} studied</span>
                  <span>Goal: {sub.goalHours}h</span>
                </div>
                <div className="progress-bar-container">
                  <div className="progress-bar-fill" style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${sub.color}, ${sub.color}aa)` }} />
                </div>
                <div style={{ marginTop: 8, fontSize: 12, color: "var(--text-muted)", textAlign: "right" }}>{Math.round(pct)}% complete</div>
              </div>
            );
          })}
        </div>
      )}

      {showModal && (
        <SubjectModal
          subject={editSubject}
          onClose={() => { setShowModal(false); setEditSubject(null); }}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
