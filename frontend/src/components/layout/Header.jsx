import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useTasks } from "../../context/TaskContext";

export default function Header({
  activeViewTab,
  setActiveViewTab,
  onToggleSidebar,
  onOpenNewTask,
  onOpenNewProject,
  onEditProject,
  onDeleteProject,
  onOpenEditProfile
}) {
  const { currentUser, isTeamLeader, logout } = useAuth();
  const {
    visibleProjects,
    selectedProject,
    setSelectedProject,
    theme,
    toggleTheme,
    tasks,
    directives
  } = useTasks();

  const [projectDropdownOpen, setProjectDropdownOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const tabs = [
    { id: "dashboard", label: "Dashboard" },
    { id: "team_tasks", label: isTeamLeader ? "Team Tasks" : "My Tasks", badge: tasks.length },
    ...(isTeamLeader ? [{ id: "delegation", label: "👑 Delegation Hub" }] : []),
    { id: "announcements", label: "📢 Announcements & Chat", badge: directives.length },
    { id: "board",     label: "Board" },
    { id: "calendar",  label: "Calendar" },
    { id: "workflow",  label: "Workflow" }
  ];

  return (
    <>
      <header className="top-nav-bar">
        {/* Left: Hamburger menu toggle (mobile/tablet) + Project Selector + New Project */}
        <div className="top-nav-left">
          {onToggleSidebar && (
            <button
              type="button"
              className="btn-mobile-sidebar-toggle"
              onClick={onToggleSidebar}
              title="Open menu"
              aria-label="Toggle navigation menu"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="12" x2="21" y2="12"></line>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <line x1="3" y1="18" x2="21" y2="18"></line>
              </svg>
            </button>
          )}

          <div
            className="project-selector-dropdown"
            role="button"
            tabIndex={0}
            title={isTeamLeader ? "Switch Project (All Workspace Projects)" : "Projects with your assigned tasks"}
            onClick={() => setProjectDropdownOpen(!projectDropdownOpen)}
          >
            <span className="project-selector-title">
              {selectedProject ? selectedProject.title : (visibleProjects.length > 0 ? visibleProjects[0].title : "No Active Project")}
            </span>
            <svg className="dropdown-chevron" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </div>

          {/* Project Dropdown Popover */}
          {projectDropdownOpen && (
            <div className="dropdown-popover" style={{ display: "block" }}>
              <div className="dropdown-popover-header">
                <span>{isTeamLeader ? "All Workspace Projects" : "Your Assigned Projects"}</span>
                <button type="button" className="btn-dropdown-close" onClick={() => setProjectDropdownOpen(false)}>✕</button>
              </div>

              {visibleProjects.length === 0 ? (
                <div style={{ padding: "16px 14px", fontSize: "12.5px", color: "var(--text-muted)", textAlign: "center" }}>
                  {isTeamLeader ? "No projects in this workspace yet." : "No assigned projects yet."}
                </div>
              ) : (
                <ul className="dropdown-project-list">
                  {visibleProjects.map(p => (
                    <li
                      key={p.id}
                      className={`dropdown-project-item ${selectedProject?.id === p.id ? "is-selected" : ""}`}
                      onClick={() => {
                        setSelectedProject(p);
                        setProjectDropdownOpen(false);
                      }}
                      style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 12px" }}
                    >
                      <span style={{ fontWeight: selectedProject?.id === p.id ? "700" : "500", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {p.title}
                      </span>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }} onClick={(e) => e.stopPropagation()}>
                        {selectedProject?.id === p.id && <span style={{ color: "#10b981", marginRight: "4px" }}>✓</span>}
                        {isTeamLeader && (
                          <>
                            <button
                              type="button"
                              className="btn-icon-xs"
                              title={`Edit project "${p.title}"`}
                              style={{ background: "transparent", border: "none", cursor: "pointer", fontSize: "12px", padding: "2px" }}
                              onClick={() => {
                                setProjectDropdownOpen(false);
                                if (onEditProject) onEditProject(p);
                              }}
                            >
                              ✏️
                            </button>
                            <button
                              type="button"
                              className="btn-icon-xs"
                              title={`Delete project "${p.title}"`}
                              style={{ background: "transparent", border: "none", cursor: "pointer", fontSize: "12px", padding: "2px" }}
                              onClick={() => {
                                setProjectDropdownOpen(false);
                                if (onDeleteProject) onDeleteProject(p);
                              }}
                            >
                              🗑️
                            </button>
                          </>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}

              {/* Only Team Leader can create new projects */}
              {isTeamLeader && (
                <div className="dropdown-popover-footer">
                  <button
                    type="button"
                    className="btn-dropdown-action"
                    onClick={() => {
                      setProjectDropdownOpen(false);
                      if (onOpenNewProject) onOpenNewProject();
                    }}
                  >
                    + Create New Project
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Only Team Leader has + New Project quick button */}
          {isTeamLeader && (
            <button className="btn btn-outline-pill btn-new-project-top" onClick={onOpenNewProject} title="Create New Project">
              <span>+ New Project</span>
            </button>
          )}
        </div>

        {/* Right Section: Notifications, Theme Toggle, User Profile & New Task */}
        <div className="top-nav-right">
          {/* Notifications */}
          <div style={{ position: "relative" }}>
            <button
              type="button"
              className="nav-icon-btn with-badge"
              title="Notifications"
              onClick={() => setNotifOpen(!notifOpen)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
              </svg>
              <span className="notification-dot"></span>
            </button>

            {notifOpen && (
              <div className="notifications-popover" style={{ display: "block" }}>
                <div className="notif-header">
                  <h3>Notifications</h3>
                  <button type="button" className="btn-notif-clear" onClick={() => setNotifOpen(false)}>Done</button>
                </div>
                <ul className="notif-list">
                  <li className="notif-item unread">
                    <span className="notif-dot"></span>
                    <div className="notif-content">
                      <p className="notif-text">Workspace live on Supabase PostgreSQL.</p>
                      <span className="notif-time">Just now</span>
                    </div>
                  </li>
                </ul>
              </div>
            )}
          </div>

          {/* Theme Toggle */}
          <button className="nav-icon-btn" onClick={toggleTheme} title="Toggle theme">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
            </svg>
          </button>

          {/* User Status Chip with Sign Out dropdown */}
          <div style={{ position: "relative" }}>
            <button
              type="button"
              className="btn-top-user"
              title="Click to view profile / Log Out"
              onClick={() => setUserDropdownOpen(!userDropdownOpen)}
            >
              <span className={`top-user-avatar ${currentUser?.color || "av-blue"}`}>
                {currentUser?.initials || (currentUser?.name ? currentUser.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() : "TL")}
              </span>
              <span className="top-user-info">
                <span className="top-user-name">{currentUser?.name || "User"}</span>
                <span className={`top-user-role-chip ${isTeamLeader ? "" : "is-member"}`}>
                  {isTeamLeader ? "Leader" : "Member"}
                </span>
              </span>
            </button>

            {userDropdownOpen && (
              <div
                style={{
                  position: "absolute",
                  right: 0,
                  top: "115%",
                  width: "240px",
                  background: "var(--bg-card)",
                  border: "1px solid var(--border-light)",
                  borderRadius: "12px",
                  boxShadow: "0 10px 30px rgba(0,0,0,0.15)",
                  padding: "14px",
                  zIndex: 100
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
                  <span className={`assignee-avatar ${currentUser?.color || "av-blue"}`} style={{ width: "32px", height: "32px", fontSize: "12px" }}>
                    {currentUser?.initials || (currentUser?.name ? currentUser.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() : "TL")}
                  </span>
                  <div>
                    <div style={{ fontWeight: "700", fontSize: "13.5px", color: "var(--text-main)" }}>
                      {currentUser?.name}
                    </div>
                    <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                      {currentUser?.email}
                    </div>
                  </div>
                </div>

                <div style={{ padding: "6px 8px", background: "var(--bg-sidebar)", borderRadius: "6px", fontSize: "11px", color: "var(--text-muted)", marginBottom: "12px" }}>
                  Role: <strong>{currentUser?.role}</strong> ({currentUser?.title || "Member"})
                  <div style={{ marginTop: "4px", fontSize: "10px", color: "var(--text-subtle)" }}>
                    🔒 Supabase Database Session Active
                  </div>
                </div>

                <button
                  type="button"
                  className="btn btn-outline-pill btn-sm"
                  onClick={() => {
                    setUserDropdownOpen(false);
                    if (onOpenEditProfile) onOpenEditProfile();
                  }}
                  style={{ width: "100%", justifyContent: "center", marginBottom: "8px", fontWeight: "700" }}
                >
                  ✏️ Edit Profile
                </button>

                <button
                  type="button"
                  className="btn btn-danger btn-sm"
                  onClick={handleLogout}
                  style={{ width: "100%", justifyContent: "center" }}
                >
                  🚪 Sign Out / Logout
                </button>
              </div>
            )}
          </div>

          {/* + New Task Primary Action (Team Leader Only) */}
          {isTeamLeader && (
            <button className="btn btn-primary-pill btn-new-task-top" onClick={onOpenNewTask} title="Create New Task">
              <span className="btn-label-desktop">+ New Task</span>
              <span className="btn-label-mobile">+</span>
            </button>
          )}
        </div>
      </header>

      {/* Sub-Header Bar: View Tabs */}
      <div className="sub-header-bar">
        <div className="view-tabs-list" role="tablist">
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`view-tab-btn ${activeViewTab === tab.id ? "is-active" : ""}`}
              onClick={() => setActiveViewTab(tab.id)}
            >
              <span>{tab.label}</span>
              {tab.badge !== undefined && <span className="tab-badge">{tab.badge}</span>}
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
