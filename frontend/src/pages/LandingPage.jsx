import React, { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function LandingPage() {
  const { login, isAuthenticated, currentUser, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/dashboard", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  return (
    <div className="landing-page-view">
      {/* ── STICKY LANDING NAVBAR ───────────────────────────────────────── */}
      <header className="landing-navbar">
        <div className="landing-nav-container">
          <div className="landing-brand">
            <div className="brand-logo-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
              </svg>
            </div>
            <span className="landing-brand-title">FlowTask</span>
          </div>

          <nav className="landing-nav-links">
            <a href="#lp-features" className="lp-link">Features</a>
            <a href="#lp-team-roles" className="lp-link">Team Leader Roles</a>
            <a href="#lp-workload" className="lp-link">Workload Tracking</a>
          </nav>

          <div className="landing-nav-actions">
            {isAuthenticated ? (
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span style={{ fontSize: "12.5px", color: "var(--text-main)", fontWeight: "600" }}>
                  👤 {currentUser?.name} ({currentUser?.role})
                </span>
                <Link to="/dashboard" className="btn btn-primary-pill lp-nav-btn">
                  Enter Dashboard &rarr;
                </Link>
                <button
                  type="button"
                  className="btn btn-outline-pill lp-nav-btn"
                  onClick={() => {
                    logout();
                    navigate("/");
                  }}
                  style={{ color: "#ef4444" }}
                >
                  Log Out
                </button>
              </div>
            ) : (
              <>
                <Link to="/login" className="btn btn-outline-pill lp-nav-btn">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path>
                    <polyline points="10 17 15 12 10 7"></polyline>
                    <line x1="15" y1="12" x2="3" y2="12"></line>
                  </svg>
                  <span>Log In</span>
                </Link>
                <Link to="/register" className="btn btn-primary-pill lp-nav-btn">
                  <span>+ Create User</span>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ── HERO SECTION ────────────────────────────────────────────────── */}
      <section className="landing-hero" id="lp-hero">
        <div className="landing-hero-content">
          <div className="hero-badge">
            <span className="badge-dot"></span>
            <span>&starf; Next-Generation Team Workflow &amp; Task Delegation</span>
          </div>

          <h1 className="hero-headline">
            Master Your Team's Workflow With <span className="text-gradient">Smart Delegation</span> &amp; Live Tracking
          </h1>

          <p className="hero-subheadline">
            Empower <strong>Team Leaders</strong> to assign work in 1 click, balance individual workloads in real time, and accelerate project delivery with multi-view tracking and O(log n) algorithmic task search.
          </p>

          <div className="hero-cta-group">
            <Link to="/register" className="btn btn-hero-primary" style={{ textDecoration: "none" }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
              <span>Create User / Register</span>
            </Link>

            <Link to="/login" className="btn btn-hero-secondary" style={{ textDecoration: "none" }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path>
                <polyline points="10 17 15 12 10 7"></polyline>
                <line x1="15" y1="12" x2="3" y2="12"></line>
              </svg>
              <span>Sign In to Account</span>
            </Link>
          </div>

          {/* Showcase Preview Frame */}
          <div className="hero-preview-frame">
            <div className="preview-frame-header">
              <div className="pf-dots">
                <span className="pf-dot dot-red"></span>
                <span className="pf-dot dot-yellow"></span>
                <span className="pf-dot dot-green"></span>
              </div>
              <div className="pf-title-bar">flowtask.app/workspace/dashboard</div>
              <div className="pf-status-badge">&bull; Live Production Preview</div>
            </div>

            <div className="preview-frame-body">
              <div className="mini-metrics-row">
                <div className="mini-stat-card">
                  <span className="msc-label">Total Tasks</span>
                  <span className="msc-val">54</span>
                  <span className="msc-sub trend-green">+8 this week</span>
                </div>
                <div className="mini-stat-card">
                  <span className="msc-label">Completed</span>
                  <span className="msc-val" style={{ color: "#10b981" }}>31</span>
                  <span className="msc-sub trend-green">+12%</span>
                </div>
                <div className="mini-stat-card">
                  <span className="msc-label">In Progress</span>
                  <span className="msc-val" style={{ color: "#5b5df8" }}>12</span>
                  <span className="msc-sub trend-orange">+3 new</span>
                </div>
                <div className="mini-stat-card">
                  <span className="msc-label">Overdue</span>
                  <span className="msc-val" style={{ color: "#ef4444" }}>5</span>
                  <span className="msc-sub trend-red">-2 resolved</span>
                </div>
              </div>

              <div className="preview-cta-strip">
                <span>Sprint 14 is active with 6/8 tasks completed</span>
                <Link to={isAuthenticated ? "/dashboard" : "/login"} className="btn-preview-jump" style={{ textDecoration: "none" }}>
                  Get Started &rarr;
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CORE CAPABILITIES ───────────────────────────────────────────── */}
      <section className="landing-section" id="lp-features">
        <div className="landing-container">
          <div className="section-badge-center">Core Capabilities</div>
          <h2 className="section-title-center">Built for Speed, Delegation &amp; Team Visibility</h2>
          <p className="section-desc-center">Everything your squad needs to coordinate sprints and balance workloads.</p>

          <div className="features-grid">
            <div className="feature-box">
              <div className="fb-icon-box" style={{ background: "rgba(91,93,248,0.1)", color: "#5b5df8" }}>👑</div>
              <h3 className="fb-title">Team Leader Delegation</h3>
              <p className="fb-text">Assign tasks to any member with 1-click reassignment from table or modal.</p>
            </div>
            <div className="feature-box">
              <div className="fb-icon-box" style={{ background: "rgba(16,185,129,0.1)", color: "#10b981" }}>👥</div>
              <h3 className="fb-title">Multi-User Collaboration</h3>
              <p className="fb-text">Create accounts instantly and switch sessions with custom role permissions.</p>
            </div>
            <div className="feature-box">
              <div className="fb-icon-box" style={{ background: "rgba(245,158,11,0.1)", color: "#f59e0b" }}>📊</div>
              <h3 className="fb-title">Live Workload Meters</h3>
              <p className="fb-text">Monitor active member capacity ratios in real time to prevent bottlenecks.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── TEAM ROLES SHOWCASE ─────────────────────────────────────────── */}
      <section className="landing-section bg-subtle" id="lp-team-roles">
        <div className="landing-container">
          <div className="section-badge-center">Team Roles</div>
          <h2 className="section-title-center">Designed for Collaborative Hierarchy</h2>
          <div className="roles-showcase-grid" style={{ marginTop: "32px" }}>
            <div className="role-showcase-card role-card-leader">
              <span className="badge-role-tag badge-leader" style={{ width: "fit-content" }}>👑 Team Leader</span>
              <h3>Project Lead &amp; Work Delegator</h3>
              <p className="rsc-desc">Oversee sprints, assign tasks, broadcast team directives, and balance member capacity.</p>
              <Link
                to="/register"
                className="btn btn-primary btn-block"
                style={{ textDecoration: "none" }}
              >
                + Create Leader Account &rarr;
              </Link>
            </div>

            <div className="role-showcase-card role-card-member">
              <span className="badge-role-tag badge-member" style={{ width: "fit-content" }}>👤 Team Member</span>
              <h3>Task Execution &amp; Sprint Contributor</h3>
              <p className="rsc-desc">Team Members are created and invited exclusively by their Team Leader. Sign in to access your assigned projects and tasks.</p>
              <Link
                to="/login"
                className="btn btn-secondary btn-block"
                style={{ textDecoration: "none" }}
              >
                Sign In as Team Member &rarr;
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ──────────────────────────────────────────────────── */}
      <section className="landing-cta-banner">
        <div className="landing-cta-content">
          <h2 className="cta-banner-title">Ready to streamline your team's workflow?</h2>
          <p className="cta-banner-sub">Create your account in seconds or sign in to collaborate with your team.</p>
          <div className="cta-banner-buttons">
            <Link to="/register" className="btn btn-hero-primary" style={{ textDecoration: "none" }}>+ Create New User</Link>
            <Link to="/login" className="btn btn-hero-secondary" style={{ textDecoration: "none" }}>Sign In to Account</Link>
          </div>
        </div>
      </section>

      {/* ── FOOTER ──────────────────────────────────────────────────────── */}
      <footer className="landing-footer">
        <div className="landing-container footer-container">
          <div className="footer-brand">
            <span className="landing-brand-title">FlowTask</span>
            <span className="footer-copy">&copy; 2026 FlowTask Inc. Production-Ready Work Management.</span>
          </div>
          <div className="footer-actions">
            <Link to="/login" className="btn-link">Sign In</Link>
            <Link to="/register" className="btn-link">Create Account</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
