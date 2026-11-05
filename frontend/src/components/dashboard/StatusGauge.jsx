import React from "react";
import { useTasks } from "../../context/TaskContext";

export default function StatusGauge({ onSelectStatus }) {
  const { dashboardStats, setTaskStatusFilter } = useTasks();

  const handleSelect = (status) => {
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
  const pending = dashboardStats?.pending || 0;
  const completionRate = dashboardStats?.completion_rate || (total > 0 ? Math.round((completed / total) * 100) : 0);

  // Dynamic SVG arc calculations (arc length = PI * R, R = 85 -> 267.04)
  const ARC_LEN = 267.04;
  const cLen = total > 0 ? (completed / total) * ARC_LEN : 0;
  const pLen = total > 0 ? (inProgress / total) * ARC_LEN : 0;
  const oLen = total > 0 ? (overdue / total) * ARC_LEN : 0;
  const pendLen = total > 0 ? Math.max(0, ARC_LEN - cLen - pLen - oLen) : 0;

  return (
    <section className="dashboard-panel gauge-panel" aria-label="Tasks by status breakdown">
      <div className="panel-card-header">
        <div>
          <h2 className="card-heading">Tasks by Status</h2>
          <p className="card-subheading">Live database distribution · Click any status to view tasks</p>
        </div>
      </div>

      <div
        className="gauge-wrapper"
        onClick={() => handleSelect("all")}
        style={{ cursor: "pointer" }}
        title="Click to view all tasks"
        role="button"
        tabIndex={0}
      >
        <svg viewBox="0 0 220 125" className="gauge-svg" aria-hidden="true">
          {/* Background Arc */}
          <path
            d="M 25 110 A 85 85 0 0 1 195 110"
            fill="none"
            stroke="var(--border-light, #eef0f8)"
            strokeWidth="16"
            strokeLinecap="round"
          />

          {total > 0 && (
            <>
              {/* Segment 1: Pending (Amber) */}
              {pendLen > 0 && (
                <path
                  d="M 25 110 A 85 85 0 0 1 195 110"
                  fill="none"
                  stroke="#f59e0b"
                  strokeWidth="16"
                  strokeDasharray={`${pendLen} ${ARC_LEN}`}
                  strokeDashoffset="0"
                  style={{ transition: "stroke-dasharray 0.5s ease" }}
                />
              )}

              {/* Segment 2: Overdue (Red) */}
              {oLen > 0 && (
                <path
                  d="M 25 110 A 85 85 0 0 1 195 110"
                  fill="none"
                  stroke="#ef4444"
                  strokeWidth="16"
                  strokeDasharray={`${oLen} ${ARC_LEN}`}
                  strokeDashoffset={-pendLen}
                  style={{ transition: "stroke-dasharray 0.5s ease, stroke-dashoffset 0.5s ease" }}
                />
              )}

              {/* Segment 3: In Progress (Blue) */}
              {pLen > 0 && (
                <path
                  d="M 25 110 A 85 85 0 0 1 195 110"
                  fill="none"
                  stroke="#5b5df8"
                  strokeWidth="16"
                  strokeDasharray={`${pLen} ${ARC_LEN}`}
                  strokeDashoffset={-(pendLen + oLen)}
                  style={{ transition: "stroke-dasharray 0.5s ease, stroke-dashoffset 0.5s ease" }}
                />
              )}

              {/* Segment 4: Completed (Green) */}
              {cLen > 0 && (
                <path
                  d="M 25 110 A 85 85 0 0 1 195 110"
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="16"
                  strokeDasharray={`${cLen} ${ARC_LEN}`}
                  strokeDashoffset={-(pendLen + oLen + pLen)}
                  strokeLinecap={cLen === ARC_LEN ? "round" : "butt"}
                  style={{ transition: "stroke-dasharray 0.5s ease, stroke-dashoffset 0.5s ease" }}
                />
              )}
            </>
          )}

          {/* Center Text */}
          <text x="110" y="80" textAnchor="middle" className="gauge-center-num">{total}</text>
          <text x="110" y="98" textAnchor="middle" className="gauge-center-sub" style={{ fontSize: "11px", fill: "var(--primary)" }}>
            {total > 0 ? `${completionRate}% Done` : "No Tasks"} &rarr;
          </text>
        </svg>
      </div>

      <ul className="status-legend-list">
        <li
          className="legend-row interactive-legend-item"
          onClick={() => handleSelect("done")}
          style={{ cursor: "pointer", padding: "6px 8px", borderRadius: "6px" }}
          title="Filter Team Tasks by Completed"
        >
          <span className="legend-left">
            <span className="legend-dot dot-green"></span>
            <span className="legend-label" style={{ fontWeight: "600" }}>Completed</span>
          </span>
          <span className="legend-val" style={{ color: "#10b981", fontWeight: "700" }}>
            {completed} <span style={{ fontSize: "11px", fontWeight: "500", opacity: 0.85 }}>({total > 0 ? Math.round((completed / total) * 100) : 0}%)</span> &rarr;
          </span>
        </li>

        <li
          className="legend-row interactive-legend-item"
          onClick={() => handleSelect("in_progress")}
          style={{ cursor: "pointer", padding: "6px 8px", borderRadius: "6px" }}
          title="Filter Team Tasks by In Progress"
        >
          <span className="legend-left">
            <span className="legend-dot dot-blue"></span>
            <span className="legend-label" style={{ fontWeight: "600" }}>In Progress</span>
          </span>
          <span className="legend-val" style={{ color: "var(--primary)", fontWeight: "700" }}>
            {inProgress} <span style={{ fontSize: "11px", fontWeight: "500", opacity: 0.85 }}>({total > 0 ? Math.round((inProgress / total) * 100) : 0}%)</span> &rarr;
          </span>
        </li>

        <li
          className="legend-row interactive-legend-item"
          onClick={() => handleSelect("overdue")}
          style={{ cursor: "pointer", padding: "6px 8px", borderRadius: "6px" }}
          title="Filter Team Tasks by Overdue"
        >
          <span className="legend-left">
            <span className="legend-dot dot-red" style={{ background: "#ef4444" }}></span>
            <span className="legend-label" style={{ fontWeight: "600" }}>Overdue</span>
          </span>
          <span className="legend-val" style={{ color: "#ef4444", fontWeight: "700" }}>
            {overdue} <span style={{ fontSize: "11px", fontWeight: "500", opacity: 0.85 }}>({total > 0 ? Math.round((overdue / total) * 100) : 0}%)</span> &rarr;
          </span>
        </li>

        <li
          className="legend-row interactive-legend-item"
          onClick={() => handleSelect("todo")}
          style={{ cursor: "pointer", padding: "6px 8px", borderRadius: "6px" }}
          title="Filter Team Tasks by Pending"
        >
          <span className="legend-left">
            <span className="legend-dot dot-orange" style={{ background: "#f59e0b" }}></span>
            <span className="legend-label" style={{ fontWeight: "600" }}>Pending / To Do</span>
          </span>
          <span className="legend-val" style={{ color: "#f59e0b", fontWeight: "700" }}>
            {pending} <span style={{ fontSize: "11px", fontWeight: "500", opacity: 0.85 }}>({total > 0 ? Math.round((pending / total) * 100) : 0}%)</span> &rarr;
          </span>
        </li>
      </ul>
    </section>
  );
}
