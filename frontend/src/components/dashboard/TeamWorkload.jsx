import React from "react";
import { useAuth } from "../../context/AuthContext";
import { useTasks } from "../../context/TaskContext";

export default function TeamWorkload({ onAddMember }) {
  const { teamUsers, isTeamLeader } = useAuth();
  const { tasks, activeMemberFilter, setActiveMemberFilter, setInspectedMember } = useTasks();

  return (
    <section className="dashboard-panel workload-panel" aria-label="Team Workload">
      <div className="panel-card-header">
        <div>
          <h2 className="card-heading" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span>👥 Team Workload</span>
          </h2>
          <p className="card-subheading">Active members · {teamUsers.length} people</p>
        </div>
        {isTeamLeader && onAddMember && (
          <button
            type="button"
            className="btn btn-outline-pill btn-xs"
            onClick={onAddMember}
            title="Add new team member"
          >
            + Add Member
          </button>
        )}
      </div>

      <ul className="workload-list">
        {teamUsers.map(u => {
          const userTasks = tasks.filter(t => t.assignee === u.initials);
          const doneCount = userTasks.filter(t => t.status === "done").length;
          const totalCount = userTasks.length;
          const pct = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;
          const isSelected = activeMemberFilter === u.initials;
          const fillClass = (u.color || "av-blue").replace("av-", "fill-");

          return (
            <li
              key={u.id}
              className={`workload-item clickable-member ${isSelected ? "is-selected-member" : ""}`}
              onClick={() => {
                setActiveMemberFilter(u.initials);
                setInspectedMember(u);
              }}
              title={`Click to view assigned tasks & work updates for ${u.name}`}
              style={{ cursor: "pointer" }}
            >
              <span className={`assignee-avatar ${u.color || "av-blue"}`}>{u.initials}</span>
              <span className="member-name">
                {u.name}
                {u.role === "Team Leader" && (
                  <span style={{ fontSize: "10px", color: "var(--primary)", fontWeight: "bold", marginLeft: "4px" }}>👑</span>
                )}
              </span>
              <div className="progress-bar-track">
                <div className={`progress-bar-fill ${fillClass}`} style={{ width: `${pct}%` }}></div>
              </div>
              <span className="member-ratio">{doneCount}/{totalCount}</span>
            </li>
          );
        })}
      </ul>

      {/* Sprint Box (Dynamically calculated from real workspace tasks) */}
      <div className="sprint-status-box" style={{ marginTop: "16px" }}>
        <div className="sprint-box-top" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div className="sprint-badge">
            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
            <span>Workspace Sprint Velocity</span>
          </div>
          <span style={{ fontSize: "12px", fontWeight: "700", color: "var(--primary)" }}>
            {tasks.length > 0 ? Math.round((tasks.filter(t => t.status === "done").length / tasks.length) * 100) : 0}%
          </span>
        </div>
        <div className="sprint-progress-bar" style={{ marginTop: "8px" }}>
          <div
            className="sprint-progress-fill"
            style={{
              width: `${tasks.length > 0 ? Math.round((tasks.filter(t => t.status === "done").length / tasks.length) * 100) : 0}%`,
              transition: "width 0.4s ease"
            }}
          ></div>
        </div>
        <p className="sprint-details" style={{ marginTop: "6px" }}>
          {tasks.filter(t => t.status === "done").length}/{tasks.length} deliverables completed in workspace
        </p>
      </div>
    </section>
  );
}
