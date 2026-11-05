import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { useTasks } from "../../context/TaskContext";
import AddMemberModal from "../team/AddMemberModal";
import EditMemberModal from "../team/EditMemberModal";

export default function DelegationHub() {
  const { teamUsers, addTeamMember, updateTeamMember, removeTeamMember } = useAuth();
  const {
    projects,
    tasks,
    createTask,
    deleteTask,
    setEditModalTask,
    directives,
    setInspectedMember,
    setIsProjectModalOpen
  } = useTasks();

  // Selected member to inspect in deliverables table
  const [selectedMemberInitials, setSelectedMemberInitials] = useState(null);

  // All team members (excluding Leader for task assignments)
  const assignableMembers = teamUsers.filter(u => u.role !== "Team Leader");

  // Inline Quick Assignment State: Project first!
  const [quickProjectId, setQuickProjectId] = useState(projects[0]?.id || "");
  const [quickAssignee, setQuickAssignee] = useState("");
  const [quickTitle, setQuickTitle] = useState("");
  const [quickDesc, setQuickDesc] = useState("");
  const [quickPriority, setQuickPriority] = useState("high");
  const [quickDue, setQuickDue] = useState("");

  // Personal task assignment modal state
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [modalProjectId, setModalProjectId] = useState(projects[0]?.id || "");
  const [modalAssignee, setModalAssignee] = useState("");
  const [modalTitle, setModalTitle] = useState("");
  const [modalDesc, setModalDesc] = useState("");
  const [modalPriority, setModalPriority] = useState("high");
  const [modalDue, setModalDue] = useState("");

  // Modal states for Team Member Management
  const [addMemberOpen, setAddMemberOpen] = useState(false);
  const [editingMember, setEditingMember] = useState(null);

  const [toastMsg, setToastMsg] = useState("");

  // Compute eligible members for the selected Quick Project
  const eligibleMembersForQuickProject = assignableMembers.filter(u => {
    if (!quickProjectId) return false;
    const qpid = parseInt(quickProjectId, 10);
    const pids = u.assigned_project_ids || (u.assigned_projects ? u.assigned_projects.map(p => p.id) : []);
    return pids.includes(qpid);
  });

  // Compute eligible members for the selected Modal Project
  const eligibleMembersForModalProject = assignableMembers.filter(u => {
    if (!modalProjectId) return false;
    const mpid = parseInt(modalProjectId, 10);
    const pids = u.assigned_project_ids || (u.assigned_projects ? u.assigned_projects.map(p => p.id) : []);
    return pids.includes(mpid);
  });

  // Sync Quick Project selection & Assignee
  useEffect(() => {
    if (projects.length > 0 && !quickProjectId) {
      setQuickProjectId(projects[0].id);
    }
  }, [projects, quickProjectId]);

  useEffect(() => {
    if (eligibleMembersForQuickProject.length > 0) {
      if (!eligibleMembersForQuickProject.some(u => u.initials === quickAssignee)) {
        setQuickAssignee(eligibleMembersForQuickProject[0].initials);
      }
    } else {
      setQuickAssignee("");
    }
  }, [quickProjectId, eligibleMembersForQuickProject.length]);

  // Sync Modal Project selection & Assignee
  useEffect(() => {
    if (eligibleMembersForModalProject.length > 0) {
      if (!eligibleMembersForModalProject.some(u => u.initials === modalAssignee)) {
        setModalAssignee(eligibleMembersForModalProject[0].initials);
      }
    } else {
      setModalAssignee("");
    }
  }, [modalProjectId, eligibleMembersForModalProject.length]);

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 4000);
  };

  const handleOpenAssignModal = (member) => {
    if (member.role === "Team Leader") {
      alert("⚠️ Rule Enforced: Team Leader cannot be assigned tasks. Tasks can only be assigned to Team Members.");
      return;
    }
    // Set project to the member's first assigned project if available
    const memberProjectIds = member.assigned_project_ids || (member.assigned_projects ? member.assigned_projects.map(p => p.id) : []);
    if (memberProjectIds.length > 0) {
      setModalProjectId(memberProjectIds[0]);
    } else if (projects.length > 0) {
      setModalProjectId(projects[0].id);
    }
    setModalAssignee(member.initials);
    setModalTitle("");
    setModalDesc("");
    setAssignModalOpen(true);
  };

  // 1. Submit Quick Inline Personal Task Assignment
  const handleQuickAssignSubmit = async (e) => {
    e.preventDefault();
    if (!quickTitle.trim() || !quickAssignee) return;

    if (!quickProjectId) {
      alert("Please create or select a project first before assigning tasks.");
      return;
    }

    const assignedUser = teamUsers.find(u => u.initials === quickAssignee);
    const targetProj = projects.find(p => p.id === parseInt(quickProjectId, 10));

    try {
      await createTask({
        title: quickTitle.trim(),
        description: quickDesc.trim() || null,
        priority: quickPriority,
        assignee: quickAssignee,
        assignee_id: assignedUser ? assignedUser.id : null,
        project_id: parseInt(quickProjectId, 10),
        due_date: quickDue || null
      });

      setQuickTitle("");
      setQuickDesc("");
      showToast(`✓ Task personally assigned to ${assignedUser ? assignedUser.name : quickAssignee} in "${targetProj ? targetProj.title : 'Project'}"!`);
    } catch (err) {
      alert(`Assignment Failed: ${err.message}`);
    }
  };

  // 2. Submit Modal Personal Task Assignment
  const handleModalAssignSubmit = async (e) => {
    e.preventDefault();
    if (!modalTitle.trim() || !modalAssignee) return;

    if (!modalProjectId) {
      alert("Please select a project first.");
      return;
    }

    const assignedUser = teamUsers.find(u => u.initials === modalAssignee);
    const targetProj = projects.find(p => p.id === parseInt(modalProjectId, 10));

    try {
      await createTask({
        title: modalTitle.trim(),
        description: modalDesc.trim() || null,
        priority: modalPriority,
        assignee: modalAssignee,
        assignee_id: assignedUser ? assignedUser.id : null,
        project_id: parseInt(modalProjectId, 10),
        due_date: modalDue || null
      });

      setAssignModalOpen(false);
      setModalTitle("");
      setModalDesc("");
      showToast(`✓ Task personally assigned to ${assignedUser ? assignedUser.name : modalAssignee} in "${targetProj ? targetProj.title : 'Project'}"!`);
    } catch (err) {
      alert(`Assignment Failed: ${err.message}`);
    }
  };

  // 3. Remove Member
  const handleRemoveMember = async (member) => {
    if (member.role === "Team Leader") {
      alert("Cannot remove the primary Team Leader.");
      return;
    }
    const confirmed = window.confirm(`Are you sure you want to remove ${member.name} (${member.email}) from the team?`);
    if (!confirmed) return;

    await removeTeamMember(member.id);
    showToast(`✓ ${member.name} has been removed from the team roster.`);
    if (selectedMemberInitials === member.initials) {
      setSelectedMemberInitials(null);
    }
  };

  // Filter tasks based on selected member or show all
  const filteredTasks = selectedMemberInitials
    ? tasks.filter(t => t.assignee === selectedMemberInitials)
    : tasks;

  const currentInspectedMember = teamUsers.find(u => u.initials === selectedMemberInitials);

  return (
    <div className="delegation-hub-container" style={{ padding: "4px 0 32px" }}>
      {/* ── TOP HERO BANNER ────────────────────────────────────────────── */}
      <div className="role-dashboard-banner" style={{ marginBottom: "20px" }}>
        <div className="role-banner-inner is-leader" style={{ background: "linear-gradient(135deg, rgba(91,93,248,0.09) 0%, rgba(147,51,234,0.05) 100%)", borderColor: "rgba(91,93,248,0.3)" }}>
          <div className="rb-left">
            <span className="assignee-avatar av-blue" style={{ width: "44px", height: "44px", fontSize: "18px", boxShadow: "0 4px 12px rgba(79,70,229,0.25)" }}>
              👑
            </span>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                <h2 style={{ fontSize: "19px", fontWeight: "800", color: "var(--text-main)", margin: 0, letterSpacing: "-0.3px" }}>
                  Team Delegation &amp; Work Allocation Hub
                </h2>
                <span className="badge-role-tag badge-leader" style={{ fontSize: "11px", padding: "2px 8px" }}>
                  👑 Team Leader Exclusive
                </span>
              </div>
              <p style={{ fontSize: "13px", color: "var(--text-muted)", margin: "4px 0 0 0" }}>
                Personally delegate tasks into any project, manage members, broadcast team directives, and track live responses with read receipts.
              </p>
            </div>
          </div>

          <div className="rb-actions" style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                if (assignableMembers.length === 0) {
                  alert("Please add at least one Team Member before assigning a task.");
                  setAddMemberOpen(true);
                  return;
                }
                if (projects.length === 0) {
                  alert("Please create at least one Project first.");
                  return;
                }
                setModalAssignee(assignableMembers[0]?.initials || "");
                setModalProjectId(projects[0]?.id || "");
                setAssignModalOpen(true);
              }}
              style={{ display: "flex", alignItems: "center", gap: "6px", fontWeight: "600" }}
            >
              <span>+ Assign Task (Modal)</span>
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setAddMemberOpen(true)}
              style={{ display: "flex", alignItems: "center", gap: "6px", fontWeight: "600" }}
            >
              <span>👥 Add Team Member</span>
            </button>
          </div>
        </div>
      </div>

      {/* Global Toast Alert */}
      {toastMsg && (
        <div style={{ background: "rgba(16,185,129,0.12)", border: "1.5px solid #10b981", color: "#059669", padding: "12px 18px", borderRadius: "10px", fontSize: "13.5px", fontWeight: "700", marginBottom: "20px", display: "flex", alignItems: "center", gap: "8px" }}>
          <span>✓</span>
          <span>{toastMsg}</span>
        </div>
      )}

      {/* ── SECTION 1: INLINE QUICK PERSONAL TASK ASSIGNMENT CARD ─────── */}
      <section className="dashboard-panel" style={{ padding: "22px", marginBottom: "24px", border: "1.5px solid rgba(91,93,248,0.25)", background: "var(--bg-card)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px", flexWrap: "wrap", gap: "8px" }}>
          <div>
            <h3 style={{ fontSize: "16px", fontWeight: "800", color: "var(--text-main)", margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
              <span>⚡ Personal Task Assignment</span>
              <span style={{ fontSize: "11.5px", background: "rgba(91,93,248,0.1)", color: "var(--primary)", padding: "2px 8px", borderRadius: "999px", fontWeight: "700" }}>
                Instant Allocation
              </span>
            </h3>
            <p style={{ fontSize: "12.5px", color: "var(--text-muted)", margin: "4px 0 0 0" }}>
              Select target project first. Only team members assigned to that project will be eligible to receive deliverables.
            </p>
          </div>
        </div>

        <form onSubmit={handleQuickAssignSubmit}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "12px", marginBottom: "12px" }}>
            {/* 1. Target Project (Selected First) */}
            <div>
              <label style={{ fontSize: "12px", fontWeight: "700", color: "var(--text-main)", display: "block", marginBottom: "6px" }}>
                1. Select Project Workspace *
              </label>
              <select
                value={quickProjectId}
                onChange={(e) => setQuickProjectId(e.target.value)}
                required
                style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1.5px solid var(--border-light)", background: "var(--bg-sidebar)", color: "var(--text-main)", fontSize: "13px", fontWeight: "600" }}
              >
                {projects.length === 0 ? (
                  <option value="">No projects yet — create a project first</option>
                ) : (
                  projects.map(p => (
                    <option key={p.id} value={p.id}>📁 {p.title}</option>
                  ))
                )}
              </select>
            </div>

            {/* 2. Target Member (Filtered to Project Members) */}
            <div>
              <label style={{ fontSize: "12px", fontWeight: "700", color: "var(--text-main)", display: "block", marginBottom: "6px" }}>
                2. Assign To Teammate *
              </label>
              <select
                value={quickAssignee}
                onChange={(e) => setQuickAssignee(e.target.value)}
                required
                disabled={eligibleMembersForQuickProject.length === 0}
                style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1.5px solid var(--border-light)", background: eligibleMembersForQuickProject.length === 0 ? "var(--bg-sidebar)" : "var(--bg-card)", color: "var(--text-main)", fontSize: "13px", fontWeight: "600" }}
              >
                {eligibleMembersForQuickProject.length === 0 ? (
                  <option value="">⚠️ No members assigned to this project</option>
                ) : (
                  eligibleMembersForQuickProject.map(u => {
                    const pendingCount = tasks.filter(t => t.assignee === u.initials && t.status !== "done").length;
                    return (
                      <option key={u.id} value={u.initials}>
                        👤 {u.name} ({u.title || "Team Member"}) — {pendingCount} active tasks
                      </option>
                    );
                  })
                )}
              </select>
              {eligibleMembersForQuickProject.length === 0 && (
                <div style={{ fontSize: "11px", color: "#d97706", marginTop: "4px", fontWeight: "600" }}>
                  💡 Assign members to this project below using "✏️ Edit &amp; Projects"
                </div>
              )}
            </div>

            {/* 3. Priority */}
            <div>
              <label style={{ fontSize: "12px", fontWeight: "700", color: "var(--text-main)", display: "block", marginBottom: "6px" }}>
                3. Priority Level
              </label>
              <select
                value={quickPriority}
                onChange={(e) => setQuickPriority(e.target.value)}
                style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1.5px solid var(--border-light)", background: "var(--bg-sidebar)", color: "var(--text-main)", fontSize: "13px" }}
              >
                <option value="low">Low Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="high">High Priority</option>
              </select>
            </div>

            {/* 4. Due Date */}
            <div>
              <label style={{ fontSize: "12px", fontWeight: "700", color: "var(--text-main)", display: "block", marginBottom: "6px" }}>
                4. Due Date
              </label>
              <input
                type="date"
                value={quickDue}
                onChange={(e) => setQuickDue(e.target.value)}
                style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1.5px solid var(--border-light)", background: "var(--bg-sidebar)", color: "var(--text-main)", fontSize: "13px" }}
              />
            </div>
          </div>

          {/* 5. Title & Description */}
          <div className="delegation-form-row-2col" style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: "12px", marginBottom: "14px" }}>
            <div>
              <label style={{ fontSize: "12px", fontWeight: "700", color: "var(--text-main)", display: "block", marginBottom: "6px" }}>
                5. Deliverable Title *
              </label>
              <input
                type="text"
                placeholder="e.g. Implement responsive navigation &amp; test on mobile devices"
                value={quickTitle}
                onChange={(e) => setQuickTitle(e.target.value)}
                required
                style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1.5px solid var(--border-light)", background: "var(--bg-sidebar)", color: "var(--text-main)", fontSize: "13.5px" }}
              />
            </div>

            <div>
              <label style={{ fontSize: "12px", fontWeight: "700", color: "var(--text-main)", display: "block", marginBottom: "6px" }}>
                6. Instructions / Notes (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Verify with Figma specs and pull latest main branch"
                value={quickDesc}
                onChange={(e) => setQuickDesc(e.target.value)}
                style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1.5px solid var(--border-light)", background: "var(--bg-sidebar)", color: "var(--text-main)", fontSize: "13px" }}
              />
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={!quickAssignee || eligibleMembersForQuickProject.length === 0}
              style={{ padding: "10px 24px", fontSize: "14px", fontWeight: "700", display: "flex", alignItems: "center", gap: "8px", borderRadius: "8px" }}
            >
              <span>🚀 Assign Task Personally to Teammate</span>
            </button>
          </div>
        </form>
      </section>

      {/* ── SECTION 2: TEAM ROSTER & CAPACITY CARDS ─────────────────────── */}
      <div style={{ marginBottom: "24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px", flexWrap: "wrap", gap: "8px" }}>
          <div>
            <h3 style={{ fontSize: "15.5px", fontWeight: "800", color: "var(--text-main)", margin: 0 }}>
              Team Roster ({teamUsers.length} Active Members)
            </h3>
            <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
              Inspect member capacity, allocate tasks directly to their cards, or filter the deliverables table below.
            </span>
          </div>

          {selectedMemberInitials && (
            <button
              type="button"
              className="btn btn-outline-pill btn-xs"
              onClick={() => setSelectedMemberInitials(null)}
              style={{ fontWeight: "700" }}
            >
              ✕ Show All Deliverables
            </button>
          )}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "14px" }}>
          {teamUsers.length === 0 ? (
            <div style={{ textAlign: "center", padding: "36px 20px", background: "var(--bg-card)", border: "1.5px dashed var(--border-light)", borderRadius: "14px", gridColumn: "1 / -1" }}>
              <div style={{ fontSize: "32px", marginBottom: "8px" }}>👥</div>
              <div style={{ fontWeight: "700", fontSize: "14.5px", color: "var(--text-main)", marginBottom: "4px" }}>No team members in your workspace yet</div>
              <p style={{ fontSize: "13px", color: "var(--text-muted)", marginBottom: "14px" }}>Add teammates to your workspace to assign deliverables and track capacity.</p>
              <button type="button" className="btn btn-primary btn-sm" onClick={() => setAddMemberOpen(true)}>+ Add Team Member</button>
            </div>
          ) : (
            teamUsers.map(member => {
            const memberTasks = tasks.filter(t => t.assignee === member.initials);
            const doneCount = memberTasks.filter(t => t.status === "done").length;
            const inProgCount = memberTasks.filter(t => t.status === "in_progress").length;
            const isSelected = selectedMemberInitials === member.initials;

            return (
              <div
                key={member.id}
                style={{
                  background: isSelected ? "rgba(91,93,248,0.05)" : "var(--bg-card)",
                  border: isSelected ? "2px solid var(--primary)" : "1px solid var(--border-light)",
                  borderRadius: "14px",
                  padding: "16px",
                  boxShadow: "0 4px 14px rgba(0,0,0,0.03)",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  transition: "all 0.15s ease"
                }}
              >
                <div>
                  <div
                    style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px", cursor: "pointer" }}
                    onClick={() => setInspectedMember(member)}
                    title={`Click to view assigned tasks & work updates for ${member.name}`}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <span className={`assignee-avatar ${member.color || "av-blue"}`} style={{ width: "38px", height: "38px", fontSize: "13px" }}>
                        {member.initials}
                      </span>
                      <div>
                        <div style={{ fontWeight: "700", fontSize: "14px", color: "var(--text-main)" }}>
                          {member.name}
                        </div>
                        <div style={{ fontSize: "11.5px", color: "var(--text-muted)" }}>
                          {member.title || (member.role === "Team Leader" ? "Project Lead" : "Engineer")}
                        </div>
                      </div>
                    </div>

                    <span className={`badge-role-tag ${member.role === "Team Leader" ? "badge-leader" : "badge-member"}`}>
                      {member.role === "Team Leader" ? "👑 Leader" : "👤 Member"}
                    </span>
                  </div>

                  <div style={{ fontSize: "12px", color: "var(--text-subtle)", marginBottom: "12px" }}>
                    ✉️ {member.email}
                  </div>

                  {/* Task Workload Stats */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "6px", background: "var(--bg-sidebar)", padding: "8px 10px", borderRadius: "8px", textAlign: "center", marginBottom: "14px" }}>
                    {member.role === "Team Leader" ? (
                      <>
                        <div>
                          <div style={{ fontSize: "14px", fontWeight: "800", color: "var(--text-main)" }}>{tasks.length}</div>
                          <div style={{ fontSize: "10px", color: "var(--text-muted)" }}>Total Tasks</div>
                        </div>
                        <div>
                          <div style={{ fontSize: "14px", fontWeight: "800", color: "var(--primary)" }}>{assignableMembers.length}</div>
                          <div style={{ fontSize: "10px", color: "var(--text-muted)" }}>Teammates</div>
                        </div>
                        <div>
                          <div style={{ fontSize: "14px", fontWeight: "800", color: "#10b981" }}>{tasks.filter(t => t.status === "done").length}</div>
                          <div style={{ fontSize: "10px", color: "var(--text-muted)" }}>Completed</div>
                        </div>
                      </>
                    ) : (
                      <>
                        <div>
                          <div style={{ fontSize: "14px", fontWeight: "800", color: "var(--text-main)" }}>{memberTasks.length}</div>
                          <div style={{ fontSize: "10px", color: "var(--text-muted)" }}>Total Tasks</div>
                        </div>
                        <div>
                          <div style={{ fontSize: "14px", fontWeight: "800", color: "var(--primary)" }}>{inProgCount}</div>
                          <div style={{ fontSize: "10px", color: "var(--text-muted)" }}>Active</div>
                        </div>
                        <div>
                          <div style={{ fontSize: "14px", fontWeight: "800", color: "#10b981" }}>{doneCount}</div>
                          <div style={{ fontSize: "10px", color: "var(--text-muted)" }}>Done</div>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Assigned Projects Preview */}
                  {member.role !== "Team Leader" && (
                    <div style={{ marginBottom: "12px", background: "rgba(91,93,248,0.03)", border: "1px solid rgba(91,93,248,0.12)", borderRadius: "8px", padding: "8px 10px" }}>
                      <div style={{ fontSize: "11px", fontWeight: "700", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "4px", display: "flex", justifyContent: "space-between" }}>
                        <span>Assigned Projects</span>
                        <span style={{ color: "var(--primary)", fontWeight: "800" }}>
                          {(member.assigned_projects?.length || member.assigned_project_ids?.length || 0)}
                        </span>
                      </div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                        {(member.assigned_projects && member.assigned_projects.length > 0) ? (
                          member.assigned_projects.map(p => (
                            <span key={p.id} style={{ fontSize: "11px", background: "rgba(91,93,248,0.12)", color: "var(--primary)", padding: "2px 7px", borderRadius: "4px", fontWeight: "600" }}>
                              📁 {p.title}
                            </span>
                          ))
                        ) : (
                          <span style={{ fontSize: "11px", color: "#d97706", fontStyle: "italic" }}>
                            ⚠️ No projects assigned yet
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Card Actions */}
                <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", alignItems: "center" }}>
                  <button
                    type="button"
                    className="btn btn-primary-pill btn-xs"
                    onClick={() => setInspectedMember(member)}
                    style={{ flex: 1, justifyContent: "center", fontWeight: "700" }}
                    title={`View assigned tasks & work updates for ${member.name}`}
                  >
                    👁️ Tasks &amp; Updates
                  </button>

                  <button
                    type="button"
                    className={`btn btn-xs ${isSelected ? "btn-dark" : "btn-outline-pill"}`}
                    onClick={() => setSelectedMemberInitials(isSelected ? null : member.initials)}
                    title="Filter deliverables table below"
                  >
                    {isSelected ? "Hide Work" : "Filter Table"}
                  </button>

                  {member.role !== "Team Leader" && (
                    <button
                      type="button"
                      className="btn btn-outline-pill btn-xs"
                      onClick={() => setEditingMember(member)}
                      title={`Edit ${member.name} and assign projects`}
                      style={{ fontWeight: "700" }}
                    >
                      ✏️ Edit &amp; Projects
                    </button>
                  )}

                  {member.role === "Team Leader" ? (
                    <span
                      style={{
                        fontSize: "11px",
                        padding: "5px 8px",
                        borderRadius: "6px",
                        background: "rgba(91,93,248,0.08)",
                        color: "var(--primary)",
                        fontWeight: "700",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px"
                      }}
                      title="Team Leader delegates work to members"
                    >
                      👑 Delegator / Lead
                    </span>
                  ) : (
                    <button
                      type="button"
                      className="btn btn-outline-pill btn-xs"
                      onClick={() => handleOpenAssignModal(member)}
                      title={`Assign new deliverable to ${member.name}`}
                    >
                      + Assign
                    </button>
                  )}

                  {member.role !== "Team Leader" && (
                    <button
                      type="button"
                      className="btn btn-outline-pill btn-xs"
                      onClick={() => handleRemoveMember(member)}
                      title={`Remove ${member.name} from team`}
                      style={{ color: "#ef4444", borderColor: "rgba(239,68,68,0.3)" }}
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
      </div>

      {/* ── SECTION 3: DELIVERABLES TABLE ───────────────────────────────── */}
      <section className="dashboard-panel" style={{ padding: "20px", marginBottom: "24px" }}>
        <div className="panel-card-header" style={{ marginBottom: "14px" }}>
          <div>
            <h3 className="card-heading" style={{ margin: 0 }}>
              {currentInspectedMember
                ? `Deliverables Assigned to ${currentInspectedMember.name} (${filteredTasks.length} Tasks)`
                : `All Assigned Deliverables (${filteredTasks.length} Tasks across team)`}
            </h3>
            <p className="card-subheading" style={{ margin: "2px 0 0 0" }}>
              Each task is tied to a project. Once assigned, the task and project automatically appear on the member's account.
            </p>
          </div>

          <button
            type="button"
            className="btn btn-primary-pill btn-xs"
            onClick={() => {
              setModalAssignee(currentInspectedMember && currentInspectedMember.role !== "Team Leader" ? currentInspectedMember.initials : (assignableMembers[0]?.initials || "SK"));
              setAssignModalOpen(true);
            }}
          >
            + Delegate New Task
          </button>
        </div>

        {filteredTasks.length === 0 ? (
          <div style={{ textAlign: "center", padding: "32px", color: "var(--text-muted)", fontSize: "13.5px" }}>
            No tasks currently assigned to {currentInspectedMember ? currentInspectedMember.name : "the team"}. Use the Quick Assignment form above to allocate work!
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
              <thead>
                <tr style={{ borderBottom: "1.5px solid var(--border-light)", color: "var(--text-muted)", textAlign: "left" }}>
                  <th style={{ padding: "8px 10px" }}>Task Title</th>
                  <th style={{ padding: "8px 10px" }}>Project</th>
                  <th style={{ padding: "8px 10px" }}>Assigned Member</th>
                  <th style={{ padding: "8px 10px" }}>Priority</th>
                  <th style={{ padding: "8px 10px" }}>Status</th>
                  <th style={{ padding: "8px 10px" }}>Due Date</th>
                  <th style={{ padding: "8px 10px", textAlign: "center" }}>Assignment Status</th>
                  <th style={{ padding: "8px 10px", textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTasks.map(t => {
                  const assigneeUser = teamUsers.find(u => u.initials === t.assignee) || { name: t.assignee, initials: t.assignee, color: "av-blue" };
                  const proj = projects.find(p => p.id === t.project_id) || { title: "FlowTask App" };

                  return (
                    <tr key={t.id} style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                      <td style={{ padding: "10px", fontWeight: "600", color: "var(--text-main)" }}>
                        {t.title}
                        {t.description && (
                          <div style={{ fontSize: "11.5px", color: "var(--text-muted)", fontWeight: "400" }}>{t.description}</div>
                        )}
                      </td>
                      <td style={{ padding: "10px" }}>
                        <span style={{ background: "var(--bg-sidebar)", padding: "3px 8px", borderRadius: "6px", fontSize: "11.5px", color: "var(--text-body)" }}>
                          📁 {proj.title}
                        </span>
                      </td>
                      <td style={{ padding: "10px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <span className={`assignee-avatar ${assigneeUser.color || "av-blue"}`} style={{ width: "22px", height: "22px", fontSize: "10px" }}>
                            {assigneeUser.initials}
                          </span>
                          <span>{assigneeUser.name}</span>
                        </div>
                      </td>
                      <td style={{ padding: "10px" }}>
                        <span className={`badge badge-priority-${t.priority}`}>{t.priority}</span>
                      </td>
                      <td style={{ padding: "10px" }}>
                        <span className={`badge badge-status-${t.status === "in_progress" ? "in_progress" : t.status === "done" ? "done" : "todo"}`}>
                          {t.status.replace("_", " ")}
                        </span>
                      </td>
                      <td style={{ padding: "10px", color: "var(--text-muted)", fontSize: "12px" }}>
                        {t.due_date || "No date"}
                      </td>
                      <td style={{ padding: "10px", textAlign: "center" }}>
                        <span
                          style={{
                            fontSize: "11.5px",
                            padding: "4px 8px",
                            borderRadius: "6px",
                            background: "rgba(16,185,129,0.08)",
                            color: "#059669",
                            border: "1px solid rgba(16,185,129,0.25)",
                            fontWeight: "700",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px"
                          }}
                          title="One task assign only one time rule: assignment is permanent."
                        >
                          🔒 Assigned (1x)
                        </span>
                      </td>
                      <td style={{ padding: "10px", textAlign: "right" }}>
                        <div style={{ display: "inline-flex", gap: "6px", justifyContent: "flex-end" }}>
                          <button
                            type="button"
                            className="btn-task-action btn-task-edit btn-task-pill"
                            onClick={() => setEditModalTask(t)}
                            title="Edit task details"
                          >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                            </svg>
                            <span>Edit</span>
                          </button>
                          <button
                            type="button"
                            className="btn-task-action btn-task-delete btn-task-pill"
                            onClick={async () => {
                              if (window.confirm(`Are you sure you want to delete task "${t.title}"?`)) {
                                await deleteTask(t.id);
                                showToast(`Task "${t.title}" deleted successfully!`);
                              }
                            }}
                            title="Delete task"
                          >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="3 6 5 6 21 6" />
                              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                              <line x1="10" y1="11" x2="10" y2="17" />
                              <line x1="14" y1="11" x2="14" y2="17" />
                            </svg>
                            <span>Delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ── SECTION 3.5: MEMBER WORK UPDATES & ACTIVITY ─────────────────── */}
      {currentInspectedMember && (
        <section className="dashboard-panel" style={{ padding: "20px", marginBottom: "24px", background: "var(--bg-card)", border: "1.5px solid var(--border-light)" }}>
          <div className="panel-card-header" style={{ marginBottom: "14px" }}>
            <div>
              <h3 className="card-heading" style={{ margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
                <span>💬 Work Updates &amp; Progress Reports by {currentInspectedMember.name}</span>
              </h3>
              <p className="card-subheading" style={{ margin: "2px 0 0 0" }}>
                Status updates, progress reports and responses submitted by {currentInspectedMember.name}
              </p>
            </div>

            <button
              type="button"
              className="btn btn-outline-pill btn-xs"
              onClick={() => setInspectedMember(currentInspectedMember)}
            >
              🔍 Open Full Work Profile
            </button>
          </div>

          {(() => {
            const memberUpdates = [];
            directives.forEach(d => {
              (d.responses || []).forEach(r => {
                if (r.memberInitials === currentInspectedMember.initials || r.memberName === currentInspectedMember.name) {
                  memberUpdates.push({ ...r, directiveTitle: d.message });
                }
              });
              if (d.from === currentInspectedMember.name || d.fromInitials === currentInspectedMember.initials) {
                memberUpdates.push({ id: d.id, text: d.message, timestamp: d.timestamp, seenBy: d.seenBy });
              }
            });

            if (memberUpdates.length === 0) {
              return (
                <div style={{ textAlign: "center", padding: "24px", color: "var(--text-muted)", fontSize: "13px" }}>
                  No work status updates posted by {currentInspectedMember.name} yet.
                </div>
              );
            }

            return (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {memberUpdates.map((u, i) => (
                  <div key={u.id || i} style={{ background: "var(--bg-sidebar)", border: "1px solid var(--border-subtle)", borderRadius: "10px", padding: "12px 14px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span className={`assignee-avatar ${currentInspectedMember.color || "av-blue"}`} style={{ width: "24px", height: "24px", fontSize: "10px" }}>
                          {currentInspectedMember.initials}
                        </span>
                        <strong style={{ fontSize: "13px", color: "var(--text-main)" }}>{currentInspectedMember.name}</strong>
                      </div>
                      <span style={{ fontSize: "11px", color: "var(--text-subtle)" }}>{u.timestamp || "Recently"}</span>
                    </div>
                    <div style={{ fontSize: "13px", color: "var(--text-body)", lineHeight: "1.4" }}>
                      {u.text}
                    </div>
                    {u.directiveTitle && (
                      <div style={{ marginTop: "4px", fontSize: "11px", color: "var(--text-muted)" }}>
                        <em>In reply to directive: "{u.directiveTitle.slice(0, 70)}..."</em>
                      </div>
                    )}
                    {u.seenBy && (
                      <div style={{ marginTop: "4px", fontSize: "11px", color: "var(--text-subtle)" }}>
                        👁️ Seen by: {u.seenBy.join(", ")}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            );
          })()}
        </section>
      )}

      {/* ── FIXED MODAL 1: PERSONAL TASK ASSIGNMENT MODAL ─────────────────── */}
      {assignModalOpen && (
        <div className="modal-overlay-fixed" onClick={() => setAssignModalOpen(false)}>
          <div className="modal-card-fixed" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2 className="modal-title">Personally Assign Task to Member</h2>
                <p className="card-subheading">Select target project first, then allocate to an assigned team member</p>
              </div>
              <button type="button" className="btn btn-icon-only modal-x" onClick={() => setAssignModalOpen(false)}>✕</button>
            </div>

            <form onSubmit={handleModalAssignSubmit} style={{ marginTop: "16px" }}>
              <div className="modal-field-grid-2col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "14px" }}>
                <div className="field-group">
                  <label style={{ fontSize: "12.5px", fontWeight: "600", color: "var(--text-main)", display: "block", marginBottom: "6px" }}>
                    1. Project Workspace *
                  </label>
                  <select
                    value={modalProjectId}
                    onChange={(e) => setModalProjectId(e.target.value)}
                    style={{ width: "100%", padding: "8px 10px", borderRadius: "8px", border: "1.5px solid var(--border-light)", background: "var(--bg-card)", color: "var(--text-main)", fontSize: "13px" }}
                    required
                  >
                    {projects.length === 0 ? (
                      <option value="" disabled>No projects created yet</option>
                    ) : (
                      projects.map(p => (
                        <option key={p.id} value={p.id}>📁 {p.title}</option>
                      ))
                    )}
                  </select>
                </div>

                <div className="field-group">
                  <label style={{ fontSize: "12.5px", fontWeight: "600", color: "var(--text-main)", display: "block", marginBottom: "6px" }}>
                    2. Target Team Member *
                  </label>
                  <select
                    value={modalAssignee}
                    onChange={(e) => setModalAssignee(e.target.value)}
                    disabled={eligibleMembersForModalProject.length === 0}
                    style={{ width: "100%", padding: "8px 10px", borderRadius: "8px", border: "1.5px solid var(--border-light)", background: eligibleMembersForModalProject.length === 0 ? "var(--bg-sidebar)" : "var(--bg-card)", color: "var(--text-main)", fontSize: "13px" }}
                    required
                  >
                    {eligibleMembersForModalProject.length === 0 ? (
                      <option value="" disabled>⚠️ No members assigned to this project</option>
                    ) : (
                      eligibleMembersForModalProject.map(u => (
                        <option key={u.id} value={u.initials}>👤 {u.name} ({u.title || "Team Member"})</option>
                      ))
                    )}
                  </select>
                  {eligibleMembersForModalProject.length === 0 && (
                    <div style={{ fontSize: "11px", color: "#d97706", marginTop: "3px", fontWeight: "600" }}>
                      💡 Assign members to this project first
                    </div>
                  )}
                </div>
              </div>

              <div className="field-group" style={{ marginBottom: "14px" }}>
                <label style={{ fontSize: "12.5px", fontWeight: "600", color: "var(--text-main)", display: "block", marginBottom: "6px" }}>
                  Task Title *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Build authentication middleware &amp; JWT verification"
                  value={modalTitle}
                  onChange={(e) => setModalTitle(e.target.value)}
                  required
                  style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1.5px solid var(--border-light)", background: "var(--bg-card)", color: "var(--text-main)", fontSize: "13.5px" }}
                />
              </div>

              <div className="field-group" style={{ marginBottom: "14px" }}>
                <label style={{ fontSize: "12.5px", fontWeight: "600", color: "var(--text-main)", display: "block", marginBottom: "6px" }}>
                  Task Instructions / Description
                </label>
                <textarea
                  rows="3"
                  placeholder="Specify requirements, acceptance criteria, or branch names..."
                  value={modalDesc}
                  onChange={(e) => setModalDesc(e.target.value)}
                  style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1.5px solid var(--border-light)", background: "var(--bg-card)", color: "var(--text-main)", fontSize: "13px", resize: "vertical" }}
                ></textarea>
              </div>

              <div className="modal-field-grid-2col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "20px" }}>
                <div className="field-group">
                  <label style={{ fontSize: "12.5px", fontWeight: "600", color: "var(--text-main)", display: "block", marginBottom: "6px" }}>
                    Priority
                  </label>
                  <select
                    value={modalPriority}
                    onChange={(e) => setModalPriority(e.target.value)}
                    style={{ width: "100%", padding: "8px 10px", borderRadius: "8px", border: "1.5px solid var(--border-light)", background: "var(--bg-card)", color: "var(--text-main)", fontSize: "13px" }}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>

                <div className="field-group">
                  <label style={{ fontSize: "12.5px", fontWeight: "600", color: "var(--text-main)", display: "block", marginBottom: "6px" }}>
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={modalDue}
                    onChange={(e) => setModalDue(e.target.value)}
                    style={{ width: "100%", padding: "8px 10px", borderRadius: "8px", border: "1.5px solid var(--border-light)", background: "var(--bg-card)", color: "var(--text-main)", fontSize: "13px" }}
                  />
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                <button type="button" className="btn btn-secondary" onClick={() => setAssignModalOpen(false)}>
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={!modalAssignee || eligibleMembersForModalProject.length === 0}
                >
                  ✓ Assign Task &amp; Notify Member
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── ADD NEW TEAM MEMBER MODAL ── */}
      {addMemberOpen && (
        <AddMemberModal
          projects={projects}
          onClose={() => setAddMemberOpen(false)}
          onAddMember={async (memberData) => {
            const res = await addTeamMember(memberData);
            if (res) {
              setAddMemberOpen(false);
              showToast(`✓ New team member "${memberData.name}" created with assigned projects!`);
            }
            return res;
          }}
          onOpenCreateProject={() => {
            setAddMemberOpen(false);
            if (setIsProjectModalOpen) setIsProjectModalOpen(true);
          }}
        />
      )}

      {/* ── EDIT TEAM MEMBER & PROJECT ASSIGNMENTS MODAL ── */}
      {editingMember && (
        <EditMemberModal
          member={editingMember}
          projects={projects}
          onClose={() => setEditingMember(null)}
          onSave={async (updatedData) => {
            await updateTeamMember(editingMember.id, updatedData);
            setEditingMember(null);
            showToast(`✓ Updated project assignments for ${editingMember.name}`);
          }}
          onOpenCreateProject={() => {
            setEditingMember(null);
            if (setIsProjectModalOpen) setIsProjectModalOpen(true);
          }}
        />
      )}
    </div>
  );
}
