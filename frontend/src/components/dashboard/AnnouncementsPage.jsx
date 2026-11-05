import React from "react";
import { useAuth } from "../../context/AuthContext";
import { useTasks } from "../../context/TaskContext";
import DirectivesFeed from "./DirectivesFeed";

export default function AnnouncementsPage() {
  const { currentUser, isTeamLeader, teamUsers } = useAuth();
  const { directives } = useTasks();

  return (
    <div className="announcements-page-wrapper" style={{ padding: "4px 0 32px" }}>
      {/* ── TOP HERO BANNER ────────────────────────────────────────────── */}
      <div className="role-dashboard-banner" style={{ marginBottom: "20px" }}>
        <div
          className="role-banner-inner"
          style={{
            background: isTeamLeader
              ? "linear-gradient(135deg, rgba(91,93,248,0.09) 0%, rgba(147,51,234,0.05) 100%)"
              : "linear-gradient(135deg, rgba(16,185,129,0.08) 0%, rgba(91,93,248,0.04) 100%)",
            borderColor: isTeamLeader ? "rgba(91,93,248,0.3)" : "rgba(16,185,129,0.3)"
          }}
        >
          <div className="rb-left">
            <span
              className={`assignee-avatar ${currentUser?.color || (isTeamLeader ? "av-blue" : "av-green")}`}
              style={{ width: "44px", height: "44px", fontSize: "18px", boxShadow: "0 4px 12px rgba(79,70,229,0.2)" }}
            >
              📢
            </span>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                <h2 style={{ fontSize: "19px", fontWeight: "800", color: "var(--text-main)", margin: 0, letterSpacing: "-0.3px" }}>
                  Team Announcements, Directives &amp; Chat Hub
                </h2>
                <span className={`badge-role-tag ${isTeamLeader ? "badge-leader" : "badge-member"}`}>
                  {isTeamLeader ? "👑 Team Leader View" : "👤 Team Member View"}
                </span>
                <span style={{ fontSize: "11px", background: "rgba(91,93,248,0.1)", color: "var(--primary)", padding: "2px 8px", borderRadius: "999px", fontWeight: "700" }}>
                  {directives.length} Active Directives
                </span>
              </div>
              <p style={{ fontSize: "13px", color: "var(--text-muted)", margin: "4px 0 0 0" }}>
                {isTeamLeader
                  ? "Broadcast sprint directives to @All Members or individual teammates with live 'Seen by' read receipts and real-time status updates."
                  : "View announcements from Team Leader, submit deliverable progress responses, and keep teammates updated."}
              </p>
            </div>
          </div>

          <div className="rb-actions" style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
            <span style={{ fontSize: "12px", color: "var(--text-muted)", background: "var(--bg-card)", padding: "6px 12px", borderRadius: "8px", border: "1px solid var(--border-light)" }}>
              👥 {teamUsers.length} Workspace Teammates Connected
            </span>
          </div>
        </div>
      </div>

      {/* ── DEDICATED DIRECTIVES, BROADCASTS & CHAT FEED ─────────────────── */}
      <DirectivesFeed />
    </div>
  );
}
