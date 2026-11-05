import React from "react";
import { useAuth } from "../../context/AuthContext";
import { useTasks } from "../../context/TaskContext";

export default function KanbanBoard({ onNewTask }) {
  const { currentUser, teamUsers, isTeamLeader } = useAuth();
  const { tasks, updateTask, deleteTask, setEditModalTask, activeMemberFilter } = useTasks();

  const displayedTasks = tasks.filter(t => !activeMemberFilter || t.assignee === activeMemberFilter);

  const todoTasks = displayedTasks.filter(t => t.status === "todo" || t.status === "backlog");
  const ipTasks = displayedTasks.filter(t => t.status === "in_progress" || t.status === "review");
  const doneTasks = displayedTasks.filter(t => t.status === "done");

  const moveTask = (task, newStatus) => {
    if (!isTeamLeader && task.assignee !== currentUser?.initials) {
      alert("Permission Denied: You cannot modify tasks assigned to another team member.");
      return;
    }
    updateTask(task.id, { ...task, status: newStatus });
  };

  const getAssigneeUser = (initials) => {
    return teamUsers.find(u => u.initials === initials) || { name: initials, initials, color: "av-blue" };
  };

  return (
    <div className="kanban-board-container" style={{ padding: "8px 0" }}>
      <div className="kanban-board">
        {/* Column 1: To Do */}
        <div className="kanban-col">
          <div className="kb-col-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span className="kb-col-dot" style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#818cf8" }}></span>
              <span style={{ fontWeight: "700", fontSize: "14px" }}>To Do</span>
              <span className="tab-badge">{todoTasks.length}</span>
            </div>
            {isTeamLeader && (
              <button type="button" className="btn btn-outline-pill btn-xs" onClick={onNewTask}>+</button>
            )}
          </div>

          <div className="kb-cards-list" style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {todoTasks.map(task => {
              const u = getAssigneeUser(task.assignee);
              const isAssignedToMe = task.assignee === currentUser?.initials;
              const canModify = isTeamLeader || isAssignedToMe;

              return (
                <div key={task.id} className="kanban-card">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "6px" }}>
                    <div className="kb-card-title">{task.title}</div>
                    <div style={{ display: "flex", gap: "4px", flexShrink: 0 }}>
                      {canModify && (
                        <button
                          type="button"
                          className="btn-task-action btn-task-edit btn-task-icon-xs"
                          onClick={(e) => { e.stopPropagation(); setEditModalTask(task); }}
                          title={isTeamLeader ? "Leader: Edit task" : "Edit your task"}
                          aria-label="Edit task"
                        >
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                          </svg>
                        </button>
                      )}
                      {isTeamLeader && (
                        <button
                          type="button"
                          className="btn-task-action btn-task-delete btn-task-icon-xs"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (window.confirm(`Delete task "${task.title}"?`)) {
                              deleteTask(task.id);
                            }
                          }}
                          title="Leader: Delete task"
                          aria-label="Delete task"
                        >
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                            <line x1="10" y1="11" x2="10" y2="17" />
                            <line x1="14" y1="11" x2="14" y2="17" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="kb-card-footer" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "10px" }}>
                    <span className={`badge badge-priority-${task.priority}`}>{task.priority}</span>
                    <span className={`assignee-avatar ${u.color || "av-blue"}`} style={{ width: "22px", height: "22px", fontSize: "10px" }}>
                      {u.initials}
                    </span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "8px" }}>
                    {canModify ? (
                      <button
                        type="button"
                        className="btn btn-outline-pill btn-xs"
                        onClick={() => moveTask(task, "in_progress")}
                      >
                        Start &rarr;
                      </button>
                    ) : (
                      <span style={{ fontSize: "11px", color: "var(--text-muted)", fontStyle: "italic", background: "var(--bg-sidebar)", padding: "2px 8px", borderRadius: "4px" }}>
                        🔒 {u.name}'s task
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Column 2: In Progress */}
        <div className="kanban-col">
          <div className="kb-col-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span className="kb-col-dot" style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#5b5df8" }}></span>
              <span style={{ fontWeight: "700", fontSize: "14px" }}>In Progress</span>
              <span className="tab-badge">{ipTasks.length}</span>
            </div>
          </div>

          <div className="kb-cards-list" style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {ipTasks.map(task => {
              const u = getAssigneeUser(task.assignee);
              const isAssignedToMe = task.assignee === currentUser?.initials;
              const canModify = isTeamLeader || isAssignedToMe;

              return (
                <div key={task.id} className="kanban-card">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "6px" }}>
                    <div className="kb-card-title">{task.title}</div>
                    <div style={{ display: "flex", gap: "4px", flexShrink: 0 }}>
                      {canModify && (
                        <button
                          type="button"
                          className="btn-task-action btn-task-edit btn-task-icon-xs"
                          onClick={(e) => { e.stopPropagation(); setEditModalTask(task); }}
                          title={isTeamLeader ? "Leader: Edit task" : "Edit your task"}
                          aria-label="Edit task"
                        >
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                          </svg>
                        </button>
                      )}
                      {isTeamLeader && (
                        <button
                          type="button"
                          className="btn-task-action btn-task-delete btn-task-icon-xs"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (window.confirm(`Delete task "${task.title}"?`)) {
                              deleteTask(task.id);
                            }
                          }}
                          title="Leader: Delete task"
                          aria-label="Delete task"
                        >
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                            <line x1="10" y1="11" x2="10" y2="17" />
                            <line x1="14" y1="11" x2="14" y2="17" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="kb-card-footer" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "10px" }}>
                    <span className={`badge badge-priority-${task.priority}`}>{task.priority}</span>
                    <span className={`assignee-avatar ${u.color || "av-blue"}`} style={{ width: "22px", height: "22px", fontSize: "10px" }}>
                      {u.initials}
                    </span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "8px" }}>
                    {canModify ? (
                      <>
                        <button
                          type="button"
                          className="btn btn-outline-pill btn-xs"
                          onClick={() => moveTask(task, "todo")}
                        >
                          &larr; Back
                        </button>
                        <button
                          type="button"
                          className="btn btn-primary-pill btn-xs"
                          onClick={() => moveTask(task, "done")}
                        >
                          Done &rarr;
                        </button>
                      </>
                    ) : (
                      <span style={{ fontSize: "11px", color: "var(--text-muted)", fontStyle: "italic", background: "var(--bg-sidebar)", padding: "2px 8px", borderRadius: "4px", marginLeft: "auto" }}>
                        🔒 {u.name}'s task
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Column 3: Completed */}
        <div className="kanban-col">
          <div className="kb-col-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span className="kb-col-dot" style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#10b981" }}></span>
              <span style={{ fontWeight: "700", fontSize: "14px" }}>Completed</span>
              <span className="tab-badge">{doneTasks.length}</span>
            </div>
          </div>

          <div className="kb-cards-list" style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {doneTasks.map(task => {
              const u = getAssigneeUser(task.assignee);
              const isAssignedToMe = task.assignee === currentUser?.initials;
              const canModify = isTeamLeader || isAssignedToMe;

              return (
                <div key={task.id} className="kanban-card is-completed">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "6px" }}>
                    <div className="kb-card-title is-strikethrough">{task.title}</div>
                    <div style={{ display: "flex", gap: "4px", flexShrink: 0 }}>
                      {canModify && (
                        <button
                          type="button"
                          className="btn-task-action btn-task-edit btn-task-icon-xs"
                          onClick={(e) => { e.stopPropagation(); setEditModalTask(task); }}
                          title={isTeamLeader ? "Leader: Edit task" : "Edit your task"}
                          aria-label="Edit task"
                        >
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                          </svg>
                        </button>
                      )}
                      {isTeamLeader && (
                        <button
                          type="button"
                          className="btn-task-action btn-task-delete btn-task-icon-xs"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (window.confirm(`Delete task "${task.title}"?`)) {
                              deleteTask(task.id);
                            }
                          }}
                          title="Leader: Delete task"
                          aria-label="Delete task"
                        >
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                            <line x1="10" y1="11" x2="10" y2="17" />
                            <line x1="14" y1="11" x2="14" y2="17" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="kb-card-footer" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "10px" }}>
                    <span className="badge badge-status-done">Done</span>
                    <span className={`assignee-avatar ${u.color || "av-blue"}`} style={{ width: "22px", height: "22px", fontSize: "10px" }}>
                      {u.initials}
                    </span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "flex-start", marginTop: "8px" }}>
                    {canModify ? (
                      <button
                        type="button"
                        className="btn btn-outline-pill btn-xs"
                        onClick={() => moveTask(task, "in_progress")}
                      >
                        &larr; Reopen
                      </button>
                    ) : (
                      <span style={{ fontSize: "11px", color: "var(--text-muted)", fontStyle: "italic", background: "var(--bg-sidebar)", padding: "2px 8px", borderRadius: "4px" }}>
                        🔒 {u.name}'s task
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
