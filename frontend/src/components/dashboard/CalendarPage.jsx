import React, { useState, useMemo } from "react";
import { useAuth } from "../../context/AuthContext";
import { useTasks } from "../../context/TaskContext";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const DAYS_OF_WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function CalendarPage({ onEditTask, onNewTask }) {
  const { isTeamLeader, teamUsers } = useAuth();
  const { tasks, visibleProjects, selectedProject, setSelectedProject, updateTask } = useTasks();

  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [selectedStatusFilter, setSelectedStatusFilter] = useState("all");
  const [selectedMemberFilter, setSelectedMemberFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth(); // 0-indexed

  // Month navigation
  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Helper to normalize task dates to YYYY-MM-DD
  const parseTaskDate = (dueDateStr) => {
    if (!dueDateStr) return null;
    const str = String(dueDateStr).trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
      return str;
    }
    const d = new Date(str);
    if (!isNaN(d.getTime())) {
      return d.toISOString().split("T")[0];
    }
    return null;
  };

  const todayStr = useMemo(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  }, []);

  // Filter tasks based on search, project, status, and member
  const filteredTasks = useMemo(() => {
    return tasks.filter(t => {
      // Project filter
      if (selectedProject && t.project_id !== selectedProject.id) {
        return false;
      }
      // Status filter
      if (selectedStatusFilter !== "all") {
        if (selectedStatusFilter === "overdue") {
          if (t.status === "done" || t.status === "completed") return false;
          const parsed = parseTaskDate(t.due_date);
          if (!parsed || parsed >= todayStr) return false;
        } else if (selectedStatusFilter === "done") {
          if (t.status !== "done" && t.status !== "completed") return false;
        } else if (t.status !== selectedStatusFilter) {
          return false;
        }
      }
      // Member filter
      if (selectedMemberFilter !== "all" && t.assignee !== selectedMemberFilter) {
        return false;
      }
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = t.title?.toLowerCase().includes(q);
        const matchAssignee = t.assignee?.toLowerCase().includes(q);
        const matchProject = t.project_name?.toLowerCase().includes(q);
        if (!matchTitle && !matchAssignee && !matchProject) return false;
      }
      return true;
    });
  }, [tasks, selectedProject, selectedStatusFilter, selectedMemberFilter, searchQuery, todayStr]);

  // Map tasks to dates: { "YYYY-MM-DD": [task1, task2] }
  const tasksByDate = useMemo(() => {
    const map = {};
    filteredTasks.forEach(task => {
      const dStr = parseTaskDate(task.due_date);
      if (dStr) {
        if (!map[dStr]) map[dStr] = [];
        map[dStr].push(task);
      }
    });
    return map;
  }, [filteredTasks]);

  // Tasks without a specific date
  const unscheduledTasks = useMemo(() => {
    return filteredTasks.filter(t => !parseTaskDate(t.due_date));
  }, [filteredTasks]);

  // Calendar grid calculations
  const calendarCells = useMemo(() => {
    const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay(); // 0 for Sunday
    const daysInCurrentMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(currentYear, currentMonth, 0).getDate();

    const cells = [];

    // 1. Previous month trailing days
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const dayNum = daysInPrevMonth - i;
      const prevDate = new Date(currentYear, currentMonth - 1, dayNum);
      const dateStr = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;
      cells.push({
        dayNum,
        dateStr,
        isCurrentMonth: false,
        isToday: dateStr === todayStr
      });
    }

    // 2. Current month days
    for (let day = 1; day <= daysInCurrentMonth; day++) {
      const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      cells.push({
        dayNum: day,
        dateStr,
        isCurrentMonth: true,
        isToday: dateStr === todayStr
      });
    }

    // 3. Next month leading days to complete the 35 or 42 grid
    const totalCells = cells.length > 35 ? 42 : 35;
    const remaining = totalCells - cells.length;
    for (let day = 1; day <= remaining; day++) {
      const nextDate = new Date(currentYear, currentMonth + 1, day);
      const dateStr = `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      cells.push({
        dayNum: day,
        dateStr,
        isCurrentMonth: false,
        isToday: dateStr === todayStr
      });
    }

    return cells;
  }, [currentYear, currentMonth, todayStr]);

  // Monthly statistics
  const monthStats = useMemo(() => {
    const prefix = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}`;
    const inMonthTasks = filteredTasks.filter(t => {
      const d = parseTaskDate(t.due_date);
      return d && d.startsWith(prefix);
    });

    const total = inMonthTasks.length;
    const done = inMonthTasks.filter(t => t.status === "done" || t.status === "completed").length;
    const inProgress = inMonthTasks.filter(t => t.status === "in_progress").length;
    const overdue = inMonthTasks.filter(t => {
      if (t.status === "done" || t.status === "completed") return false;
      const d = parseTaskDate(t.due_date);
      return d && d < todayStr;
    }).length;

    return { total, done, inProgress, overdue };
  }, [filteredTasks, currentYear, currentMonth, todayStr]);

  const handleToggleTaskStatus = async (task, e) => {
    e.stopPropagation();
    const newStatus = task.status === "done" ? "in_progress" : "done";
    await updateTask(task.id, { status: newStatus });
  };

  return (
    <div className="calendar-page-container" style={{ padding: "20px 24px" }}>
      {/* ── HEADER BANNER ───────────────────────────────────────────── */}
      <div className="panel-card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px", marginBottom: "20px" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontSize: "24px" }}>📅</span>
            <h1 style={{ fontSize: "22px", fontWeight: "800", color: "var(--text-main)", letterSpacing: "-0.5px", margin: 0 }}>
              Team Delivery Calendar
            </h1>
            <span className="badge-role-tag badge-leader" style={{ fontSize: "11px", padding: "2px 8px" }}>
              Live Schedule
            </span>
          </div>
          <p style={{ fontSize: "13.5px", color: "var(--text-muted)", margin: "4px 0 0 0" }}>
            Track deliverables and sprint milestones by deadline across all workspace projects
          </p>
        </div>

        {isTeamLeader && (
          <button
            type="button"
            className="btn btn-primary-pill"
            onClick={onNewTask}
            style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
          >
            <span>+ Create Scheduled Task</span>
          </button>
        )}
      </div>

      {/* ── MONTH CONTROLS & DYNAMIC METRICS STRIP ───────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: "16px", alignItems: "center", marginBottom: "16px", flexWrap: "wrap" }}>
        {/* Navigation buttons */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "var(--bg-card)", padding: "6px 10px", borderRadius: "12px", border: "1px solid var(--border-light)" }}>
          <button
            type="button"
            className="btn btn-secondary btn-xs"
            onClick={handlePrevMonth}
            title="Previous Month"
            style={{ padding: "4px 10px", borderRadius: "8px" }}
          >
            &larr; Prev
          </button>
          <span style={{ fontWeight: "800", fontSize: "15px", minWidth: "150px", textAlign: "center", color: "var(--text-main)" }}>
            {MONTH_NAMES[currentMonth]} {currentYear}
          </span>
          <button
            type="button"
            className="btn btn-secondary btn-xs"
            onClick={handleNextMonth}
            title="Next Month"
            style={{ padding: "4px 10px", borderRadius: "8px" }}
          >
            Next &rarr;
          </button>
          <button
            type="button"
            className="btn btn-outline-pill btn-xs"
            onClick={handleToday}
            style={{ marginLeft: "4px", fontSize: "11.5px" }}
          >
            Today
          </button>
        </div>

        {/* Dynamic Metric Pills for this Month */}
        <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap", justifyContent: "flex-end" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", background: "var(--bg-card)", padding: "6px 12px", borderRadius: "10px", border: "1px solid var(--border-light)", fontSize: "12.5px" }}>
            <span style={{ color: "var(--text-muted)" }}>Due in {MONTH_NAMES[currentMonth].slice(0, 3)}:</span>
            <strong style={{ color: "var(--text-main)", fontSize: "13.5px" }}>{monthStats.total}</strong>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", background: "rgba(16,185,129,0.08)", padding: "6px 12px", borderRadius: "10px", border: "1px solid rgba(16,185,129,0.3)", fontSize: "12.5px" }}>
            <span style={{ color: "#10b981", fontWeight: "600" }}>✓ Completed:</span>
            <strong style={{ color: "#10b981", fontSize: "13.5px" }}>{monthStats.done}</strong>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", background: "rgba(91,93,248,0.08)", padding: "6px 12px", borderRadius: "10px", border: "1px solid rgba(91,93,248,0.3)", fontSize: "12.5px" }}>
            <span style={{ color: "var(--primary)", fontWeight: "600" }}>⚡ In Progress:</span>
            <strong style={{ color: "var(--primary)", fontSize: "13.5px" }}>{monthStats.inProgress}</strong>
          </div>
          {monthStats.overdue > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: "6px", background: "rgba(239,68,68,0.08)", padding: "6px 12px", borderRadius: "10px", border: "1px solid rgba(239,68,68,0.3)", fontSize: "12.5px" }}>
              <span style={{ color: "#ef4444", fontWeight: "600" }}>⚠️ Overdue:</span>
              <strong style={{ color: "#ef4444", fontSize: "13.5px" }}>{monthStats.overdue}</strong>
            </div>
          )}
        </div>
      </div>

      {/* ── FILTER & SEARCH TOOLBAR ─────────────────────────────────── */}
      <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap", marginBottom: "16px", background: "var(--bg-card)", padding: "10px 14px", borderRadius: "12px", border: "1px solid var(--border-light)" }}>
        {/* Project Filter */}
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: "600" }}>Project:</span>
          <select
            className="field-select"
            value={selectedProject ? selectedProject.id : "all"}
            onChange={(e) => {
              if (e.target.value === "all") setSelectedProject(null);
              else {
                const found = visibleProjects.find(p => p.id === Number(e.target.value));
                if (found) setSelectedProject(found);
              }
            }}
            style={{ padding: "5px 10px", fontSize: "12.5px", borderRadius: "8px", border: "1px solid var(--border-light)", background: "var(--bg-sidebar)", color: "var(--text-main)" }}
          >
            <option value="all">All Projects ({visibleProjects.length})</option>
            {visibleProjects.map(p => (
              <option key={p.id} value={p.id}>{p.title}</option>
            ))}
          </select>
        </div>

        {/* Status Filter */}
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: "600" }}>Status:</span>
          <select
            className="field-select"
            value={selectedStatusFilter}
            onChange={(e) => setSelectedStatusFilter(e.target.value)}
            style={{ padding: "5px 10px", fontSize: "12.5px", borderRadius: "8px", border: "1px solid var(--border-light)", background: "var(--bg-sidebar)", color: "var(--text-main)" }}
          >
            <option value="all">All Statuses</option>
            <option value="todo">Pending / To Do</option>
            <option value="in_progress">In Progress</option>
            <option value="done">Completed</option>
            <option value="overdue">Overdue Only</option>
          </select>
        </div>

        {/* Member Filter */}
        {teamUsers.length > 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: "600" }}>Assignee:</span>
            <select
              className="field-select"
              value={selectedMemberFilter}
              onChange={(e) => setSelectedMemberFilter(e.target.value)}
              style={{ padding: "5px 10px", fontSize: "12.5px", borderRadius: "8px", border: "1px solid var(--border-light)", background: "var(--bg-sidebar)", color: "var(--text-main)" }}
            >
              <option value="all">All Members ({teamUsers.length})</option>
              {teamUsers.map(u => (
                <option key={u.id} value={u.initials}>{u.name} ({u.initials})</option>
              ))}
            </select>
          </div>
        )}

        {/* Search */}
        <div style={{ marginLeft: "auto", minWidth: "180px" }}>
          <input
            type="text"
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: "100%", padding: "5px 10px", fontSize: "12px", borderRadius: "8px", border: "1px solid var(--border-light)", background: "var(--bg-sidebar)", color: "var(--text-main)" }}
          />
        </div>
      </div>

      {/* ── 7-COLUMN CALENDAR GRID ───────────────────────────────────── */}
      <div style={{ background: "var(--bg-card)", borderRadius: "16px", border: "1px solid var(--border-light)", overflow: "hidden", boxShadow: "var(--shadow-card)" }}>
        {/* Weekday Names Header */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", background: "var(--bg-sidebar)", borderBottom: "1px solid var(--border-light)" }}>
          {DAYS_OF_WEEK.map((day, idx) => (
            <div
              key={day}
              style={{
                padding: "10px",
                textAlign: "center",
                fontWeight: "700",
                fontSize: "12.5px",
                color: idx === 0 || idx === 6 ? "var(--text-muted)" : "var(--text-main)",
                letterSpacing: "0.5px"
              }}
            >
              {day}
            </div>
          ))}
        </div>

        {/* Days Grid Cells */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gridAutoRows: "minmax(110px, auto)" }}>
          {calendarCells.map((cell, idx) => {
            const dayTasks = tasksByDate[cell.dateStr] || [];
            const isToday = cell.isToday;

            return (
              <div
                key={`${cell.dateStr}-${idx}`}
                style={{
                  borderRight: (idx + 1) % 7 === 0 ? "none" : "1px solid var(--border-light)",
                  borderBottom: "1px solid var(--border-light)",
                  padding: "8px",
                  background: isToday
                    ? "rgba(91,93,248,0.03)"
                    : cell.isCurrentMonth
                    ? "var(--bg-card)"
                    : "rgba(248,250,252,0.6)",
                  opacity: cell.isCurrentMonth ? 1 : 0.45,
                  display: "flex",
                  flexDirection: "column",
                  minHeight: "115px",
                  transition: "background 0.15s ease"
                }}
              >
                {/* Day Header Row */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                  <span
                    style={{
                      fontSize: "12px",
                      fontWeight: isToday ? "800" : "600",
                      width: "24px",
                      height: "24px",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      borderRadius: "50%",
                      background: isToday ? "var(--primary)" : "transparent",
                      color: isToday ? "#ffffff" : "var(--text-main)",
                      boxShadow: isToday ? "0 2px 6px rgba(91,93,248,0.3)" : "none"
                    }}
                  >
                    {cell.dayNum}
                  </span>

                  {dayTasks.length > 0 && (
                    <span style={{ fontSize: "10px", fontWeight: "700", padding: "1px 5px", borderRadius: "10px", background: "var(--bg-sidebar)", color: "var(--text-muted)" }}>
                      {dayTasks.length} {dayTasks.length === 1 ? "task" : "tasks"}
                    </span>
                  )}
                </div>

                {/* Task Items inside Day Cell */}
                <div style={{ display: "flex", flexDirection: "column", gap: "4px", overflowY: "auto", flex: 1, maxHeight: "120px" }}>
                  {dayTasks.slice(0, 3).map(task => {
                    const isDone = task.status === "done" || task.status === "completed";
                    const isInProgress = task.status === "in_progress";
                    const isOverdue = !isDone && cell.dateStr < todayStr;

                    return (
                      <div
                        key={task.id}
                        onClick={() => onEditTask && onEditTask(task)}
                        title={`Click to view/edit: ${task.title} (${task.status})`}
                        style={{
                          padding: "4px 6px",
                          borderRadius: "6px",
                          background: isDone
                            ? "rgba(16,185,129,0.12)"
                            : isInProgress
                            ? "rgba(91,93,248,0.12)"
                            : isOverdue
                            ? "rgba(239,68,68,0.12)"
                            : "var(--bg-sidebar)",
                          borderLeft: `3px solid ${
                            isDone ? "#10b981" : isInProgress ? "var(--primary)" : isOverdue ? "#ef4444" : "#94a3b8"
                          }`,
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: "4px",
                          transition: "transform 0.1s ease, box-shadow 0.1s ease"
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "4px", minWidth: 0, flex: 1 }}>
                          {/* Quick Toggle Checkbox */}
                          <span
                            onClick={(e) => handleToggleTaskStatus(task, e)}
                            title={isDone ? "Mark as In Progress" : "Mark as Completed"}
                            style={{
                              fontSize: "11px",
                              cursor: "pointer",
                              color: isDone ? "#10b981" : "var(--text-muted)"
                            }}
                          >
                            {isDone ? "✓" : "○"}
                          </span>

                          <span
                            style={{
                              fontSize: "11px",
                              fontWeight: "600",
                              color: isDone ? "var(--text-muted)" : "var(--text-main)",
                              textDecoration: isDone ? "line-through" : "none",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap"
                            }}
                          >
                            {task.title}
                          </span>
                        </div>

                        {/* Assignee Avatar */}
                        {task.assignee && (
                          <span
                            className="assignee-avatar av-blue"
                            style={{ width: "16px", height: "16px", fontSize: "8px", flexShrink: 0 }}
                          >
                            {task.assignee}
                          </span>
                        )}
                      </div>
                    );
                  })}

                  {dayTasks.length > 3 && (
                    <span style={{ fontSize: "10px", color: "var(--primary)", fontWeight: "600", textAlign: "center" }}>
                      +{dayTasks.length - 3} more
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── UNSCHEDULED TASKS SECTION (Tasks with no deadline) ───────── */}
      {unscheduledTasks.length > 0 && (
        <div style={{ marginTop: "24px", background: "var(--bg-card)", padding: "16px 20px", borderRadius: "14px", border: "1px solid var(--border-light)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
            <div>
              <h3 style={{ fontSize: "14px", fontWeight: "700", color: "var(--text-main)", margin: 0 }}>
                📋 Unscheduled Deliverables ({unscheduledTasks.length})
              </h3>
              <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: "2px 0 0 0" }}>
                Tasks without a specific due date. Click to set deadline and schedule on calendar.
              </p>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "10px" }}>
            {unscheduledTasks.slice(0, 8).map(task => (
              <div
                key={task.id}
                onClick={() => onEditTask && onEditTask(task)}
                style={{
                  padding: "8px 12px",
                  borderRadius: "8px",
                  background: "var(--bg-sidebar)",
                  border: "1px solid var(--border-light)",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "8px"
                }}
              >
                <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  <div style={{ fontSize: "12.5px", fontWeight: "600", color: "var(--text-main)", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {task.title}
                  </div>
                  <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                    {task.project_name || "General"} · {task.priority}
                  </div>
                </div>
                <span className="btn btn-outline-pill btn-xs" style={{ fontSize: "10px", padding: "2px 6px" }}>
                  + Set Date
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
