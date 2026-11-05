import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      setError("Please enter your email.");
      return;
    }
    if (!password) {
      setError("Please enter your password.");
      return;
    }
    setError("");
    const res = await login(email.trim(), password);
    if (res.success) {
      navigate("/dashboard");
    } else {
      setError(res.error || "Email or password incorrect.");
    }
  };

  return (
    <div className="auth-page-container">
      <div className="auth-card-box" style={{ maxWidth: "440px" }}>
        <div style={{ textAlign: "center", marginBottom: "24px" }}>
          <div className="brand-logo-icon" style={{ margin: "0 auto 12px" }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
            </svg>
          </div>
          <h2 style={{ fontSize: "24px", fontWeight: "800", color: "var(--text-main)", letterSpacing: "-0.5px" }}>
            Sign In to FlowTask
          </h2>
          <p style={{ fontSize: "14px", color: "var(--text-muted)", marginTop: "4px" }}>
            Access your team workspace and active sprint deliverables
          </p>
        </div>

        {error && (
          <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid #ef4444", color: "#ef4444", padding: "10px", borderRadius: "8px", fontSize: "13px", marginBottom: "16px" }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="field-group" style={{ marginBottom: "14px" }}>
            <label style={{ fontSize: "13px", fontWeight: "600", color: "var(--text-main)", display: "block", marginBottom: "6px" }}>
              Workspace Email
            </label>
            <input
              type="email"
              placeholder="name@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1.5px solid var(--border-light)", background: "var(--bg-card)", color: "var(--text-main)", fontSize: "14px" }}
            />
          </div>

          <div className="field-group" style={{ marginBottom: "20px" }}>
            <label style={{ fontSize: "13px", fontWeight: "600", color: "var(--text-main)", display: "block", marginBottom: "6px" }}>
              Password
            </label>
            <div className="password-input-wrap">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1.5px solid var(--border-light)", background: "var(--bg-card)", color: "var(--text-main)", fontSize: "14px" }}
              />
              <button
                type="button"
                className="btn-toggle-password"
                onClick={() => setShowPassword(!showPassword)}
                title={showPassword ? "Hide password" : "Show password"}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                    <line x1="1" y1="1" x2="23" y2="23"></line>
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                  </svg>
                )}
              </button>
            </div>
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: "100%", padding: "12px", fontSize: "15px", fontWeight: "600", borderRadius: "8px", justifyContent: "center" }}>
            Sign In to Workspace &rarr;
          </button>
        </form>

        <div style={{ marginTop: "24px", textAlign: "center", fontSize: "13.5px", color: "var(--text-muted)" }}>
          Don't have an account?{" "}
          <Link to="/register" style={{ color: "var(--primary)", fontWeight: "600", textDecoration: "none" }}>
            Create User Account
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
