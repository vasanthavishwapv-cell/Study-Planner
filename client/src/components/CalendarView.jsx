import { useState, useEffect } from "react";
import {
  format, startOfMonth, endOfMonth, eachDayOfInterval,
  addMonths, subMonths, isSameMonth, isSameDay, parseISO, startOfWeek, endOfWeek
} from "date-fns";
import { api } from "../utils/api";

export default function CalendarView({ addToast }) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [tasks, setTasks] = useState([]);
  const [selectedDay, setSelectedDay] = useState(new Date());
  const [dayTasks, setDayTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getTasks()
      .then(setTasks)
      .catch(() => addToast("Failed to load tasks", "error"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const dateStr = format(selectedDay, "yyyy-MM-dd");
    setDayTasks(tasks.filter((t) => t.date === dateStr));
  }, [selectedDay, tasks]);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
  const calDays = eachDayOfInterval({ start: calStart, end: calEnd });

  const getTasksForDay = (day) => {
    const dateStr = format(day, "yyyy-MM-dd");
    return tasks.filter((t) => t.date === dateStr);
  };

  const today = new Date();

  const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Calendar View</h1>
        <p className="page-subtitle">See all your tasks in a monthly overview</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 20, alignItems: "start" }}>
        {/* Calendar */}
        <div>
          <div className="calendar-header">
            <button className="date-nav-btn" onClick={() => setCurrentMonth((m) => subMonths(m, 1))}>◀</button>
            <div className="calendar-month">{format(currentMonth, "MMMM yyyy")}</div>
            <button className="date-nav-btn" onClick={() => setCurrentMonth((m) => addMonths(m, 1))}>▶</button>
          </div>

          <div className="calendar-grid">
            {/* Weekday headers */}
            <div className="calendar-weekdays">
              {WEEKDAYS.map((d) => (
                <div key={d} className="calendar-weekday">{d}</div>
              ))}
            </div>

            {/* Days */}
            <div className="calendar-days">
              {calDays.map((day) => {
                const dayTaskList = getTasksForDay(day);
                const isOther = !isSameMonth(day, currentMonth);
                const isToday = isSameDay(day, today);
                const isSelected = isSameDay(day, selectedDay);
                return (
                  <div
                    key={day.toISOString()}
                    className={`calendar-day${isOther ? " other-month" : ""}${isToday ? " today" : ""}${isSelected ? " selected" : ""}`}
                    onClick={() => setSelectedDay(day)}
                  >
                    <div className="day-number">{format(day, "d")}</div>
                    <div className="day-tasks">
                      {dayTaskList.slice(0, 3).map((task) => (
                        <div
                          key={task._id}
                          className={`day-task-pill${task.completed ? " completed" : ""}`}
                          style={{
                            background: task.completed ? "rgba(255,255,255,0.06)" : "rgba(99,102,241,0.25)",
                            color: task.completed ? "var(--text-muted)" : "#a5b4fc",
                          }}
                        >
                          {task.title}
                        </div>
                      ))}
                      {dayTaskList.length > 3 && (
                        <div className="day-more">+{dayTaskList.length - 3} more</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Day Detail Panel */}
        <div className="card" style={{ position: "sticky", top: 20 }}>
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontFamily: "Outfit, sans-serif", fontSize: 18, fontWeight: 700 }}>
              {format(selectedDay, "EEEE")}
            </div>
            <div style={{ color: "var(--text-secondary)", fontSize: 14 }}>
              {format(selectedDay, "MMMM d, yyyy")}
            </div>
          </div>

          {dayTasks.length === 0 ? (
            <div className="empty-state" style={{ padding: "24px 0" }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>📅</div>
              <div style={{ fontSize: 13, color: "var(--text-muted)" }}>No tasks this day</div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {dayTasks.map((task) => (
                <div key={task._id} style={{
                  padding: "10px 14px",
                  background: task.completed ? "rgba(255,255,255,0.03)" : "rgba(99,102,241,0.08)",
                  border: `1px solid ${task.completed ? "var(--border)" : "rgba(99,102,241,0.2)"}`,
                  borderRadius: 10,
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 16 }}>{task.completed ? "✅" : "⭕"}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: task.completed ? "var(--text-muted)" : "var(--text-primary)", textDecoration: task.completed ? "line-through" : "none" }}>
                        {task.title}
                      </div>
                      {task.subjectName && (
                        <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>📚 {task.subjectName}</div>
                      )}
                    </div>
                    <div className={`priority-dot priority-${task.priority}`} />
                  </div>
                  {task.startTime && (
                    <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 6, marginLeft: 24 }}>
                      🕐 {task.startTime}{task.endTime ? ` – ${task.endTime}` : ""}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {dayTasks.length > 0 && (
            <div style={{ marginTop: 12, padding: "8px 12px", background: "var(--glass)", borderRadius: 8, fontSize: 12, color: "var(--text-secondary)", display: "flex", justifyContent: "space-between" }}>
              <span>{dayTasks.filter((t) => t.completed).length} completed</span>
              <span>{dayTasks.filter((t) => !t.completed).length} remaining</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
