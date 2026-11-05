/**
 * api.js — Complete Database API Client
 * Connects directly to FastAPI backend on http://localhost:8001 (Supabase PostgreSQL).
 * Zero dummy data, full multi-tenant team isolation.
 */

const API_BASE_URL = "https://flow-task-backend-2.onrender.com";

async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const headers = {
    "Content-Type": "application/json",
    Accept: "application/json",
    ...(options.headers || {})
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 6000);

  try {
    const res = await fetch(url, {
      ...options,
      headers,
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      let errDetail = `HTTP ${res.status}`;
      try {
        const errorJson = await res.json();
        errDetail = errorJson.detail || errorJson.message || errDetail;
      } catch (_) {}
      throw new Error(errDetail);
    }

    if (res.status === 204) return null;
    return await res.json();
  } catch (err) {
    clearTimeout(timeoutId);
    console.error(`API Error on [${options.method || "GET"} ${endpoint}]:`, err.message);
    throw err;
  }
}

export const api = {
  // ── Authentication ────────────────────────────────────────────────────────
  async login(email, password) {
    return await apiRequest("/users/login", {
      method: "POST",
      body: JSON.stringify({ email: email.trim(), password })
    });
  },

  async register(userData) {
    return await apiRequest("/users/", {
      method: "POST",
      body: JSON.stringify(userData)
    });
  },

  // ── Users & Team Members ──────────────────────────────────────────────────
  async listUsers(leaderId = null) {
    try {
      const q = leaderId !== null && leaderId !== undefined ? `?leader_id=${leaderId}` : "";
      return await apiRequest(`/users/${q}`);
    } catch (_) {
      return [];
    }
  },

  async getUser(userId) {
    return await apiRequest(`/users/${userId}`);
  },

  async createUser(userData) {
    return await apiRequest("/users/", {
      method: "POST",
      body: JSON.stringify(userData)
    });
  },

  async updateUser(userId, userData, requesterId = null) {
    const q = requesterId ? `?requester_id=${requesterId}` : "";
    return await apiRequest(`/users/${userId}${q}`, {
      method: "PUT",
      body: JSON.stringify(userData)
    });
  },

  async updateUserProfile(userId, profileData, requesterId = null) {
    const q = requesterId ? `?requester_id=${requesterId}` : "";
    return await apiRequest(`/users/${userId}/profile${q}`, {
      method: "PUT",
      body: JSON.stringify(profileData)
    });
  },

  async deleteUser(userId) {
    return await apiRequest(`/users/${userId}`, {
      method: "DELETE"
    });
  },

  // ── Projects ──────────────────────────────────────────────────────────────
  async listProjects(params = null) {
    try {
      let q = "";
      if (typeof params === "object" && params !== null) {
        const sp = new URLSearchParams();
        if (params.ownerId !== undefined && params.ownerId !== null) sp.append("owner_id", params.ownerId);
        if (params.memberId !== undefined && params.memberId !== null) sp.append("member_id", params.memberId);
        if (params.requesterId !== undefined && params.requesterId !== null) sp.append("requester_id", params.requesterId);
        q = sp.toString() ? `?${sp.toString()}` : "";
      } else if (params !== null && params !== undefined) {
        q = `?owner_id=${params}`;
      }
      return await apiRequest(`/projects/${q}`);
    } catch (_) {
      return [];
    }
  },

  async getProject(projectId) {
    return await apiRequest(`/projects/${projectId}`);
  },

  async getProjectMembers(projectId) {
    try {
      return await apiRequest(`/projects/${projectId}/members`);
    } catch (_) {
      return [];
    }
  },

  async updateMemberProjects(memberId, projectIds, requesterId = null) {
    const q = requesterId ? `?requester_id=${requesterId}` : "";
    return await apiRequest(`/users/${memberId}/projects${q}`, {
      method: "PUT",
      body: JSON.stringify({ project_ids: projectIds })
    });
  },

  async createProject(projectData) {
    return await apiRequest("/projects/", {
      method: "POST",
      body: JSON.stringify(projectData)
    });
  },

  async updateProject(projectId, projectData, requesterId = null) {
    const q = requesterId ? `?requester_id=${requesterId}` : "";
    return await apiRequest(`/projects/${projectId}${q}`, {
      method: "PUT",
      body: JSON.stringify(projectData)
    });
  },

  async deleteProject(projectId, requesterId = null) {
    const q = requesterId ? `?requester_id=${requesterId}` : "";
    return await apiRequest(`/projects/${projectId}${q}`, {
      method: "DELETE"
    });
  },

  // ── Tasks ─────────────────────────────────────────────────────────────────
  async listTasks({ leaderId = null, projectId = null, assignee = null, assigneeId = null, status = null, requesterId = null, sort = null } = {}) {
    try {
      const params = new URLSearchParams();
      if (leaderId !== null && leaderId !== undefined) params.append("leader_id", leaderId);
      if (projectId !== null && projectId !== undefined) params.append("project_id", projectId);
      if (assignee) params.append("assignee", assignee);
      if (assigneeId !== null && assigneeId !== undefined) params.append("assignee_id", assigneeId);
      if (requesterId !== null && requesterId !== undefined) params.append("requester_id", requesterId);
      if (status && status !== "all") params.append("status", status);
      if (sort) params.append("sort", sort);

      const qs = params.toString() ? `?${params.toString()}` : "";
      return await apiRequest(`/tasks/${qs}`);
    } catch (_) {
      return [];
    }
  },

  async listAllTasks(leaderId = null, requesterId = null) {
    return this.listTasks({ leaderId, requesterId });
  },

  async getTask(taskId) {
    return await apiRequest(`/tasks/${taskId}`);
  },

  async createTask(taskData, requesterId = null) {
    const q = requesterId ? `?requester_id=${requesterId}` : "";
    return await apiRequest(`/tasks/${q}`, {
      method: "POST",
      body: JSON.stringify(taskData)
    });
  },

  async updateTask(taskId, taskData, requesterId = null) {
    const q = requesterId ? `?requester_id=${requesterId}` : "";
    return await apiRequest(`/tasks/${taskId}${q}`, {
      method: "PUT",
      body: JSON.stringify(taskData)
    });
  },

  async deleteTask(taskId, requesterId = null) {
    const q = requesterId ? `?requester_id=${requesterId}` : "";
    return await apiRequest(`/tasks/${taskId}${q}`, {
      method: "DELETE"
    });
  },

  // ── Chat / Directives / Announcements ─────────────────────────────────────
  async listMessages(leaderId) {
    if (!leaderId) return [];
    try {
      return await apiRequest(`/messages/?leader_id=${leaderId}`);
    } catch (_) {
      return [];
    }
  },

  async createMessage(data) {
    return await apiRequest("/messages/", {
      method: "POST",
      body: JSON.stringify(data)
    });
  },

  async replyMessage(messageId, data) {
    return await apiRequest(`/messages/${messageId}/responses`, {
      method: "POST",
      body: JSON.stringify(data)
    });
  },

  // ── Dashboard Statistics ──────────────────────────────────────────────────
  async getDashboardStats({ leaderId = null, memberId = null, assignee = null, projectId = null } = {}) {
    try {
      const params = new URLSearchParams();
      if (leaderId !== null && leaderId !== undefined) params.append("leader_id", leaderId);
      if (memberId !== null && memberId !== undefined) params.append("member_id", memberId);
      if (assignee) params.append("assignee", assignee);
      if (projectId !== null && projectId !== undefined) params.append("project_id", projectId);

      const qs = params.toString() ? `?${params.toString()}` : "";
      const data = await apiRequest(`/stats/overview${qs}`);
      if (data) {
        return {
          total: data.total_tasks,
          completed: data.completed_tasks,
          in_progress: data.in_progress_tasks,
          overdue: data.overdue_tasks,
          pending: data.pending_tasks,
          completion_rate: data.completion_rate,
          by_status: data.by_status || []
        };
      }
      return null;
    } catch (_) {
      return null;
    }
  }
};

// Safe preferences storage (for non-database UI preferences only)
export const LocalStore = {
  getDirectives() { return []; },
  saveDirectives() {}
};
