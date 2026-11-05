import React, { useState, useMemo } from "react";
import { useAuth } from "../../context/AuthContext";
import { useTasks } from "../../context/TaskContext";

const STAGES = [
  {
    id: "todo",
    key: "todo",
    title: "Backlog & To-Do",
    description: "Tasks awaiting execution or backlog queue",
    color: "#64748b",
    bgTint: "rgba(100, 116, 139, 0.08)",
    borderTint: "rgba(100, 116, 139, 0.25)",
    icon: "📋",
    statuses: ["todo", "backlog", "pending"]
  },
  {
    id: "in_progress",
    key: "in_progress",
    title: "In Progress",
    description: "Actively being worked on by assignees",
    color: "#3b82f6",
    bgTint: "rgba(59, 130, 246, 0.08)",
    borderTint: "rgba(59, 130, 246, 0.25)",
    icon: "⚡",
    statuses: ["in_progress"]
  },
  {
    id: "review",
    key: "review",
    title: "Review & Quality Check",
    description: "Completed work submitted for team review",
    color: "#f59e0b",
    bgTint: "rgba(245, 158, 11, 0.08)",
    borderTint: "rgba(245, 158, 11, 0.25)",
    icon: "🔍",
    statuses: ["review"]
  },
  {
    id: "done",
    key: "done",
    title: "Delivered & Done",
    description: "Finished and verified deliverables",
    color: "#10b981",
    bgTint: "rgba(16, 185, 129, 0.08)",
    borderTint: "rgba(16, 185, 129, 0.25)",
    icon: "✅",
    statuses: ["done", "completed"]
  }
];

export default function WorkflowPage({ onEditTask, onNewTask }) {
  const { currentUser, isTeamLeader, teamUsers } = useAuth();
  const {
    tasks,
    visibleProjects,
    selectedProject,
    setSelectedProject,
    updateTask
  } = useTasks();

  const [selectedMemberFilter, setSelectedMemberFilter] = useState("all");
  const [selectedPriorityFilter, setSelectedPriorityFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isUpdatingTaskId, setIsUpdatingTaskId] = useState(null);

  // Normalize status into one of our 4 stage keys
  const getStageKeyForTask = (status) => {
    const s = (status || "").toLowerCase().trim();
    if (s === "done" || s === "completed") return "done";
    if (s === "review") return "review";
    if (s === "in_progress") return "in_progress";
    return "todo";
  };

  // Filter tasks based on project, member, priority, search
  const filteredTasks = useMemo(() => {
    return tasks.filter(t => {
      if (selectedProject && t.project_id !== selectedProject.id) {
        return false;
      }
      if (selectedMemberFilter !== "all" && t.assignee !== selectedMemberFilter) {
        return false;
      }
      if (selectedPriorityFilter !== "all" && (t.priority || "").toLowerCase() !== selectedPriorityFilter.toLowerCase()) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = t.title?.toLowerCase().includes(q);
        const matchAssignee = t.assignee?.toLowerCase().includes(q);
        const matchProject = t.project_name?.toLowerCase().includes(q);
        if (!matchTitle && !matchAssignee && !matchProject) return false;
      }
      return true;
    });
  }, [tasks, selectedProject, selectedMemberFilter, selectedPriorityFilter, searchQuery]);

  // Group tasks by stage
  const tasksByStage = useMemo(() => {
    const map = {
      todo: [],
      in_progress: [],
      review: [],
      done: []
    };
    filteredTasks.forEach(task => {
      const stageKey = getStageKeyForTask(task.status);
      if (map[stageKey]) {
        map[stageKey].push(task);
      } else {
        map.todo.push(task);
      }
    });
    return map;
  }, [filteredTasks]);

  // Pipeline throughput & velocity metrics
  const totalCount = filteredTasks.length;
  const doneCount = tasksByStage.done.length;
  const inProgressCount = tasksByStage.in_progress.length;
  const reviewCount = tasksByStage.review.length;
  const todoCount = tasksByStage.todo.length;
  const completionRate = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;

  // Move task to a new status
  const handleMoveTask = async (task, targetStatus) => {
    try {
      setIsUpdatingTaskId(task.id);
      await updateTask(task.id, {
        ...task,
        status: targetStatus
      });
    } catch (err) {
      console.error("Failed to move task stage:", err);
      alert(`Could not update task: ${err.message}`);
    } finally {
      setIsUpdatingTaskId(null);
    }
  };

  const getPriorityBadgeClass = (priority) => {
    const p = (priority || "").toLowerCase();
    if (p === "high" || p === "urgent") return "badge-priority-high";
    if (p === "low") return "badge-priority-low";
    return "badge-priority-med";
  };

  return (
    <div className="workflow-page-container" style={{ padding: "0 4px", width: "100%", boxSizing: "border-box" }}>
      {/* ── TOP HEADER: TITLE & REALTIME PIPELINE SUMMARY ────────────────── */}
      <div
        className="workflow-header-card"
        style={{
          background: "var(--bg-card, #ffffff)",
          border: "1px solid var(--border-light, #e2e8f0)",
          borderRadius: "14px",
          padding: "18px 22px",
          marginBottom: "18px",
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.03)"
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "14px" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
              <h1 style={{ fontSize: "22px", fontWeight: "800", color: "var(--text-main, #0f172a)", margin: 0, letterSpacing: "-0.3px" }}>
                🔀 Workflow &amp; Execution Pipeline
              </h1>
              <span
                style={{
                  background: "rgba(91, 93, 248, 0.1)",
                  color: "var(--primary, #5b5df8)",
                  fontSize: "12px",
                  fontWeight: "700",
                  padding: "3px 10px",
                  borderRadius: "9999px"
                }}
              >
                {selectedProject ? selectedProject.title : "All Workspace Projects"}
              </span>
            </div>
            <p style={{ fontSize: "13px", color: "var(--text-muted, #64748b)", margin: "4px 0 0 0" }}>
              Track tasks through each stage of delivery. Advance work with 1-click stage transitions directly synced with Supabase.
            </p>
          </div>

          {isTeamLeader && onNewTask && (
            <button
              type="button"
              className="btn btn-primary-pill"
              onClick={onNewTask}
              style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontWeight: "700" }}
            >
              <span>+ Add Task</span>
            </button>
          )}
        </div>

        {/* ── LIVE PIPELINE METRICS STRIP ───────────────────────────────── */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
            gap: "12px",
            marginTop: "16px",
            paddingTop: "14px",
            borderTop: "1px solid var(--border-subtle, #f1f5f9)"
          }}
        >
          <div style={{ padding: "8px 12px", borderRadius: "8px", background: "var(--bg-sidebar, #f8fafc)" }}>
            <div style={{ fontSize: "11px", fontWeight: "700", color: "var(--text-muted)", textTransform: "uppercase" }}>
              Completion Rate
            </div>
            <div style={{ fontSize: "20px", fontWeight: "800", color: "var(--text-main)", marginTop: "2px" }}>
              {completionRate}%
            </div>
            <div style={{ width: "100%", height: "4px", background: "#e2e8f0", borderRadius: "99px", marginTop: "6px", overflow: "hidden" }}>
              <div style={{ width: `${completionRate}%`, height: "100%", background: "#10b981", borderRadius: "99px", transition: "width 0.3s ease" }} />
            </div>
          </div>

          <div style={{ padding: "8px 12px", borderRadius: "8px", background: "rgba(100, 116, 139, 0.08)" }}>
            <div style={{ fontSize: "11px", fontWeight: "700", color: "#64748b", textTransform: "uppercase" }}>
              📋 Backlog / To Do
            </div>
            <div style={{ fontSize: "20px", fontWeight: "800", color: "#334155", marginTop: "2px" }}>
              {todoCount}
            </div>
          </div>

          <div style={{ padding: "8px 12px", borderRadius: "8px", background: "rgba(59, 130, 246, 0.08)" }}>
            <div style={{ fontSize: "11px", fontWeight: "700", color: "#2563eb", textTransform: "uppercase" }}>
              ⚡ In Progress (WIP)
            </div>
            <div style={{ fontSize: "20px", fontWeight: "800", color: "#1d4ed8", marginTop: "2px" }}>
              {inProgressCount}
            </div>
          </div>

          <div style={{ padding: "8px 12px", borderRadius: "8px", background: "rgba(245, 158, 11, 0.08)" }}>
            <div style={{ fontSize: "11px", fontWeight: "700", color: "#d97706", textTransform: "uppercase" }}>
              🔍 In Review
            </div>
            <div style={{ fontSize: "20px", fontWeight: "800", color: "#b45309", marginTop: "2px" }}>
              {reviewCount}
            </div>
          </div>

          <div style={{ padding: "8px 12px", borderRadius: "8px", background: "rgba(16, 185, 129, 0.08)" }}>
            <div style={{ fontSize: "11px", fontWeight: "700", color: "#059669", textTransform: "uppercase" }}>
              ✅ Delivered / Done
            </div>
            <div style={{ fontSize: "20px", fontWeight: "800", color: "#047857", marginTop: "2px" }}>
              {doneCount}
            </div>
          </div>
        </div>
      </div>

      {/* ── FILTER & SEARCH TOOLBAR ─────────────────────────────────────── */}
      <div
        className="workflow-filter-bar"
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          flexWrap: "wrap",
          marginBottom: "18px",
          background: "var(--bg-card, #ffffff)",
          border: "1px solid var(--border-light, #e2e8f0)",
          borderRadius: "12px",
          padding: "10px 14px"
        }}
      >
        {/* Project Selector */}
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{ fontSize: "12px", fontWeight: "600", color: "var(--text-muted)" }}>Project:</span>
          <select
            value={selectedProject ? selectedProject.id : "all"}
            onChange={(e) => {
              const val = e.target.value;
              if (val === "all") {
                setSelectedProject(null);
              } else {
                const found = visibleProjects.find(p => String(p.id) === val);
                setSelectedProject(found || null);
              }
            }}
            style={{
              padding: "5px 10px",
              borderRadius: "8px",
              border: "1px solid var(--border-light)",
              background: "var(--bg-sidebar)",
              color: "var(--text-main)",
              fontSize: "12.5px",
              fontWeight: "600"
            }}
          >
            <option value="all">📁 All Projects ({visibleProjects.length})</option>
            {visibleProjects.map(p => (
              <option key={p.id} value={p.id}>{p.title}</option>
            ))}
          </select>
        </div>

        {/* Member Selector */}
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{ fontSize: "12px", fontWeight: "600", color: "var(--text-muted)" }}>Assignee:</span>
          <select
            value={selectedMemberFilter}
            onChange={(e) => setSelectedMemberFilter(e.target.value)}
            style={{
              padding: "5px 10px",
              borderRadius: "8px",
              border: "1px solid var(--border-light)",
              background: "var(--bg-sidebar)",
              color: "var(--text-main)",
              fontSize: "12.5px",
              fontWeight: "600"
            }}
          >
            <option value="all">👥 All Team Members</option>
            {teamUsers.map(u => (
              <option key={u.id} value={u.initials}>{u.name} ({u.initials})</option>
            ))}
          </select>
        </div>

        {/* Priority Selector */}
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{ fontSize: "12px", fontWeight: "600", color: "var(--text-muted)" }}>Priority:</span>
          <select
            value={selectedPriorityFilter}
            onChange={(e) => setSelectedPriorityFilter(e.target.value)}
            style={{
              padding: "5px 10px",
              borderRadius: "8px",
              border: "1px solid var(--border-light)",
              background: "var(--bg-sidebar)",
              color: "var(--text-main)",
              fontSize: "12.5px",
              fontWeight: "600"
            }}
          >
            <option value="all">⚡ All Priorities</option>
            <option value="high">🔴 High / Urgent</option>
            <option value="medium">🟡 Medium</option>
            <option value="low">🟢 Low</option>
          </select>
        </div>

        {/* Search */}
        <div style={{ marginLeft: "auto", minWidth: "180px", flex: "1 1 auto", maxWidth: "260px" }}>
          <input
            type="text"
            placeholder="🔍 Search tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: "100%",
              padding: "6px 12px",
              borderRadius: "8px",
              border: "1px solid var(--border-light)",
              background: "var(--bg-sidebar)",
              color: "var(--text-main)",
              fontSize: "12.5px",
              boxSizing: "border-box"
            }}
          />
        </div>
      </div>

      {/* ── WORKFLOW STAGES COLUMNS ─────────────────────────────────────── */}
      <div
        className="workflow-columns-grid"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, minmax(260px, 1fr))",
          gap: "16px",
          alignItems: "start",
          overflowX: "auto",
          paddingBottom: "24px"
        }}
      >
        {STAGES.map(stage => {
          const stageTasks = tasksByStage[stage.key] || [];

          return (
            <div
              key={stage.id}
              className="workflow-stage-column"
              style={{
                background: "var(--bg-sidebar, #f8fafc)",
                border: `1.5px solid ${stage.borderTint}`,
                borderRadius: "14px",
                padding: "14px",
                minHeight: "450px",
                display: "flex",
                flexDirection: "column",
                boxShadow: "0 2px 6px rgba(0, 0, 0, 0.02)"
              }}
            >
              {/* Stage Header */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: "8px"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ fontSize: "16px" }}>{stage.icon}</span>
                  <span style={{ fontSize: "14px", fontWeight: "800", color: "var(--text-main)" }}>
                    {stage.title}
                  </span>
                </div>
                <span
                  style={{
                    background: stage.bgTint,
                    color: stage.color,
                    fontSize: "12px",
                    fontWeight: "800",
                    padding: "2px 8px",
                    borderRadius: "9999px",
                    border: `1px solid ${stage.borderTint}`
                  }}
                >
                  {stageTasks.length}
                </span>
              </div>

              <div style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: "12px" }}>
                {stage.description}
              </div>

              {/* Task Cards Container */}
              <div style={{ display: "flex", flexDirection: "column", gap: "10px", flex: 1 }}>
                {stageTasks.length === 0 ? (
                  <div
                    style={{
                      padding: "24px 12px",
                      textAlign: "center",
                      color: "var(--text-subtle, #94a3b8)",
                      fontSize: "12.5px",
                      border: "1.5px dashed var(--border-light, #e2e8f0)",
                      borderRadius: "10px",
                      marginTop: "4px"
                    }}
                  >
                    No tasks in {stage.title.toLowerCase()}
                  </div>
                ) : (
                  stageTasks.map(task => {
                    const isBusy = isUpdatingTaskId === task.id;
                    const canEdit = isTeamLeader || task.assignee === currentUser?.initials;

                    return (
                      <div
                        key={task.id}
                        className="workflow-task-card"
                        style={{
                          background: "var(--bg-card, #ffffff)",
                          border: "1px solid var(--border-light, #e2e8f0)",
                          borderRadius: "10px",
                          padding: "12px 14px",
                          boxShadow: "0 1px 3px rgba(0, 0, 0, 0.04)",
                          opacity: isBusy ? 0.6 : 1,
                          transition: "all 0.15s ease",
                          cursor: canEdit ? "pointer" : "default"
                        }}
                        onClick={() => {
                          if (canEdit && onEditTask) {
                            onEditTask(task);
                          }
                        }}
                      >
                        {/* Tags: Project & Priority */}
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "6px", marginBottom: "8px" }}>
                          <span
                            style={{
                              fontSize: "10.5px",
                              fontWeight: "700",
                              color: "var(--primary, #5b5df8)",
                              background: "rgba(91, 93, 248, 0.08)",
                              padding: "2px 6px",
                              borderRadius: "6px",
                              maxWidth: "140px",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap"
                            }}
                          >
                            📁 {task.project_name || "General"}
                          </span>
                          <span className={`badge-priority-chip ${getPriorityBadgeClass(task.priority)}`} style={{ fontSize: "10px", padding: "1px 6px" }}>
                            {task.priority || "Medium"}
                          </span>
                        </div>

                        {/* Title */}
                        <div
                          style={{
                            fontSize: "13px",
                            fontWeight: "700",
                            color: "var(--text-main, #0f172a)",
                            lineHeight: "1.35",
                            marginBottom: "8px"
                          }}
                        >
                          {task.title}
                        </div>

                        {/* Description Preview if any */}
                        {task.description && (
                          <div
                            style={{
                              fontSize: "11.5px",
                              color: "var(--text-muted, #64748b)",
                              lineHeight: "1.3",
                              marginBottom: "10px",
                              display: "-webkit-box",
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: "vertical",
                              overflow: "hidden"
                            }}
                          >
                            {task.description}
                          </div>
                        )}

                        {/* Assignee & Due Date Row */}
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            gap: "8px",
                            paddingTop: "8px",
                            borderTop: "1px solid var(--border-subtle, #f1f5f9)",
                            fontSize: "11px",
                            color: "var(--text-muted)"
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            <span
                              className={`assignee-avatar ${task.assignee_color || "av-blue"}`}
                              style={{ width: "22px", height: "22px", fontSize: "10px" }}
                            >
                              {task.assignee || "TM"}
                            </span>
                            <span style={{ fontWeight: "600", color: "var(--text-body)" }}>
                              {task.assignee_name || task.assignee || "Unassigned"}
                            </span>
                          </div>

                          {task.due_date && (
                            <span title={`Due Date: ${task.due_date}`} style={{ fontWeight: "600" }}>
                              📅 {String(task.due_date).slice(5)}
                            </span>
                          )}
                        </div>

                        {/* ── 1-CLICK STAGE ADVANCEMENT ACTION BUTTONS ───────── */}
                        <div
                          style={{
                            marginTop: "10px",
                            paddingTop: "8px",
                            borderTop: "1px dashed var(--border-light, #e2e8f0)",
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                            flexWrap: "wrap"
                          }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          {/* From Backlog/Todo: Can start or jump directly to done */}
                          {stage.key === "todo" && (
                            <button
                              type="button"
                              className="btn btn-outline-pill btn-xs"
                              disabled={isBusy}
                              onClick={() => handleMoveTask(task, "in_progress")}
                              style={{ flex: 1, justifyContent: "center", fontSize: "11px", fontWeight: "700", color: "#2563eb", borderColor: "#93c5fd" }}
                            >
                              Start Work ⚡
                            </button>
                          )}

                          {/* From In Progress: Can submit for review or mark done */}
                          {stage.key === "in_progress" && (
                            <>
                              <button
                                type="button"
                                className="btn btn-outline-pill btn-xs"
                                disabled={isBusy}
                                onClick={() => handleMoveTask(task, "review")}
                                style={{ flex: 1, justifyContent: "center", fontSize: "11px", fontWeight: "700", color: "#d97706", borderColor: "#fde68a" }}
                              >
                                For Review 🔍
                              </button>
                              <button
                                type="button"
                                className="btn btn-outline-pill btn-xs"
                                disabled={isBusy}
                                onClick={() => handleMoveTask(task, "done")}
                                style={{ flex: 1, justifyContent: "center", fontSize: "11px", fontWeight: "700", color: "#059669", borderColor: "#a7f3d0" }}
                              >
                                Done ✅
                              </button>
                            </>
                          )}

                          {/* From Review: Can approve (done) or send back to in_progress */}
                          {stage.key === "review" && (
                            <>
                              <button
                                type="button"
                                className="btn btn-outline-pill btn-xs"
                                disabled={isBusy}
                                onClick={() => handleMoveTask(task, "in_progress")}
                                style={{ flex: 1, justifyContent: "center", fontSize: "11px", fontWeight: "600" }}
                              >
                                ↺ Revise
                              </button>
                              <button
                                type="button"
                                className="btn btn-outline-pill btn-xs"
                                disabled={isBusy}
                                onClick={() => handleMoveTask(task, "done")}
                                style={{ flex: 1, justifyContent: "center", fontSize: "11px", fontWeight: "700", color: "#059669", borderColor: "#a7f3d0" }}
                              >
                                Approve ✅
                              </button>
                            </>
                          )}

                          {/* From Done: Can reopen */}
                          {stage.key === "done" && (
                            <button
                              type="button"
                              className="btn btn-outline-pill btn-xs"
                              disabled={isBusy}
                              onClick={() => handleMoveTask(task, "todo")}
                              style={{ width: "100%", justifyContent: "center", fontSize: "11px", fontWeight: "600", color: "var(--text-muted)" }}
                            >
                              ↺ Reopen Task
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
