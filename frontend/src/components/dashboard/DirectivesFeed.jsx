import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useTasks } from "../../context/TaskContext";

export default function DirectivesFeed() {
  const { currentUser, isTeamLeader, teamUsers } = useAuth();
  const { directives, postTeamMessage, sendResponse, tasks } = useTasks();

  // Post message form state
  const [msgText, setMsgText] = useState("");
  const [msgTarget, setMsgTarget] = useState("All Members");

  // Inline reply inputs for individual directive threads: { [directiveId]: text }
  const [threadReplies, setThreadReplies] = useState({});

  // Member quick reply composer state
  const [activeReplyDirId, setActiveReplyDirId] = useState(directives[0]?.id || null);
  const [replyText, setReplyText] = useState("");
  const [replyTaskId, setReplyTaskId] = useState("");
  const [toastMsg, setToastMsg] = useState("");

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 3500);
  };

  const handlePostMessage = (e) => {
    e.preventDefault();
    if (!msgText.trim()) return;
    postTeamMessage(msgText.trim(), msgTarget);
    setMsgText("");
    showToast(`✓ Message posted and broadcast to ${msgTarget}! All team members can see this and tracking views.`);
  };

  const handleMemberQuickReply = (e, directiveId) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    const targetDirId = directiveId || activeReplyDirId || directives[0]?.id;
    if (!targetDirId) return;
    const relatedTask = tasks.find(t => String(t.id) === String(replyTaskId));
    sendResponse(targetDirId, replyText.trim(), relatedTask ? relatedTask.title : null);
    setReplyText("");
    setReplyTaskId("");
    showToast("✓ Progress update posted to thread! Team and Leader can view.");
  };

  const handleThreadDirectReply = (e, directiveId) => {
    e.preventDefault();
    const text = (threadReplies[directiveId] || "").trim();
    if (!text) return;
    sendResponse(directiveId, text);
    setThreadReplies(prev => ({ ...prev, [directiveId]: "" }));
    showToast("✓ Reply added to thread!");
  };

  const handleQuickPillClick = (pillText) => {
    setReplyText(prev => (prev ? `${prev} - ${pillText}` : pillText));
  };

  // Filter tasks assigned to current member for task selector
  const myAssignedTasks = tasks.filter(t => t.assignee === currentUser?.initials);

  return (
    <div className="dashboard-panel directives-panel" style={{ marginBottom: "20px" }}>
      <div className="panel-card-header" style={{ marginBottom: "14px" }}>
        <div>
          <h2 className="card-heading" style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", margin: 0 }}>
            <span>📢 Team Announcements, Directives &amp; Chat</span>
            <span className="badge-role-tag badge-leader" style={{ fontSize: "11px", padding: "2px 8px" }}>
              {directives.length} Active Messages
            </span>
          </h2>
          <p className="card-subheading" style={{ margin: "3px 0 0 0" }}>
            All messages from Team Leader and Members are visible to everyone with live <strong>"Seen by"</strong> read receipts.
          </p>
        </div>
      </div>

      {toastMsg && (
        <div style={{ background: "rgba(16,185,129,0.12)", border: "1.5px solid #10b981", color: "#059669", padding: "10px 16px", borderRadius: "8px", fontSize: "13px", fontWeight: "700", marginBottom: "16px" }}>
          {toastMsg}
        </div>
      )}

      {/* ── UNIVERSAL MESSAGE COMPOSER (Leader & Member both can post) ────── */}
      <form onSubmit={handlePostMessage} className="directive-composer-box" style={{ background: "var(--bg-sidebar)", border: "1.5px solid var(--border-light)", borderRadius: "12px", padding: "16px", marginBottom: "18px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px", flexWrap: "wrap", gap: "6px" }}>
          <span style={{ fontSize: "13.5px", fontWeight: "700", color: "var(--text-main)", display: "flex", alignItems: "center", gap: "6px" }}>
            {isTeamLeader ? <span>👑 Broadcast Directive / Announcement to Team:</span> : <span>💬 Post Message / Update to Team:</span>}
          </span>
          <span style={{ fontSize: "11.5px", color: "var(--text-muted)" }}>
            Posting as <strong>{currentUser?.name || "User"}</strong> ({isTeamLeader ? "Team Leader" : "Team Member"})
          </span>
        </div>

        <textarea
          className="directive-textarea"
          placeholder={isTeamLeader
            ? "e.g. Sprint 14 Directive: Team, please complete all high priority tasks and check staging before Friday 4 PM release."
            : "e.g. Status Update: Finished mobile responsiveness testing on Android and iOS. Found no layout blockers."}
          value={msgText}
          onChange={(e) => setMsgText(e.target.value)}
          rows={2}
          required
          style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1.5px solid var(--border-light)", background: "var(--bg-card)", color: "var(--text-main)", fontSize: "13.5px", resize: "vertical" }}
        />

        <div className="directive-composer-footer" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "12px", flexWrap: "wrap", gap: "10px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <label style={{ fontSize: "12.5px", color: "var(--text-muted)", fontWeight: "600" }}>Recipient:</label>
            <select
              className="field-select"
              style={{ width: "auto", padding: "6px 12px", fontSize: "12.5px", borderRadius: "6px", background: "var(--bg-card)", color: "var(--text-main)", border: "1px solid var(--border-light)" }}
              value={msgTarget}
              onChange={(e) => setMsgTarget(e.target.value)}
            >
              <option value="All Members">👥 All Team Members (Broadcast to Everyone)</option>
              {teamUsers.filter(u => u.name !== currentUser?.name).map(u => (
                <option key={u.id} value={u.name}>👤 @{u.name} ({u.role})</option>
              ))}
            </select>
          </div>

          <button type="submit" className="btn btn-primary" style={{ padding: "8px 20px", fontWeight: "700", fontSize: "13px" }}>
            {isTeamLeader ? "📢 Broadcast Directive" : "🚀 Post to Team"}
          </button>
        </div>
      </form>

      {/* ── FOR TEAM MEMBER: QUICK REPLY / STATUS UPDATE BOX ─────────────── */}
      {!isTeamLeader && (
        <div className="member-reply-composer-box" style={{ background: "var(--bg-card)", border: "1.5px dashed var(--border-active)", borderRadius: "12px", padding: "14px", marginBottom: "18px" }}>
          <div style={{ fontSize: "13px", fontWeight: "700", color: "var(--text-main)", marginBottom: "8px", display: "flex", alignItems: "center", gap: "6px" }}>
            <span>⚡ Quick Deliverable Update to Leader &amp; Team:</span>
          </div>

          <div className="quick-response-pills" style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "10px" }}>
            <span style={{ fontSize: "12px", color: "var(--text-muted)", alignSelf: "center" }}>Quick tags:</span>
            {["🚀 Working on it", "✅ Ready for Review", "⚠️ Need Help / Blocked", "🎉 Deliverable Completed"].map(pill => (
              <button
                key={pill}
                type="button"
                className="btn btn-outline-pill btn-xs"
                onClick={() => handleQuickPillClick(pill)}
              >
                {pill}
              </button>
            ))}
          </div>

          <form onSubmit={(e) => handleMemberQuickReply(e, activeReplyDirId || directives[0]?.id)}>
            <div style={{ display: "flex", gap: "10px", marginBottom: "8px", flexWrap: "wrap" }}>
              <select
                className="field-select"
                style={{ flex: 1, minWidth: "180px", padding: "6px 10px", fontSize: "12px" }}
                value={activeReplyDirId || (directives[0]?.id || "")}
                onChange={(e) => setActiveReplyDirId(Number(e.target.value))}
              >
                {directives.map(d => (
                  <option key={d.id} value={d.id}>Thread: "{d.message.slice(0, 45)}..."</option>
                ))}
              </select>

              {myAssignedTasks.length > 0 && (
                <select
                  className="field-select"
                  style={{ flex: 1, minWidth: "180px", padding: "6px 10px", fontSize: "12px" }}
                  value={replyTaskId}
                  onChange={(e) => setReplyTaskId(e.target.value)}
                >
                  <option value="">(Optional) Tag my assigned task</option>
                  {myAssignedTasks.map(t => (
                    <option key={t.id} value={t.id}>Task: {t.title} ({t.priority})</option>
                  ))}
                </select>
              )}
            </div>

            <textarea
              className="directive-textarea"
              placeholder="Write your progress response to Team Leader & team..."
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              rows={2}
              required
              style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid var(--border-light)", background: "var(--bg-sidebar)", color: "var(--text-main)", fontSize: "13px", resize: "vertical" }}
            />

            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "8px" }}>
              <button type="submit" className="btn btn-primary btn-sm">
                💬 Submit Response to Thread
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── DIRECTIVES & RESPONSES THREAD WITH "SEEN BY" TRACKING ───────── */}
      <div className="directives-list" style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
        {directives.length === 0 ? (
          <div style={{ textAlign: "center", padding: "24px", color: "var(--text-muted)", fontSize: "13px" }}>
            No messages posted yet. Use the composer above to broadcast an announcement!
          </div>
        ) : (
          directives.map(dir => {
            const seenUsers = dir.seenBy || [dir.from];
            const isCurrentUserAuthor = currentUser?.name === dir.from;

            return (
              <div key={dir.id} className="directive-item-card" style={{ background: "var(--bg-sidebar)", border: "1px solid var(--border-light)", borderRadius: "12px", padding: "16px" }}>
                <div className="directive-head" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px", flexWrap: "wrap", gap: "8px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                    <span className={`assignee-avatar ${dir.fromColor || "av-blue"}`} style={{ width: "28px", height: "28px", fontSize: "11px" }}>
                      {dir.fromInitials || "AM"}
                    </span>
                    <span style={{ fontWeight: "700", fontSize: "13.5px", color: "var(--text-main)" }}>{dir.from}</span>
                    <span className={`badge-role-tag ${dir.fromRole === "Team Leader" ? "badge-leader" : "badge-member"}`} style={{ fontSize: "10px", padding: "1px 6px" }}>
                      {dir.fromRole === "Team Leader" ? "👑 Leader" : "👤 Member"}
                    </span>
                    <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>&rarr; To: <strong>{dir.to}</strong></span>
                  </div>
                  <span style={{ fontSize: "11.5px", color: "var(--text-subtle)" }}>{dir.timestamp}</span>
                </div>

                <p className="directive-body-text" style={{ fontSize: "13.5px", color: "var(--text-body)", lineHeight: "1.5", margin: "6px 0 10px 0" }}>
                  {dir.message}
                </p>

                {/* ── LIVE "SEEN BY" INDICATOR ───────────────────────────────── */}
                <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "var(--text-muted)", padding: "5px 10px", background: "rgba(91,93,248,0.06)", borderRadius: "6px", width: "fit-content", marginBottom: "12px", flexWrap: "wrap" }}>
                  <span>👁️</span>
                  <span style={{ fontWeight: "700", color: "var(--text-main)" }}>Seen by ({seenUsers.length}):</span>
                  <span>{seenUsers.join(", ")}</span>
                </div>

                {/* Responses List */}
                {dir.responses && dir.responses.length > 0 && (
                  <div className="directive-responses-box" style={{ background: "var(--bg-card)", border: "1px solid var(--border-subtle)", borderRadius: "8px", padding: "10px 14px", marginBottom: "10px" }}>
                    <div style={{ fontSize: "12px", fontWeight: "700", color: "var(--text-muted)", marginBottom: "8px" }}>
                      💬 Thread Replies ({dir.responses.length}):
                    </div>
                    {dir.responses.map(resp => (
                      <div key={resp.id} className="member-response-item" style={{ borderBottom: "1px solid var(--border-subtle)", padding: "8px 0" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "3px", flexWrap: "wrap" }}>
                          <span className={`assignee-avatar ${resp.memberColor || "av-green"}`} style={{ width: "22px", height: "22px", fontSize: "10px" }}>
                            {resp.memberInitials}
                          </span>
                          <span style={{ fontWeight: "700", fontSize: "12.5px", color: "var(--text-main)" }}>{resp.memberName}</span>
                          <span className="badge-role-tag badge-member" style={{ fontSize: "9px", padding: "1px 5px" }}>
                            {resp.memberRole === "Team Leader" || isTeamLeader ? "👑 Leader" : "👤 Member"}
                          </span>
                          <span style={{ fontSize: "10.5px", color: "var(--text-subtle)", marginLeft: "auto" }}>{resp.timestamp}</span>
                        </div>
                        <div style={{ fontSize: "13px", color: "var(--text-body)", paddingLeft: "30px" }}>
                          {resp.text}
                        </div>
                        {resp.seenBy && (
                          <div style={{ paddingLeft: "30px", fontSize: "11px", color: "var(--text-subtle)", marginTop: "3px" }}>
                            👁️ Seen by: {resp.seenBy.join(", ")}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Inline Quick Reply to this thread (Leader and Member both can reply) */}
                <form
                  onSubmit={(e) => handleThreadDirectReply(e, dir.id)}
                  style={{ display: "flex", gap: "8px", marginTop: "8px" }}
                >
                  <input
                    type="text"
                    placeholder={`Reply to @${dir.from}'s thread...`}
                    value={threadReplies[dir.id] || ""}
                    onChange={(e) => setThreadReplies({ ...threadReplies, [dir.id]: e.target.value })}
                    style={{ flex: 1, padding: "7px 12px", borderRadius: "8px", border: "1px solid var(--border-light)", fontSize: "12.5px", background: "var(--bg-card)", color: "var(--text-main)" }}
                  />
                  <button type="submit" className="btn btn-outline-pill btn-xs" style={{ fontWeight: "700" }}>
                    💬 Reply
                  </button>
                </form>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
