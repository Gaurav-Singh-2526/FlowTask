import React, { useState } from "react";
import ProjectMultiSelect from "./ProjectMultiSelect";

export default function AddMemberModal({
  projects = [],
  onClose,
  onAddMember,
  onOpenCreateProject = null
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("password123");
  const [title, setTitle] = useState("");
  const [color, setColor] = useState("av-green");
  const [selectedProjectIds, setSelectedProjectIds] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg("Please enter the member's full name.");
      return;
    }
    if (!email.trim()) {
      setErrorMsg("Please enter a valid email address.");
      return;
    }
    if (password && password.length < 6) {
      setErrorMsg("Member password must be at least 6 characters.");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg("");

    try {
      const result = await onAddMember({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password: password.trim() || "password123",
        role: "Team Member",
        title: title.trim() || "Engineer",
        color: color,
        project_ids: selectedProjectIds
      });

      if (result) {
        onClose();
      }
    } catch (err) {
      setErrorMsg(err.message || "Failed to create team member.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay-fixed" onClick={onClose}>
      <div className="modal-card-fixed" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "540px" }}>
        <div className="modal-header">
          <div>
            <h2 className="modal-title">👥 Add New Team Member</h2>
            <p className="card-subheading">Create an account for a new teammate and assign them to project workspaces</p>
          </div>
          <button type="button" className="btn btn-icon-only modal-x" onClick={onClose}>✕</button>
        </div>

        {errorMsg && (
          <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid #ef4444", color: "#dc2626", padding: "10px 14px", borderRadius: "8px", fontSize: "13px", marginTop: "14px" }}>
            ⚠️ {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ marginTop: "16px" }}>
          <div className="modal-field-grid-2col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "14px" }}>
            <div className="field-group">
              <label style={{ fontSize: "12.5px", fontWeight: "600", color: "var(--text-main)", display: "block", marginBottom: "6px" }}>
                Full Name *
              </label>
              <input
                type="text"
                placeholder="e.g. Rachel Green"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1.5px solid var(--border-light)", background: "var(--bg-card)", color: "var(--text-main)", fontSize: "13px" }}
              />
            </div>

            <div className="field-group">
              <label style={{ fontSize: "12.5px", fontWeight: "600", color: "var(--text-main)", display: "block", marginBottom: "6px" }}>
                Email Address *
              </label>
              <input
                type="email"
                placeholder="e.g. rachel@flowtask.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1.5px solid var(--border-light)", background: "var(--bg-card)", color: "var(--text-main)", fontSize: "13px" }}
              />
            </div>
          </div>

          <div
            style={{
              padding: "8px 12px",
              borderRadius: "8px",
              background: "var(--bg-sidebar)",
              border: "1px solid var(--border-light)",
              marginBottom: "14px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              fontSize: "12.5px",
              color: "var(--text-muted)"
            }}
          >
            <span>Role: <strong style={{ color: "var(--text-main)" }}>👤 Team Member</strong></span>
            <span style={{ fontSize: "11px", color: "var(--primary)", fontWeight: "600" }}>👑 Created by Team Leader</span>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "14px" }}>
            <div className="field-group">
              <label style={{ fontSize: "12.5px", fontWeight: "600", color: "var(--text-main)", display: "block", marginBottom: "6px" }}>
                Login Password *
              </label>
              <input
                type="text"
                placeholder="password123"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1.5px solid var(--border-light)", background: "var(--bg-card)", color: "var(--text-main)", fontSize: "13px" }}
              />
            </div>

            <div className="field-group">
              <label style={{ fontSize: "12.5px", fontWeight: "600", color: "var(--text-main)", display: "block", marginBottom: "6px" }}>
                Job Title / Specialty
              </label>
              <input
                type="text"
                placeholder="e.g. React Frontend Specialist"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1.5px solid var(--border-light)", background: "var(--bg-card)", color: "var(--text-main)", fontSize: "13px" }}
              />
            </div>
          </div>

          {/* Multiple Project Assignment Selection */}
          <div className="field-group" style={{ marginBottom: "16px" }}>
            <label style={{ fontSize: "12.5px", fontWeight: "700", color: "var(--text-main)", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
              <span>📁 Assign to Project Workspaces</span>
              <span style={{ fontSize: "11px", color: "var(--primary)", fontWeight: "600" }}>
                {selectedProjectIds.length} Selected
              </span>
            </label>
            <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: "0 0 8px 0" }}>
              Select one or multiple projects this member can work on. They will only see deliverables for these projects.
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
              {isSubmitting ? "Creating..." : "✓ Create Member & Assign Projects"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
