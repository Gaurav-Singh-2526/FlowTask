import React from "react";
import { useTasks } from "../../context/TaskContext";

export default function VelocityChart({ onSelectStatus }) {
  const { tasks, dashboardStats, setTaskStatusFilter } = useTasks();

  const handleOpenTasks = () => {
    if (setTaskStatusFilter) setTaskStatusFilter("all");
    if (onSelectStatus) onSelectStatus("all");
  };

  const total = dashboardStats?.total || tasks.length;
  const completed = dashboardStats?.completed || tasks.filter(t => t.status === "done" || t.status === "completed").length;
  const inProgress = dashboardStats?.in_progress || tasks.filter(t => t.status === "in_progress").length;
  const overdue = dashboardStats?.overdue || 0;
  const pending = dashboardStats?.pending || tasks.filter(t => t.status === "todo").length;
  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

  // Dynamic 5-point Velocity Calculation
  const X = [50, 190, 330, 470, 610];
  const getY = (pct) => 175 - 1.5 * Math.min(100, Math.max(0, pct));

  const p0 = 0;
  const p1 = total > 0 ? Math.min(100, Math.round(((total - overdue) / total) * 28)) : 0;
  const p2 = total > 0 ? Math.min(100, Math.round(((inProgress * 0.7 + completed) / total) * 60)) : 0;
  const p3 = total > 0 ? Math.min(100, Math.round(((inProgress * 0.3 + completed) / total) * 85)) : 0;
  const p4 = completionRate;

  const Y = [getY(p0), getY(p1), getY(p2), getY(p3), getY(p4)];

  // Planned target pace (ideal burndown line)
  const YPlan = [getY(0), getY(25), getY(50), getY(75), getY(100)];

  // Build smooth bezier curves from dynamic coordinates
  const actualPathD = `M ${X[0]} ${Y[0]} C ${(X[0]+X[1])/2} ${Y[0]}, ${(X[0]+X[1])/2} ${Y[1]}, ${X[1]} ${Y[1]} C ${(X[1]+X[2])/2} ${Y[1]}, ${(X[1]+X[2])/2} ${Y[2]}, ${X[2]} ${Y[2]} C ${(X[2]+X[3])/2} ${Y[2]}, ${(X[2]+X[3])/2} ${Y[3]}, ${X[3]} ${Y[3]} C ${(X[3]+X[4])/2} ${Y[3]}, ${(X[3]+X[4])/2} ${Y[4]}, ${X[4]} ${Y[4]}`;
  const areaPathD = `${actualPathD} L ${X[4]} 185 L ${X[0]} 185 Z`;

  const plannedPathD = `M ${X[0]} ${YPlan[0]} C ${(X[0]+X[1])/2} ${YPlan[0]}, ${(X[0]+X[1])/2} ${YPlan[1]}, ${X[1]} ${YPlan[1]} C ${(X[1]+X[2])/2} ${YPlan[1]}, ${(X[1]+X[2])/2} ${YPlan[2]}, ${X[2]} ${YPlan[2]} C ${(X[2]+X[3])/2} ${YPlan[2]}, ${(X[2]+X[3])/2} ${YPlan[3]}, ${X[3]} ${YPlan[3]} C ${(X[3]+X[4])/2} ${YPlan[3]}, ${(X[3]+X[4])/2} ${YPlan[4]}, ${X[4]} ${YPlan[4]}`;

  return (
    <section className="dashboard-panel chart-panel" aria-label="Task progress activity overview">
      <div className="panel-card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h2 className="card-heading">Task Completion Velocity</h2>
          <p className="card-subheading">
            Live velocity: <strong>{completed} of {total}</strong> deliverables completed (<strong>{completionRate}%</strong>) · {inProgress} in progress
          </p>
        </div>
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11px", color: "var(--text-muted)" }}>
            <span style={{ width: "12px", height: "3px", background: "#5b5df8", borderRadius: "2px" }}></span>
            <span>Actual ({completionRate}%)</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11px", color: "var(--text-muted)" }}>
            <span style={{ width: "12px", height: "3px", borderTop: "2px dashed #a5b4fc" }}></span>
            <span>Target Pace</span>
          </div>
          <button
            type="button"
            className="btn btn-outline-pill btn-xs"
            onClick={handleOpenTasks}
            title="Open Team Tasks page"
          >
            View Tasks &rarr;
          </button>
        </div>
      </div>

      <div
        className="chart-wrapper"
        onClick={handleOpenTasks}
        style={{ cursor: "pointer" }}
        title="Click to view full Team Tasks"
        role="button"
        tabIndex={0}
      >
        <svg viewBox="0 0 650 210" className="progress-svg-chart" aria-hidden="true">
          <defs>
            <linearGradient id="chartGlowBlue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#5b5df8" stopOpacity="0.22" />
              <stop offset="100%" stopColor="#5b5df8" stopOpacity="0.01" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          <line x1="35" y1="25" x2="630" y2="25" className="chart-grid-line" stroke="var(--border-light, #f1f5f9)" strokeWidth="1" />
          <line x1="35" y1="62" x2="630" y2="62" className="chart-grid-line" stroke="var(--border-light, #f1f5f9)" strokeWidth="1" />
          <line x1="35" y1="100" x2="630" y2="100" className="chart-grid-line" stroke="var(--border-light, #f1f5f9)" strokeWidth="1" />
          <line x1="35" y1="137" x2="630" y2="137" className="chart-grid-line" stroke="var(--border-light, #f1f5f9)" strokeWidth="1" />
          <line x1="35" y1="175" x2="630" y2="175" className="chart-grid-line" stroke="var(--border-light, #f1f5f9)" strokeWidth="1" />

          {/* Y-axis labels */}
          <text x="15" y="29" className="chart-axis-label">100%</text>
          <text x="15" y="66" className="chart-axis-label">75%</text>
          <text x="15" y="104" className="chart-axis-label">50%</text>
          <text x="15" y="141" className="chart-axis-label">25%</text>
          <text x="15" y="179" className="chart-axis-label">0%</text>

          {/* Dynamic Filled Area Gradient */}
          <path
            d={areaPathD}
            fill="url(#chartGlowBlue)"
            style={{ transition: "d 0.5s ease" }}
          />

          {/* Planned Curve (Target) */}
          <path
            d={plannedPathD}
            fill="none"
            stroke="#a5b4fc"
            strokeWidth="2.2"
            strokeDasharray="4 4"
            opacity="0.8"
          />

          {/* Actual Dynamic Velocity Curve */}
          <path
            d={actualPathD}
            fill="none"
            stroke="#5b5df8"
            strokeWidth="3.2"
            strokeLinecap="round"
            style={{ transition: "d 0.5s ease" }}
          />

          {/* Dynamic Interactive Dots */}
          <circle cx={X[1]} cy={Y[1]} r="4.5" fill="#5b5df8" stroke="#ffffff" strokeWidth="2.5" />
          <circle cx={X[2]} cy={Y[2]} r="4.5" fill="#5b5df8" stroke="#ffffff" strokeWidth="2.5" />
          <circle cx={X[3]} cy={Y[3]} r="4.5" fill="#5b5df8" stroke="#ffffff" strokeWidth="2.5" />
          <circle cx={X[4]} cy={Y[4]} r="5.5" fill="#10b981" stroke="#ffffff" strokeWidth="2.5" />

          {/* Value callout above current velocity dot */}
          <text
            x={X[4]}
            y={Math.max(16, Y[4] - 10)}
            textAnchor="middle"
            fill="#10b981"
            fontSize="11"
            fontWeight="700"
          >
            {completionRate}%
          </text>

          {/* X-axis labels */}
          <text x={X[0]} y="198" className="chart-axis-label">Kickoff</text>
          <text x={X[1]} y="198" className="chart-axis-label">Planning</text>
          <text x={X[2]} y="198" className="chart-axis-label">Development</text>
          <text x={X[3]} y="198" className="chart-axis-label">Review</text>
          <text x={X[4]} y="198" className="chart-axis-label">Delivered</text>
        </svg>
      </div>
    </section>
  );
}
