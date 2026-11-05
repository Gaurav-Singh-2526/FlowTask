import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useTasks } from "../context/TaskContext";
import Sidebar from "../components/layout/Sidebar";
import Header from "../components/layout/Header";
import LeaderDashboard from "../components/dashboard/LeaderDashboard";
import MemberDashboard from "../components/dashboard/MemberDashboard";
import DelegationHub from "../components/dashboard/DelegationHub";
import AnnouncementsPage from "../components/dashboard/AnnouncementsPage";
import KanbanBoard from "../components/dashboard/KanbanBoard";
import TaskTable from "../components/dashboard/TaskTable";
import TeamTasksPage from "../components/dashboard/TeamTasksPage";
import CalendarPage from "../components/dashboard/CalendarPage";
import WorkflowPage from "../components/dashboard/WorkflowPage";
import MemberWorkModal from "../components/dashboard/MemberWorkModal";
import EditProfileModal from "../components/dashboard/EditProfileModal";
import AddMemberModal from "../components/team/AddMemberModal";

export default function DashboardPage() {
  const { isTeamLeader, currentUser, teamUsers, addTeamMember } = useAuth();
  const {
    createTask,
    updateTask,
    deleteTask,
    createProject,
    updateProject,
    deleteProject,
    visibleProjects,
    selectedProject,
    inspectedMember,
    setInspectedMember,
    editModalTask,
    setEditModalTask,
    setTaskStatusFilter,
    tasks
  } = useTasks();

  const [activeViewTab, setActiveViewTab] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [addMemberModalOpen, setAddMemberModalOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);

  // Project Modal State (Create & Edit)
  const [projectModalOpen, setProjectModalOpen] = useState(false);
  const [projectModalMode, setProjectModalMode] = useState("create"); // "create" | "edit"
  const [editingProject, setEditingProject] = useState(null);
  const [projFormTitle, setProjFormTitle] = useState("");
  const [projFormDesc, setProjFormDesc] = useState("");
  const [projFormStatus, setProjFormStatus] = useState("active");
  const [projFormDeadline, setProjFormDeadline] = useState("");

  const handleOpenCreateProjectModal = () => {
    if (!isTeamLeader) {
      alert("Permission Denied: Only Team Leaders can create projects.");
      return;
    }
    setProjectModalMode("create");
    setEditingProject(null);
    setProjFormTitle("");
    setProjFormDesc("");
    setProjFormStatus("active");
    setProjFormDeadline("");
    setProjectModalOpen(true);
  };

  const handleOpenEditProjectModal = (proj) => {
    if (!isTeamLeader) {
      alert("Permission Denied: Only Team Leaders can edit projects.");
      return;
    }
    setProjectModalMode("edit");
    setEditingProject(proj);
    setProjFormTitle(proj.title || "");
    setProjFormDesc(proj.description || "");
    setProjFormStatus(proj.status || "active");
    setProjFormDeadline(proj.deadline || "");
    setProjectModalOpen(true);
  };

  const handleDeleteProject = async (proj) => {
    if (!isTeamLeader) {
      alert("Permission Denied: Only Team Leaders can delete projects.");
      return;
    }
    const confirmed = window.confirm(`Are you sure you want to delete project "${proj.title}"? All associated tasks will be permanently removed from Supabase.`);
    if (confirmed) {
      await deleteProject(proj.id);
    }
  };

  const handleProjectModalSubmit = async (e) => {
    e.preventDefault();
    if (!projFormTitle.trim()) return;

    if (projectModalMode === "create") {
      await createProject(projFormTitle.trim(), projFormDesc.trim(), projFormStatus, projFormDeadline || null);
    } else if (editingProject) {
      await updateProject(editingProject.id, {
        title: projFormTitle.trim(),
        description: projFormDesc.trim(),
        status: projFormStatus,
        deadline: projFormDeadline || null
      });
    }
    setProjectModalOpen(false);
  };

  const handleSelectStatus = (status) => {
    if (setTaskStatusFilter) setTaskStatusFilter(status || "all");
    setActiveViewTab("team_tasks");
    setSidebarOpen(false);
  };

  // New task form state
  const firstMember = teamUsers.find(u => u.role !== "Team Leader");
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDesc, setTaskDesc] = useState("");
  const [taskPriority, setTaskPriority] = useState("medium");
  const [taskAssignee, setTaskAssignee] = useState(firstMember?.initials || "SK");
  const [taskProject, setTaskProject] = useState("");
  const [taskDue, setTaskDue] = useState("");

  // Add Member form state
  const [newMemberName, setNewMemberName] = useState("");
  const [newMemberEmail, setNewMemberEmail] = useState("");
  const [newMemberPassword, setNewMemberPassword] = useState("password123");
  const [newMemberRole, setNewMemberRole] = useState("Team Member");
  const [newMemberTitle, setNewMemberTitle] = useState("");
  const [newMemberColor, setNewMemberColor] = useState("av-green");

  const handleOpenAddMemberModal = () => {
    setNewMemberName("");
    setNewMemberEmail("");
    setNewMemberPassword("password123");
    setNewMemberRole("Team Member");
    setNewMemberTitle("");
    setNewMemberColor("av-green");
    setAddMemberModalOpen(true);
  };

  const handleAddMemberSubmit = async (e) => {
    e.preventDefault();
    if (!newMemberName.trim() || !newMemberEmail.trim()) return;

    await addTeamMember({
      name: newMemberName.trim(),
      email: newMemberEmail.trim(),
      password: newMemberPassword.trim() || "password123",
      role: "Team Member",
      title: newMemberTitle.trim() || "Engineer",
      color: newMemberColor
    });

    setAddMemberModalOpen(false);
    setNewMemberName("");
    setNewMemberEmail("");
    setNewMemberPassword("password123");
    setNewMemberTitle("");
  };

  const handleOpenNewTaskModal = () => {
    if (!isTeamLeader) {
      alert("⚠️ Permission Denied: Only Team Leaders can create and assign tasks.");
      return;
    }
    setTaskTitle("");
    setTaskDesc("");
    setTaskPriority("medium");
    const defaultMember = teamUsers.find(u => u.role !== "Team Leader");
    setTaskAssignee(defaultMember?.initials || "");
    setTaskProject(selectedProject ? selectedProject.id : (visibleProjects[0]?.id || ""));
    setTaskDue("");
    setTaskModalOpen(true);
  };

  const handleCreateTaskSubmit = async (e) => {
    e.preventDefault();
    if (!isTeamLeader) {
      alert("⚠️ Permission Denied: Only Team Leaders can create and assign tasks.");
      return;
    }
    if (!taskTitle.trim()) return;
    const finalProjectId = taskProject || (selectedProject ? selectedProject.id : visibleProjects[0]?.id);
    if (!finalProjectId) {
      alert("Please select or create a project first.");
      return;
    }
    const assignedUser = teamUsers.find(u => u.initials === taskAssignee);
    try {
      await createTask({
        title: taskTitle.trim(),
        description: taskDesc.trim() || null,
        priority: taskPriority,
        assignee: taskAssignee,
        assignee_id: assignedUser ? assignedUser.id : null,
        project_id: parseInt(finalProjectId, 10),
        due_date: taskDue || null
      });
      setTaskTitle("");
      setTaskDesc("");
      setTaskModalOpen(false);
    } catch (err) {
      alert(`Error creating task: ${err.message}`);
    }
  };

  const handleEditTaskSubmit = async (e) => {
    e.preventDefault();
    if (!isTeamLeader) {
      alert("⚠️ Permission Denied: Only Team Leaders can edit task details.");
      setEditModalTask(null);
      return;
    }
    if (!editModalTask || !editModalTask.title.trim()) return;
    await updateTask(editModalTask.id, editModalTask);
    setEditModalTask(null);
  };

  return (
    <div className="app-layout" id="workspace">
      {/* ── MOBILE BACKDROP FOR OFF-CANVAS SIDEBAR ─────────────────────── */}
      {sidebarOpen && (
        <div
          className="sidebar-mobile-backdrop"
          onClick={() => setSidebarOpen(false)}
          aria-label="Close navigation menu"
        />
      )}

      {/* ── LEFT SIDEBAR ──────────────────────────────────────────────── */}
      <Sidebar
        isOpen={sidebarOpen}
        sidebarOpen={sidebarOpen}
        onCloseSidebar={() => setSidebarOpen(false)}
        onOpenNewProject={handleOpenCreateProjectModal}
        onEditProject={handleOpenEditProjectModal}
        onDeleteProject={handleDeleteProject}
        onOpenNewTask={handleOpenNewTaskModal}
        onOpenDelegation={() => { setActiveViewTab("delegation"); setSidebarOpen(false); }}
        onOpenAnnouncements={() => { setActiveViewTab("announcements"); setSidebarOpen(false); }}
        onOpenAddMember={handleOpenAddMemberModal}
        onOpenEditProfile={() => { setProfileModalOpen(true); setSidebarOpen(false); }}
        activeViewTab={activeViewTab}
        onSelectHome={() => { setActiveViewTab("dashboard"); setSidebarOpen(false); }}
        onSelectTasks={() => handleSelectStatus("all")}
        onSelectCalendar={() => { setActiveViewTab("calendar"); setSidebarOpen(false); }}
        onSelectWorkflow={() => { setActiveViewTab("workflow"); setSidebarOpen(false); }}
        onSelectBoard={() => { setActiveViewTab("board"); setSidebarOpen(false); }}
        onSelectTab={(tab) => { setActiveViewTab(tab); setSidebarOpen(false); }}
      />

      {/* ── MAIN WORKSPACE CONTENT ────────────────────────────────────── */}
      <main className="app-main">
        <Header
          activeViewTab={activeViewTab}
          setActiveViewTab={(tab) => { setActiveViewTab(tab); setSidebarOpen(false); }}
          onToggleSidebar={() => setSidebarOpen(prev => !prev)}
          onOpenNewTask={handleOpenNewTaskModal}
          onOpenNewProject={handleOpenCreateProjectModal}
          onEditProject={handleOpenEditProjectModal}
          onDeleteProject={handleDeleteProject}
          onOpenEditProfile={() => setProfileModalOpen(true)}
        />

        <div className="dashboard-scrollable-content tab-view-content">
          {/* EMPTY WORKSPACE ONBOARDING BANNER FOR NEW TEAM LEADER */}
          {activeViewTab === "dashboard" && isTeamLeader && visibleProjects.length === 0 && tasks.length === 0 && (
            <div
              style={{
                background: "linear-gradient(135deg, rgba(79, 70, 229, 0.08) 0%, rgba(147, 51, 234, 0.04) 100%)",
                border: "1.5px dashed var(--primary)",
                borderRadius: "14px",
                padding: "24px 20px",
                marginBottom: "20px",
                textAlign: "center"
              }}
            >
              <div style={{ fontSize: "32px", marginBottom: "8px" }}>🚀</div>
              <h2 style={{ fontSize: "18px", fontWeight: "800", color: "var(--text-main)", margin: "0 0 6px" }}>
                Welcome to your new TaskFlow Workspace!
              </h2>
              <p style={{ fontSize: "13.5px", color: "var(--text-muted)", maxWidth: "520px", margin: "0 auto 16px" }}>
                Your workspace is completely isolated and stored permanently in Supabase PostgreSQL. Create your first project and add team members to start assigning work.
              </p>
              <div style={{ display: "flex", gap: "10px", justifyContent: "center", flexWrap: "wrap" }}>
                <button type="button" className="btn btn-primary" onClick={handleOpenCreateProjectModal}>
                  + Create First Project
                </button>
                <button type="button" className="btn btn-secondary" onClick={handleOpenAddMemberModal}>
                  👥 Add Team Member
                </button>
              </div>
            </div>
          )}

          {/* VIEW: DASHBOARD (Role-Aware: Dedicated Leader vs Member Dashboards) */}
          {activeViewTab === "dashboard" && (
            isTeamLeader ? (
              <LeaderDashboard
                onNewTask={handleOpenNewTaskModal}
                onOpenDelegation={() => setActiveViewTab("delegation")}
                onEditTask={(task) => setEditModalTask(task)}
                onSelectStatus={handleSelectStatus}
              />
            ) : (
              <MemberDashboard
                onSelectStatus={handleSelectStatus}
                onOpenEditProfile={() => setProfileModalOpen(true)}
              />
            )
          )}

          {/* VIEW: TEAM TASKS (Dedicated task management page with search, filters, inline status updates) */}
          {(activeViewTab === "team_tasks" || activeViewTab === "list") && (
            <TeamTasksPage
              onNewTask={handleOpenNewTaskModal}
              onEditTask={(task) => setEditModalTask(task)}
            />
          )}

          {/* VIEW: DELEGATION HUB (Team Leader Exclusive) */}
          {activeViewTab === "delegation" && isTeamLeader && (
            <DelegationHub />
          )}

          {/* VIEW: ANNOUNCEMENTS, DIRECTIVES & CHAT (Dedicated Hub) */}
          {activeViewTab === "announcements" && (
            <AnnouncementsPage />
          )}

          {/* VIEW: KANBAN BOARD */}
          {activeViewTab === "board" && (
            <KanbanBoard onNewTask={handleOpenNewTaskModal} />
          )}

          {/* VIEW: CALENDAR PAGE */}
          {activeViewTab === "calendar" && (
            <CalendarPage
              onEditTask={(task) => setEditModalTask(task)}
              onNewTask={handleOpenNewTaskModal}
            />
          )}

          {/* VIEW: WORKFLOW PIPELINE PAGE */}
          {activeViewTab === "workflow" && (
            <WorkflowPage
              onEditTask={(task) => setEditModalTask(task)}
              onNewTask={handleOpenNewTaskModal}
            />
          )}

          {/* VIEW: OVERVIEW */}
          {activeViewTab === "overview" && (
            <div style={{ padding: "20px" }}>
              <h2 style={{ fontSize: "20px", fontWeight: "800", color: "var(--text-main)", marginBottom: "16px" }}>
                Overview View
              </h2>
              <TaskTable onEditTask={(task) => setEditModalTask(task)} />
            </div>
          )}
        </div>
      </main>

      {/* ── FIXED MODAL 1: CREATE TASK ────────────────────────────────── */}
      {taskModalOpen && (
        <div className="modal-overlay-fixed" onClick={() => setTaskModalOpen(false)}>
          <div className="modal-card-fixed" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2 className="modal-title">Create New Task</h2>
                <p className="card-subheading">
                  {isTeamLeader ? "👑 Team Leader: Delegate work to any team member" : "Add a new task to project"}
                </p>
              </div>
              <button type="button" className="btn btn-icon-only modal-x" onClick={() => setTaskModalOpen(false)}>✕</button>
            </div>

            <form onSubmit={handleCreateTaskSubmit} style={{ marginTop: "16px" }}>
              <div className="field-group" style={{ marginBottom: "12px" }}>
                <label style={{ fontSize: "12.5px", fontWeight: "600", color: "var(--text-main)", display: "block", marginBottom: "6px" }}>
                  Task Title *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Redesign checkout modal"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  required
                  style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1.5px solid var(--border-light)", background: "var(--bg-card)", color: "var(--text-main)", fontSize: "13.5px" }}
                />
              </div>

              {isTeamLeader && (
                <div className="field-group" style={{ marginBottom: "12px" }}>
                  <label style={{ fontSize: "12.5px", fontWeight: "600", color: "var(--text-main)", display: "block", marginBottom: "6px" }}>
                    Project Workspace *
                  </label>
                  <select
                    className="field-select"
                    value={taskProject || (selectedProject ? selectedProject.id : 101)}
                    onChange={(e) => setTaskProject(Number(e.target.value))}
                    style={{ width: "100%", padding: "8px 10px", borderRadius: "8px", border: "1.5px solid var(--border-light)", background: "var(--bg-card)", color: "var(--text-main)", fontSize: "13px" }}
                  >
                    {visibleProjects.map(p => (
                      <option key={p.id} value={p.id}>📁 {p.title}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="field-row modal-field-grid-3col" style={{ display: "grid", gridTemplateColumns: "1fr 1.5fr 1fr", gap: "10px", marginBottom: "12px" }}>
                <div className="field-group">
                  <label style={{ fontSize: "12.5px", fontWeight: "600", color: "var(--text-main)", display: "block", marginBottom: "6px" }}>
                    Priority
                  </label>
                  <select
                    className="field-select"
                    value={taskPriority}
                    onChange={(e) => setTaskPriority(e.target.value)}
                    style={{ width: "100%", padding: "8px 10px", borderRadius: "8px", border: "1.5px solid var(--border-light)", background: "var(--bg-card)", color: "var(--text-main)", fontSize: "13px" }}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">🚨 Urgent</option>
                  </select>
                </div>

                <div className="field-group">
                  <label style={{ fontSize: "12.5px", fontWeight: "600", color: "var(--text-main)", display: "block", marginBottom: "6px" }}>
                    {isTeamLeader ? (
                      <>
                        <span className="badge-role-tag badge-leader" style={{ fontSize: "9px", padding: "1px 5px", marginRight: "4px" }}>👑 Leader</span>
                        Assign Work To
                      </>
                    ) : (
                      "Assignee (Your Deliverable)"
                    )}
                  </label>
                  {isTeamLeader ? (() => {
                    const currentPid = Number(taskProject || (selectedProject ? selectedProject.id : visibleProjects[0]?.id));
                    const projectMembers = teamUsers.filter(u => {
                      if (u.role === "Team Leader") return false;
                      const pids = u.assigned_project_ids || (u.assigned_projects ? u.assigned_projects.map(p => p.id) : []);
                      return pids.includes(currentPid);
                    });

                    return (
                      <>
                        <select
                          className="field-select"
                          value={taskAssignee}
                          onChange={(e) => setTaskAssignee(e.target.value)}
                          disabled={projectMembers.length === 0}
                          style={{ width: "100%", padding: "8px 10px", borderRadius: "8px", border: "1.5px solid var(--border-light)", background: projectMembers.length === 0 ? "var(--bg-sidebar)" : "var(--bg-card)", color: "var(--text-main)", fontSize: "13px" }}
                        >
                          {projectMembers.length === 0 ? (
                            <option value="">⚠️ No members assigned to this project</option>
                          ) : (
                            projectMembers.map(u => (
                              <option key={u.id} value={u.initials}>
                                👤 {u.name} ({u.title || "Team Member"})
                              </option>
                            ))
                          )}
                        </select>
                        {projectMembers.length === 0 && (
                          <div style={{ fontSize: "11px", color: "#d97706", marginTop: "3px", fontWeight: "600" }}>
                            💡 Assign members to this project first
                          </div>
                        )}
                      </>
                    );
                  })() : (
                    <div
                      style={{
                        width: "100%",
                        padding: "8px 10px",
                        borderRadius: "8px",
                        border: "1.5px solid var(--border-light)",
                        background: "var(--bg-sidebar)",
                        color: "var(--text-main)",
                        fontSize: "13px",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px"
                      }}
                    >
                      <span>👤 {currentUser?.name || "You"}</span>
                      <span style={{ fontSize: "10.5px", color: "var(--text-muted)", marginLeft: "auto" }}>
                        (Members only create own tasks)
                      </span>
                    </div>
                  )}
                </div>

                <div className="field-group">
                  <label style={{ fontSize: "12.5px", fontWeight: "600", color: "var(--text-main)", display: "block", marginBottom: "6px" }}>
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={taskDue}
                    onChange={(e) => setTaskDue(e.target.value)}
                    style={{ width: "100%", padding: "8px 10px", borderRadius: "8px", border: "1.5px solid var(--border-light)", background: "var(--bg-card)", color: "var(--text-main)", fontSize: "13px" }}
                  />
                </div>
              </div>

              <div className="field-group" style={{ marginBottom: "16px" }}>
                <label style={{ fontSize: "12.5px", fontWeight: "600", color: "var(--text-main)", display: "block", marginBottom: "6px" }}>
                  Description / Instructions
                </label>
                <textarea
                  rows={2}
                  placeholder="Optional task instructions or context..."
                  value={taskDesc}
                  onChange={(e) => setTaskDesc(e.target.value)}
                  style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1.5px solid var(--border-light)", background: "var(--bg-card)", color: "var(--text-main)", fontSize: "13px", resize: "vertical" }}
                />
              </div>

              <div className="modal-actions" style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                <button type="button" className="btn btn-secondary" onClick={() => setTaskModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Create Task</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── FIXED MODAL 2: EDIT TASK ───────────────────────────────────── */}
      {editModalTask && (() => {
        const canEditCurrent = isTeamLeader || editModalTask.assignee === currentUser?.initials;
        const assigneeUser = teamUsers.find(u => u.initials === editModalTask.assignee) || { name: editModalTask.assignee };

        return (
          <div className="modal-overlay-fixed" onClick={() => setEditModalTask(null)} style={{ zIndex: 120000 }}>
            <div className="modal-card-fixed" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <div>
                  <h2 className="modal-title">{canEditCurrent ? "Edit Task" : "Task Details (View Only)"}</h2>
                  <p className="card-subheading">
                    {canEditCurrent
                      ? "Update task title, description, priority or status"
                      : `Deliverable assigned to ${assigneeUser.name}`}
                  </p>
                </div>
                <button type="button" className="btn btn-icon-only modal-x" onClick={() => setEditModalTask(null)}>✕</button>
              </div>

              {!canEditCurrent && (
                <div style={{ background: "rgba(239,68,68,0.08)", border: "1.5px solid rgba(239,68,68,0.3)", color: "#ef4444", padding: "10px 14px", borderRadius: "8px", fontSize: "12.5px", marginTop: "12px", display: "flex", alignItems: "center", gap: "8px" }}>
                  <span>🔒</span>
                  <span>Permission Notice: You cannot modify tasks assigned to another teammate. Only the assigned member or Team Leader can make changes.</span>
                </div>
              )}

              <form onSubmit={handleEditTaskSubmit} style={{ marginTop: "16px" }}>
                <div className="field-group" style={{ marginBottom: "12px" }}>
                  <label style={{ fontSize: "12.5px", fontWeight: "600", color: "var(--text-main)", display: "block", marginBottom: "6px" }}>
                    Task Title *
                  </label>
                  <input
                    type="text"
                    value={editModalTask.title}
                    disabled={!canEditCurrent}
                    onChange={(e) => setEditModalTask({ ...editModalTask, title: e.target.value })}
                    required
                    style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1.5px solid var(--border-light)", background: canEditCurrent ? "var(--bg-card)" : "var(--bg-sidebar)", color: "var(--text-main)", fontSize: "13.5px", cursor: canEditCurrent ? "text" : "not-allowed" }}
                  />
                </div>

                <div className="field-group" style={{ marginBottom: "12px" }}>
                  <label style={{ fontSize: "12.5px", fontWeight: "600", color: "var(--text-main)", display: "block", marginBottom: "6px" }}>
                    Description (Optional)
                  </label>
                  <textarea
                    rows={2}
                    value={editModalTask.description || ""}
                    disabled={!canEditCurrent}
                    onChange={(e) => setEditModalTask({ ...editModalTask, description: e.target.value })}
                    placeholder="Task instructions and details..."
                    style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1.5px solid var(--border-light)", background: canEditCurrent ? "var(--bg-card)" : "var(--bg-sidebar)", color: "var(--text-main)", fontSize: "13px", resize: "vertical", cursor: canEditCurrent ? "text" : "not-allowed" }}
                  />
                </div>

                <div className="field-row modal-field-grid-3col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1.2fr", gap: "10px", marginBottom: "16px" }}>
                  <div className="field-group">
                    <label style={{ fontSize: "12.5px", fontWeight: "600", color: "var(--text-main)", display: "block", marginBottom: "6px" }}>
                      Priority
                    </label>
                    <select
                      className="field-select"
                      value={editModalTask.priority}
                      disabled={!canEditCurrent}
                      onChange={(e) => setEditModalTask({ ...editModalTask, priority: e.target.value })}
                      style={{ width: "100%", padding: "8px 10px", borderRadius: "8px", border: "1.5px solid var(--border-light)", background: canEditCurrent ? "var(--bg-card)" : "var(--bg-sidebar)", color: "var(--text-main)", fontSize: "13px", cursor: canEditCurrent ? "pointer" : "not-allowed" }}
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="urgent">🚨 Urgent</option>
                    </select>
                  </div>

                  <div className="field-group">
                    <label style={{ fontSize: "12.5px", fontWeight: "600", color: "var(--text-main)", display: "block", marginBottom: "6px" }}>
                      Status
                    </label>
                    <select
                      className="field-select"
                      value={editModalTask.status}
                      disabled={!canEditCurrent}
                      onChange={(e) => setEditModalTask({ ...editModalTask, status: e.target.value })}
                      style={{ width: "100%", padding: "8px 10px", borderRadius: "8px", border: "1.5px solid var(--border-light)", background: canEditCurrent ? "var(--bg-card)" : "var(--bg-sidebar)", color: "var(--text-main)", fontSize: "13px", cursor: canEditCurrent ? "pointer" : "not-allowed" }}
                    >
                      <option value="todo">To Do</option>
                      <option value="in_progress">In Progress</option>
                      <option value="review">Review</option>
                      <option value="done">Done</option>
                    </select>
                  </div>

                  <div className="field-group">
                    <label style={{ fontSize: "12.5px", fontWeight: "600", color: "var(--text-main)", display: "block", marginBottom: "6px" }}>
                      Due Date
                    </label>
                    <input
                      type="date"
                      value={editModalTask.due_date || ""}
                      disabled={!canEditCurrent}
                      onChange={(e) => setEditModalTask({ ...editModalTask, due_date: e.target.value })}
                      style={{ width: "100%", padding: "8px 10px", borderRadius: "8px", border: "1.5px solid var(--border-light)", background: canEditCurrent ? "var(--bg-card)" : "var(--bg-sidebar)", color: "var(--text-main)", fontSize: "13px", cursor: canEditCurrent ? "pointer" : "not-allowed" }}
                    />
                  </div>
                </div>

                <div className="field-group" style={{ marginBottom: "18px" }}>
                  <label style={{ fontSize: "12.5px", fontWeight: "600", color: "var(--text-main)", display: "block", marginBottom: "6px" }}>
                    Assignee (🔒 One-time Assigned)
                  </label>
                  <div
                    style={{
                      width: "100%",
                      padding: "8px 10px",
                      borderRadius: "8px",
                      border: "1.5px solid var(--border-light)",
                      background: "var(--bg-sidebar)",
                      color: "var(--text-main)",
                      fontSize: "13px",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      fontWeight: "600"
                    }}
                  >
                    <span>🔒</span>
                    <span>{assigneeUser.name}</span>
                    <span style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: "normal" }}>
                      (1x Permanent Assignment Rule)
                    </span>
                  </div>
                </div>

                <div className="modal-actions" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "10px" }}>
                  {isTeamLeader && (
                    <button
                      type="button"
                      className="btn-modal-delete-task"
                      onClick={async () => {
                        if (window.confirm(`Are you sure you want to permanently delete task "${editModalTask.title}"?`)) {
                          await deleteTask(editModalTask.id);
                          setEditModalTask(null);
                        }
                      }}
                      title="Delete this task permanently"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        <line x1="10" y1="11" x2="10" y2="17" />
                        <line x1="14" y1="11" x2="14" y2="17" />
                      </svg>
                      <span>Delete Task</span>
                    </button>
                  )}
                  <div style={{ display: "flex", gap: "10px", marginLeft: "auto" }}>
                    <button type="button" className="btn btn-secondary" onClick={() => setEditModalTask(null)}>
                      {canEditCurrent ? "Cancel" : "Close"}
                    </button>
                    {canEditCurrent && (
                      <button type="submit" className="btn btn-primary">Save Changes</button>
                    )}
                  </div>
                </div>
              </form>
            </div>
          </div>
        );
      })()}

      {/* ── FIXED MODAL 3: ADD TEAM MEMBER ─────────────────────────────── */}
      {addMemberModalOpen && (
        <AddMemberModal
          projects={visibleProjects}
          onClose={() => setAddMemberModalOpen(false)}
          onAddMember={async (memberData) => {
            const res = await addTeamMember(memberData);
            if (res) {
              setAddMemberModalOpen(false);
            }
            return res;
          }}
          onOpenCreateProject={() => {
            setAddMemberModalOpen(false);
            handleOpenNewProjectModal();
          }}
        />
      )}

      {/* ── FIXED MODAL 4: MEMBER WORK PROFILE, TASKS & UPDATES ───────── */}
      {inspectedMember && (
        <MemberWorkModal
          member={inspectedMember}
          onClose={() => setInspectedMember(null)}
          onOpenAssignTask={handleOpenNewTaskModal}
        />
      )}

      {/* ── MODAL: CREATE / EDIT PROJECT (SUPABASE PERSISTENT) ─────────── */}
      {projectModalOpen && (
        <div className="modal-overlay-fixed" onClick={() => setProjectModalOpen(false)}>
          <div className="modal-card-fixed" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2 className="modal-title">
                  {projectModalMode === "create" ? "Create New Project" : "Edit Project"}
                </h2>
                <p className="card-subheading">
                  {projectModalMode === "create"
                    ? "Add a new project to your Supabase workspace"
                    : "Update project details, status, and deadline in Supabase"}
                </p>
              </div>
              <button type="button" className="btn btn-icon-only modal-x" onClick={() => setProjectModalOpen(false)}>✕</button>
            </div>

            <form onSubmit={handleProjectModalSubmit} style={{ marginTop: "16px" }}>
              <div className="field-group" style={{ marginBottom: "14px" }}>
                <label style={{ fontSize: "12.5px", fontWeight: "700", color: "var(--text-main)", display: "block", marginBottom: "6px" }}>
                  Project Title *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Mobile App Redesign"
                  value={projFormTitle}
                  onChange={(e) => setProjFormTitle(e.target.value)}
                  required
                  style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1.5px solid var(--border-light)", background: "var(--bg-card)", color: "var(--text-main)", fontSize: "13.5px" }}
                />
              </div>

              <div className="field-group" style={{ marginBottom: "14px" }}>
                <label style={{ fontSize: "12.5px", fontWeight: "700", color: "var(--text-main)", display: "block", marginBottom: "6px" }}>
                  Description
                </label>
                <textarea
                  placeholder="Summary of project goals and scope..."
                  value={projFormDesc}
                  onChange={(e) => setProjFormDesc(e.target.value)}
                  rows={3}
                  style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1.5px solid var(--border-light)", background: "var(--bg-card)", color: "var(--text-main)", fontSize: "13px" }}
                />
              </div>

              <div className="modal-field-grid-2col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "18px" }}>
                <div className="field-group">
                  <label style={{ fontSize: "12.5px", fontWeight: "700", color: "var(--text-main)", display: "block", marginBottom: "6px" }}>
                    Status
                  </label>
                  <select
                    value={projFormStatus}
                    onChange={(e) => setProjFormStatus(e.target.value)}
                    style={{ width: "100%", padding: "8px 10px", borderRadius: "8px", border: "1.5px solid var(--border-light)", background: "var(--bg-card)", color: "var(--text-main)", fontSize: "13px" }}
                  >
                    <option value="active">Active</option>
                    <option value="completed">Completed</option>
                    <option value="on_hold">On Hold</option>
                  </select>
                </div>

                <div className="field-group">
                  <label style={{ fontSize: "12.5px", fontWeight: "700", color: "var(--text-main)", display: "block", marginBottom: "6px" }}>
                    Deadline
                  </label>
                  <input
                    type="date"
                    value={projFormDeadline}
                    onChange={(e) => setProjFormDeadline(e.target.value)}
                    style={{ width: "100%", padding: "8px 10px", borderRadius: "8px", border: "1.5px solid var(--border-light)", background: "var(--bg-card)", color: "var(--text-main)", fontSize: "13px" }}
                  />
                </div>
              </div>

              <div className="modal-actions" style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
                <button type="button" className="btn btn-secondary" onClick={() => setProjectModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {projectModalMode === "create" ? "+ Create Project" : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── FIXED MODAL 5: EDIT USER PROFILE ──────────────────────────── */}
      <EditProfileModal
        isOpen={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
      />
    </div>
  );
}
