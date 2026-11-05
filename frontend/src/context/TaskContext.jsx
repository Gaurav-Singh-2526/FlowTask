import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from "react";
import { api } from "../services/api";
import { useAuth } from "./AuthContext";

const TaskContext = createContext();

export function TaskProvider({ children }) {
  const { currentUser, isTeamLeader, teamUsers } = useAuth();
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [activeMemberFilter, setActiveMemberFilter] = useState(null);
  const [inspectedMember, setInspectedMember] = useState(null);
  const [directives, setDirectives] = useState([]);
  const [editModalTask, setEditModalTask] = useState(null);
  const [theme, setTheme] = useState(() => localStorage.getItem("flowtask_theme_v2") || "light");
  const [taskStatusFilter, setTaskStatusFilter] = useState("all");
  const [taskSearchQuery, setTaskSearchQuery] = useState("");
  const [dbStats, setDbStats] = useState(null);
  const [isLoadingWorkspace, setIsLoadingWorkspace] = useState(false);

  // Compute the current workspace Leader ID:
  // For a Team Leader: their own user id
  // For a Team Member: their assigned leader_id
  const leaderId = useMemo(() => {
    if (!currentUser) return null;
    return currentUser.role === "Team Leader" ? currentUser.id : currentUser.leader_id;
  }, [currentUser]);

  // Fetch live stats for the current team leader workspace or team member
  const fetchDbStats = useCallback(async () => {
    if (!currentUser || !leaderId) {
      setDbStats(null);
      return;
    }
    try {
      const stats = await api.getDashboardStats(
        isTeamLeader
          ? { leaderId }
          : { leaderId, memberId: currentUser.id }
      );
      if (stats) setDbStats(stats);
    } catch (_) {}
  }, [leaderId, isTeamLeader, currentUser]);

  // Load all workspace data from Supabase whenever the logged-in user or leaderId changes
  useEffect(() => {
    async function loadWorkspaceData() {
      if (!currentUser || !leaderId) {
        setProjects([]);
        setSelectedProject(null);
        setTasks([]);
        setDirectives([]);
        setDbStats(null);
        return;
      }

      setIsLoadingWorkspace(true);
      try {
        const [workspaceProjects, workspaceTasks, workspaceMessages, workspaceStats] = await Promise.all([
          api.listProjects(
            isTeamLeader
              ? { ownerId: leaderId }
              : { memberId: currentUser.id, requesterId: currentUser.id }
          ),
          api.listTasks(
            isTeamLeader
              ? { leaderId }
              : { leaderId, requesterId: currentUser.id }
          ),
          api.listMessages(leaderId),
          api.getDashboardStats(
            isTeamLeader
              ? { leaderId }
              : { leaderId, memberId: currentUser.id }
          )
        ]);

        setProjects(workspaceProjects);
        if (workspaceProjects.length > 0) {
          setSelectedProject(prev => (prev && workspaceProjects.some(p => p.id === prev.id) ? prev : workspaceProjects[0]));
        } else {
          setSelectedProject(null);
        }

        setTasks(workspaceTasks);
        setDirectives(workspaceMessages);
        setDbStats(workspaceStats);
      } catch (err) {
        console.error("Failed to load workspace data:", err);
      } finally {
        setIsLoadingWorkspace(false);
      }
    }

    loadWorkspaceData();
  }, [currentUser?.id, currentUser?.role, leaderId, isTeamLeader]);

  // Dynamic dashboard task statistics (calculated live from database tasks)
  const dashboardStats = useMemo(() => {
    const today = new Date().toISOString().split("T")[0];
    const total = tasks.length;
    const completed = tasks.filter(t => t.status === "done" || t.status === "completed").length;
    const in_progress = tasks.filter(t => t.status === "in_progress").length;
    const overdue = tasks.filter(t => {
      if (t.status === "done" || t.status === "completed") return false;
      if (!t.due_date) return false;
      const due = String(t.due_date).trim();
      const dueDate = new Date(due);
      if (!isNaN(dueDate.getTime())) {
        const todayDate = new Date();
        todayDate.setHours(0, 0, 0, 0);
        return dueDate < todayDate;
      }
      return due < today;
    }).length;
    const pending = tasks.filter(t => t.status === "todo" || t.status === "backlog" || t.status === "review").length;
    const completion_rate = total > 0 ? Number(((completed / total) * 100).toFixed(1)) : 0;

    if (dbStats && dbStats.total >= total) {
      return dbStats;
    }

    return {
      total,
      completed,
      in_progress,
      overdue,
      pending,
      completion_rate
    };
  }, [tasks, dbStats]);

  // Visible projects: Team Leader sees all workspace projects; Team Member sees projects with assigned tasks (or all team projects)
  const visibleProjects = useMemo(() => {
    if (isTeamLeader) return projects;
    const memberInitials = currentUser?.initials;
    if (!memberInitials) return projects;
    const memberProjects = projects.filter(p =>
      tasks.some(t => t.project_id === p.id && t.assignee === memberInitials)
    );
    return memberProjects.length > 0 ? memberProjects : projects;
  }, [projects, tasks, isTeamLeader, currentUser]);

  // Keep selectedProject valid
  useEffect(() => {
    if (visibleProjects.length > 0) {
      if (!selectedProject || !visibleProjects.some(p => p.id === selectedProject.id)) {
        setSelectedProject(visibleProjects[0]);
      }
    } else {
      setSelectedProject(null);
    }
  }, [visibleProjects, selectedProject]);

  // Active member filter defaults
  useEffect(() => {
    if (!currentUser) return;
    if (currentUser.role === "Team Member") {
      setActiveMemberFilter(currentUser.initials);
    } else {
      setActiveMemberFilter(null);
    }
  }, [currentUser?.role, currentUser?.initials]);

  // Theme toggle
  useEffect(() => {
    if (theme === "dark") {
      document.body.classList.add("dark-theme");
    } else {
      document.body.classList.remove("dark-theme");
    }
    localStorage.setItem("flowtask_theme_v2", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === "dark" ? "light" : "dark"));
  };

  // ── Project Management ───────────────────────────────────────────────────
  const createProject = async (title, description = "", status = "active", deadline = null) => {
    if (!isTeamLeader || !currentUser) {
      alert("Permission Denied: Only Team Leaders can create projects.");
      return null;
    }

    try {
      const newProj = await api.createProject({
        title,
        description,
        status: status || "active",
        deadline,
        owner_id: currentUser.id
      });

      setProjects(prev => [newProj, ...prev]);
      setSelectedProject(newProj);
      return newProj;
    } catch (err) {
      alert(`Error creating project: ${err.message}`);
      return null;
    }
  };

  const updateProject = async (projectId, projectData) => {
    if (!isTeamLeader || !currentUser) {
      alert("Permission Denied: Only Team Leaders can edit projects.");
      return null;
    }

    try {
      const updated = await api.updateProject(projectId, projectData, currentUser.id);
      setProjects(prev => prev.map(p => (p.id === projectId ? { ...p, ...updated } : p)));
      if (selectedProject?.id === projectId) {
        setSelectedProject(prev => ({ ...prev, ...updated }));
      }
      return updated;
    } catch (err) {
      alert(`Error updating project: ${err.message}`);
      return null;
    }
  };

  const deleteProject = async (projectId) => {
    if (!isTeamLeader || !currentUser) {
      alert("Permission Denied: Only Team Leaders can delete projects.");
      return false;
    }

    try {
      await api.deleteProject(projectId, currentUser.id);
      setProjects(prev => {
        const filtered = prev.filter(p => p.id !== projectId);
        if (selectedProject?.id === projectId) {
          setSelectedProject(filtered.length > 0 ? filtered[0] : null);
        }
        return filtered;
      });
      // Remove all tasks associated with this project from memory
      setTasks(prev => prev.filter(t => t.project_id !== projectId));
      fetchDbStats();
      return true;
    } catch (err) {
      alert(`Error deleting project: ${err.message}`);
      return false;
    }
  };

  // ── Task Management ──────────────────────────────────────────────────────
  const createTask = async (data) => {
    if (!isTeamLeader) {
      alert("⚠️ Permission Denied: Only Team Leaders can create and assign tasks.");
      return null;
    }

    if (!selectedProject && !data.project_id) {
      alert("Please select or create a project first before adding a task.");
      return null;
    }

    const projId = parseInt(data.project_id || (selectedProject ? selectedProject.id : 0), 10);
    const cleanTitle = (data.title || "").trim();

    // Prevent duplicate assignment in the same project
    const alreadyExists = tasks.find(t => t.project_id === projId && (t.title || "").trim().toLowerCase() === cleanTitle.toLowerCase());
    if (alreadyExists) {
      alert(`⚠️ One Task Assign Only One Time: "${cleanTitle}" has already been assigned to ${alreadyExists.assignee}. Duplicate assignment is blocked.`);
      return alreadyExists;
    }

    // Role Rule: Team Leader cannot be assigned tasks! The leader assigns to members.
    const targetAssignee = data.assignee;
    if (!targetAssignee || targetAssignee === currentUser?.initials) {
      alert("⚠️ Rule Enforced: Team Leader cannot be assigned tasks. Please select a Team Member to assign this task to.");
      return null;
    }

    try {
      const newTask = await api.createTask({
        ...data,
        project_id: projId,
        assignee: targetAssignee,
        leader_id: leaderId
      }, currentUser.id);

      setTasks(prev => [newTask, ...prev.filter(t => t.id !== newTask.id)]);
      fetchDbStats();
      return newTask;
    } catch (err) {
      alert(`Error creating task: ${err.message}`);
      return null;
    }
  };

  const updateTask = async (id, data) => {
    const original = tasks.find(t => t.id === id);
    if (!original) return null;

    // Strict Rule: Team members can ONLY update status on their own assigned tasks
    const isAssignedToCurrent = (original.assignee === currentUser?.initials) || (original.assignee_id === currentUser?.id);
    if (!isTeamLeader && !isAssignedToCurrent) {
      alert(`⚠️ Permission Denied: You cannot modify tasks assigned to another team member (${original.assignee}).`);
      return null;
    }

    // If Team Member, ONLY status is permitted to be changed
    const safeData = isTeamLeader
      ? {
          ...data,
          assignee: original.assignee,
          leader_id: leaderId
        }
      : {
          status: data.status
        };

    // Immediate optimistic local update
    setTasks(prev => prev.map(t => (t.id === id ? { ...t, ...safeData } : t)));

    // Optimistically update dbStats
    if (safeData.status && safeData.status !== original.status) {
      setDbStats(prev => {
        if (!prev) return prev;
        const oldStatus = original.status;
        const newStatus = safeData.status;
        let c = prev.completed;
        let p = prev.in_progress;
        let pend = prev.pending;

        if (oldStatus === "done") c = Math.max(0, c - 1);
        else if (oldStatus === "in_progress") p = Math.max(0, p - 1);
        else pend = Math.max(0, pend - 1);

        if (newStatus === "done") c += 1;
        else if (newStatus === "in_progress") p += 1;
        else pend += 1;

        const rate = prev.total > 0 ? Number(((c / prev.total) * 100).toFixed(1)) : 0;
        return {
          ...prev,
          completed: c,
          in_progress: p,
          pending: pend,
          completion_rate: rate
        };
      });
    }

    try {
      const updated = await api.updateTask(id, safeData, currentUser?.id);
      if (updated) {
        setTasks(prev => prev.map(t => (t.id === id ? { ...t, ...updated } : t)));
      }
      fetchDbStats();
      return updated || safeData;
    } catch (err) {
      // Revert on failure
      setTasks(prev => prev.map(t => (t.id === id ? original : t)));
      fetchDbStats();
      alert(`Failed to save task update: ${err.message}`);
      return null;
    }
  };

  const reassignTask = async (taskId, newAssigneeInitials) => {
    if (!isTeamLeader) {
      alert("⚠️ Permission Denied: Only Team Leaders can reassign tasks.");
      return null;
    }
    const task = tasks.find(t => t.id === taskId);
    if (!task) return null;
    if (task.assignee && task.assignee !== newAssigneeInitials) {
      alert(`⚠️ Rule Enforced: One task can only be assigned one time. This task is permanently assigned to ${task.assignee} and cannot be reassigned.`);
      return task;
    }
    return await updateTask(taskId, { ...task, assignee: newAssigneeInitials });
  };

  const deleteTask = async (id) => {
    if (!isTeamLeader) {
      alert("⚠️ Permission Denied: Only the Team Leader has access to delete tasks.");
      return;
    }

    try {
      await api.deleteTask(id, currentUser?.id);
      setTasks(prev => prev.filter(t => t.id !== id));
      fetchDbStats();
    } catch (err) {
      alert(`Error deleting task: ${err.message}`);
    }
  };

  // ── Chat & Directives Persistence ─────────────────────────────────────────
  const postTeamMessage = async (message, target = "All Members") => {
    if (!currentUser || !leaderId) return null;

    try {
      const newMsg = await api.createMessage({
        leader_id: leaderId,
        sender_id: currentUser.id,
        sender_name: currentUser.name,
        sender_role: currentUser.role,
        sender_initials: currentUser.initials,
        sender_color: currentUser.color || (isTeamLeader ? "av-blue" : "av-green"),
        target,
        message
      });

      setDirectives(prev => [newMsg, ...prev.filter(m => m.id !== newMsg.id)]);
      return newMsg;
    } catch (err) {
      alert(`Chat Error: Failed to send message to database (${err.message}).`);
      return null;
    }
  };

  const sendResponse = async (directiveId, responseText, taskTitle = null) => {
    if (!currentUser) return null;
    const textWithTask = taskTitle ? `[Task: ${taskTitle}] ${responseText}` : responseText;

    try {
      const newResp = await api.replyMessage(directiveId, {
        sender_id: currentUser.id,
        sender_name: currentUser.name,
        sender_role: currentUser.role,
        sender_initials: currentUser.initials,
        sender_color: currentUser.color || "av-green",
        message: textWithTask
      });

      setDirectives(prev =>
        prev.map(d => {
          if (d.id === directiveId) {
            return {
              ...d,
              responses: [...(d.responses || []), newResp]
            };
          }
          return d;
        })
      );
      return newResp;
    } catch (err) {
      alert(`Chat Error: Failed to send update to database (${err.message}).`);
      return null;
    }
  };

  const markMessageSeen = (messageId) => {
    if (!currentUser) return;
    const userName = currentUser.name;
    setDirectives(prev =>
      prev.map(d => {
        if (d.id === messageId) {
          const seenList = d.seenBy || [];
          if (!seenList.includes(userName)) {
            return { ...d, seenBy: [...seenList, userName] };
          }
        }
        return d;
      })
    );
  };

  return (
    <TaskContext.Provider
      value={{
        leaderId,
        isLoadingWorkspace,
        projects,
        visibleProjects,
        selectedProject,
        setSelectedProject,
        createProject,
        updateProject,
        deleteProject,
        tasks,
        setTasks,
        activeMemberFilter,
        setActiveMemberFilter,
        inspectedMember,
        setInspectedMember,
        directives,
        sendDirective: postTeamMessage,
        postTeamMessage,
        sendResponse,
        markMessageSeen,
        createTask,
        updateTask,
        reassignTask,
        deleteTask,
        editModalTask,
        setEditModalTask,
        taskStatusFilter,
        setTaskStatusFilter,
        taskSearchQuery,
        setTaskSearchQuery,
        dashboardStats,
        theme,
        toggleTheme,
        fetchDbStats
      }}
    >
      {children}
    </TaskContext.Provider>
  );
}

export function useTasks() {
  return useContext(TaskContext);
}
