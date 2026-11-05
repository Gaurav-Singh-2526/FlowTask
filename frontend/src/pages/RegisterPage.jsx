import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [title, setTitle] = useState("");
  const [role] = useState("Team Leader");
  const [color, setColor] = useState("av-blue");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      setError("Name and email are required.");
      return;
    }
    if (!password) {
      setError("Password is required.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match. Please re-enter.");
      return;
    }
    setError("");
    const res = await register({
      name: name.trim(),
      email: email.trim(),
      password,
      role: "Team Leader",
      title: title.trim() || "Team Leader",
      color
    });
    if (res && res.error) {
      setError(res.error);
      return;
    }
    navigate("/dashboard");
  };

  return (
    <div className="auth-page-container">
      <div className="auth-card-box" style={{ maxWidth: "480px" }}>
        <div style={{ textAlign: "center", marginBottom: "24px" }}>
          <div className="brand-logo-icon" style={{ margin: "0 auto 12px" }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
            </svg>
          </div>
          <h2 style={{ fontSize: "24px", fontWeight: "800", color: "var(--text-main)", letterSpacing: "-0.5px" }}>
            Create Team Leader Account
          </h2>
          <p style={{ fontSize: "14px", color: "var(--text-muted)", marginTop: "4px" }}>
            Register as a Team Leader to launch your workspace and manage team members
          </p>
        </div>

        {error && (
          <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid #ef4444", color: "#ef4444", padding: "10px", borderRadius: "8px", fontSize: "13px", marginBottom: "16px" }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="field-row auth-field-row" style={{ display: "flex", gap: "12px", marginBottom: "14px" }}>
            <div className="field-group" style={{ flex: 2 }}>
              <label style={{ fontSize: "13px", fontWeight: "600", color: "var(--text-main)", display: "block", marginBottom: "6px" }}>
                Full Name *
              </label>
              <input
                type="text"
                placeholder="e.g. Rahul Sharma"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1.5px solid var(--border-light)", background: "var(--bg-card)", color: "var(--text-main)", fontSize: "13.5px" }}
              />
            </div>
            <div className="field-group" style={{ flex: 1.5 }}>
              <label style={{ fontSize: "13px", fontWeight: "600", color: "var(--text-main)", display: "block", marginBottom: "6px" }}>
                Job Title
              </label>
              <input
                type="text"
                placeholder="e.g. Frontend Dev"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1.5px solid var(--border-light)", background: "var(--bg-card)", color: "var(--text-main)", fontSize: "13.5px" }}
              />
            </div>
          </div>

          <div className="field-group" style={{ marginBottom: "16px" }}>
            <label style={{ fontSize: "13px", fontWeight: "600", color: "var(--text-main)", display: "block", marginBottom: "6px" }}>
              Email Address *
            </label>
            <input
              type="email"
              placeholder="e.g. rahul@flowtask.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1.5px solid var(--border-light)", background: "var(--bg-card)", color: "var(--text-main)", fontSize: "13.5px" }}
            />
          </div>

          <div className="field-row" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "16px" }}>
            <div className="field-group">
              <label style={{ fontSize: "13px", fontWeight: "600", color: "var(--text-main)", display: "block", marginBottom: "6px" }}>
                Password *
              </label>
              <div className="password-input-wrap">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Min 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1.5px solid var(--border-light)", background: "var(--bg-card)", color: "var(--text-main)", fontSize: "13.5px" }}
                />
                <button
                  type="button"
                  className="btn-toggle-password"
                  onClick={() => setShowPassword(!showPassword)}
                  title={showPassword ? "Hide password" : "Show password"}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                      <line x1="1" y1="1" x2="23" y2="23"></line>
                    </svg>
                  ) : (
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                      <circle cx="12" cy="12" r="3"></circle>
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <div className="field-group">
              <label style={{ fontSize: "13px", fontWeight: "600", color: "var(--text-main)", display: "block", marginBottom: "6px" }}>
                Confirm Password *
              </label>
              <div className="password-input-wrap">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Repeat password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1.5px solid var(--border-light)", background: "var(--bg-card)", color: "var(--text-main)", fontSize: "13.5px" }}
                />
                <button
                  type="button"
                  className="btn-toggle-password"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  title={showConfirmPassword ? "Hide password" : "Show password"}
                  aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                >
                  {showConfirmPassword ? (
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                      <line x1="1" y1="1" x2="23" y2="23"></line>
                    </svg>
                  ) : (
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                      <circle cx="12" cy="12" r="3"></circle>
                    </svg>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Account Role Badge & Team Member Guidance */}
          <div className="field-group" style={{ marginBottom: "18px" }}>
            <label style={{ fontSize: "13px", fontWeight: "600", color: "var(--text-main)", display: "block", marginBottom: "8px" }}>
              Account Role
            </label>
            <div
              style={{
                padding: "12px 14px",
                borderRadius: "10px",
                background: "rgba(91, 93, 248, 0.06)",
                border: "1.5px solid rgba(91, 93, 248, 0.25)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "12px"
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span style={{ fontSize: "22px" }}>👑</span>
                <div>
                  <div style={{ fontWeight: "700", fontSize: "14px", color: "var(--primary)" }}>
                    Team Leader (Workspace Creator)
                  </div>
                  <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "2px" }}>
                    Can create projects, add team members, and delegate tasks.
                  </div>
                </div>
              </div>
              <span className="badge-role-tag badge-leader">Team Leader</span>
            </div>

            <div
              style={{
                marginTop: "10px",
                padding: "10px 14px",
                borderRadius: "8px",
                background: "var(--bg-sidebar)",
                border: "1px solid var(--border-light)",
                fontSize: "12px",
                color: "var(--text-muted)",
                lineHeight: "1.5"
              }}
            >
              ℹ️ <strong>Are you a Team Member?</strong> Team Members are created and invited directly by their Team Leader. Please ask your Team Leader to add you to their workspace, then{" "}
              <Link to="/login" style={{ color: "var(--primary)", fontWeight: "600" }}>
                Sign In here
              </Link>.
            </div>
          </div>

          <div className="field-group" style={{ marginBottom: "22px" }}>
            <label style={{ fontSize: "13px", fontWeight: "600", color: "var(--text-main)", display: "block", marginBottom: "6px" }}>
              Avatar Theme Color
            </label>
            <select
              className="field-select"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1.5px solid var(--border-light)", background: "var(--bg-card)", color: "var(--text-main)" }}
            >
              <option value="av-blue">Blue (Corporate)</option>
              <option value="av-green">Green (Engineering)</option>
              <option value="av-orange">Orange (Product)</option>
              <option value="av-purple">Purple (Design)</option>
              <option value="av-red">Red (Operations)</option>
              <option value="av-pink">Pink (Creative)</option>
            </select>
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: "100%", padding: "12px", fontSize: "15px", fontWeight: "600", borderRadius: "8px", justifyContent: "center" }}>
            ✦ Create Account
          </button>
        </form>

        <div style={{ marginTop: "24px", textAlign: "center", fontSize: "13.5px", color: "var(--text-muted)" }}>
          Already have an account?{" "}
          <Link to="/login" style={{ color: "var(--primary)", fontWeight: "600", textDecoration: "none" }}>
            Sign In
          </Link>
          <div style={{ marginTop: "8px" }}>
            <Link to="/" style={{ color: "var(--text-subtle)", fontSize: "12px", textDecoration: "none" }}>
              &larr; Back to Landing Page
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
