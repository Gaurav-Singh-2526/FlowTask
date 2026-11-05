import React, { useState, useRef, useEffect } from "react";

export default function ProjectMultiSelect({
  projects = [],
  selectedProjectIds = [],
  onChange,
  onOpenCreateProject = null
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const containerRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleToggle = (projectId) => {
    const id = Number(projectId);
    let updated;
    if (selectedProjectIds.includes(id)) {
      updated = selectedProjectIds.filter(x => x !== id);
    } else {
      // Prevent duplicates using Set
      updated = Array.from(new Set([...selectedProjectIds, id]));
    }
    onChange(updated);
  };

  const handleRemove = (e, projectId) => {
    e.stopPropagation();
    const id = Number(projectId);
    onChange(selectedProjectIds.filter(x => x !== id));
  };

  const handleSelectAll = (e) => {
    e.preventDefault();
    const allIds = projects.map(p => p.id);
    onChange(Array.from(new Set(allIds)));
  };

  const handleClearAll = (e) => {
    e.preventDefault();
    onChange([]);
  };

  const filteredProjects = projects.filter(p =>
    (p.title || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedProjects = projects.filter(p => selectedProjectIds.includes(p.id));

  if (!projects || projects.length === 0) {
    return (
      <div
        style={{
          background: "rgba(245, 158, 11, 0.08)",
          border: "1.5px dashed #f59e0b",
          borderRadius: "10px",
          padding: "14px 16px",
          color: "#b45309",
          fontSize: "13px"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: "700", marginBottom: "4px" }}>
          <span>⚠️</span>
          <span>No Projects in Workspace</span>
        </div>
        <p style={{ margin: "0 0 10px 0", fontSize: "12.5px", color: "#92400e" }}>
          You must create at least one project first before assigning team members to projects.
        </p>
        {onOpenCreateProject && (
          <button
            type="button"
            className="btn btn-primary btn-xs"
            onClick={onOpenCreateProject}
            style={{ fontWeight: "700" }}
          >
            + Create a Project First
          </button>
        )}
      </div>
    );
  }

  return (
    <div ref={containerRef} style={{ position: "relative", width: "100%" }}>
      {/* Selected Project Tags Preview */}
      {selectedProjects.length > 0 && (
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "6px",
            marginBottom: "8px"
          }}
        >
          {selectedProjects.map(proj => (
            <span
              key={proj.id}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                background: "rgba(91, 93, 248, 0.12)",
                border: "1px solid rgba(91, 93, 248, 0.3)",
                color: "var(--primary, #5b5df8)",
                padding: "3px 9px",
                borderRadius: "999px",
                fontSize: "12px",
                fontWeight: "600"
              }}
            >
              <span>📁 {proj.title}</span>
              <button
                type="button"
                onClick={(e) => handleRemove(e, proj.id)}
                title="Remove project"
                style={{
                  background: "transparent",
                  border: "none",
                  color: "var(--primary, #5b5df8)",
                  cursor: "pointer",
                  fontSize: "12px",
                  padding: "0 2px",
                  fontWeight: "800",
                  lineHeight: 1
                }}
              >
                ✕
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Trigger Button / Input */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: "100%",
          padding: "9px 12px",
          borderRadius: "8px",
          border: isOpen ? "1.5px solid var(--primary, #5b5df8)" : "1.5px solid var(--border-light, #e2e8f0)",
          background: "var(--bg-card, #ffffff)",
          color: "var(--text-main, #0f172a)",
          fontSize: "13px",
          fontWeight: "500",
          cursor: "pointer",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          boxShadow: isOpen ? "0 0 0 3px rgba(91, 93, 248, 0.15)" : "none",
          transition: "all 0.15s ease"
        }}
      >
        <span style={{ color: selectedProjectIds.length === 0 ? "var(--text-muted, #94a3b8)" : "var(--text-main, #0f172a)" }}>
          {selectedProjectIds.length === 0
            ? "Select one or more projects..."
            : `${selectedProjectIds.length} project${selectedProjectIds.length > 1 ? "s" : ""} selected`}
        </span>
        <span style={{ fontSize: "11px", color: "var(--text-muted, #94a3b8)", transform: isOpen ? "rotate(180deg)" : "none", transition: "transform 0.15s ease" }}>
          ▼
        </span>
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            left: 0,
            right: 0,
            zIndex: 1050,
            background: "var(--bg-card, #ffffff)",
            border: "1.5px solid var(--border-light, #cbd5e1)",
            borderRadius: "10px",
            boxShadow: "0 10px 25px rgba(0,0,0,0.12)",
            padding: "10px",
            maxHeight: "260px",
            display: "flex",
            flexDirection: "column"
          }}
        >
          {/* Search box & actions */}
          <div style={{ display: "flex", gap: "8px", marginBottom: "8px", alignItems: "center" }}>
            <input
              type="text"
              placeholder="Search projects..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              style={{
                flex: 1,
                padding: "6px 10px",
                borderRadius: "6px",
                border: "1px solid var(--border-light, #cbd5e1)",
                fontSize: "12px",
                background: "var(--bg-sidebar, #f8fafc)",
                color: "var(--text-main, #0f172a)",
                outline: "none"
              }}
            />
            <button
              type="button"
              onClick={handleSelectAll}
              style={{
                fontSize: "11px",
                background: "transparent",
                border: "none",
                color: "var(--primary, #5b5df8)",
                cursor: "pointer",
                fontWeight: "700",
                padding: "2px 4px"
              }}
            >
              All
            </button>
            <span style={{ color: "var(--border-light, #cbd5e1)" }}>|</span>
            <button
              type="button"
              onClick={handleClearAll}
              style={{
                fontSize: "11px",
                background: "transparent",
                border: "none",
                color: "var(--text-muted, #64748b)",
                cursor: "pointer",
                fontWeight: "600",
                padding: "2px 4px"
              }}
            >
              Clear
            </button>
          </div>

          {/* Project List with Checkboxes */}
          <div style={{ overflowY: "auto", flex: 1, display: "flex", flexDirection: "column", gap: "2px" }}>
            {filteredProjects.length === 0 ? (
              <div style={{ padding: "12px", textAlign: "center", color: "var(--text-muted, #94a3b8)", fontSize: "12.5px" }}>
                No matching projects found
              </div>
            ) : (
              filteredProjects.map(proj => {
                const isChecked = selectedProjectIds.includes(proj.id);
                return (
                  <label
                    key={proj.id}
                    onClick={(e) => e.stopPropagation()}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      padding: "8px 10px",
                      borderRadius: "6px",
                      cursor: "pointer",
                      fontSize: "13px",
                      fontWeight: isChecked ? "600" : "400",
                      background: isChecked ? "rgba(91, 93, 248, 0.08)" : "transparent",
                      color: isChecked ? "var(--primary, #5b5df8)" : "var(--text-main, #0f172a)",
                      transition: "background 0.1s ease"
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => handleToggle(proj.id)}
                      style={{
                        width: "16px",
                        height: "16px",
                        accentColor: "var(--primary, #5b5df8)",
                        cursor: "pointer"
                      }}
                    />
                    <div style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      <span>📁 {proj.title}</span>
                      {proj.status && (
                        <span
                          style={{
                            marginLeft: "8px",
                            fontSize: "10.5px",
                            padding: "1px 6px",
                            borderRadius: "4px",
                            background: "rgba(0,0,0,0.06)",
                            color: "var(--text-muted, #64748b)"
                          }}
                        >
                          {proj.status}
                        </span>
                      )}
                    </div>
                  </label>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
