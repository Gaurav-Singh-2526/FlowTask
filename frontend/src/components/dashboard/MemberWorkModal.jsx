import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useTasks } from "../../context/TaskContext";

export default function MemberWorkModal({ member, onClose, onOpenAssignTask }) {
  const { isTeamLeader, currentUser, teamUsers } = useAuth();
  const {
    tasks,
    projects,
    directives,
    updateTask,
    deleteTask,
    setEditModalTask,
    createTask,
    postTeamMessage
  } = useTasks();

  const [activeTab, setActiveTab] = useState("tasks"); // "tasks" | "updates"
  const [directMsg, setDirectMsg] = useState("");
  const [toastMsg, setToastMsg] = useState("");

  // Quick Inline Task Assign within modal
  const [showInlineAssign, setShowInlineAssign] = useState(false);
  const [quickTitle, setQuickTitle] = useState("");
  const [quickProject, setQuickProject] = useState(projects[0]?.id || 101);
  const [quickPriority, setQuickPriority] = useState("high");
  const [quickDue, setQuickDue] = useState("");

  // Inline Task Editing within modal
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [editTaskForm, setEditTaskForm] = useState({
    title: "",
    description: "",
    priority: "medium",
    status: "todo",
    due_date: ""
  });

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 3500);
  };

  const handleStartEdit = (t) => {
    setEditingTaskId(t.id);
    setEditTaskForm({
      title: t.title,
      description: t.description || "",
      priority: t.priority,
      status: t.status,
      due_date: t.due_date || ""
    });
  };

  const handleSaveInlineEdit = async (taskId) => {
    if (!editTaskForm.title.trim()) return;
    await updateTask(taskId, editTaskForm);
    setEditingTaskId(null);
    showToast(`Task "${editTaskForm.title}" updated successfully!`);
  };

  if (!member) return null;

  const isOwnProfile = currentUser?.initials === member.initials;
  const canUpdateTaskStatus = isTeamLeader || isOwnProfile;

  // 1. All tasks assigned to this member
  const memberTasks = tasks.filter(
    t => t.assignee === member.initials || t.assignee === member.name
  );
  const doneTasks = memberTasks.filter(t => t.status === "done");
  const inProgressTasks = memberTasks.filter(t => t.status === "in_progress");
  const todoTasks = memberTasks.filter(t => t.status === "todo");

  // 2. All work updates, responses and messages from or regarding this member
  const memberResponses = [];
  directives.forEach(d => {
    // Check responses in directives
    (d.responses || []).forEach(r => {
      if (r.memberInitials === member.initials || r.memberName === member.name) {
        memberResponses.push({
          id: r.id,
          text: r.text,
          timestamp: r.timestamp || "Recently",
          seenBy: r.seenBy || [member.name],
          directiveTitle: d.message,
          directiveFrom: d.from,
          type: "response"
        });
      }
    });

    // Check directives sent by this member
    if (d.from === member.name || d.fromInitials === member.initials) {
      memberResponses.push({
        id: d.id,
        text: d.message,
        timestamp: d.timestamp || "Recently",
        seenBy: d.seenBy || [member.name],
        to: d.to,
        type: "announcement"
      });
    }
  });

  const handleSendDirectMessage = (e) => {
    e.preventDefault();
    if (!directMsg.trim()) return;
    postTeamMessage(directMsg.trim(), member.name);
    setDirectMsg("");
    showToast(`Message sent to @${member.name}! Visible in Announcements & Chat.`);
  };

  const handleQuickAssignSubmit = async (e) => {
    e.preventDefault();
    if (!quickTitle.trim()) return;
    await createTask({
      title: quickTitle.trim(),
      assignee: member.initials,
      project_id: parseInt(quickProject, 10),
      priority: quickPriority,
      due_date: quickDue || null
    });
    setQuickTitle("");
    setShowInlineAssign(false);
    showToast(`✓ New task assigned to ${member.name}!`);
  };

  const handleStatusChange = async (taskId, newStatus) => {
    if (!canUpdateTaskStatus) {
      alert("Permission Denied: You cannot modify tasks assigned to another team member.");
      return;
    }
    await updateTask(taskId, { status: newStatus });
    showToast(`Task status updated to ${newStatus.replace("_", " ")}`);
  };

  return (
    <div className="modal-overlay-fixed" onClick={onClose} style={{ zIndex: 100000 }}>
      <div
        className="modal-card-fixed"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: "760px", width: "95%", maxHeight: "90vh", padding: "26px" }}
      >
        {/* ── HEADER: MEMBER PROFILE & IDENTITY ─────────────────────────── */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "1.5px solid var(--border-light)", paddingBottom: "18px", marginBottom: "18px", flexWrap: "wrap", gap: "12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <span
              className={`assignee-avatar ${member.color || "av-blue"}`}
              style={{ width: "52px", height: "52px", fontSize: "18px", fontWeight: "800", boxShadow: "0 4px 14px rgba(0,0,0,0.12)" }}
            >
              {member.initials}
            </span>

            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                <h2 style={{ fontSize: "20px", fontWeight: "800", color: "var(--text-main)", margin: 0 }}>
                  {member.name}
                </h2>
                <span className={`badge-role-tag ${member.role === "Team Leader" ? "badge-leader" : "badge-member"}`}>
                  {member.role === "Team Leader" ? "👑 Team Leader" : "👤 Team Member"}
                </span>
              </div>
              <div style={{ fontSize: "13px", color: "var(--text-muted)", marginTop: "3px" }}>
                <span>{member.title || "Software Engineer"}</span> &middot; <span style={{ color: "var(--text-body)" }}>✉️ {member.email}</span>
              </div>
            </div>
          </div>

          <button
            type="button"
            className="btn btn-icon-only modal-x"
            onClick={onClose}
            title="Close"
            style={{ fontSize: "20px" }}
          >
            ✕
          </button>
        </div>

        {/* Informational Read-Only Banner for other teammates */}
        {!isTeamLeader && !isOwnProfile && (
          <div style={{ background: "var(--bg-sidebar)", border: "1px solid var(--border-light)", color: "var(--text-muted)", padding: "8px 12px", borderRadius: "8px", fontSize: "12px", display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
            <span>🔒</span>
            <span>Viewing <strong>{member.name}</strong>'s public deliverables & workload. (Read-only view for teammates)</span>
          </div>
        )}

        {/* Global Toast Alert */}
        {toastMsg && (
          <div style={{ background: "rgba(16,185,129,0.12)", border: "1.5px solid #10b981", color: "#059669", padding: "10px 14px", borderRadius: "8px", fontSize: "13px", fontWeight: "700", marginBottom: "16px" }}>
            {toastMsg}
          </div>
        )}

        {/* ── METRIC STAT COUNTERS ───────────────────────────────────────── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "10px", marginBottom: "20px" }}>
          {member.role === "Team Leader" ? (
            <>
              <div style={{ background: "var(--bg-sidebar)", padding: "12px", borderRadius: "10px", textAlign: "center", border: "1px solid var(--border-subtle)" }}>
                <div style={{ fontSize: "18px", fontWeight: "800", color: "var(--text-main)" }}>{tasks.length}</div>
                <div style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.4px" }}>Squad Tasks</div>
              </div>
              <div style={{ background: "rgba(91,93,248,0.06)", padding: "12px", borderRadius: "10px", textAlign: "center", border: "1px solid rgba(91,93,248,0.2)" }}>
                <div style={{ fontSize: "18px", fontWeight: "800", color: "var(--primary)" }}>{teamUsers.filter(u => u.role !== "Team Leader").length}</div>
                <div style={{ fontSize: "11px", color: "var(--primary)", textTransform: "uppercase", letterSpacing: "0.4px" }}>Teammates</div>
              </div>
              <div style={{ background: "rgba(16,185,129,0.08)", padding: "12px", borderRadius: "10px", textAlign: "center", border: "1px solid rgba(16,185,129,0.2)" }}>
                <div style={{ fontSize: "18px", fontWeight: "800", color: "#10b981" }}>{tasks.filter(t => t.status === "done").length}</div>
                <div style={{ fontSize: "11px", color: "#10b981", textTransform: "uppercase", letterSpacing: "0.4px" }}>Completed</div>
              </div>
              <div style={{ background: "rgba(245,158,11,0.08)", padding: "12px", borderRadius: "10px", textAlign: "center", border: "1px solid rgba(245,158,11,0.2)" }}>
                <div style={{ fontSize: "18px", fontWeight: "800", color: "#d97706" }}>{directives.length}</div>
                <div style={{ fontSize: "11px", color: "#d97706", textTransform: "uppercase", letterSpacing: "0.4px" }}>Directives</div>
              </div>
            </>
          ) : (
            <>
              <div style={{ background: "var(--bg-sidebar)", padding: "12px", borderRadius: "10px", textAlign: "center", border: "1px solid var(--border-subtle)" }}>
                <div style={{ fontSize: "18px", fontWeight: "800", color: "var(--text-main)" }}>{memberTasks.length}</div>
                <div style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.4px" }}>Total Tasks</div>
              </div>
              <div style={{ background: "rgba(91,93,248,0.06)", padding: "12px", borderRadius: "10px", textAlign: "center", border: "1px solid rgba(91,93,248,0.2)" }}>
                <div style={{ fontSize: "18px", fontWeight: "800", color: "var(--primary)" }}>{inProgressTasks.length}</div>
                <div style={{ fontSize: "11px", color: "var(--primary)", textTransform: "uppercase", letterSpacing: "0.4px" }}>Active Work</div>
              </div>
              <div style={{ background: "rgba(16,185,129,0.08)", padding: "12px", borderRadius: "10px", textAlign: "center", border: "1px solid rgba(16,185,129,0.2)" }}>
                <div style={{ fontSize: "18px", fontWeight: "800", color: "#10b981" }}>{doneTasks.length}</div>
                <div style={{ fontSize: "11px", color: "#10b981", textTransform: "uppercase", letterSpacing: "0.4px" }}>Completed</div>
              </div>
              <div style={{ background: "rgba(245,158,11,0.08)", padding: "12px", borderRadius: "10px", textAlign: "center", border: "1px solid rgba(245,158,11,0.2)" }}>
                <div style={{ fontSize: "18px", fontWeight: "800", color: "#d97706" }}>{memberResponses.length}</div>
                <div style={{ fontSize: "11px", color: "#d97706", textTransform: "uppercase", letterSpacing: "0.4px" }}>Work Updates</div>
              </div>
            </>
          )}
        </div>

        {/* ── TABS: ASSIGNED TASKS vs WORK UPDATES ───────────────────────── */}
        <div style={{ display: "flex", gap: "10px", borderBottom: "1.5px solid var(--border-light)", marginBottom: "16px" }}>
          <button
            type="button"
            onClick={() => setActiveTab("tasks")}
            style={{
              padding: "10px 16px",
              background: "transparent",
              border: "none",
              borderBottom: activeTab === "tasks" ? "3px solid var(--primary)" : "3px solid transparent",
              color: activeTab === "tasks" ? "var(--primary)" : "var(--text-muted)",
              fontWeight: "700",
              fontSize: "14px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "8px"
            }}
          >
            <span>📋 Assigned Tasks</span>
            <span style={{ fontSize: "11px", background: activeTab === "tasks" ? "var(--primary)" : "var(--bg-content)", color: activeTab === "tasks" ? "#fff" : "var(--text-muted)", padding: "1px 7px", borderRadius: "999px" }}>
              {memberTasks.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("updates")}
            style={{
              padding: "10px 16px",
              background: "transparent",
              border: "none",
              borderBottom: activeTab === "updates" ? "3px solid var(--primary)" : "3px solid transparent",
              color: activeTab === "updates" ? "var(--primary)" : "var(--text-muted)",
              fontWeight: "700",
              fontSize: "14px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "8px"
            }}
          >
            <span>💬 Work Updates &amp; Responses</span>
            <span style={{ fontSize: "11px", background: activeTab === "updates" ? "var(--primary)" : "var(--bg-content)", color: activeTab === "updates" ? "#fff" : "var(--text-muted)", padding: "1px 7px", borderRadius: "999px" }}>
              {memberResponses.length}
            </span>
          </button>
        </div>

        {/* ── CONTENT TAB 1: ASSIGNED TASKS ─────────────────────────────── */}
        {activeTab === "tasks" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px", flexWrap: "wrap", gap: "8px" }}>
              <span style={{ fontSize: "13px", fontWeight: "700", color: "var(--text-main)" }}>
                {member.role === "Team Leader" ? "👑 Team Leader Work Management & Oversight:" : `Deliverables Allocated to ${member.name}:`}
              </span>

              {isTeamLeader && member.role !== "Team Leader" && (
                <button
                  type="button"
                  className="btn btn-primary-pill btn-xs"
                  onClick={() => setShowInlineAssign(!showInlineAssign)}
                >
                  {showInlineAssign ? "✕ Close Form" : "+ Assign New Task"}
                </button>
              )}
            </div>

            {/* Inline Quick Task Creator if toggled */}
            {showInlineAssign && member.role !== "Team Leader" && (
              <form onSubmit={handleQuickAssignSubmit} style={{ background: "var(--bg-sidebar)", border: "1.5px solid var(--border-light)", borderRadius: "10px", padding: "14px", marginBottom: "16px" }}>
                <div style={{ fontSize: "12.5px", fontWeight: "700", color: "var(--text-main)", marginBottom: "8px" }}>
                  ⚡ Assign Deliverable to {member.name}:
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: "10px", marginBottom: "10px" }}>
                  <input
                    type="text"
                    placeholder="Task Title (e.g. Implement OAuth token refresh)"
                    value={quickTitle}
                    onChange={(e) => setQuickTitle(e.target.value)}
                    required
                    style={{ padding: "8px 12px", borderRadius: "6px", border: "1px solid var(--border-light)", fontSize: "13px", background: "var(--bg-card)", color: "var(--text-main)" }}
                  />

                  <select
                    value={quickProject}
                    onChange={(e) => setQuickProject(e.target.value)}
                    style={{ padding: "8px 10px", borderRadius: "6px", border: "1px solid var(--border-light)", fontSize: "13px", background: "var(--bg-card)", color: "var(--text-main)" }}
                  >
                    {projects.map(p => (
                      <option key={p.id} value={p.id}>📁 {p.title}</option>
                    ))}
                  </select>
                </div>

                <div style={{ display: "flex", gap: "10px", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap" }}>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <select
                      value={quickPriority}
                      onChange={(e) => setQuickPriority(e.target.value)}
                      style={{ padding: "6px 8px", borderRadius: "6px", border: "1px solid var(--border-light)", fontSize: "12px", background: "var(--bg-card)", color: "var(--text-main)" }}
                    >
                      <option value="low">Low Priority</option>
                      <option value="medium">Medium Priority</option>
                      <option value="high">High Priority</option>
                      <option value="urgent">🚨 Urgent</option>
                    </select>

                    <input
                      type="date"
                      value={quickDue}
                      onChange={(e) => setQuickDue(e.target.value)}
                      style={{ padding: "6px 8px", borderRadius: "6px", border: "1px solid var(--border-light)", fontSize: "12px", background: "var(--bg-card)", color: "var(--text-main)" }}
                    />
                  </div>

                  <button type="submit" className="btn btn-primary btn-xs">
                    ✓ Assign Task Directly
                  </button>
                </div>
              </form>
            )}

            {member.role === "Team Leader" ? (
              <div style={{ textAlign: "center", padding: "36px 20px", background: "var(--bg-sidebar)", borderRadius: "10px", border: "1px dashed var(--border-light)" }}>
                <div style={{ fontSize: "32px", marginBottom: "10px" }}>👑</div>
                <div style={{ fontSize: "16px", fontWeight: "800", color: "var(--text-main)", marginBottom: "6px" }}>
                  Team Leader &amp; Work Delegator
                </div>
                <div style={{ fontSize: "13px", color: "var(--text-muted)", maxWidth: "440px", margin: "0 auto", lineHeight: "1.5" }}>
                  Tasks cannot be assigned to the Team Leader. The Team Leader oversees all sprint projects and delegates deliverables directly to Team Members.
                </div>
              </div>
            ) : memberTasks.length === 0 ? (
              <div style={{ textAlign: "center", padding: "32px", color: "var(--text-muted)", fontSize: "13.5px", background: "var(--bg-sidebar)", borderRadius: "10px" }}>
                No tasks currently assigned to {member.name}.
                {isTeamLeader && (
                  <div style={{ marginTop: "8px" }}>
                    <button type="button" className="btn btn-primary-pill btn-xs" onClick={() => setShowInlineAssign(true)}>
                      + Assign First Task
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px", maxHeight: "380px", overflowY: "auto" }}>
                {memberTasks.map(t => {
                  const proj = projects.find(p => p.id === t.project_id) || { title: "FlowTask App" };

                  // If currently editing this task inline
                  if (editingTaskId === t.id) {
                    return (
                      <div
                        key={t.id}
                        style={{
                          background: "var(--bg-sidebar)",
                          border: "1.5px solid var(--primary)",
                          borderRadius: "10px",
                          padding: "14px",
                          boxShadow: "0 2px 10px rgba(91,93,248,0.12)"
                        }}
                      >
                        <div style={{ fontSize: "12px", fontWeight: "700", color: "var(--primary)", marginBottom: "8px" }}>
                          ✏️ Edit Personal Task for {member.name}:
                        </div>
                        <div style={{ marginBottom: "8px" }}>
                          <input
                            type="text"
                            value={editTaskForm.title}
                            onChange={(e) => setEditTaskForm({ ...editTaskForm, title: e.target.value })}
                            required
                            placeholder="Task Title"
                            style={{ width: "100%", padding: "7px 10px", borderRadius: "6px", border: "1px solid var(--border-light)", fontSize: "13px", background: "var(--bg-card)", color: "var(--text-main)" }}
                          />
                        </div>
                        <div style={{ marginBottom: "8px" }}>
                          <input
                            type="text"
                            value={editTaskForm.description}
                            onChange={(e) => setEditTaskForm({ ...editTaskForm, description: e.target.value })}
                            placeholder="Task description / notes (optional)"
                            style={{ width: "100%", padding: "6px 10px", borderRadius: "6px", border: "1px solid var(--border-light)", fontSize: "12px", background: "var(--bg-card)", color: "var(--text-main)" }}
                          />
                        </div>
                        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between" }}>
                          <div style={{ display: "flex", gap: "8px" }}>
                            <select
                              value={editTaskForm.priority}
                              onChange={(e) => setEditTaskForm({ ...editTaskForm, priority: e.target.value })}
                              style={{ padding: "5px 8px", borderRadius: "6px", border: "1px solid var(--border-light)", fontSize: "12px", background: "var(--bg-card)", color: "var(--text-main)" }}
                            >
                              <option value="low">Low Priority</option>
                              <option value="medium">Medium Priority</option>
                              <option value="high">High Priority</option>
                              <option value="urgent">🚨 Urgent</option>
                            </select>
                            <select
                              value={editTaskForm.status}
                              onChange={(e) => setEditTaskForm({ ...editTaskForm, status: e.target.value })}
                              style={{ padding: "5px 8px", borderRadius: "6px", border: "1px solid var(--border-light)", fontSize: "12px", background: "var(--bg-card)", color: "var(--text-main)" }}
                            >
                              <option value="todo">To Do</option>
                              <option value="in_progress">In Progress</option>
                              <option value="review">Review</option>
                              <option value="done">Done</option>
                            </select>
                            <input
                              type="date"
                              value={editTaskForm.due_date}
                              onChange={(e) => setEditTaskForm({ ...editTaskForm, due_date: e.target.value })}
                              style={{ padding: "5px 8px", borderRadius: "6px", border: "1px solid var(--border-light)", fontSize: "12px", background: "var(--bg-card)", color: "var(--text-main)" }}
                            />
                          </div>
                          <div style={{ display: "flex", gap: "6px" }}>
                            <button
                              type="button"
                              className="btn btn-secondary btn-xs"
                              onClick={() => setEditingTaskId(null)}
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              className="btn btn-primary btn-xs"
                              onClick={() => handleSaveInlineEdit(t.id)}
                            >
                              ✓ Save
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={t.id}
                      style={{
                        background: "var(--bg-card)",
                        border: "1px solid var(--border-light)",
                        borderRadius: "10px",
                        padding: "12px 14px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: "12px",
                        flexWrap: "wrap"
                      }}
                    >
                      <div style={{ flex: 1, minWidth: "220px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                          <span style={{ fontWeight: "700", fontSize: "13.5px", color: "var(--text-main)" }}>
                            {t.title}
                          </span>
                          <span className={`badge badge-priority-${t.priority}`} style={{ fontSize: "10px", padding: "1px 6px" }}>
                            {t.priority}
                          </span>
                        </div>
                        {t.description && (
                          <div style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "4px" }}>
                            {t.description}
                          </div>
                        )}
                        <div style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "11.5px", color: "var(--text-subtle)" }}>
                          <span>📁 {proj.title}</span>
                          <span>&middot;</span>
                          <span>Due: {t.due_date || "No deadline"}</span>
                        </div>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        {canUpdateTaskStatus ? (
                          <select
                            value={t.status}
                            onChange={(e) => handleStatusChange(t.id, e.target.value)}
                            style={{
                              fontSize: "12px",
                              padding: "5px 8px",
                              borderRadius: "6px",
                              border: "1px solid var(--border-light)",
                              background: t.status === "done" ? "rgba(16,185,129,0.1)" : t.status === "in_progress" ? "rgba(91,93,248,0.1)" : "var(--bg-sidebar)",
                              color: t.status === "done" ? "#10b981" : t.status === "in_progress" ? "var(--primary)" : "var(--text-main)",
                              fontWeight: "600"
                            }}
                          >
                            <option value="todo">To Do</option>
                            <option value="in_progress">In Progress</option>
                            <option value="review">Review</option>
                            <option value="done">✓ Done</option>
                          </select>
                        ) : (
                          <span
                            className={`badge badge-status-${t.status === "in_progress" ? "in_progress" : t.status === "done" ? "done" : "todo"}`}
                            style={{ padding: "4px 8px", fontSize: "11px", fontWeight: "600" }}
                            title={`Assigned to ${member.name} (View-only)`}
                          >
                            {t.status.replace("_", " ")}
                          </span>
                        )}

                        {isTeamLeader && (
                          <div style={{ display: "inline-flex", gap: "6px", alignItems: "center" }}>
                            <button
                              type="button"
                              className="btn-task-action btn-task-edit btn-task-icon-sm"
                              onClick={() => handleStartEdit(t)}
                              title="Edit personal task"
                              aria-label="Edit personal task"
                            >
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                              </svg>
                            </button>
                            <button
                              type="button"
                              className="btn-task-action btn-task-delete btn-task-icon-sm"
                              onClick={async () => {
                                if (window.confirm(`Are you sure you want to delete task "${t.title}" assigned to ${member.name}?`)) {
                                  await deleteTask(t.id);
                                  showToast(`Task "${t.title}" deleted successfully!`);
                                }
                              }}
                              title="Delete personal task"
                              aria-label="Delete personal task"
                            >
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="3 6 5 6 21 6" />
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                <line x1="10" y1="11" x2="10" y2="17" />
                                <line x1="14" y1="11" x2="14" y2="17" />
                              </svg>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── CONTENT TAB 2: WORK UPDATES & ACTIVITY ────────────────────── */}
        {activeTab === "updates" && (
          <div>
            <div style={{ fontSize: "13px", fontWeight: "700", color: "var(--text-main)", marginBottom: "12px" }}>
              Work Updates &amp; Progress Reports Submitted by {member.name}:
            </div>

            {memberResponses.length === 0 ? (
              <div style={{ textAlign: "center", padding: "32px", color: "var(--text-muted)", fontSize: "13.5px", background: "var(--bg-sidebar)", borderRadius: "10px" }}>
                No work status updates posted by {member.name} yet.
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px", maxHeight: "380px", overflowY: "auto", marginBottom: "16px" }}>
                {memberResponses.map((r, i) => (
                  <div
                    key={r.id || i}
                    style={{
                      background: "var(--bg-card)",
                      border: "1px solid var(--border-light)",
                      borderRadius: "10px",
                      padding: "12px 14px"
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span className={`assignee-avatar ${member.color || "av-blue"}`} style={{ width: "24px", height: "24px", fontSize: "10px" }}>
                          {member.initials}
                        </span>
                        <strong style={{ fontSize: "13px", color: "var(--text-main)" }}>{member.name}</strong>
                        <span className="badge-role-tag badge-member" style={{ fontSize: "9px", padding: "1px 5px" }}>
                          {r.type === "announcement" ? "📢 Announcement" : "💬 Update"}
                        </span>
                      </div>
                      <span style={{ fontSize: "11px", color: "var(--text-subtle)" }}>{r.timestamp}</span>
                    </div>

                    <p style={{ fontSize: "13px", color: "var(--text-body)", lineHeight: "1.5", margin: "4px 0 6px" }}>
                      {r.text}
                    </p>

                    {r.directiveTitle && (
                      <div style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: "6px" }}>
                        <em>In reply to directive: "{r.directiveTitle.slice(0, 60)}..."</em>
                      </div>
                    )}

                    {r.seenBy && (
                      <div style={{ fontSize: "11px", color: "var(--text-subtle)", display: "flex", alignItems: "center", gap: "4px" }}>
                        <span>👁️ Seen by ({r.seenBy.length}):</span>
                        <span>{r.seenBy.join(", ")}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Quick Directive / Message Composer to this member */}
            <form onSubmit={handleSendDirectMessage} style={{ background: "var(--bg-sidebar)", border: "1px solid var(--border-light)", borderRadius: "10px", padding: "12px", marginTop: "12px" }}>
              <div style={{ fontSize: "12px", fontWeight: "700", color: "var(--text-main)", marginBottom: "6px" }}>
                ✉️ Send Instruction or Note to @{member.name}:
              </div>
              <div style={{ display: "flex", gap: "8px" }}>
                <input
                  type="text"
                  placeholder={`Write message to @${member.name}...`}
                  value={directMsg}
                  onChange={(e) => setDirectMsg(e.target.value)}
                  required
                  style={{ flex: 1, padding: "8px 12px", borderRadius: "6px", border: "1px solid var(--border-light)", fontSize: "13px", background: "var(--bg-card)", color: "var(--text-main)" }}
                />
                <button type="submit" className="btn btn-primary btn-sm">
                  Send Note &rarr;
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ── FOOTER ACTIONS ────────────────────────────────────────────── */}
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "20px", paddingTop: "14px", borderTop: "1px solid var(--border-light)" }}>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
