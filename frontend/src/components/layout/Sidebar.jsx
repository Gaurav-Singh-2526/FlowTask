import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useTasks } from "../../context/TaskContext";

export default function Sidebar({
  isOpen = false,
  sidebarOpen = false,
  onCloseSidebar,
  onOpenNewProject,
  onEditProject,
  onDeleteProject,
  onOpenNewTask,
  onOpenDelegation,
  onOpenAnnouncements,
  onOpenAddMember,
  onOpenEditProfile,
  activeViewTab,
  onSelectHome,
  onSelectTasks,
  onSelectCalendar,
  onSelectWorkflow,
  onSelectBoard,
  onSelectTab
}) {
  const { currentUser, isTeamLeader, teamUsers, logout, removeTeamMember } = useAuth();
  const {
    visibleProjects,
    selectedProject,
    setSelectedProject,
    tasks,
    directives,
    activeMemberFilter,
    setActiveMemberFilter,
    setInspectedMember
  } = useTasks();
  const navigate = useNavigate();

  const isDrawerOpen = Boolean(isOpen || sidebarOpen);

  const myTasksCount = tasks.filter(t => t.assignee === currentUser?.initials && t.status !== "done").length;

  const handleNavClick = (callback) => {
    if (callback) callback();
    if (onCloseSidebar && window.innerWidth <= 768) {
      onCloseSidebar();
    }
  };

  const handleLogout = () => {
    if (onCloseSidebar) onCloseSidebar();
    logout();
    navigate("/");
  };

  return (
    <aside className={`app-sidebar ${isDrawerOpen ? "is-open" : ""}`} id="app-sidebar">
      {/* Brand Header */}
      <div className="sidebar-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div
          className="brand-box"
          onClick={() => {
            setActiveMemberFilter(null);
            handleNavClick(onSelectHome);
          }}
          style={{ cursor: "pointer" }}
        >
          <div className="brand-logo-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
            </svg>
          </div>
          <span className="brand-name">FlowTask</span>
        </div>

        {onCloseSidebar && (
          <button
            type="button"
            className="btn-sidebar-mobile-close"
            onClick={onCloseSidebar}
            title="Close navigation"
            aria-label="Close navigation"
          >
            ✕
          </button>
        )}
      </div>

      {/* Nav Content Scroll */}
      <div className="sidebar-nav-scroll">
        <nav className="sidebar-nav" aria-label="Main Navigation">
          <ul className="nav-list">
            {/* Home / Dashboard View */}
            <li className="nav-item">
              <a
                href="#home"
                className={`nav-link ${activeViewTab === "dashboard" ? "is-active" : ""}`}
                onClick={(e) => {
                  e.preventDefault();
                  setActiveMemberFilter(null);
                  handleNavClick(onSelectHome);
                }}
              >
                <svg className="nav-icon" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                  <polyline points="9 22 9 12 15 12 15 22"></polyline>
                </svg>
                <span className="nav-label">Home</span>
              </a>
            </li>

            {/* Tasks View: "Team Tasks" for Team Leader, "My Tasks" for Team Member */}
            <li className="nav-item">
              <a
                href={isTeamLeader ? "#team-tasks" : "#my-tasks"}
                className={`nav-link ${activeViewTab === "team_tasks" || activeViewTab === "list" ? "is-active" : ""}`}
                onClick={(e) => {
                  e.preventDefault();
                  if (onSelectTasks) {
                    handleNavClick(onSelectTasks);
                  } else if (onSelectHome) {
                    handleNavClick(onSelectHome);
                  }
                }}
              >
                <svg className="nav-icon" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="9 11 12 14 22 4"></polyline>
                  <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
                </svg>
                <span className="nav-label">{isTeamLeader ? "Team Tasks" : "My Tasks"}</span>
                <span className="nav-badge badge-purple">{isTeamLeader ? tasks.length : myTasksCount}</span>
              </a>
            </li>

            {/* Calendar View */}
            <li className="nav-item">
              <a
                href="#calendar"
                className={`nav-link ${activeViewTab === "calendar" ? "is-active" : ""}`}
                onClick={(e) => {
                  e.preventDefault();
                  if (onSelectCalendar) {
                    handleNavClick(onSelectCalendar);
                  } else if (onSelectTab) {
                    handleNavClick(() => onSelectTab("calendar"));
                  }
                }}
                title="Interactive Calendar View"
                style={{ fontWeight: "600" }}
              >
                <span style={{ fontSize: "16px", marginRight: "6px" }}>📅</span>
                <span className="nav-label">Calendar</span>
              </a>
            </li>

            {/* Workflow Pipeline View */}
            <li className="nav-item">
              <a
                href="#workflow"
                className={`nav-link ${activeViewTab === "workflow" ? "is-active" : ""}`}
                onClick={(e) => {
                  e.preventDefault();
                  if (onSelectWorkflow) {
                    handleNavClick(onSelectWorkflow);
                  } else if (onSelectTab) {
                    handleNavClick(() => onSelectTab("workflow"));
                  }
                }}
                title="Workflow & Execution Pipeline"
                style={{ fontWeight: "600" }}
              >
                <span style={{ fontSize: "16px", marginRight: "6px" }}>🔀</span>
                <span className="nav-label">Workflow</span>
              </a>
            </li>

            {/* Kanban Board View */}
            <li className="nav-item">
              <a
                href="#board"
                className={`nav-link ${activeViewTab === "board" ? "is-active" : ""}`}
                onClick={(e) => {
                  e.preventDefault();
                  if (onSelectBoard) {
                    handleNavClick(onSelectBoard);
                  } else if (onSelectTab) {
                    handleNavClick(() => onSelectTab("board"));
                  }
                }}
                title="Kanban Board View"
                style={{ fontWeight: "600" }}
              >
                <svg className="nav-icon" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="9" y1="3" x2="9" y2="21"></line>
                  <line x1="15" y1="3" x2="15" y2="21"></line>
                </svg>
                <span className="nav-label">Board</span>
              </a>
            </li>

            {/* Dedicated Page for Team Announcements, Directives & Chat */}
            <li className="nav-item">
              <a
                href="#announcements"
                className={`nav-link ${activeViewTab === "announcements" ? "is-active" : ""}`}
                onClick={(e) => {
                  e.preventDefault();
                  handleNavClick(onOpenAnnouncements);
                }}
                title="Team Announcements, Directives & Chat"
                style={{ fontWeight: "600" }}
              >
                <span style={{ fontSize: "16px", marginRight: "6px" }}>📢</span>
                <span className="nav-label">Announcements &amp; Chat</span>
                <span className="nav-badge badge-blue">{directives.length}</span>
              </a>
            </li>

            {/* Team Leader Dedicated Delegation Hub Link */}
            {isTeamLeader && (
              <li className="nav-item">
                <a
                  href="#delegation"
                  className={`nav-link ${activeViewTab === "delegation" ? "is-active" : ""}`}
                  onClick={(e) => {
                    e.preventDefault();
                    handleNavClick(onOpenDelegation);
                  }}
                  title="Team Delegation & Allocation Hub"
                  style={{ color: "var(--primary)", fontWeight: "600" }}
                >
                  <span style={{ fontSize: "16px", marginRight: "6px" }}>👑</span>
                  <span className="nav-label">Delegation Hub</span>
                </a>
              </li>
            )}
          </ul>
        </nav>

        {/* Projects Section */}
        <div className="sidebar-section">
          <div className="section-title-row">
            <span className="section-title">
              {isTeamLeader ? "PROJECTS (ALL)" : "MY PROJECTS"}
            </span>
            {isTeamLeader && (
              <button
                type="button"
                className="section-add-btn"
                onClick={onOpenNewProject}
                title="Create New Project in Supabase"
              >
                +
              </button>
            )}
          </div>
          {visibleProjects.length === 0 ? (
            <div style={{ padding: "8px 12px", fontSize: "11.5px", color: "var(--text-muted)" }}>
              {isTeamLeader ? "No projects yet. Click + to create one." : "No assigned projects yet"}
            </div>
          ) : (
            <ul className="entity-list">
              {visibleProjects.map(proj => (
                <li
                  key={proj.id}
                  className={`entity-card ${selectedProject?.id === proj.id ? "is-selected" : ""}`}
                  style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "6px", cursor: "pointer" }}
                  onClick={() => handleNavClick(() => setSelectedProject(proj))}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", minWidth: 0, overflow: "hidden" }}>
                    <span className="entity-indicator" style={{ background: "#5b5df8" }}></span>
                    <span className="entity-name" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {proj.title}
                    </span>
                  </div>

                  {/* PROJECT EDIT & DELETE BUTTONS (TEAM LEADER ONLY) */}
                  {isTeamLeader && (
                    <div style={{ display: "flex", gap: "3px", alignItems: "center", flexShrink: 0 }} onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        className="sidebar-action-icon-btn"
                        style={{ background: "transparent", border: "none", cursor: "pointer", fontSize: "12px", padding: "2px 4px", borderRadius: "4px" }}
                        title={`Edit project "${proj.title}"`}
                        onClick={() => onEditProject && onEditProject(proj)}
                        aria-label="Edit project"
                      >
                        ✏️
                      </button>
                      <button
                        type="button"
                        className="sidebar-action-icon-btn"
                        style={{ background: "transparent", border: "none", cursor: "pointer", fontSize: "12px", padding: "2px 4px", borderRadius: "4px" }}
                        title={`Delete project "${proj.title}"`}
                        onClick={() => onDeleteProject && onDeleteProject(proj)}
                        aria-label="Delete project"
                      >
                        🗑️
                      </button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Team Section with Add & Delete Member controls for Team Leader */}
        <div className="sidebar-section">
          <div className="section-title-row">
            <span className="section-title">TEAM ROSTER</span>
            {isTeamLeader && (
              <button
                type="button"
                className="section-add-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  if (onOpenAddMember) onOpenAddMember();
                }}
                title="Add New Team Member"
                style={{ cursor: "pointer" }}
              >
                +
              </button>
            )}
          </div>
          <ul className="entity-list">
            {teamUsers.length === 0 ? (
              <li style={{ padding: "8px 12px", fontSize: "11.5px", color: "var(--text-muted)" }}>
                {isTeamLeader ? "No team members yet. Click + to add." : "No team members"}
              </li>
            ) : (
              teamUsers.map(u => (
                <li
                  key={u.id}
                  className={`entity-card ${activeMemberFilter === u.initials ? "is-selected" : ""}`}
                  style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "6px", cursor: "pointer" }}
                  onClick={() => {
                    handleNavClick(() => {
                      setActiveMemberFilter(u.initials);
                      setInspectedMember(u);
                    });
                  }}
                  title={`Click to view assigned tasks & work updates for ${u.name}`}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", minWidth: 0, overflow: "hidden" }}>
                    <span className={`assignee-avatar ${u.color || "av-blue"}`} style={{ width: "22px", height: "22px", fontSize: "10px", flexShrink: 0 }}>
                      {u.initials}
                    </span>
                    <span className="entity-name" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {u.name}
                      {u.role === "Team Leader" && (
                        <span style={{ fontSize: "10px", color: "var(--primary)", marginLeft: "4px" }}>👑</span>
                      )}
                    </span>
                  </div>

                  {/* Team Leader Delete Member Button */}
                  {isTeamLeader && u.role !== "Team Leader" && (
                    <button
                      type="button"
                      className="sidebar-delete-btn"
                      title={`Remove ${u.name} from team`}
                      onClick={async (e) => {
                        e.stopPropagation();
                        const confirmed = window.confirm(`Are you sure you want to remove ${u.name} (${u.email}) from the team?`);
                        if (confirmed) {
                          await removeTeamMember(u.id);
                          if (activeMemberFilter === u.initials) {
                            setActiveMemberFilter(null);
                          }
                        }
                      }}
                      style={{
                        background: "transparent",
                        border: "none",
                        color: "#ef4444",
                        cursor: "pointer",
                        fontSize: "13px",
                        fontWeight: "bold",
                        padding: "2px 6px",
                        borderRadius: "4px",
                        lineHeight: 1
                      }}
                    >
                      ✕
                    </button>
                  )}
                </li>
              ))
            )}
          </ul>
        </div>
      </div>

      {/* Sidebar Footer User Profile Card */}
      <div className="sidebar-footer" style={{ padding: "10px 12px", borderTop: "1px solid var(--border-subtle, #e2e8f0)", background: "var(--bg-sidebar, #f8fafc)" }}>
        <div
          className="user-profile-card"
          onClick={() => handleNavClick(onOpenEditProfile)}
          title="Click to view and edit your profile"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            width: "100%",
            padding: "8px 10px",
            borderRadius: "12px",
            background: "var(--bg-card, #ffffff)",
            border: "1px solid var(--border-light, #e2e8f0)",
            boxShadow: "0 1px 3px rgba(0, 0, 0, 0.04)",
            cursor: "pointer",
            boxSizing: "border-box"
          }}
        >
          {currentUser?.avatar_url ? (
            <img
              src={currentUser.avatar_url}
              alt={currentUser.name}
              className="user-avatar-img"
              style={{
                width: "36px",
                height: "36px",
                minWidth: "36px",
                borderRadius: "50%",
                objectFit: "cover",
                border: "2px solid #ffffff",
                boxShadow: "0 2px 6px rgba(0, 0, 0, 0.12)",
                flexShrink: 0
              }}
            />
          ) : (
            <span
              className={`user-avatar ${currentUser?.color || "av-blue"}`}
              style={{
                width: "36px",
                height: "36px",
                minWidth: "36px",
                borderRadius: "50%",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "13px",
                fontWeight: "800",
                color: "#ffffff",
                flexShrink: 0,
                textTransform: "uppercase",
                letterSpacing: "0.5px",
                background: currentUser?.color === "av-green"
                  ? "linear-gradient(135deg, #10b981 0%, #047857 100%)"
                  : currentUser?.color === "av-purple"
                  ? "linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)"
                  : currentUser?.color === "av-orange"
                  ? "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)"
                  : currentUser?.color === "av-red"
                  ? "linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)"
                  : "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
                border: "2px solid #ffffff",
                boxShadow: "0 2px 6px rgba(0, 0, 0, 0.12)",
                lineHeight: 1
              }}
            >
              {currentUser?.initials || (currentUser?.name ? currentUser.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() : "TL")}
            </span>
          )}

          <div
            className="user-info"
            style={{
              display: "flex",
              flexDirection: "column",
              minWidth: 0,
              flex: "1 1 auto",
              gap: "2px",
              overflow: "hidden"
            }}
          >
            <span
              className="user-name"
              style={{
                fontSize: "13px",
                fontWeight: "700",
                color: "var(--text-main, #0f172a)",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                lineHeight: "1.2"
              }}
            >
              {currentUser?.name || "User"}
            </span>
            <span
              className="user-role"
              style={{
                fontSize: "11px",
                fontWeight: "600",
                color: isTeamLeader ? "#4f46e5" : "#10b981",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                lineHeight: "1.2",
                display: "flex",
                alignItems: "center",
                gap: "3px"
              }}
            >
              {isTeamLeader ? "👑 Team Leader" : "👤 Team Member"}
            </span>
          </div>

          <div className="user-card-actions" onClick={(e) => e.stopPropagation()} style={{ display: "flex", alignItems: "center", gap: "2px", marginLeft: "auto", flexShrink: 0 }}>
            <button
              type="button"
              className="btn-sidebar-action btn-sidebar-edit-profile"
              onClick={() => handleNavClick(onOpenEditProfile)}
              title="Edit Profile"
              aria-label="Edit Profile"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
            </button>
            <button
              type="button"
              className="btn-sidebar-action btn-sidebar-logout"
              onClick={handleLogout}
              title="Sign Out"
              aria-label="Sign Out"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
