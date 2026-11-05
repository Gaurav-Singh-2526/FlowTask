import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useTasks } from "../../context/TaskContext";

export default function TaskTable({ onEditTask, onRespondTask }) {
  const { currentUser, isTeamLeader, teamUsers } = useAuth();
  const { tasks, updateTask, deleteTask, activeMemberFilter, setActiveMemberFilter, setInspectedMember } = useTasks();

  const [filterStatus, setFilterStatus] = useState("all");
  const [filterPriority, setFilterPriority] = useState("all");

  const statusCycle = { todo: "in_progress", in_progress: "review", review: "done", done: "todo" };
  const priorityCycle = { low: "medium", medium: "high", high: "urgent", urgent: "low" };

  const handleToggleDone = (task) => {
    if (!isTeamLeader && task.assignee !== currentUser?.initials) return;
    const nextStatus = task.status === "done" ? "todo" : "done";
    updateTask(task.id, { ...task, status: nextStatus });
  };

  const handleCycleStatus = (task) => {
    if (!isTeamLeader && task.assignee !== currentUser?.initials) return;
    const next = statusCycle[task.status] || "todo";
    updateTask(task.id, { ...task, status: next });
  };

  const handleCyclePriority = (task) => {
    if (!isTeamLeader && task.assignee !== currentUser?.initials) return;
    const next = priorityCycle[task.priority] || "medium";
    updateTask(task.id, { ...task, priority: next });
  };

  // Filter tasks
  const displayedTasks = tasks.filter(t => {
    if (activeMemberFilter && t.assignee !== activeMemberFilter) return false;
    if (filterStatus !== "all" && t.status !== filterStatus) return false;
    if (filterPriority !== "all" && t.priority !== filterPriority) return false;
    return true;
  });

  const getAssigneeUser = (initials) => {
    return teamUsers.find(u => u.initials === initials) || { name: initials, initials, color: "av-blue" };
  };

  return (
    <section className="dashboard-panel recent-tasks-panel" aria-label="Recent tasks panel">
      <div className="panel-card-header">
        <div>
          <h2 className="card-heading">Recent Tasks</h2>
          <p className="card-subheading">
            {activeMemberFilter
              ? `Filtered by member: ${activeMemberFilter}`
              : isTeamLeader
              ? "All team members · Live Sprint Progress & Task Tracking"
              : "Showing your assigned deliverables"}
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          {activeMemberFilter && (
            <button
              type="button"
              className="btn btn-outline-pill btn-xs"
              onClick={() => setActiveMemberFilter(null)}
              title="Show all tasks"
            >
              ✕ Clear Filter ({activeMemberFilter})
            </button>
          )}

          <div className="filter-ctrl" style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
            <label style={{ fontSize: "12px", color: "var(--text-muted)" }}>Status:</label>
            <select
              className="form-select-sm"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">All</option>
              <option value="todo">To Do</option>
              <option value="in_progress">In Progress</option>
              <option value="review">Review</option>
              <option value="done">Done</option>
            </select>
          </div>

          <div className="filter-ctrl" style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
            <label style={{ fontSize: "12px", color: "var(--text-muted)" }}>Priority:</label>
            <select
              className="form-select-sm"
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
            >
              <option value="all">All</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>
        </div>
      </div>

      <div className="table-header-row">
        <span className="th-col th-select">#</span>
        <span className="th-col th-title">Task</span>
        <span className="th-col th-priority">Priority</span>
        <span className="th-col th-status">Status</span>
        <span className="th-col th-due">Due</span>
        <span className="th-col th-assignee">Assignee</span>
        <span className="th-col th-actions" style={{ width: "90px" }}>Actions</span>
      </div>

      <ul className="task-list-items">
        {displayedTasks.length === 0 ? (
          <li style={{ padding: "32px", textAlign: "center", color: "var(--text-muted)", fontSize: "14px" }}>
            No tasks found in this view.
          </li>
        ) : (
          displayedTasks.map(task => {
            const assigneeUser = getAssigneeUser(task.assignee);
            const isAssignedToMe = task.assignee === currentUser?.initials;
            const canModify = isTeamLeader || isAssignedToMe;

            return (
              <li
                key={task.id}
                className={`task-item ${task.status === "done" ? "is-completed" : ""}`}
              >
                {/* 1. Checkbox */}
                <div className="task-col-select">
                  <input
                    type="checkbox"
                    className="task-checkbox"
                    checked={task.status === "done"}
                    disabled={!canModify}
                    onChange={() => canModify && handleToggleDone(task)}
                    aria-label={`Mark "${task.title}" as done`}
                    style={{ cursor: canModify ? "pointer" : "not-allowed", opacity: canModify ? 1 : 0.45 }}
                    title={canModify ? `Mark "${task.title}" as done` : `🔒 Only ${assigneeUser.name} or Team Leader can modify this task`}
                  />
                </div>

                {/* 2. Title */}
                <div className={`task-col-title ${task.status === "done" ? "is-strikethrough" : ""}`}>
                  {task.title}
                  {isAssignedToMe && !isTeamLeader && (
                    <span className="badge-role-tag badge-member" style={{ fontSize: "9px", padding: "1px 5px", marginLeft: "6px" }}>
                      Assigned to You
                    </span>
                  )}
                </div>

                {/* 3. Priority badge */}
                <div className="task-col-priority">
                  <span
                    className={`badge badge-priority-${task.priority}`}
                    style={{ cursor: canModify ? "pointer" : "default", opacity: canModify ? 1 : 0.8 }}
                    title={canModify ? "Click to cycle priority" : `Priority: ${task.priority}`}
                    onClick={() => canModify && handleCyclePriority(task)}
                  >
                    {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                  </span>
                </div>

                {/* 4. Status badge */}
                <div className="task-col-status">
                  <span
                    className={`badge badge-status-${task.status === "in_progress" ? "in_progress" : task.status === "done" ? "done" : task.status === "review" ? "review" : "backlog"}`}
                    style={{ cursor: canModify ? "pointer" : "default", opacity: canModify ? 1 : 0.8 }}
                    title={canModify ? "Click to advance status" : `Status: ${task.status.replace("_", " ")}`}
                    onClick={() => canModify && handleCycleStatus(task)}
                  >
                    {task.status === "in_progress" ? "In Progress" : task.status === "done" ? "Completed" : task.status === "review" ? "Review" : "To Do"}
                  </span>
                </div>

                {/* 5. Due date */}
                <div className="task-col-due">
                  {task.due_date || "Apr 5"}
                </div>

                {/* 6. Assignee Avatar (🔒 One-time Assignment Rule - Click to view member profile & work) */}
                <div className="task-col-assignee" style={{ position: "relative" }}>
                  <span
                    className={`assignee-avatar ${assigneeUser.color || "av-blue"}`}
                    style={{ cursor: "pointer" }}
                    title={`Assigned to ${assigneeUser.name} (🔒 One-time Assignment Rule - Click to view work updates)`}
                    onClick={() => {
                      if (setInspectedMember) {
                        setInspectedMember(assigneeUser);
                      }
                    }}
                  >
                    {assigneeUser.initials}
                  </span>
                </div>

                {/* 7. Action Buttons */}
                <div className="task-col-actions">
                  {/* Member Quick Respond button */}
                  {!isTeamLeader && isAssignedToMe && onRespondTask && (
                    <button
                      type="button"
                      className="btn-task-action"
                      style={{
                        background: "rgba(79, 70, 229, 0.08)",
                        color: "var(--primary)",
                        borderColor: "rgba(79, 70, 229, 0.2)",
                        fontWeight: "600",
                        fontSize: "11px",
                        padding: "3px 8px",
                        borderRadius: "6px"
                      }}
                      title="Send quick status response to Leader on this task"
                      onClick={() => onRespondTask(task)}
                    >
                      💬 Update
                    </button>
                  )}

                  {/* Edit: Accessible ONLY to Team Leader or the Assigned Member themselves */}
                  {canModify && (
                    <button
                      type="button"
                      className="btn-task-action btn-task-edit btn-task-icon-sm"
                      title={isTeamLeader ? "Leader: Edit task" : "Edit your assigned task"}
                      onClick={() => onEditTask && onEditTask(task)}
                      aria-label="Edit task"
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                    </button>
                  )}

                  {/* Delete: Direct task deletion is strictly Team Leader only */}
                  {isTeamLeader && (
                    <button
                      type="button"
                      className="btn-task-action btn-task-delete btn-task-icon-sm"
                      title="Leader: Delete task"
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
                  )}
                </div>
              </li>
            );
          })
        )}
      </ul>
    </section>
  );
}
