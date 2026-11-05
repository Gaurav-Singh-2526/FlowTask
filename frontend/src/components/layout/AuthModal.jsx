import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";

export default function AuthModal({ isOpen, onClose, initialTab = "switch" }) {
  const { currentUser, teamUsers, switchUser, register, login } = useAuth();
  const [activeTab, setActiveTab] = useState(initialTab);

  // Register form state
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [regTitle, setRegTitle] = useState("");
  const [regRole, setRegRole] = useState("Team Member");
  const [regColor, setRegColor] = useState("av-blue");
  const [regErr, setRegErr] = useState("");

  // Login form state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [loginErr, setLoginErr] = useState("");

  if (!isOpen) return null;

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    if (!regName.trim() || !regEmail.trim()) {
      setRegErr("Name and email are required.");
      return;
    }
    if (!regPassword || regPassword.length < 6) {
      setRegErr("Password must be at least 6 characters long.");
      return;
    }
    setRegErr("");
    const res = await register({
      name: regName.trim(),
      email: regEmail.trim(),
      password: regPassword,
      role: regRole,
      title: regTitle.trim() || (regRole === "Team Leader" ? "Project Lead" : "Engineer"),
      color: regColor
    });
    if (res && res.error) {
      setRegErr(res.error);
      return;
    }
    onClose();
  };

  const handleLoginSubmit = (e) => {
    e.preventDefault();
    if (!loginEmail.trim()) {
      setLoginErr("Please enter your email.");
      return;
    }
    if (!loginPassword) {
      setLoginErr("Please enter your password.");
      return;
    }
    setLoginErr("");
    const res = login(loginEmail.trim(), loginPassword);
    if (res.success) {
      onClose();
    } else {
      setLoginErr(res.error || "Email or password incorrect.");
    }
  };

  return (
    <dialog className="auth-modal" open style={{ display: "block" }}>
      <div className="modal-header">
        <div>
          <h2 className="modal-title">Team Workspace &amp; Authentication</h2>
          <p className="card-subheading">Switch active user account or create new team members easily</p>
        </div>
        <button type="button" className="btn btn-icon-only modal-x" onClick={onClose}>✕</button>
      </div>

      {/* Tabs */}
      <div className="auth-tabs" role="tablist">
        <button
          className={`auth-tab-btn ${activeTab === "switch" ? "is-active" : ""}`}
          onClick={() => setActiveTab("switch")}
        >
          <span>👥 Switch Account</span>
        </button>
        <button
          className={`auth-tab-btn ${activeTab === "create" ? "is-active" : ""}`}
          onClick={() => setActiveTab("create")}
        >
          <span>➕ Create New User</span>
        </button>
        <button
          className={`auth-tab-btn ${activeTab === "login" ? "is-active" : ""}`}
          onClick={() => setActiveTab("login")}
        >
          <span>🔐 Login</span>
        </button>
      </div>

      {/* TAB 1: SWITCH ACCOUNT */}
      {activeTab === "switch" && (
        <div className="auth-tab-content">
          <div className="current-session-banner">
            <div className="csb-left">
              <span className={`user-avatar-main ${currentUser?.color || "av-blue"}`}>
                {currentUser?.initials || (currentUser?.name ? currentUser.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() : "US")}
              </span>
              <div>
                <div className="csb-name">{currentUser?.name || "Active User"}</div>
                <div className="csb-email">{currentUser?.email || ""}</div>
              </div>
            </div>
            <span className={`badge-role-tag ${currentUser?.role === "Team Leader" ? "badge-leader" : "badge-member"}`}>
              {currentUser?.role === "Team Leader" ? "👑 Team Leader" : "👤 Team Member"}
            </span>
          </div>

          <div className="team-roster-header" style={{ marginTop: "14px", marginBottom: "10px" }}>
            <h4>Workspace Team Roster ({teamUsers.length} members)</h4>
            <span className="team-roster-hint">Click any member to switch active session</span>
          </div>

          <div className="team-cards-grid">
            {teamUsers.map(u => {
              const isCurrent = currentUser?.id === u.id;
              const isLead = u.role === "Team Leader";
              return (
                <div
                  key={u.id}
                  className={`team-card-item ${isCurrent ? "is-current" : ""}`}
                  onClick={() => {
                    switchUser(u);
                    onClose();
                  }}
                  style={{ cursor: "pointer" }}
                >
                  <div className="tci-left">
                    <span className={`assignee-avatar ${u.color || "av-blue"}`}>{u.initials}</span>
                    <div className="tci-info">
                      <div className="tci-name">
                        {u.name}
                        <span className={`badge-role-tag ${isLead ? "badge-leader" : "badge-member"}`} style={{ fontSize: "10px", padding: "1px 6px", marginLeft: "6px" }}>
                          {isLead ? "👑 Leader" : "Member"}
                        </span>
                      </div>
                      <div className="tci-meta">{u.email} · {u.title || u.role}</div>
                    </div>
                  </div>
                  <div>
                    {isCurrent ? (
                      <span className="btn-switch-user is-active-btn">✓ Active Session</span>
                    ) : (
                      <button type="button" className="btn-switch-user">Switch to user</button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: CREATE NEW USER */}
      {activeTab === "create" && (
        <div className="auth-tab-content">
          <form onSubmit={handleRegisterSubmit}>
            <p className="auth-intro-text">Create a new user account to join and collaborate with this workspace team.</p>

            {regErr && <div style={{ color: "#ef4444", fontSize: "12px", marginBottom: "10px" }}>{regErr}</div>}

            <div className="field-row">
              <div className="field-group flex-2">
                <label>Full Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Rahul Sharma"
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  required
                />
              </div>
              <div className="field-group flex-1">
                <label>Job Title</label>
                <input
                  type="text"
                  placeholder="e.g. Frontend Dev"
                  value={regTitle}
                  onChange={(e) => setRegTitle(e.target.value)}
                />
              </div>
            </div>

            <div className="field-group">
              <label>Email Address *</label>
              <input
                type="email"
                placeholder="e.g. rahul@flowtask.com"
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
                required
              />
            </div>

            <div className="field-group">
              <label>Account Password *</label>
              <div className="password-input-wrap">
                <input
                  type={showRegPassword ? "text" : "password"}
                  placeholder="Min 6 characters"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="btn-toggle-password"
                  onClick={() => setShowRegPassword(!showRegPassword)}
                  title={showRegPassword ? "Hide password" : "Show password"}
                  aria-label={showRegPassword ? "Hide password" : "Show password"}
                >
                  {showRegPassword ? (
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
              <label>Team Role *</label>
              <div className="role-selector-cards">
                <label
                  className={`role-choice-card ${regRole === "Team Member" ? "is-selected" : ""}`}
                  onClick={() => setRegRole("Team Member")}
                >
                  <input type="radio" name="auth-role" value="Team Member" checked={regRole === "Team Member"} readOnly />
                  <div className="role-choice-body">
                    <div className="role-choice-title">👤 Team Member</div>
                    <div className="role-choice-desc">Works on assigned tasks, updates task progress (To Do, In Progress, Done).</div>
                  </div>
                </label>
                <label
                  className={`role-choice-card ${regRole === "Team Leader" ? "is-selected" : ""}`}
                  onClick={() => setRegRole("Team Leader")}
                >
                  <input type="radio" name="auth-role" value="Team Leader" checked={regRole === "Team Leader"} readOnly />
                  <div className="role-choice-body">
                    <div className="role-choice-title">👑 Team Leader</div>
                    <div className="role-choice-desc">Assign work to any member, manage sprints, and broadcast team directives.</div>
                  </div>
                </label>
              </div>
            </div>

            <div className="field-group">
              <label>Avatar Theme Color</label>
              <select className="field-select" value={regColor} onChange={(e) => setRegColor(e.target.value)}>
                <option value="av-blue">Blue</option>
                <option value="av-green">Green</option>
                <option value="av-orange">Orange</option>
                <option value="av-purple">Purple</option>
                <option value="av-red">Red</option>
                <option value="av-pink">Pink</option>
              </select>
            </div>

            <div className="modal-actions">
              <button type="submit" className="btn btn-primary">✦ Create &amp; Join Team</button>
              <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 3: LOGIN */}
      {activeTab === "login" && (
        <div className="auth-tab-content">
          <form onSubmit={handleLoginSubmit}>
            <p className="auth-intro-text">Sign in to your team account using your registered workspace email.</p>

            {loginErr && <div style={{ color: "#ef4444", fontSize: "12px", marginBottom: "10px" }}>{loginErr}</div>}

            <div className="field-group">
              <label>Workspace Email</label>
              <input
                type="email"
                placeholder="name@company.com"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                required
              />
            </div>

            <div className="field-group">
              <label>Password</label>
              <div className="password-input-wrap">
                <input
                  type={showLoginPassword ? "text" : "password"}
                  placeholder="Enter password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="btn-toggle-password"
                  onClick={() => setShowLoginPassword(!showLoginPassword)}
                  title={showLoginPassword ? "Hide password" : "Show password"}
                  aria-label={showLoginPassword ? "Hide password" : "Show password"}
                >
                  {showLoginPassword ? (
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

            <div className="modal-actions" style={{ marginTop: "18px" }}>
              <button type="submit" className="btn btn-primary">Sign In</button>
              <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            </div>
          </form>
        </div>
      )}
    </dialog>
  );
}
