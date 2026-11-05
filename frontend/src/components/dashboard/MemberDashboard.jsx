import React, { useState, useMemo } from "react";
import { useAuth } from "../../context/AuthContext";
import { useTasks } from "../../context/TaskContext";

export default function MemberDashboard({ onSelectStatus, onOpenEditProfile }) {
  const { currentUser } = useAuth();
  const { projects, tasks, updateTask, setTaskStatusFilter } = useTasks();

  const [selectedProjectId, setSelectedProjectId] = useState("all");

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

  // Assigned projects belonging to this member (from DB / Context)
  const myAssignedProjects = useMemo(() => {
    if (projects && projects.length > 0) return projects;
    if (currentUser?.assigned_projects && currentUser.assigned_projects.length > 0) {
      return currentUser.assigned_projects;
    }
    return [];
  }, [projects, currentUser]);

  // Strictly filter tasks assigned to this logged-in member
  const myAssignedTasks = useMemo(() => {
    return tasks.filter(t => 
      t.assignee === currentUser?.initials || 
      t.assignee_id === currentUser?.id
    );
  }, [tasks, currentUser]);

  // Filter tasks based on selected project
  const filteredTasksByProject = useMemo(() => {
    if (selectedProjectId === "all") return myAssignedTasks;
    const pid = Number(selectedProjectId);
    return myAssignedTasks.filter(t => t.project_id === pid);
  }, [myAssignedTasks, selectedProjectId]);

  // Project-wise progress calculations
  const projectProgressList = useMemo(() => {
    return myAssignedProjects.map(proj => {
      const projTasks = myAssignedTasks.filter(t => t.project_id === proj.id);
      const total = projTasks.length;
      const completed = projTasks.filter(t => t.status === "done" || t.status === "completed").length;
      const inProgress = projTasks.filter(t => t.status === "in_progress").length;
      const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
      return {
        ...proj,
        total,
        completed,
        inProgress,
        percent
      };
    });
  }, [myAssignedProjects, myAssignedTasks]);

  // Dynamic metrics calculated dynamically for the selected project view
  const metrics = useMemo(() => {
    const total = filteredTasksByProject.length;
    const inProgress = filteredTasksByProject.filter(t => t.status === "in_progress").length;
    const completed = filteredTasksByProject.filter(t => t.status === "done" || t.status === "completed").length;
    const overdue = filteredTasksByProject.filter(isOverdue).length;
    return { total, inProgress, completed, overdue };
  }, [filteredTasksByProject, todayStr]);

  const currentSelectedProj = myAssignedProjects.find(p => p.id === Number(selectedProjectId));

  const handleCardClick = (statusFilter) => {
    if (setTaskStatusFilter) {
      setTaskStatusFilter(statusFilter);
    }
    if (onSelectStatus) {
      onSelectStatus(statusFilter);
    }
  };

  const handleStatusChange = async (task, newStatus) => {
    await updateTask(task.id, { status: newStatus });
  };

  return (
    <div className="member-dashboard-container" style={{ padding: "4px 0 32px" }}>
      {/* ── SECTION 1: PERSONAL INFORMATION & PROFILE CARD ───────────────── */}
      <section
        className="dashboard-panel"
        style={{
          background: "var(--bg-card)",
          border: "1.5px solid var(--border-light)",
          borderRadius: "16px",
          padding: "24px 26px",
          marginBottom: "24px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.03)"
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px" }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: "16px" }}>
            {currentUser?.avatar_url ? (
              <img
                src={currentUser.avatar_url}
                alt={currentUser.name}
                style={{ width: "64px", height: "64px", borderRadius: "50%", objectFit: "cover", border: "2.5px solid var(--primary)" }}
              />
            ) : (
              <span
                className={`assignee-avatar ${currentUser?.color || "av-green"}`}
                style={{ width: "64px", height: "64px", fontSize: "22px", fontWeight: "800", boxShadow: "0 4px 14px rgba(16,185,129,0.25)" }}
              >
                {currentUser?.initials || "TM"}
              </span>
            )}

            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                <h1 style={{ fontSize: "22px", fontWeight: "800", color: "var(--text-main)", margin: 0, letterSpacing: "-0.4px" }}>
                  {currentUser?.name || "Team Member"}
                </h1>
                <span className="badge-role-tag badge-member" style={{ fontSize: "11px", padding: "3px 10px" }}>
                  👤 Team Member
                </span>
                <span style={{ fontSize: "12px", background: "rgba(16,185,129,0.1)", color: "#059669", padding: "2px 8px", borderRadius: "6px", fontWeight: "700" }}>
                  {currentUser?.title || "Engineer"}
                </span>
              </div>

              <div style={{ display: "flex", gap: "18px", alignItems: "center", marginTop: "8px", flexWrap: "wrap", fontSize: "13px", color: "var(--text-muted)" }}>
                <span>✉️ {currentUser?.email}</span>
                {currentUser?.phone ? (
                  <span>📞 {currentUser.phone}</span>
                ) : (
                  <span style={{ color: "var(--text-subtle)", fontStyle: "italic" }}>📞 No phone added</span>
                )}
                <span>🏢 Workspace ID: #{currentUser?.leader_id || "Active"}</span>
                <span>📁 {myAssignedProjects.length} Assigned Project{myAssignedProjects.length !== 1 ? "s" : ""}</span>
              </div>

              {currentUser?.bio && (
                <p style={{ marginTop: "10px", fontSize: "13.5px", color: "var(--text-body)", lineHeight: "1.5", maxWidth: "680px", margin: "10px 0 0" }}>
                  "{currentUser.bio}"
                </p>
              )}
            </div>
          </div>

          <button
            type="button"
            className="btn btn-primary"
            onClick={onOpenEditProfile}
            style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontWeight: "700", padding: "9px 16px" }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
            <span>✏️ Edit Profile</span>
          </button>
        </div>
      </section>

      {/* ── SECTION 2: ASSIGNED PROJECTS & PROJECT-WISE PROGRESS ────────── */}
      <section style={{ marginBottom: "24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px", flexWrap: "wrap", gap: "8px" }}>
          <div>
            <h2 style={{ fontSize: "16px", fontWeight: "800", color: "var(--text-main)", margin: "0 0 4px" }}>
              📁 Assigned Projects &amp; Progress
            </h2>
            <p style={{ fontSize: "12.5px", color: "var(--text-muted)", margin: 0 }}>
              Select a project to focus your deliverables and metrics. You have access to {myAssignedProjects.length} project workspace{myAssignedProjects.length !== 1 ? "s" : ""}.
            </p>
          </div>

          {selectedProjectId !== "all" && (
            <button
              type="button"
              className="btn btn-outline-pill btn-xs"
              onClick={() => setSelectedProjectId("all")}
              style={{ fontWeight: "700" }}
            >
              ✕ Show All Projects
            </button>
          )}
        </div>

        {myAssignedProjects.length === 0 ? (
          <div style={{ padding: "24px 20px", background: "rgba(245, 158, 11, 0.08)", border: "1.5px dashed #f59e0b", borderRadius: "14px", color: "#92400e", textAlign: "center" }}>
            <div style={{ fontSize: "28px", marginBottom: "6px" }}>📁</div>
            <div style={{ fontWeight: "700", fontSize: "14px", marginBottom: "4px" }}>No Projects Assigned Yet</div>
            <p style={{ fontSize: "12.5px", margin: 0 }}>
              Your Team Leader has not assigned you to any projects yet. As soon as your leader assigns you to projects, they will appear here with your task deliverables.
            </p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "14px" }}>
            {/* All Projects Card */}
            <div
              onClick={() => setSelectedProjectId("all")}
              style={{
                background: selectedProjectId === "all" ? "rgba(91,93,248,0.06)" : "var(--bg-card)",
                border: selectedProjectId === "all" ? "2px solid var(--primary)" : "1.5px solid var(--border-light)",
                borderRadius: "14px",
                padding: "16px 18px",
                cursor: "pointer",
                boxShadow: selectedProjectId === "all" ? "0 4px 14px rgba(91,93,248,0.15)" : "0 2px 6px rgba(0,0,0,0.02)",
                transition: "all 0.15s ease",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between"
              }}
            >
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                  <span style={{ fontWeight: "800", fontSize: "14px", color: "var(--text-main)" }}>
                    🌐 All Assigned Projects
                  </span>
                  <span style={{ fontSize: "11px", fontWeight: "700", padding: "2px 8px", borderRadius: "999px", background: "rgba(91,93,248,0.1)", color: "var(--primary)" }}>
                    {myAssignedProjects.length} Workspaces
                  </span>
                </div>
                <div style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "12px" }}>
                  Combined view of all deliverables assigned across all your projects
                </div>
              </div>

              <div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11.5px", fontWeight: "700", marginBottom: "4px" }}>
                  <span style={{ color: "var(--text-muted)" }}>Overall Completion</span>
                  <span style={{ color: "var(--primary)" }}>
                    {myAssignedTasks.length > 0 ? Math.round((myAssignedTasks.filter(t => t.status === "done" || t.status === "completed").length / myAssignedTasks.length) * 100) : 0}%
                  </span>
                </div>
                <div style={{ height: "6px", width: "100%", background: "var(--bg-sidebar)", borderRadius: "999px", overflow: "hidden" }}>
                  <div
                    style={{
                      height: "100%",
                      width: `${myAssignedTasks.length > 0 ? Math.round((myAssignedTasks.filter(t => t.status === "done" || t.status === "completed").length / myAssignedTasks.length) * 100) : 0}%`,
                      background: "linear-gradient(90deg, var(--primary), #8b5cf6)",
                      borderRadius: "999px",
                      transition: "width 0.3s ease"
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Individual Project Progress Cards */}
            {projectProgressList.map(proj => {
              const isSelected = selectedProjectId === proj.id;
              return (
                <div
                  key={proj.id}
                  onClick={() => setSelectedProjectId(proj.id)}
                  style={{
                    background: isSelected ? "rgba(91,93,248,0.06)" : "var(--bg-card)",
                    border: isSelected ? "2px solid var(--primary)" : "1.5px solid var(--border-light)",
                    borderRadius: "14px",
                    padding: "16px 18px",
                    cursor: "pointer",
                    boxShadow: isSelected ? "0 4px 14px rgba(91,93,248,0.15)" : "0 2px 6px rgba(0,0,0,0.02)",
                    transition: "all 0.15s ease",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between"
                  }}
                >
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "6px", gap: "6px" }}>
                      <div style={{ fontWeight: "800", fontSize: "14px", color: "var(--text-main)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        📁 {proj.title}
                      </div>
                      <span
                        style={{
                          fontSize: "10.5px",
                          padding: "2px 7px",
                          borderRadius: "4px",
                          fontWeight: "700",
                          background: proj.status === "active" ? "rgba(16,185,129,0.1)" : "rgba(100,116,139,0.1)",
                          color: proj.status === "active" ? "#059669" : "#64748b"
                        }}
                      >
                        {proj.status || "active"}
                      </span>
                    </div>

                    <div style={{ fontSize: "11.5px", color: "var(--text-muted)", marginBottom: "12px", display: "flex", gap: "10px" }}>
                      <span>🎯 {proj.total} task{proj.total !== 1 ? "s" : ""}</span>
                      <span>⚡ {proj.inProgress} active</span>
                      <span>✓ {proj.completed} done</span>
                    </div>
                  </div>

                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11.5px", fontWeight: "700", marginBottom: "4px" }}>
                      <span style={{ color: "var(--text-muted)" }}>Project Progress</span>
                      <span style={{ color: proj.percent === 100 ? "#10b981" : "var(--primary)" }}>
                        {proj.percent}%
                      </span>
                    </div>
                    <div style={{ height: "6px", width: "100%", background: "var(--bg-sidebar)", borderRadius: "999px", overflow: "hidden" }}>
                      <div
                        style={{
                          height: "100%",
                          width: `${proj.percent}%`,
                          background: proj.percent === 100 ? "#10b981" : "linear-gradient(90deg, #3b82f6, #6366f1)",
                          borderRadius: "999px",
                          transition: "width 0.3s ease"
                        }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ── SECTION 3: 4 DYNAMIC CLICKABLE STAT METRIC CARDS ──────────────── */}
      <div style={{ marginBottom: "12px" }}>
        <h2 style={{ fontSize: "16px", fontWeight: "800", color: "var(--text-main)", margin: "0 0 4px" }}>
          {selectedProjectId !== "all" && currentSelectedProj
            ? `Task Overview: ${currentSelectedProj.title}`
            : "Task Overview & Performance"}
        </h2>
        <p style={{ fontSize: "13px", color: "var(--text-muted)", margin: 0 }}>
          Click on any status card below to filter your deliverables
        </p>
      </div>

      <div
        className="metrics-grid"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))",
          gap: "16px",
          marginBottom: "28px"
        }}
      >
        {/* Card 1: Total Assigned Tasks */}
        <div
          className="metric-card interactive-stat-card"
          onClick={() => handleCardClick("all")}
          role="button"
          tabIndex={0}
          title="Click to view all assigned tasks"
          style={{ cursor: "pointer", transition: "transform 0.18s ease, box-shadow 0.18s ease", border: "1.5px solid var(--border-light)", background: "var(--bg-card)", borderRadius: "14px", padding: "20px" }}
        >
          <div className="card-top-row" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
            <div className="card-icon-box box-purple">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="9 11 12 14 22 4"></polyline>
                <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
              </svg>
            </div>
            <span style={{ fontSize: "11px", fontWeight: "700", color: "var(--primary)", background: "rgba(91,93,248,0.1)", padding: "2px 8px", borderRadius: "999px" }}>
              {selectedProjectId === "all" ? "All Deliverables" : "Project Tasks"}
            </span>
          </div>
          <div className="metric-value" style={{ fontSize: "32px", fontWeight: "800", color: "var(--text-main)" }}>
            {metrics.total}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "6px" }}>
            <div className="metric-label" style={{ fontSize: "13px", fontWeight: "600", color: "var(--text-muted)" }}>
              Total Assigned Tasks
            </div>
            <span style={{ fontSize: "12px", color: "var(--primary)", fontWeight: "700" }}>View All &rarr;</span>
          </div>
        </div>

        {/* Card 2: In Progress Tasks */}
        <div
          className="metric-card interactive-stat-card"
          onClick={() => handleCardClick("in_progress")}
          role="button"
          tabIndex={0}
          title="Click to view only in-progress tasks"
          style={{ cursor: "pointer", transition: "transform 0.18s ease, box-shadow 0.18s ease", border: "1.5px solid var(--border-light)", background: "var(--bg-card)", borderRadius: "14px", padding: "20px" }}
        >
          <div className="card-top-row" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
            <div className="card-icon-box box-orange">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
              </svg>
            </div>
            <span style={{ fontSize: "11px", fontWeight: "700", color: "#f59e0b", background: "rgba(245,158,11,0.1)", padding: "2px 8px", borderRadius: "999px" }}>
              Active Now
            </span>
          </div>
          <div className="metric-value" style={{ fontSize: "32px", fontWeight: "800", color: "var(--text-main)" }}>
            {metrics.inProgress}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "6px" }}>
            <div className="metric-label" style={{ fontSize: "13px", fontWeight: "600", color: "var(--text-muted)" }}>
              In Progress Tasks
            </div>
            <span style={{ fontSize: "12px", color: "#f59e0b", fontWeight: "700" }}>View Active &rarr;</span>
          </div>
        </div>

        {/* Card 3: Completed Tasks */}
        <div
          className="metric-card interactive-stat-card"
          onClick={() => handleCardClick("done")}
          role="button"
          tabIndex={0}
          title="Click to view only completed tasks"
          style={{ cursor: "pointer", transition: "transform 0.18s ease, box-shadow 0.18s ease", border: "1.5px solid var(--border-light)", background: "var(--bg-card)", borderRadius: "14px", padding: "20px" }}
        >
          <div className="card-top-row" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
            <div className="card-icon-box box-green">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
              </svg>
            </div>
            <span style={{ fontSize: "11px", fontWeight: "700", color: "#10b981", background: "rgba(16,185,129,0.1)", padding: "2px 8px", borderRadius: "999px" }}>
              Finished
            </span>
          </div>
          <div className="metric-value" style={{ fontSize: "32px", fontWeight: "800", color: "var(--text-main)" }}>
            {metrics.completed}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "6px" }}>
            <div className="metric-label" style={{ fontSize: "13px", fontWeight: "600", color: "var(--text-muted)" }}>
              Completed Tasks
            </div>
            <span style={{ fontSize: "12px", color: "#10b981", fontWeight: "700" }}>View Done &rarr;</span>
          </div>
        </div>

        {/* Card 4: Overdue Tasks */}
        <div
          className="metric-card interactive-stat-card"
          onClick={() => handleCardClick("overdue")}
          role="button"
          tabIndex={0}
          title="Click to view only overdue tasks"
          style={{ cursor: "pointer", transition: "transform 0.18s ease, box-shadow 0.18s ease", border: "1.5px solid var(--border-light)", background: "var(--bg-card)", borderRadius: "14px", padding: "20px" }}
        >
          <div className="card-top-row" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
            <div className="card-icon-box box-red">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
            </div>
            <span style={{ fontSize: "11px", fontWeight: "700", color: "#ef4444", background: "rgba(239,68,68,0.1)", padding: "2px 8px", borderRadius: "999px" }}>
              Action Required
            </span>
          </div>
          <div className="metric-value" style={{ fontSize: "32px", fontWeight: "800", color: metrics.overdue > 0 ? "#ef4444" : "var(--text-main)" }}>
            {metrics.overdue}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "6px" }}>
            <div className="metric-label" style={{ fontSize: "13px", fontWeight: "600", color: "var(--text-muted)" }}>
              Overdue Tasks
            </div>
            <span style={{ fontSize: "12px", color: "#ef4444", fontWeight: "700" }}>View Overdue &rarr;</span>
          </div>
        </div>
      </div>

      {/* ── SECTION 4: ASSIGNED DELIVERABLES TABLE WITH INLINE STATUS UPDATES ── */}
      <section
        className="dashboard-panel"
        style={{
          background: "var(--bg-card)",
          border: "1.5px solid var(--border-light)",
          borderRadius: "16px",
          padding: "24px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.03)"
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "10px" }}>
          <div>
            <h3 style={{ fontSize: "17px", fontWeight: "800", color: "var(--text-main)", margin: 0 }}>
              {selectedProjectId !== "all" && currentSelectedProj
                ? `Deliverables in "${currentSelectedProj.title}" (${filteredTasksByProject.length})`
                : `Your Assigned Deliverables (${filteredTasksByProject.length})`}
            </h3>
            <p style={{ fontSize: "12.5px", color: "var(--text-muted)", margin: "2px 0 0 0" }}>
              {selectedProjectId !== "all" && currentSelectedProj
                ? `Showing deliverables belonging to project "${currentSelectedProj.title}"`
                : "Update the status dropdown as you make progress. All changes are saved to Supabase immediately."}
            </p>
          </div>

          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            {selectedProjectId !== "all" && (
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setSelectedProjectId("all")}
              >
                Clear Project Filter
              </button>
            )}
            <button
              type="button"
              className="btn btn-outline-pill btn-sm"
              onClick={() => handleCardClick("all")}
            >
              📋 Open Full Tasks Page
            </button>
          </div>
        </div>

        {filteredTasksByProject.length === 0 ? (
          <div style={{ textAlign: "center", padding: "48px 20px", background: "var(--bg-sidebar)", borderRadius: "12px", border: "1px dashed var(--border-light)" }}>
            <div style={{ fontSize: "36px", marginBottom: "8px" }}>🎉</div>
            <div style={{ fontWeight: "700", fontSize: "15px", color: "var(--text-main)", marginBottom: "4px" }}>
              {selectedProjectId !== "all" ? "No deliverables in this project" : "You're all caught up!"}
            </div>
            <p style={{ fontSize: "13px", color: "var(--text-muted)", margin: 0 }}>
              {selectedProjectId !== "all"
                ? `You don't have any tasks assigned in "${currentSelectedProj?.title}".`
                : "Your Team Leader hasn't assigned any deliverables to you yet. New tasks will appear here automatically."}
            </p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13px" }}>
              <thead>
                <tr style={{ borderBottom: "1.5px solid var(--border-light)", color: "var(--text-muted)", fontSize: "11.5px", textTransform: "uppercase" }}>
                  <th style={{ padding: "10px 12px" }}>Task Name &amp; Description</th>
                  <th style={{ padding: "10px 12px" }}>Project Name</th>
                  <th style={{ padding: "10px 12px" }}>Priority</th>
                  <th style={{ padding: "10px 12px" }}>Status (Update)</th>
                  <th style={{ padding: "10px 12px" }}>Deadline</th>
                  <th style={{ padding: "10px 12px" }}>Assigned By</th>
                </tr>
              </thead>
              <tbody>
                {filteredTasksByProject.map(t => {
                  const overdue = isOverdue(t);
                  const isDone = t.status === "done" || t.status === "completed";

                  return (
                    <tr
                      key={t.id}
                      style={{
                        borderBottom: "1px solid var(--border-subtle)",
                        background: isDone ? "rgba(16,185,129,0.03)" : "transparent"
                      }}
                    >
                      {/* 1. Task Name & Description */}
                      <td style={{ padding: "12px", maxWidth: "260px" }}>
                        <div style={{ fontWeight: "700", color: isDone ? "var(--text-muted)" : "var(--text-main)", textDecoration: isDone ? "line-through" : "none" }}>
                          {t.title}
                        </div>
                        {t.description && (
                          <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "2px", lineHeight: "1.3" }}>
                            {t.description.length > 70 ? `${t.description.slice(0, 70)}...` : t.description}
                          </div>
                        )}
                      </td>

                      {/* 2. Project Name */}
                      <td style={{ padding: "12px", color: "var(--text-body)", fontWeight: "600" }}>
                        📁 {t.project_title || `Project #${t.project_id}`}
                      </td>

                      {/* 3. Priority */}
                      <td style={{ padding: "12px" }}>
                        <span className={`badge badge-priority-${t.priority}`} style={{ fontSize: "11px", padding: "3px 8px" }}>
                          {t.priority ? t.priority.charAt(0).toUpperCase() + t.priority.slice(1) : "Medium"}
                        </span>
                      </td>

                      {/* 4. Status Update Dropdown (Only Team Member allowed status update) */}
                      <td style={{ padding: "12px" }}>
                        <select
                          value={t.status === "completed" ? "done" : t.status}
                          onChange={(e) => handleStatusChange(t, e.target.value)}
                          style={{
                            padding: "6px 10px",
                            borderRadius: "8px",
                            fontSize: "12.5px",
                            fontWeight: "700",
                            border: "1.5px solid var(--border-light)",
                            cursor: "pointer",
                            background: isDone
                              ? "#dcfce7"
                              : t.status === "in_progress"
                              ? "#dbeafe"
                              : "var(--bg-app)",
                            color: isDone
                              ? "#16a34a"
                              : t.status === "in_progress"
                              ? "#2563eb"
                              : "var(--text-body)"
                          }}
                          title="Select to update task status in Supabase"
                        >
                          <option value="todo">⏳ Pending</option>
                          <option value="in_progress">⚡ In Progress</option>
                          <option value="done">✓ Completed</option>
                        </select>
                      </td>

                      {/* 5. Deadline */}
                      <td style={{ padding: "12px" }}>
                        <div style={{ color: overdue ? "#ef4444" : "var(--text-body)", fontWeight: overdue ? "700" : "500", fontSize: "12.5px" }}>
                          {t.due_date || "No deadline"}
                        </div>
                        {overdue && (
                          <span style={{ fontSize: "10px", background: "#fee2e2", color: "#dc2626", padding: "1px 5px", borderRadius: "4px", fontWeight: "700" }}>
                            Overdue
                          </span>
                        )}
                      </td>

                      {/* 6. Assigned By */}
                      <td style={{ padding: "12px", color: "var(--text-muted)", fontSize: "12.5px" }}>
                        👑 {t.leader_name || "Team Leader"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
