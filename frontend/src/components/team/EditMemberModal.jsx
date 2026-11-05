import React, { useState } from "react";
import ProjectMultiSelect from "./ProjectMultiSelect";

export default function EditMemberModal({
  member,
  projects = [],
  onClose,
  onSave,
  onOpenCreateProject = null
}) {
  const [name, setName] = useState(member?.name || "");
  const [title, setTitle] = useState(member?.title || "");
  const [color, setColor] = useState(member?.color || "av-green");
  const [selectedProjectIds, setSelectedProjectIds] = useState(
    member?.assigned_project_ids || (member?.assigned_projects ? member.assigned_projects.map(p => p.id) : [])
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  if (!member) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg("Member name cannot be empty.");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg("");

    try {
      await onSave({
        name: name.trim(),
        title: title.trim() || "Engineer",
        color: color,
        project_ids: selectedProjectIds
      });
      onClose();
    } catch (err) {
      setErrorMsg(err.message || "Failed to update team member.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay-fixed" onClick={onClose}>
      <div className="modal-card-fixed" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "540px" }}>
        <div className="modal-header">
          <div>
            <h2 className="modal-title" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span>✏️ Edit Team Member</span>
              <span className={`assignee-avatar ${color}`} style={{ width: "26px", height: "26px", fontSize: "11px" }}>
                {member.initials}
              </span>
            </h2>
            <p className="card-subheading">Update member profile details and manage assigned project workspaces</p>
          </div>
          <button type="button" className="btn btn-icon-only modal-x" onClick={onClose}>✕</button>
        </div>

        {errorMsg && (
          <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid #ef4444", color: "#dc2626", padding: "10px 14px", borderRadius: "8px", fontSize: "13px", marginTop: "14px" }}>
            ⚠️ {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ marginTop: "16px" }}>
          {/* Member Name & Email */}
          <div className="modal-field-grid-2col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "14px" }}>
            <div className="field-group">
              <label style={{ fontSize: "12.5px", fontWeight: "600", color: "var(--text-main)", display: "block", marginBottom: "6px" }}>
                Full Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1.5px solid var(--border-light)", background: "var(--bg-card)", color: "var(--text-main)", fontSize: "13px" }}
              />
            </div>

            <div className="field-group">
              <label style={{ fontSize: "12.5px", fontWeight: "600", color: "var(--text-main)", display: "block", marginBottom: "6px" }}>
                Email Address (Locked)
              </label>
              <input
                type="email"
                value={member.email}
                disabled
                style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1.5px solid var(--border-light)", background: "var(--bg-sidebar)", color: "var(--text-muted)", fontSize: "13px", cursor: "not-allowed" }}
              />
            </div>
          </div>

          {/* Role & Title */}
          <div className="modal-field-grid-2col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "14px" }}>
            <div className="field-group">
              <label style={{ fontSize: "12.5px", fontWeight: "600", color: "var(--text-main)", display: "block", marginBottom: "6px" }}>
                Role (Locked)
              </label>
              <input
                type="text"
                value={member.role}
                disabled
                style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1.5px solid var(--border-light)", background: "var(--bg-sidebar)", color: "var(--text-muted)", fontSize: "13px", cursor: "not-allowed" }}
              />
            </div>

            <div className="field-group">
              <label style={{ fontSize: "12.5px", fontWeight: "600", color: "var(--text-main)", display: "block", marginBottom: "6px" }}>
                Job Title / Specialty
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Full Stack Engineer"
                style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1.5px solid var(--border-light)", background: "var(--bg-card)", color: "var(--text-main)", fontSize: "13px" }}
              />
            </div>
          </div>

          {/* Multiple Project Assignment Selection */}
          <div className="field-group" style={{ marginBottom: "16px" }}>
            <label style={{ fontSize: "12.5px", fontWeight: "700", color: "var(--text-main)", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
              <span>📁 Assigned Project Workspaces</span>
              <span style={{ fontSize: "11px", color: "var(--primary)", fontWeight: "600" }}>
                {selectedProjectIds.length} Assigned
              </span>
            </label>
            <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: "0 0 8px 0" }}>
              Select which projects this team member is eligible to work on and receive tasks for.
            </p>
            <ProjectMultiSelect
              projects={projects}
              selectedProjectIds={selectedProjectIds}
              onChange={setSelectedProjectIds}
              onOpenCreateProject={onOpenCreateProject}
            />
          </div>

          {/* Avatar Color */}
          <div className="field-group" style={{ marginBottom: "20px" }}>
            <label style={{ fontSize: "12.5px", fontWeight: "600", color: "var(--text-main)", display: "block", marginBottom: "6px" }}>
              Avatar Color
            </label>
            <div style={{ display: "flex", gap: "10px" }}>
              {[
                { key: "av-blue", bg: "#4f46e5" },
                { key: "av-green", bg: "#10b981" },
                { key: "av-orange", bg: "#f59e0b" },
                { key: "av-purple", bg: "#8b5cf6" },
                { key: "av-red", bg: "#ef4444" },
                { key: "av-pink", bg: "#ec4899" }
              ].map(c => (
                <button
                  key={c.key}
                  type="button"
                  onClick={() => setColor(c.key)}
                  style={{
                    width: "28px",
                    height: "28px",
                    borderRadius: "50%",
                    background: c.bg,
                    border: color === c.key ? "3px solid #0f172a" : "2px solid transparent",
                    cursor: "pointer",
                    outline: "none"
                  }}
                />
              ))}
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "✓ Save Project Assignments"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
