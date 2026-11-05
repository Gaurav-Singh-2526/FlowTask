import React, { useState, useMemo } from "react";
import { useAuth } from "../../context/AuthContext";
import { useTasks } from "../../context/TaskContext";

export default function TeamTasksPage({ onNewTask, onEditTask, onRespondTask }) {
  const { currentUser, isTeamLeader, teamUsers } = useAuth();
  const {
    tasks,
    updateTask,
    deleteTask,
    setEditModalTask,
    taskStatusFilter,
    setTaskStatusFilter,
    activeMemberFilter,
    setActiveMemberFilter,
    setInspectedMember
  } = useTasks();

  const [searchQuery, setSearchQuery] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [memberFilter, setMemberFilter] = useState("all");

  const todayStr = useMemo(() => new Date().toISOString().split("T")[0], []);

  const isOverdue = (task) => {
    if (task.status === "done" || task.status === "completed") return false;
    if (!task.due_date) return false;
    const due = String(task.due_date).trim();
    const dueDate = new Date(due);
    if (!isNaN(dueDate.getTime())) {
      const todayDate = new Date();
      todayDate.setHours(0, 0, 0, 0);
      return dueDate < todayDate;
    }
    return due < todayStr;
  };

  // Real database-driven counts for filter pills
  const counts = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter(t => t.status === "done" || t.status === "completed").length;
    const inProgress = tasks.filter(t => t.status === "in_progress").length;
    const overdue = tasks.filter(isOverdue).length;
    const pending = tasks.filter(t => t.status === "todo" || t.status === "backlog" || t.status === "review").length;
    return { total, completed, inProgress, overdue, pending };
  }, [tasks, todayStr]);

  // Handle status update (Completed, In Progress, Pending)
  const handleStatusChange = async (task, newStatus) => {
    if (!isTeamLeader && task.assignee !== currentUser?.initials) {
      alert("Permission Denied: You can only update your own assigned tasks.");
      return;
    }
    await updateTask(task.id, { ...task, status: newStatus });
  };

  const handleToggleDone = async (task) => {
    if (!isTeamLeader && task.assignee !== currentUser?.initials) return;
    const nextStatus = task.status === "done" ? "todo" : "done";
    await updateTask(task.id, { ...task, status: nextStatus });
  };

  // Filter tasks dynamically
  const displayedTasks = useMemo(() => {
    return tasks.filter(task => {
      // 1. Status Filter
      if (taskStatusFilter === "done" && !(task.status === "done" || task.status === "completed")) return false;
      if (taskStatusFilter === "in_progress" && task.status !== "in_progress") return false;
      if (taskStatusFilter === "overdue" && !isOverdue(task)) return false;
      if (taskStatusFilter === "todo" && !(task.status === "todo" || task.status === "backlog" || task.status === "review")) return false;
      if (taskStatusFilter === "pending" && !(task.status === "todo" || task.status === "backlog" || task.status === "review")) return false;

      // 2. Priority Filter
      if (priorityFilter !== "all" && task.priority !== priorityFilter) return false;

      // 3. Member Filter
      if (memberFilter !== "all" && task.assignee !== memberFilter) return false;
      if (activeMemberFilter && task.assignee !== activeMemberFilter) return false;

      // 4. Search Query (matches title, description, assignee, priority)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const titleMatch = (task.title || "").toLowerCase().includes(q);
        const descMatch = (task.description || "").toLowerCase().includes(q);
        const assigneeMatch = (task.assignee || "").toLowerCase().includes(q);
        const priorityMatch = (task.priority || "").toLowerCase().includes(q);
        if (!titleMatch && !descMatch && !assigneeMatch && !priorityMatch) return false;
      }

      return true;
    });
  }, [tasks, taskStatusFilter, priorityFilter, memberFilter, activeMemberFilter, searchQuery, todayStr]);

  const getAssigneeUser = (initials) => {
    return teamUsers.find(u => u.initials === initials) || { name: initials, initials, color: "av-blue" };
  };

  return (
    <div className="team-tasks-page-wrapper" style={{ padding: "4px 0 30px" }}>
      {/* ── HEADER ROW: Title + Controls (No unrelated graphs/stats) ── */}
      <div
        className="team-tasks-header"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "14px",
          marginBottom: "18px",
          background: "var(--bg-card)",
          padding: "18px 22px",
          borderRadius: "14px",
          border: "1px solid var(--border-light)",
          boxShadow: "0 1px 3px rgba(0,0,0,0.03)"
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <h1 style={{ fontSize: "20px", fontWeight: "800", color: "var(--text-main)", margin: 0, letterSpacing: "-0.4px" }}>
              {isTeamLeader ? "Team Tasks & Deliverables" : "My Assigned Tasks"}
            </h1>
            <span
              style={{
                fontSize: "12px",
                fontWeight: "700",
                background: "rgba(79, 70, 229, 0.1)",
                color: "var(--primary)",
                padding: "2px 10px",
                borderRadius: "9999px"
              }}
            >
              {displayedTasks.length} {displayedTasks.length === 1 ? "task" : "tasks"}
            </span>
          </div>
          <p style={{ fontSize: "13px", color: "var(--text-muted)", marginTop: "4px", marginBottom: 0 }}>
            {taskStatusFilter !== "all" ? (
              <span>Filtered by status: <strong style={{ textTransform: "capitalize", color: "var(--text-main)" }}>{taskStatusFilter.replace("_", " ")}</strong></span>
            ) : (
              <span>Showing all workspace tasks · Search, filter, and manage deliverables</span>
            )}
          </p>
        </div>

        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          {isTeamLeader && onNewTask && (
            <button
              type="button"
              className="btn btn-primary-pill"
              onClick={onNewTask}
              style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "8px 16px", fontWeight: "700" }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
              <span>+ Add Task</span>
            </button>
          )}
        </div>
      </div>

      {/* ── FILTER & SEARCH TOOLBAR ── */}
      <div
        className="team-tasks-toolbar"
        style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border-light)",
          borderRadius: "14px",
          padding: "16px 20px",
          marginBottom: "18px",
          display: "flex",
          flexDirection: "column",
          gap: "14px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.02)"
        }}
      >
        {/* Search input + Dropdown filters */}
        <div style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
          {/* Search bar */}
          <div style={{ flex: 1, minWidth: "260px", position: "relative", display: "flex", alignItems: "center" }}>
            <svg
              style={{ position: "absolute", left: "12px", color: "var(--text-muted)", pointerEvents: "none" }}
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input
              type="text"
              placeholder="Search tasks by name, assignee, priority..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: "100%",
                padding: "9px 36px 9px 38px",
                borderRadius: "8px",
                border: "1.5px solid var(--border-light)",
                background: "var(--bg-app)",
                color: "var(--text-main)",
                fontSize: "13.5px"
              }}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                style={{
                  position: "absolute",
                  right: "10px",
                  background: "transparent",
                  border: "none",
                  color: "var(--text-muted)",
                  cursor: "pointer",
                  fontSize: "14px",
                  padding: "4px"
                }}
                title="Clear search"
              >
                ✕
              </button>
            )}
          </div>

          {/* Priority filter */}
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <label style={{ fontSize: "12.5px", fontWeight: "600", color: "var(--text-muted)" }}>Priority:</label>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              style={{
                padding: "8px 12px",
                borderRadius: "8px",
                border: "1.5px solid var(--border-light)",
                background: "var(--bg-card)",
                color: "var(--text-main)",
                fontSize: "13px",
                cursor: "pointer"
              }}
            >
              <option value="all">All Priorities</option>
              <option value="urgent">Urgent</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>

          {/* Assignee filter (Leader only) */}
          {isTeamLeader && (
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <label style={{ fontSize: "12.5px", fontWeight: "600", color: "var(--text-muted)" }}>Assignee:</label>
              <select
                value={memberFilter}
                onChange={(e) => setMemberFilter(e.target.value)}
                style={{
                  padding: "8px 12px",
                  borderRadius: "8px",
                  border: "1.5px solid var(--border-light)",
                  background: "var(--bg-card)",
                  color: "var(--text-main)",
                  fontSize: "13px",
                  cursor: "pointer"
                }}
              >
                <option value="all">All Members</option>
                {teamUsers.filter(u => u.role !== "Team Leader").map(u => (
                  <option key={u.id} value={u.initials}>{u.name} ({u.initials})</option>
                ))}
              </select>
            </div>
          )}

          {(searchQuery || priorityFilter !== "all" || memberFilter !== "all" || taskStatusFilter !== "all" || activeMemberFilter) && (
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => {
                setSearchQuery("");
                setPriorityFilter("all");
                setMemberFilter("all");
                setTaskStatusFilter("all");
                if (setActiveMemberFilter) setActiveMemberFilter(null);
              }}
              style={{ borderRadius: "8px", padding: "7px 12px" }}
            >
              Reset Filters
            </button>
          )}
        </div>

        {/* Status Filter Pills Row */}
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center", paddingTop: "4px", borderTop: "1px solid var(--border-subtle)" }}>
          <span style={{ fontSize: "12px", fontWeight: "700", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px", marginRight: "4px" }}>
            Status:
          </span>

          <button
            type="button"
            className={`btn-filter-pill ${taskStatusFilter === "all" ? "is-active" : ""}`}
            onClick={() => setTaskStatusFilter("all")}
            style={{
              padding: "5px 12px",
              borderRadius: "9999px",
              fontSize: "12px",
              fontWeight: "600",
              cursor: "pointer",
              border: taskStatusFilter === "all" ? "1.5px solid var(--primary)" : "1.5px solid var(--border-light)",
              background: taskStatusFilter === "all" ? "var(--primary)" : "var(--bg-app)",
              color: taskStatusFilter === "all" ? "#ffffff" : "var(--text-body)"
            }}
          >
            All Tasks ({counts.total})
          </button>

          <button
            type="button"
            className={`btn-filter-pill ${taskStatusFilter === "done" ? "is-active" : ""}`}
            onClick={() => setTaskStatusFilter("done")}
            style={{
              padding: "5px 12px",
              borderRadius: "9999px",
              fontSize: "12px",
              fontWeight: "600",
              cursor: "pointer",
              border: taskStatusFilter === "done" ? "1.5px solid #10b981" : "1.5px solid var(--border-light)",
              background: taskStatusFilter === "done" ? "#10b981" : "var(--bg-app)",
              color: taskStatusFilter === "done" ? "#ffffff" : "#10b981"
            }}
          >
            ✓ Completed ({counts.completed})
          </button>

          <button
            type="button"
            className={`btn-filter-pill ${taskStatusFilter === "in_progress" ? "is-active" : ""}`}
            onClick={() => setTaskStatusFilter("in_progress")}
            style={{
              padding: "5px 12px",
              borderRadius: "9999px",
              fontSize: "12px",
              fontWeight: "600",
              cursor: "pointer",
              border: taskStatusFilter === "in_progress" ? "1.5px solid var(--primary)" : "1.5px solid var(--border-light)",
              background: taskStatusFilter === "in_progress" ? "var(--primary)" : "var(--bg-app)",
              color: taskStatusFilter === "in_progress" ? "#ffffff" : "var(--primary)"
            }}
          >
            ⚡ In Progress ({counts.inProgress})
          </button>

          <button
            type="button"
            className={`btn-filter-pill ${taskStatusFilter === "todo" || taskStatusFilter === "pending" ? "is-active" : ""}`}
            onClick={() => setTaskStatusFilter("todo")}
            style={{
              padding: "5px 12px",
              borderRadius: "9999px",
              fontSize: "12px",
              fontWeight: "600",
              cursor: "pointer",
              border: taskStatusFilter === "todo" || taskStatusFilter === "pending" ? "1.5px solid #64748b" : "1.5px solid var(--border-light)",
              background: taskStatusFilter === "todo" || taskStatusFilter === "pending" ? "#64748b" : "var(--bg-app)",
              color: taskStatusFilter === "todo" || taskStatusFilter === "pending" ? "#ffffff" : "var(--text-body)"
            }}
          >
            ⏳ Pending ({counts.pending})
          </button>

          <button
            type="button"
            className={`btn-filter-pill ${taskStatusFilter === "overdue" ? "is-active" : ""}`}
            onClick={() => setTaskStatusFilter("overdue")}
            style={{
              padding: "5px 12px",
              borderRadius: "9999px",
              fontSize: "12px",
              fontWeight: "600",
              cursor: "pointer",
              border: taskStatusFilter === "overdue" ? "1.5px solid #ef4444" : "1.5px solid var(--border-light)",
              background: taskStatusFilter === "overdue" ? "#ef4444" : "rgba(239, 68, 68, 0.08)",
              color: taskStatusFilter === "overdue" ? "#ffffff" : "#ef4444"
            }}
          >
            ⚠️ Overdue ({counts.overdue})
          </button>
        </div>
      </div>

      {/* ── TASKS TABLE (Full-width, clean task listing with responsive scroll) ── */}
      <div
        className="tasks-table-container"
        style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border-light)",
          borderRadius: "14px",
          overflowX: "auto",
          boxShadow: "0 1px 4px rgba(0,0,0,0.03)"
        }}
      >
        <div style={{ minWidth: isTeamLeader ? "880px" : "800px" }}>
        {/* Table Header */}
        <div
          className="table-header-row"
          style={{
            display: "grid",
            gridTemplateColumns: isTeamLeader
              ? "36px minmax(200px, 2fr) 130px 130px 100px 140px 110px 80px"
              : "36px minmax(220px, 2fr) 140px 100px 150px 115px 130px",
            alignItems: "center",
            padding: "12px 18px",
            background: "var(--bg-sidebar)",
            borderBottom: "1px solid var(--border-light)",
            fontSize: "12px",
            fontWeight: "700",
            color: "var(--text-muted)",
            textTransform: "uppercase",
            letterSpacing: "0.5px"
          }}
        >
          <span>#</span>
          <span>Task Name</span>
          <span>Project</span>
          {isTeamLeader && <span>Assigned Member</span>}
          <span>Priority</span>
          <span>Status {isTeamLeader ? "" : "(Update)"}</span>
          <span>Deadline</span>
          {isTeamLeader ? (
            <span style={{ textAlign: "right" }}>Actions</span>
          ) : (
            <span>Assigned By</span>
          )}
        </div>

        {/* Task List Items */}
        {displayedTasks.length === 0 ? (
          <div style={{ textAlign: "center", padding: "48px 20px", color: "var(--text-muted)" }}>
            <div style={{ fontSize: "28px", marginBottom: "8px" }}>📋</div>
            <div style={{ fontSize: "15px", fontWeight: "700", color: "var(--text-main)", marginBottom: "4px" }}>
              No tasks found
            </div>
            <p style={{ fontSize: "13px", maxWidth: "360px", margin: "0 auto 16px" }}>
              {searchQuery
                ? `No tasks match your search query "${searchQuery}".`
                : `No tasks match the active filters.`}
            </p>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => {
                setSearchQuery("");
                setTaskStatusFilter("all");
                setPriorityFilter("all");
                setMemberFilter("all");
              }}
            >
              Reset All Filters
            </button>
          </div>
        ) : (
          <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
            {displayedTasks.map((task, idx) => {
              const assigneeUser = getAssigneeUser(task.assignee);
              const isAssignedToMe = task.assignee === currentUser?.initials || task.assignee_id === currentUser?.id;
              const canModifyStatus = isTeamLeader || isAssignedToMe;
              const overdueFlag = isOverdue(task);
              const isDone = task.status === "done" || task.status === "completed";

              return (
                <li
                  key={task.id}
                  style={{
                    display: "grid",
                    gridTemplateColumns: isTeamLeader
                      ? "36px minmax(200px, 2fr) 130px 130px 100px 140px 110px 80px"
                      : "36px minmax(220px, 2fr) 140px 100px 150px 115px 130px",
                    alignItems: "center",
                    padding: "14px 18px",
                    borderBottom: "1px solid var(--border-light)",
                    background: isDone ? "rgba(248, 249, 250, 0.4)" : "var(--bg-card)",
                    transition: "background 0.15s ease"
                  }}
                  className="team-task-row"
                >
                  {/* 1. Checkbox */}
                  <div>
                    <input
                      type="checkbox"
                      checked={isDone}
                      disabled={!canModifyStatus}
                      onChange={() => canModifyStatus && handleToggleDone(task)}
                      aria-label={`Mark "${task.title}" as completed`}
                      style={{
                        cursor: canModifyStatus ? "pointer" : "not-allowed",
                        width: "16px",
                        height: "16px",
                        accentColor: "var(--primary)",
                        opacity: canModifyStatus ? 1 : 0.4
                      }}
                      title={canModifyStatus ? "Click to toggle completion" : "Only assigned member or leader can mark done"}
                    />
                  </div>

                  {/* 2. Task Title & Description */}
                  <div style={{ paddingRight: "16px" }}>
                    <div
                      style={{
                        fontWeight: "700",
                        fontSize: "13.5px",
                        color: isDone ? "var(--text-muted)" : "var(--text-main)",
                        textDecoration: isDone ? "line-through" : "none",
                        lineHeight: 1.4
                      }}
                    >
                      {task.title}
                      {isAssignedToMe && !isTeamLeader && (
                        <span
                          className="badge-role-tag badge-member"
                          style={{ fontSize: "9px", padding: "1px 6px", marginLeft: "8px", verticalAlign: "middle" }}
                        >
                          You
                        </span>
                      )}
                    </div>
                    {task.description && (
                      <p style={{ margin: "3px 0 0", fontSize: "12px", color: "var(--text-muted)", lineHeight: 1.3 }}>
                        {task.description.length > 90 ? `${task.description.slice(0, 90)}...` : task.description}
                      </p>
                    )}
                  </div>

                  {/* 3. Project Name */}
                  <div style={{ fontSize: "12.5px", color: "var(--text-body)", fontWeight: "600", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    📁 {task.project_title || `Project #${task.project_id}`}
                  </div>

                  {/* 4. Assigned Member (Leader view only) */}
                  {isTeamLeader && (
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span
                        className={`assignee-avatar ${assigneeUser.color || "av-blue"}`}
                        style={{ width: "26px", height: "26px", fontSize: "11px", cursor: "pointer", flexShrink: 0 }}
                        onClick={() => setInspectedMember && setInspectedMember(assigneeUser)}
                        title={`Assigned to ${assigneeUser.name}`}
                      >
                        {assigneeUser.initials}
                      </span>
                      <span
                        style={{
                          fontSize: "12.5px",
                          fontWeight: "600",
                          color: "var(--text-main)",
                          cursor: "pointer",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap"
                        }}
                        onClick={() => setInspectedMember && setInspectedMember(assigneeUser)}
                        title={assigneeUser.name}
                      >
                        {assigneeUser.name}
                      </span>
                    </div>
                  )}

                  {/* 5. Priority */}
                  <div>
                    <span
                      className={`badge badge-priority-${task.priority}`}
                      style={{ fontSize: "11px", padding: "3px 8px" }}
                    >
                      {task.priority ? task.priority.charAt(0).toUpperCase() + task.priority.slice(1) : "Medium"}
                    </span>
                  </div>

                  {/* 6. Status (Interactive Dropdown with instant Supabase update) */}
                  <div>
                    {canModifyStatus ? (
                      <select
                        value={task.status === "completed" ? "done" : task.status}
                        onChange={(e) => handleStatusChange(task, e.target.value)}
                        style={{
                          padding: "5px 8px",
                          borderRadius: "6px",
                          fontSize: "12px",
                          fontWeight: "600",
                          border: "1px solid var(--border-light)",
                          cursor: "pointer",
                          background: isDone
                            ? "#dcfce7"
                            : task.status === "in_progress"
                            ? "#dbeafe"
                            : "var(--bg-app)",
                          color: isDone
                            ? "#16a34a"
                            : task.status === "in_progress"
                            ? "#2563eb"
                            : "var(--text-body)"
                        }}
                        title="Click to update task status in database"
                      >
                        <option value="todo">⏳ Pending</option>
                        <option value="in_progress">⚡ In Progress</option>
                        <option value="done">✓ Completed</option>
                      </select>
                    ) : (
                      <span
                        className={`badge badge-status-${task.status === "done" ? "done" : task.status === "in_progress" ? "in_progress" : "todo"}`}
                        style={{ fontSize: "11px", padding: "4px 8px" }}
                      >
                        {task.status === "done" ? "Completed" : task.status === "in_progress" ? "In Progress" : "Pending"}
                      </span>
                    )}
                  </div>

                  {/* 7. Deadline */}
                  <div>
                    <div style={{ fontSize: "12.5px", color: overdueFlag ? "#ef4444" : "var(--text-body)", fontWeight: overdueFlag ? "700" : "500" }}>
                      {task.due_date || "No date"}
                    </div>
                    {overdueFlag && (
                      <span
                        style={{
                          fontSize: "10px",
                          fontWeight: "700",
                          background: "#fee2e2",
                          color: "#dc2626",
                          padding: "1px 5px",
                          borderRadius: "4px",
                          marginTop: "2px",
                          display: "inline-block"
                        }}
                      >
                        Overdue
                      </span>
                    )}
                  </div>

                  {/* 8. Leader Actions OR Assigned By */}
                  {isTeamLeader ? (
                    <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: "6px" }}>
                      <button
                        type="button"
                        className="btn-task-action btn-task-edit btn-task-icon-sm"
                        title="Leader: Edit task details"
                        onClick={() => {
                          if (onEditTask) onEditTask(task);
                          else if (setEditModalTask) setEditModalTask(task);
                        }}
                        aria-label="Edit task"
                      >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                      </button>

                      <button
                        type="button"
                        className="btn-task-action btn-task-delete btn-task-icon-sm"
                        title="Leader: Delete task from database"
                        aria-label="Delete task"
                        onClick={() => {
                          if (window.confirm(`Delete task "${task.title}"?`)) {
                            deleteTask(task.id);
                          }
                        }}
                      >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                          <line x1="10" y1="11" x2="10" y2="17" />
                          <line x1="14" y1="11" x2="14" y2="17" />
                        </svg>
                      </button>
                    </div>
                  ) : (
                    <div style={{ fontSize: "12px", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "4px" }}>
                      <span>👑 {task.leader_name || "Team Leader"}</span>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
        </div>
      </div>
    </div>
  );
}
