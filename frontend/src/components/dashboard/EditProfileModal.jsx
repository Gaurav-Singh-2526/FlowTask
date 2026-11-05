import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";

export default function EditProfileModal({ isOpen, onClose }) {
  const { currentUser, updateUserProfile } = useAuth();

  const [name, setName] = useState(currentUser?.name || "");
  const [phone, setPhone] = useState(currentUser?.phone || "");
  const [bio, setBio] = useState(currentUser?.bio || "");
  const [color, setColor] = useState(currentUser?.color || "av-blue");
  const [avatarUrl, setAvatarUrl] = useState(currentUser?.avatar_url || "");
  const [title, setTitle] = useState(currentUser?.title || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  if (!isOpen || !currentUser) return null;

  const colorOptions = [
    { key: "av-blue", bg: "#4f46e5", label: "Indigo" },
    { key: "av-green", bg: "#10b981", label: "Emerald" },
    { key: "av-orange", bg: "#f59e0b", label: "Amber" },
    { key: "av-purple", bg: "#8b5cf6", label: "Purple" },
    { key: "av-red", bg: "#ef4444", label: "Rose" },
    { key: "av-pink", bg: "#ec4899", label: "Pink" }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Full name cannot be empty.");
      return;
    }
    setError("");
    setIsSubmitting(true);

    try {
      const res = await updateUserProfile({
        name: name.trim(),
        phone: phone.trim() || null,
        bio: bio.trim() || null,
        avatar_url: avatarUrl.trim() || null,
        color,
        title: title.trim() || (currentUser.role === "Team Leader" ? "Product & Engineering Lead" : "Engineer")
      });

      if (res.success) {
        setSuccess(true);
        setTimeout(() => {
          setSuccess(false);
          onClose();
        }, 1200);
      } else {
        setError(res.error || "Failed to update profile.");
      }
    } catch (err) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay-fixed" onClick={onClose}>
      <div
        className="modal-card-fixed"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: "520px" }}
      >
        <div className="modal-header">
          <div>
            <h2 className="modal-title" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span>👤 Edit User Profile</span>
            </h2>
            <p className="card-subheading">Update your personal profile details in Supabase</p>
          </div>
          <button type="button" className="btn btn-icon-only modal-x" onClick={onClose}>✕</button>
        </div>

        {error && (
          <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid #ef4444", color: "#ef4444", padding: "10px 14px", borderRadius: "8px", fontSize: "13px", marginTop: "12px" }}>
            ⚠️ {error}
          </div>
        )}

        {success && (
          <div style={{ background: "rgba(16,185,129,0.12)", border: "1px solid #10b981", color: "#059669", padding: "10px 14px", borderRadius: "8px", fontSize: "13px", fontWeight: "700", marginTop: "12px" }}>
            ✓ Profile successfully updated and saved to Supabase!
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ marginTop: "16px" }}>
          {/* Read-Only Account Details Row */}
          <div className="modal-field-grid-2col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "14px", background: "var(--bg-sidebar)", padding: "10px 12px", borderRadius: "10px", border: "1px solid var(--border-subtle)" }}>
            <div>
              <span style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: "700" }}>
                🔒 Email (Account ID)
              </span>
              <div style={{ fontSize: "13px", fontWeight: "600", color: "var(--text-main)", marginTop: "2px" }}>
                {currentUser.email}
              </div>
            </div>
            <div>
              <span style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: "700" }}>
                🔒 Account Role
              </span>
              <div style={{ fontSize: "13px", fontWeight: "700", color: currentUser.role === "Team Leader" ? "var(--primary)" : "#10b981", marginTop: "2px" }}>
                {currentUser.role === "Team Leader" ? "👑 Team Leader" : "👤 Team Member"}
              </div>
            </div>
          </div>

          {/* Full Name & Job Title */}
          <div className="modal-field-grid-2col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "14px" }}>
            <div className="field-group">
              <label style={{ fontSize: "12.5px", fontWeight: "600", color: "var(--text-main)", display: "block", marginBottom: "6px" }}>
                Full Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your full name"
                required
                style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1.5px solid var(--border-light)", background: "var(--bg-card)", color: "var(--text-main)", fontSize: "13px" }}
              />
            </div>
            <div className="field-group">
              <label style={{ fontSize: "12.5px", fontWeight: "600", color: "var(--text-main)", display: "block", marginBottom: "6px" }}>
                Job Title / Role Specialty
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Senior Frontend Engineer"
                style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1.5px solid var(--border-light)", background: "var(--bg-card)", color: "var(--text-main)", fontSize: "13px" }}
              />
            </div>
          </div>

          {/* Phone Number & Avatar Color */}
          <div className="modal-field-grid-2col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "14px" }}>
            <div className="field-group">
              <label style={{ fontSize: "12.5px", fontWeight: "600", color: "var(--text-main)", display: "block", marginBottom: "6px" }}>
                Phone Number
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. +1 (555) 234-5678"
                style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1.5px solid var(--border-light)", background: "var(--bg-card)", color: "var(--text-main)", fontSize: "13px" }}
              />
            </div>

            <div className="field-group">
              <label style={{ fontSize: "12.5px", fontWeight: "600", color: "var(--text-main)", display: "block", marginBottom: "6px" }}>
                Avatar Color Badge
              </label>
              <div style={{ display: "flex", gap: "8px", alignItems: "center", height: "36px" }}>
                {colorOptions.map(c => (
                  <button
                    key={c.key}
                    type="button"
                    title={c.label}
                    onClick={() => setColor(c.key)}
                    style={{
                      width: "26px",
                      height: "26px",
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
          </div>

          {/* Bio / Description */}
          <div className="field-group" style={{ marginBottom: "14px" }}>
            <label style={{ fontSize: "12.5px", fontWeight: "600", color: "var(--text-main)", display: "block", marginBottom: "6px" }}>
              Bio / Description
            </label>
            <textarea
              rows="3"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Brief description about your core competencies, sprint responsibilities, or availability..."
              style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1.5px solid var(--border-light)", background: "var(--bg-card)", color: "var(--text-main)", fontSize: "13px", resize: "vertical" }}
            />
          </div>

          {/* Avatar URL (Optional photo) */}
          <div className="field-group" style={{ marginBottom: "20px" }}>
            <label style={{ fontSize: "12.5px", fontWeight: "600", color: "var(--text-main)", display: "block", marginBottom: "6px" }}>
              Profile Photo URL (Optional)
            </label>
            <input
              type="url"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              placeholder="https://images.unsplash.com/..."
              style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1.5px solid var(--border-light)", background: "var(--bg-card)", color: "var(--text-main)", fontSize: "13px" }}
            />
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "✓ Save Profile Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
