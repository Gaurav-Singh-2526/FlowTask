import React from "react";
import { useAuth } from "../../context/AuthContext";
import { useTasks } from "../../context/TaskContext";
import MetricCards from "./MetricCards";
import VelocityChart from "./VelocityChart";
import StatusGauge from "./StatusGauge";

export default function LeaderDashboard({ onNewTask, onOpenDelegation, onEditTask, onSelectStatus }) {
  const { currentUser, teamUsers } = useAuth();
  const { tasks, setActiveMemberFilter } = useTasks();

  return (
    <div className="dashboard-content-wrapper">
      {/* ── ROLE-AWARE LEADER BANNER ───────────────────────────────────── */}
      <div className="role-dashboard-banner" style={{ marginBottom: "20px" }}>
        <div className="role-banner-inner is-leader">
          <div className="rb-left">
            <span className="assignee-avatar av-blue" style={{ width: "38px", height: "38px", fontSize: "14px" }}>
              {currentUser?.initials || (currentUser?.name ? currentUser.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() : "TL")}
            </span>
            <div>
              <div className="rb-title-row" style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                <span className="rb-user-name" style={{ fontWeight: "800", fontSize: "16px", color: "var(--text-main)" }}>
                  {currentUser?.name || "Team Leader"}
                </span>
                <span className="badge-role-tag badge-leader">👑 Team Leader</span>
                <span className="rb-status-chip" style={{ fontSize: "11px", background: "rgba(91,93,248,0.1)", color: "var(--primary)", padding: "2px 8px", borderRadius: "9999px", fontWeight: "600" }}>
                  Active Workspace
                </span>
              </div>
              <div className="rb-desc" style={{ fontSize: "13px", color: "var(--text-muted)", marginTop: "3px" }}>
                Managing <strong>{teamUsers.length} team members</strong> · Work delegation, 1-click reassignment, and workload capacity controls active.
              </div>
            </div>
          </div>

          <div className="rb-actions" style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <button
              type="button"
              className="btn btn-outline-pill btn-sm"
              onClick={() => onSelectStatus && onSelectStatus("all")}
              title="Open full Team Tasks page"
            >
              📋 Open Team Tasks ({tasks.length})
            </button>
            <button type="button" className="btn btn-primary-pill btn-sm" onClick={onOpenDelegation || onNewTask}>
              👑 Delegation Hub &amp; Work Allocation
            </button>
          </div>
        </div>
      </div>

      {/* ── ROW 1: 4 STAT METRIC CARDS (Total, Completed, In Progress, Overdue) ── */}
      <MetricCards onSelectStatus={onSelectStatus} />

      {/* ── ROW 2: CHARTS ROW (Interactive Completion Velocity & Status Gauge) ── */}
      <div className="charts-row" style={{ marginTop: "20px", marginBottom: "20px" }}>
        <VelocityChart onSelectStatus={onSelectStatus} />
        <StatusGauge onSelectStatus={onSelectStatus} />
      </div>
    </div>
  );
}
