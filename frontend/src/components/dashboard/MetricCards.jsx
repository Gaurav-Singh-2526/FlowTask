import React from "react";
import { useTasks } from "../../context/TaskContext";

export default function MetricCards({ onSelectStatus }) {
  const { dashboardStats, setTaskStatusFilter } = useTasks();

  const handleCardClick = (status) => {
    if (setTaskStatusFilter) {
      setTaskStatusFilter(status);
    }
    if (onSelectStatus) {
      onSelectStatus(status);
    }
  };

  const total = dashboardStats?.total || 0;
  const completed = dashboardStats?.completed || 0;
  const inProgress = dashboardStats?.in_progress || 0;
  const overdue = dashboardStats?.overdue || 0;

  const completedPct = total > 0 ? Math.round((completed / total) * 100) : 0;
  const inProgressPct = total > 0 ? Math.round((inProgress / total) * 100) : 0;
  const overduePct = total > 0 ? Math.round((overdue / total) * 100) : 0;

  return (
    <section className="metrics-grid" aria-label="Key task metrics">
      {/* Card 1: Total Tasks */}
      <div
        className="metric-card interactive-stat-card"
        onClick={() => handleCardClick("all")}
        role="button"
        tabIndex={0}
        title="Click to view all team tasks"
        style={{ cursor: "pointer", transition: "transform 0.18s ease, box-shadow 0.18s ease" }}
      >
        <div className="card-top-row">
          <div className="card-icon-box box-purple">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="9 11 12 14 22 4"></polyline>
              <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
            </svg>
          </div>
          <div className="trend-indicator trend-green">
            <span style={{ fontWeight: "700" }}>Live Database</span>
          </div>
        </div>
        <div className="metric-value">{total}</div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "4px" }}>
          <div className="metric-label">Total Tasks</div>
          <span className="card-click-hint" style={{ fontSize: "11px", color: "var(--primary)", fontWeight: "600" }}>
            View All &rarr;
          </span>
        </div>
      </div>

      {/* Card 2: Total Completed Tasks */}
      <div
        className="metric-card interactive-stat-card"
        onClick={() => handleCardClick("done")}
        role="button"
        tabIndex={0}
        title="Click to view only completed tasks"
        style={{ cursor: "pointer", transition: "transform 0.18s ease, box-shadow 0.18s ease" }}
      >
        <div className="card-top-row">
          <div className="card-icon-box box-green">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
          </div>
          <div className="trend-indicator trend-green">
            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
              <polyline points="17 6 23 6 23 12"></polyline>
            </svg>
            <span>{completedPct}% done</span>
          </div>
        </div>
        <div className="metric-value">{completed}</div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "4px" }}>
          <div className="metric-label">Total Completed Tasks</div>
          <span className="card-click-hint" style={{ fontSize: "11px", color: "#10b981", fontWeight: "600" }}>
            View Completed &rarr;
          </span>
        </div>
      </div>

      {/* Card 3: Total In Progress Tasks */}
      <div
        className="metric-card interactive-stat-card"
        onClick={() => handleCardClick("in_progress")}
        role="button"
        tabIndex={0}
        title="Click to view only in-progress tasks"
        style={{ cursor: "pointer", transition: "transform 0.18s ease, box-shadow 0.18s ease" }}
      >
        <div className="card-top-row">
          <div className="card-icon-box box-orange">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
          </div>
          <div className="trend-indicator trend-orange" style={{ color: "#ea580c" }}>
            <span>{inProgressPct}% active</span>
          </div>
        </div>
        <div className="metric-value">{inProgress}</div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "4px" }}>
          <div className="metric-label">Total In Progress Tasks</div>
          <span className="card-click-hint" style={{ fontSize: "11px", color: "#f59e0b", fontWeight: "600" }}>
            View In Progress &rarr;
          </span>
        </div>
      </div>

      {/* Card 4: Total Overdue Tasks */}
      <div
        className="metric-card interactive-stat-card"
        onClick={() => handleCardClick("overdue")}
        role="button"
        tabIndex={0}
        title="Click to view only overdue tasks"
        style={{ cursor: "pointer", transition: "transform 0.18s ease, box-shadow 0.18s ease" }}
      >
        <div className="card-top-row">
          <div className="card-icon-box box-red">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
          </div>
          <div className="trend-indicator trend-red">
            <span>{overduePct}% overdue</span>
          </div>
        </div>
        <div className="metric-value">{overdue}</div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "4px" }}>
          <div className="metric-label">Total Overdue Tasks</div>
          <span className="card-click-hint" style={{ fontSize: "11px", color: "#ef4444", fontWeight: "600" }}>
            View Overdue &rarr;
          </span>
        </div>
      </div>
    </section>
  );
}
