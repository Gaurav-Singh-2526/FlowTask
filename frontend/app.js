/* ==========================================================================
   app.js — FlowTask  |  Production-Ready Interactive Task Management Engine
   Full-stack hybrid with local resilience, real-time analytics, algorithms,
   Kanban board, interactive calendar, grouping, search, and notifications
   ========================================================================== */
"use strict";

/* ── Configuration ──────────────────────────────────────────────────────── */
const API_BASE = (typeof window !== "undefined" && (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"))
  ? "http://127.0.0.1:8000"
  : "https://flow-task-backend-2.onrender.com";

/* ── Local Persistence Keys ─────────────────────────────────────────────── */
const STORE_KEY_USERS    = "flowtask_users_v2";
const STORE_KEY_PROJECTS = "flowtask_projects_v2";
const STORE_KEY_TASKS    = "flowtask_tasks_v2";
const STORE_KEY_SETTINGS = "flowtask_settings_v2";
const STORE_KEY_THEME    = "flowtask_theme_v2";
const STORE_KEY_AUTH_USER = "flowtask_auth_user_v2";

/* ── Seed Dataset matching the screenshot ───────────────────────────────── */
const DEFAULT_USERS = [
  { id: 1, name: "Alex Morgan", email: "alex@flowtask.com", role: "Team Leader", title: "Product & Engineering Lead", initials: "AM", color: "av-blue" },
  { id: 2, name: "Sara Khan",   email: "sara@flowtask.com", role: "Team Member", title: "Backend Engineer", initials: "SK", color: "av-green" },
  { id: 3, name: "Tom Brown",   email: "tom@flowtask.com",  role: "Team Member", title: "Frontend Developer", initials: "TB", color: "av-orange" },
  { id: 4, name: "Lisa Ray",    email: "lisa@flowtask.com", role: "Team Member", title: "UI/UX Designer", initials: "LR", color: "av-purple" },
  { id: 5, name: "Mike Jones",  email: "mike@flowtask.com", role: "Team Member", title: "QA Engineer", initials: "MJ", color: "av-red" }
];

const DEFAULT_PROJECTS = [
  { id: 101, title: "FlowTask App",   description: "Main workspace & dashboard application", owner_id: 1, icon: "icon-purple" },
  { id: 102, title: "Brand Refresh",  description: "Visual identity and design system",       owner_id: 1, icon: "icon-green" },
  { id: 103, title: "API Integration",description: "FastAPI REST and webhook integrations",   owner_id: 1, icon: "icon-orange" },
  { id: 104, title: "Mobile App",     description: "React Native and Android client",        owner_id: 1, icon: "icon-pink" }
];

const DEFAULT_TASKS = [
  // FlowTask App (101)
  { id: 1001, project_id: 101, title: "Redesign onboarding flow",     description: "Refactor first-time user wizard and guided tours", priority: "high",   status: "in_progress", due_date: "2026-03-28", assignee: "AM" },
  { id: 1002, project_id: 101, title: "API documentation update",     description: "Document endpoints in OpenAPI / Swagger schema",   priority: "medium", status: "review",      due_date: "2026-03-30", assignee: "SK" },
  { id: 1003, project_id: 101, title: "Fix checkout bug #438",         description: "Fix race condition in payment confirmation hook",  priority: "high",   status: "in_progress", due_date: "2026-03-27", assignee: "TB" },
  { id: 1004, project_id: 101, title: "Mobile responsive testing",     description: "Audit layout breakpoints across iOS and Android",  priority: "low",    status: "todo",        due_date: "2026-04-05", assignee: "LR" },
  { id: 1005, project_id: 101, title: "User analytics dashboard",     description: "Integrate Mixpanel and event funnel telemetry",    priority: "high",   status: "done",        due_date: "2026-03-24", assignee: "AM" },
  { id: 1006, project_id: 101, title: "Design system token audit",     description: "Normalize CSS variables and dark mode palette",    priority: "low",    status: "todo",        due_date: "2026-04-05", assignee: "LR" },
  { id: 1007, project_id: 101, title: "Payment gateway retry logic",   description: "Add exponential backoff on transient 503s",       priority: "high",   status: "in_progress", due_date: "2026-03-27", assignee: "TB" },

  // Brand Refresh (102)
  { id: 2001, project_id: 102, title: "Brand guideline typography scale", description: "Define font sizes and line heights for H1-H6", priority: "medium", status: "in_progress", due_date: "2026-03-29", assignee: "SK" },
  { id: 2002, project_id: 102, title: "Export SVG logo icon set",          description: "Generate monocolor and gradient vector icons", priority: "low",    status: "done",        due_date: "2026-03-22", assignee: "AM" },
  { id: 2003, project_id: 102, title: "Color contrast WCAG audit",         description: "Ensure AAA ratio across dark and light themes", priority: "high",   status: "todo",        due_date: "2026-04-02", assignee: "LR" },
  { id: 2004, project_id: 102, title: "Update marketing landing page",     description: "Incorporate new brand hero illustrations",    priority: "medium", status: "review",      due_date: "2026-03-31", assignee: "TB" },

  // API Integration (103)
  { id: 3001, project_id: 103, title: "OAuth2 refresh token rotation",     description: "Implement secure silent renew flow",          priority: "high",   status: "done",        due_date: "2026-03-20", assignee: "MJ" },
  { id: 3002, project_id: 103, title: "Stripe webhook idempotency",        description: "Prevent duplicate charges on event replay",   priority: "high",   status: "in_progress", due_date: "2026-03-27", assignee: "TB" },
  { id: 3003, project_id: 103, title: "Rate limiting Redis cluster",       description: "Deploy token bucket 100 req/min tier limits", priority: "medium", status: "review",      due_date: "2026-03-30", assignee: "SK" },
  { id: 3004, project_id: 103, title: "Swagger OpenAPI 3.1 documentation", description: "Generate schema spec for public developer docs", priority: "low",    status: "todo",        due_date: "2026-04-08", assignee: "AM" },

  // Mobile App (104)
  { id: 4001, project_id: 104, title: "Mobile responsive testing",         description: "Test touch gestures and viewport breakpoints", priority: "high",   status: "in_progress", due_date: "2026-03-28", assignee: "LR" },
  { id: 4002, project_id: 104, title: "Offline SQLite cache sync",         description: "Background queue for offline task creation",   priority: "high",   status: "done",        due_date: "2026-03-25", assignee: "TB" },
  { id: 4003, project_id: 104, title: "Push notification deep-linking",    description: "Route APNS and FCM alerts directly to task ID",priority: "medium", status: "review",      due_date: "2026-03-31", assignee: "AM" },
  { id: 4004, project_id: 104, title: "Splash screen animation polish",    description: "Lottie json smooth launch experience",         priority: "low",    status: "todo",        due_date: "2026-04-06", assignee: "SK" }
];

const STORE_KEY_UPDATES = "flowtask_directives_v1";

const DEFAULT_DIRECTIVES = [
  {
    id: 1,
    from: "Alex Morgan",
    fromRole: "Team Leader",
    fromInitials: "AM",
    fromColor: "av-blue",
    to: "All Members",
    message: "Sprint 14 Goal: Deliver core task workflows on schedule. Please ensure all high priority bugs are resolved before Friday's release.",
    timestamp: "2 hours ago",
    responses: [
      { id: 101, memberName: "Sara Khan", memberInitials: "SK", memberColor: "av-green", text: "API documentation update is completed and verified against backend schemas.", timestamp: "1 hour ago" },
      { id: 102, memberName: "Tom Brown", memberInitials: "TB", memberColor: "av-orange", text: "Investigating the checkout bug #438 now, will push patch shortly.", timestamp: "30m ago" }
    ]
  },
  {
    id: 2,
    from: "Alex Morgan",
    fromRole: "Team Leader",
    fromInitials: "AM",
    fromColor: "av-blue",
    to: "Lisa Ray",
    message: "Lisa, please run a complete cross-browser test on the mobile responsive views once Tom pushes the checkout patch.",
    timestamp: "3 hours ago",
    responses: [
      { id: 103, memberName: "Lisa Ray", memberInitials: "LR", memberColor: "av-purple", text: "Test suite ready. Will start execution as soon as branch is deployed to staging.", timestamp: "2 hours ago" }
    ]
  }
];

/* ── Reactive Store Helper ──────────────────────────────────────────────── */
const Store = {
  getUsers() {
    try {
      const data = localStorage.getItem(STORE_KEY_USERS);
      if (!data) return DEFAULT_USERS;
      const parsed = JSON.parse(data);
      return parsed.map((u, i) => {
        if (i === 0 && u.role !== "Team Leader") u.role = "Team Leader";
        if (i !== 0 && (!u.role || u.role === "Member" || u.role === "Admin")) u.role = "Team Member";
        if (!u.initials) u.initials = u.name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
        if (!u.title) u.title = u.role === "Team Leader" ? "Product Lead" : "Engineer";
        return u;
      });
    } catch (_) { return DEFAULT_USERS; }
  },
  saveUsers(users) {
    try { localStorage.setItem(STORE_KEY_USERS, JSON.stringify(users)); } catch (_) {}
  },
  getProjects() {
    try {
      const data = localStorage.getItem(STORE_KEY_PROJECTS);
      return data ? JSON.parse(data) : DEFAULT_PROJECTS;
    } catch (_) { return DEFAULT_PROJECTS; }
  },
  saveProjects(projects) {
    try { localStorage.setItem(STORE_KEY_PROJECTS, JSON.stringify(projects)); } catch (_) {}
  },
  getTasks() {
    try {
      const data = localStorage.getItem(STORE_KEY_TASKS);
      if (!data) return DEFAULT_TASKS;
      const parsed = JSON.parse(data);
      if (!parsed.some(t => t.project_id === 104)) {
        const merged = [...parsed, ...DEFAULT_TASKS.filter(dt => !parsed.some(p => p.id === dt.id))];
        this.saveTasks(merged);
        return merged;
      }
      return parsed;
    } catch (_) { return DEFAULT_TASKS; }
  },
  saveTasks(tasks) {
    try { localStorage.setItem(STORE_KEY_TASKS, JSON.stringify(tasks)); } catch (_) {}
  },
  getTeamUpdates() {
    try {
      const data = localStorage.getItem(STORE_KEY_UPDATES);
      return data ? JSON.parse(data) : DEFAULT_DIRECTIVES;
    } catch (_) { return DEFAULT_DIRECTIVES; }
  },
  saveTeamUpdates(updates) {
    try { localStorage.setItem(STORE_KEY_UPDATES, JSON.stringify(updates)); } catch (_) {}
  },
  resetAll() {
    this.saveUsers(DEFAULT_USERS);
    this.saveProjects(DEFAULT_PROJECTS);
    this.saveTasks(DEFAULT_TASKS);
    this.saveTeamUpdates(DEFAULT_DIRECTIVES);
  }
};

/* ── App state ──────────────────────────────────────────────────────────── */
let selectedUserId       = 1;
let selectedUserName     = "Alex Morgan";
let selectedProjectId    = 101;
let selectedProjectTitle = "FlowTask App";
let currentTasks         = [];
let activeGroupMode      = "none";     // "none" | "status" | "priority" | "assignee"
let hideCompleted        = false;
let activeMemberFilter   = null;       // filter by assignee initials e.g. "AM"
let activeViewTab        = "dashboard";// "dashboard" | "overview" | "list" | "board" | "calendar" | "workflow"
let calendarDate         = new Date(2026, 2, 1); // March 2026

/* ── User Authentication & Team Delegation Session ──────────────────────── */
let currentUser = null;

function getCurrentUser() {
  if (currentUser) return currentUser;
  try {
    const saved = localStorage.getItem(STORE_KEY_AUTH_USER);
    if (saved) {
      currentUser = JSON.parse(saved);
      return currentUser;
    }
  } catch (_) {}
  const users = Store.getUsers();
  currentUser = users[0] || DEFAULT_USERS[0];
  return currentUser;
}

function isTeamLeader() {
  const u = getCurrentUser();
  return u && (u.role === "Team Leader" || u.role === "Admin" || u.role === "Lead");
}

function setCurrentUser(user) {
  currentUser = user;
  try {
    localStorage.setItem(STORE_KEY_AUTH_USER, JSON.stringify(user));
  } catch (_) {}
  selectedUserId = user.id;
  selectedUserName = user.name;

  // Auto-filter: Team Member views their own assigned deliverables by default; Leader views all
  if (user.role === "Team Member" || user.role === "Member") {
    activeMemberFilter = user.initials;
  } else if (user.role === "Team Leader" || user.role === "Admin" || user.role === "Lead") {
    activeMemberFilter = null;
  }

  updateActiveUserUI();
  updateAssigneeSelectOptions();
  renderRoleDashboardBanner();
  renderLeaderUpdatesSection();
  renderTasks(currentTasks);
  renderTeamWorkload(currentTasks);
}

/* ── Mobile navigation state ────────────────────────────────────────────── */
let mobileViewStack   = ["users"];
let mobileCurrentTask = null;

function isMobile() {
  return window.innerWidth < 768;
}

/* ── DOM refs: header / alerts / breadcrumb ──────────────────────────────── */
const headerStatus       = document.getElementById("header-status");
const mobileHeaderStatus = document.getElementById("mobile-header-status");
const alertBanner        = document.getElementById("alert-banner");
const alertText          = document.getElementById("alert-text");
const alertClose         = document.getElementById("alert-close");
const mobileBackBtn      = document.getElementById("mobile-back-btn");
const mobileHeaderTitle  = document.getElementById("mobile-header-title");
const mobileBreadcrumb   = document.getElementById("mobile-breadcrumb");
const bcUser             = document.getElementById("bc-user");
const bcProject          = document.getElementById("bc-project");
const bcTasks            = document.getElementById("bc-tasks");

/* ── DOM refs: panels & forms ───────────────────────────────────────────── */
const btnToggleUserForm    = document.getElementById("btn-toggle-user-form");
const userCreateForm       = document.getElementById("user-create-form");
const formNewUser          = document.getElementById("form-new-user");
const uName                = document.getElementById("u-name");
const uEmail               = document.getElementById("u-email");
const uNameErr             = document.getElementById("u-name-err");
const uEmailErr            = document.getElementById("u-email-err");
const btnCancelUser        = document.getElementById("btn-cancel-user");
const userListEl           = document.getElementById("user-list");

const btnToggleProjectForm = document.getElementById("btn-toggle-project-form");
const projectCreateForm    = document.getElementById("project-create-form");
const formNewProject       = document.getElementById("form-new-project");
const pTitle               = document.getElementById("p-title");
const pDesc                = document.getElementById("p-desc");
const pTitleErr            = document.getElementById("p-title-err");
const btnCancelProject     = document.getElementById("btn-cancel-project");
const projectListEl        = document.getElementById("project-list");

const btnToggleTaskForm    = document.getElementById("btn-toggle-task-form");
const taskCreateForm       = document.getElementById("task-create-form");
const formNewTask          = document.getElementById("form-new-task");
const tTitle               = document.getElementById("t-title");
const tDesc                = document.getElementById("t-desc");
const tPriority            = document.getElementById("t-priority");
const tDue                 = document.getElementById("t-due");
const tTitleErr            = document.getElementById("t-title-err");
const btnCancelTask        = document.getElementById("btn-cancel-task");
const taskListEl           = document.getElementById("task-list");

/* ── DOM refs: task controls ────────────────────────────────────────────── */
const taskSearchInput      = document.getElementById("task-search");
const searchAlgo           = document.getElementById("search-algo");
const btnSearch            = document.getElementById("btn-search");
const btnSearchClear       = document.getElementById("btn-search-clear");
const filterStatus         = document.getElementById("filter-status");
const filterPriority       = document.getElementById("filter-priority");
const sortBy               = document.getElementById("sort-by");
const taskCountChip        = document.getElementById("task-count");

/* ── DOM refs: project stats ────────────────────────────────────────────── */
const projectStats         = document.getElementById("project-stats");
const statTotal            = document.getElementById("stat-total");
const statTodo             = document.getElementById("stat-todo");
const statIp               = document.getElementById("stat-ip");
const statDone             = document.getElementById("stat-done");

/* ── DOM refs: quick-add & modals ───────────────────────────────────────── */
const formQuickAdd         = document.getElementById("form-quick-add");
const qaDesc               = document.getElementById("qa-desc");
const qaDescErr            = document.getElementById("qa-desc-err");

const editModal            = document.getElementById("edit-modal");
const editForm             = document.getElementById("edit-form");
const editTaskId           = document.getElementById("edit-task-id");
const editTitle            = document.getElementById("edit-title");
const editDesc             = document.getElementById("edit-desc");
const editPriority         = document.getElementById("edit-priority");
const editStatus           = document.getElementById("edit-status");
const editDue              = document.getElementById("edit-due");
const editTitleErr         = document.getElementById("edit-title-err");
const modalCloseX          = document.getElementById("modal-close-x");
const editCancelBtn        = document.getElementById("edit-cancel-btn");

const settingsModal        = document.getElementById("settings-modal");
const settingsCloseX       = document.getElementById("settings-close-x");
const settingsSaveBtn      = document.getElementById("settings-save-btn");
const settingsToggleTheme  = document.getElementById("settings-toggle-theme");
const settingsAlgoSelect   = document.getElementById("settings-algo-select");
const btnResetSampleData   = document.getElementById("btn-reset-sample-data");

/* ── DOM refs: mobile detail & FABs ─────────────────────────────────────── */
const mobileTaskDetail     = document.getElementById("mobile-task-detail");
const detailTitle          = document.getElementById("detail-title");
const detailPriorityBadge  = document.getElementById("detail-priority-badge");
const detailDescText       = document.getElementById("detail-desc-text");
const detailStatusBadge    = document.getElementById("detail-status-badge");
const detailDue            = document.getElementById("detail-due");
const detailAssignedUser   = document.getElementById("detail-assigned-user");
const detailProject        = document.getElementById("detail-project");
const detailStatusBtns     = document.getElementById("detail-status-buttons");
const detailTimeline       = document.getElementById("detail-timeline");
const detailDeleteBtn      = document.getElementById("detail-delete-btn");

const fabContainer         = document.getElementById("fab-container");
const fabAddUser           = document.getElementById("fab-add-user");
const fabAddProject        = document.getElementById("fab-add-project");
const fabAddTask           = document.getElementById("fab-add-task");

const mobileFormOverlay    = document.getElementById("mobile-form-overlay");
const mobileFormInner      = document.getElementById("mobile-form-inner");
const toastStack           = document.getElementById("toast-stack");

/* ==========================================================================
   ALERT & TOAST NOTIFICATION SYSTEM
   ========================================================================== */
function showAlert(message, isError = false) {
  if (!alertBanner || !alertText) return;
  alertText.textContent = message;
  alertBanner.classList.toggle("alert-error", isError);
  alertBanner.classList.toggle("alert-info",  !isError);
  alertBanner.hidden = false;
  if (alertClose) alertClose.hidden = false;
}

function hideAlert() {
  if (!alertBanner || !alertText) return;
  alertBanner.hidden = true;
  if (alertClose) alertClose.hidden = true;
  alertText.textContent = "";
}

if (alertClose) alertClose.addEventListener("click", hideAlert);

function toast(message, type = "success") {
  if (!toastStack) return;

  // Keep max 2 toasts visible at any time to prevent screen clutter
  while (toastStack.children.length >= 2) {
    try { toastStack.firstElementChild.remove(); } catch (_) {}
  }

  const el = document.createElement("div");
  el.className = `toast toast-${type}`;
  el.setAttribute("role", "status");

  const icon   = { success: "✔", error: "✖", info: "ℹ" }[type] ?? "ℹ";
  const iconEl = document.createElement("span");
  iconEl.className   = "toast-icon";
  iconEl.textContent = icon;

  const textEl = document.createElement("span");
  textEl.className   = "toast-text";
  textEl.textContent = message;

  const closeEl = document.createElement("button");
  closeEl.type = "button";
  closeEl.className   = "toast-close";
  closeEl.innerHTML   = "&times;";
  closeEl.setAttribute("aria-label", "Close notification");

  let isDismissed = false;
  function dismiss() {
    if (isDismissed) return;
    isDismissed = true;
    clearTimeout(timer);
    el.classList.add("toast-hiding");
    setTimeout(() => {
      try { el.remove(); } catch (_) {}
    }, 180);
  }

  closeEl.addEventListener("click", (e) => {
    e.stopPropagation();
    e.preventDefault();
    dismiss();
  });

  el.appendChild(iconEl);
  el.appendChild(textEl);
  el.appendChild(closeEl);
  toastStack.appendChild(el);

  const timer = setTimeout(dismiss, 3200);
}

/* ==========================================================================
   ALGORITHMS ENGINE (Binary Search, Linear Search, Insertion Sort)
   Provides Section 2 algorithmic verification and local counting benchmarks
   ========================================================================== */
function linearSearchTasks(tasks, title) {
  let comparisons = 0;
  const target = title.toLowerCase().trim();
  for (let i = 0; i < tasks.length; i++) {
    comparisons++;
    if (tasks[i].title.toLowerCase().trim() === target) {
      return { task: tasks[i], index: i, comparisons };
    }
  }
  return { task: null, index: -1, comparisons };
}

function binarySearchTasks(tasks, title) {
  let comparisons = 0;
  // Sort tasks lexicographically by title
  const sorted = [...tasks].sort((a, b) => a.title.localeCompare(b.title));
  const target = title.toLowerCase().trim();
  let low = 0;
  let high = sorted.length - 1;

  while (low <= high) {
    comparisons++;
    const mid = Math.floor((low + high) / 2);
    const midTitle = sorted[mid].title.toLowerCase().trim();
    if (midTitle === target) {
      return { task: sorted[mid], index: mid, comparisons };
    } else if (midTitle < target) {
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }
  return { task: null, index: -1, comparisons };
}

function insertionSortTasks(tasks, key = "priority") {
  const arr = [...tasks];
  const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };

  for (let i = 1; i < arr.length; i++) {
    const current = arr[i];
    let j = i - 1;

    if (key === "priority") {
      const curVal = priorityOrder[current.priority] ?? 2;
      while (j >= 0 && (priorityOrder[arr[j].priority] ?? 2) > curVal) {
        arr[j + 1] = arr[j];
        j--;
      }
    } else if (key === "due_date") {
      const curVal = current.due_date || "9999-99-99";
      while (j >= 0 && (arr[j].due_date || "9999-99-99") > curVal) {
        arr[j + 1] = arr[j];
        j--;
      }
    }
    arr[j + 1] = current;
  }
  return arr;
}

/* ==========================================================================
   API LAYER WITH LOCAL RESILIENCE (Offline-First Hybrid)
   ========================================================================== */
async function apiFetch(path, options = {}) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 3500);

  try {
    const res = await fetch(API_BASE + path, {
      signal: controller.signal,
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      ...options,
    });
    clearTimeout(timeoutId);
    if (!res.ok) {
      let detail = `HTTP ${res.status}`;
      try { const b = await res.json(); detail = b.detail ?? JSON.stringify(b); } catch (_) {}
      throw new Error(detail);
    }
    if (res.status === 204) return null;
    return await res.json();
  } catch (err) {
    clearTimeout(timeoutId);
    throw err;
  }
}

/* User APIs */
async function apiListUsers() {
  try {
    const live = await apiFetch("/users/");
    const cached = Store.getUsers();
    const byId = Object.fromEntries(cached.map(c => [c.id, c]));
    return live.map((u, i) => {
      const c = byId[u.id];
      return {
        id: u.id,
        name: u.name,
        email: u.email,
        role: c && c.role ? c.role : (i === 0 ? "Team Leader" : "Team Member"),
        title: c && c.title ? c.title : (i === 0 ? "Product & Engineering Lead" : "Software Engineer"),
        initials: c && c.initials ? c.initials : u.name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase(),
        color: c && c.color ? c.color : ["av-blue", "av-green", "av-orange", "av-purple", "av-red"][i % 5]
      };
    });
  } catch (_) {
    return Store.getUsers();
  }
}

async function apiCreateUser(data) {
  const users = Store.getUsers();
  const initials = data.initials || data.name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase() || "U";
  const colors = ["av-blue", "av-green", "av-orange", "av-purple", "av-red", "av-pink"];
  const color = data.color || colors[users.length % colors.length];
  const role = data.role || "Team Member";
  const title = data.title || (role === "Team Leader" ? "Team Leader" : "Team Member");

  try {
    const live = await apiFetch("/users/", {
      method: "POST",
      body: JSON.stringify({ name: data.name, email: data.email })
    });
    live.role = role;
    live.title = title;
    live.initials = initials;
    live.color = color;
    users.push(live);
    Store.saveUsers(users);
    return live;
  } catch (_) {
    const newUser = {
      id: Date.now(),
      name: data.name,
      email: data.email,
      role: role,
      title: title,
      initials: initials,
      color: color
    };
    users.push(newUser);
    Store.saveUsers(users);
    return newUser;
  }
}

async function apiDeleteUser(id) {
  try {
    return await apiFetch(`/users/${id}`, { method: "DELETE" });
  } catch (_) {
    const users = Store.getUsers().filter(u => u.id !== id);
    Store.saveUsers(users);
    return null;
  }
}

/* Project APIs */
async function apiListProjects() {
  try {
    return await apiFetch("/projects/");
  } catch (_) {
    return Store.getProjects();
  }
}

async function apiCreateProject(data) {
  try {
    return await apiFetch("/projects/", { method: "POST", body: JSON.stringify(data) });
  } catch (_) {
    const projs = Store.getProjects();
    const icons = ["icon-purple", "icon-green", "icon-orange", "icon-pink"];
    const newProj = {
      id: Date.now(),
      title: data.title,
      description: data.description || "",
      owner_id: data.owner_id || selectedUserId || 1,
      icon: icons[projs.length % icons.length]
    };
    projs.push(newProj);
    Store.saveProjects(projs);
    return newProj;
  }
}

async function apiUpdateProject(id, data) {
  try {
    return await apiFetch(`/projects/${id}`, { method: "PUT", body: JSON.stringify(data) });
  } catch (_) {
    const projs = Store.getProjects().map(p => p.id === id ? { ...p, ...data } : p);
    Store.saveProjects(projs);
    return projs.find(p => p.id === id);
  }
}

async function apiDeleteProject(id) {
  try {
    return await apiFetch(`/projects/${id}`, { method: "DELETE" });
  } catch (_) {
    const projs = Store.getProjects().filter(p => p.id !== id);
    Store.saveProjects(projs);
    const tasks = Store.getTasks().filter(t => t.project_id !== id);
    Store.saveTasks(tasks);
    return null;
  }
}

/* Task APIs */
async function apiListTasks(pid, sort) {
  try {
    return await apiFetch(`/tasks/?project_id=${pid}${sort ? "&sort=" + sort : ""}`);
  } catch (_) {
    let tasks = Store.getTasks().filter(t => t.project_id === pid || pid == null);
    if (sort) tasks = insertionSortTasks(tasks, sort);
    return tasks;
  }
}

async function apiSearchTask(title, algo) {
  try {
    return await apiFetch(`/tasks/search?title=${encodeURIComponent(title)}&algo=${algo}`);
  } catch (_) {
    const tasks = Store.getTasks();
    const result = algo === "binary" ? binarySearchTasks(tasks, title) : linearSearchTasks(tasks, title);
    if (!result.task) throw new Error(`Task "${title}" not found.`);
    result.task._comparisons = result.comparisons;
    return result.task;
  }
}

async function apiCreateTask(data) {
  const cur = getCurrentUser();
  const assignee = data.assignee || (cur ? cur.initials : "AM");
  try {
    const live = await apiFetch("/tasks/", {
      method: "POST",
      body: JSON.stringify({
        title: data.title,
        description: data.description || null,
        priority: data.priority || "medium",
        status: data.status || "todo",
        due_date: data.due_date || null,
        project_id: data.project_id || selectedProjectId || 101
      })
    });
    live.assignee = assignee;
    const tasks = Store.getTasks();
    tasks.unshift(live);
    Store.saveTasks(tasks);
    return live;
  } catch (_) {
    const tasks = Store.getTasks();
    const newTask = {
      id: Date.now(),
      project_id: data.project_id || selectedProjectId || 101,
      title: data.title,
      description: data.description || "",
      priority: data.priority || "medium",
      status: data.status || "todo",
      due_date: data.due_date || null,
      assignee: assignee
    };
    tasks.unshift(newTask);
    Store.saveTasks(tasks);
    return newTask;
  }
}

async function apiUpdateTask(id, data) {
  try {
    const live = await apiFetch(`/tasks/${id}`, {
      method: "PUT",
      body: JSON.stringify({
        title: data.title,
        description: data.description,
        priority: data.priority,
        status: data.status,
        due_date: data.due_date
      })
    });
    if (data.assignee) live.assignee = data.assignee;
    const tasks = Store.getTasks();
    const idx = tasks.findIndex(t => t.id === id);
    if (idx !== -1) {
      tasks[idx] = { ...tasks[idx], ...live, assignee: data.assignee || tasks[idx].assignee };
      Store.saveTasks(tasks);
    }
    return tasks[idx] || live;
  } catch (_) {
    const tasks = Store.getTasks().map(t => t.id === id ? { ...t, ...data } : t);
    Store.saveTasks(tasks);
    return tasks.find(t => t.id === id);
  }
}

async function apiDeleteTask(id) {
  try {
    return await apiFetch(`/tasks/${id}`, { method: "DELETE" });
  } catch (_) {
    const tasks = Store.getTasks().filter(t => t.id !== id);
    Store.saveTasks(tasks);
    return null;
  }
}

async function apiProjectStats(id) {
  try {
    return await apiFetch(`/stats/projects/${id}`);
  } catch (_) {
    const tasks = Store.getTasks().filter(t => t.project_id === id);
    const byStatus = [
      { status: "todo",        count: tasks.filter(t => t.status === "todo").length },
      { status: "in_progress", count: tasks.filter(t => t.status === "in_progress").length },
      { status: "review",      count: tasks.filter(t => t.status === "review").length },
      { status: "done",        count: tasks.filter(t => t.status === "done").length },
    ];
    return { project_id: id, total_tasks: tasks.length, by_status: byStatus };
  }
}

/* AI Quick-Add Natural Language Parser */
function parseQuickAddNaturalLanguage(text) {
  const lower = text.toLowerCase();
  let priority = "medium";
  if (lower.includes("urgent"))  priority = "urgent";
  else if (lower.includes("high")) priority = "high";
  else if (lower.includes("low"))  priority = "low";

  // Due date estimation
  let dueDate = null;
  const now = new Date();
  if (lower.includes("tomorrow")) {
    const d = new Date(now.getTime() + 86400000);
    dueDate = d.toISOString().split("T")[0];
  } else if (lower.includes("next friday") || lower.includes("friday")) {
    const d = new Date(now);
    const day = d.getDay();
    const diff = (5 - day + 7) % 7 || 7;
    d.setDate(d.getDate() + diff);
    dueDate = d.toISOString().split("T")[0];
  } else if (lower.includes("next monday") || lower.includes("monday")) {
    const d = new Date(now);
    const day = d.getDay();
    const diff = (1 - day + 7) % 7 || 7;
    d.setDate(d.getDate() + diff);
    dueDate = d.toISOString().split("T")[0];
  } else if (lower.includes("next week")) {
    const d = new Date(now.getTime() + 7 * 86400000);
    dueDate = d.toISOString().split("T")[0];
  }

  // Clean title
  let cleanTitle = text
    .replace(/\b(urgent|high priority|low priority|medium priority|high|low|medium)\b/gi, "")
    .replace(/\b(by tomorrow|tomorrow|next friday|next monday|next week|today)\b/gi, "")
    .replace(/[,;]/g, "")
    .trim();

  if (!cleanTitle) cleanTitle = text.trim();
  return { title: cleanTitle, priority, due_date: dueDate };
}

/* ==========================================================================
   VALIDATION HELPERS
   ========================================================================== */
function validateField(input, errEl, message) {
  if (!input || !input.value.trim()) {
    if (errEl) errEl.textContent = message;
    if (input) input.setAttribute("aria-invalid", "true");
    return false;
  }
  if (errEl) errEl.textContent = "";
  input.removeAttribute("aria-invalid");
  return true;
}

function formatDueDate(dueStr) {
  if (!dueStr) return "—";
  try {
    const d = new Date(dueStr);
    if (!isNaN(d.getTime())) {
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      return `${months[d.getMonth()]} ${d.getDate()}`;
    }
  } catch (_) {}
  return dueStr;
}

function statusLabel(status) {
  const map = {
    todo: "Backlog",
    in_progress: "In Progress",
    review: "Review",
    done: "Completed"
  };
  return map[status] ?? status;
}

/* ==========================================================================
   RENDERERS: USERS & PROJECTS
   ========================================================================== */
function renderUsers(users) {
  if (!userListEl) return;
  userListEl.innerHTML = "";
  if (!users.length) {
    const li = document.createElement("li");
    li.className = "entity-empty";
    li.textContent = "No users yet. Tap + to create one.";
    userListEl.appendChild(li);
    return;
  }
  users.forEach(u => userListEl.appendChild(buildUserCard(u)));
}

function buildUserCard(user) {
  const li = document.createElement("li");
  li.className = "entity-card user-nav-item";
  li.dataset.id = user.id;
  if (user.id === selectedUserId) li.classList.add("is-selected");

  const avatar = document.createElement("div");
  avatar.className = `avatar-circle ${user.color || "av-purple"}`;
  avatar.textContent = (user.name || "U").charAt(0).toUpperCase();

  const info = document.createElement("div");
  info.className = "user-meta";

  const name = document.createElement("span");
  name.className = "user-name";
  name.textContent = user.name;

  const email = document.createElement("span");
  email.className = "user-email";
  email.textContent = user.email;

  info.appendChild(name);
  info.appendChild(email);

  const del = document.createElement("button");
  del.type = "button";
  del.className = "btn btn-danger btn-sm card-del";
  del.style.marginLeft = "auto";
  del.textContent = "✕";
  del.setAttribute("aria-label", `Delete user ${user.name}`);
  del.addEventListener("click", (e) => {
    e.stopPropagation();
    handleDeleteUser(user.id);
  });

  li.appendChild(avatar);
  li.appendChild(info);
  li.appendChild(del);
  li.addEventListener("click", () => selectUser(user));
  return li;
}

function renderProjects(projects) {
  if (!projectListEl) return;
  projectListEl.innerHTML = "";
  renderDropdownProjects(projects);

  if (!projects.length) {
    const li = document.createElement("li");
    li.className = "entity-empty";
    li.textContent = "No projects yet. Tap + to add.";
    projectListEl.appendChild(li);
    return;
  }
  projects.forEach(p => projectListEl.appendChild(buildProjectCard(p)));
}

function renderDropdownProjects(projects) {
  const ddList = document.getElementById("dropdown-project-list");
  if (!ddList) return;
  ddList.innerHTML = "";
  projects.forEach(p => {
    const li = document.createElement("li");
    li.className = "dropdown-project-item" + (p.id === selectedProjectId ? " is-selected" : "");
    li.innerHTML = `<span>✦</span> <span>${p.title}</span>`;
    li.addEventListener("click", () => {
      selectProject(p);
      const ddMenu = document.getElementById("project-dropdown-menu");
      if (ddMenu) ddMenu.hidden = true;
    });
    ddList.appendChild(li);
  });
}

function buildProjectCard(project) {
  const li = document.createElement("li");
  li.className = "entity-card project-nav-item";
  li.dataset.id = project.id;
  if (project.id === selectedProjectId) li.classList.add("is-selected");

  const icon = document.createElement("span");
  const icons = ["icon-purple", "icon-green", "icon-orange", "icon-pink"];
  const colorClass = icons[(Number(project.id) || 0) % icons.length];
  icon.className = `proj-icon ${colorClass}`;
  icon.textContent = "✦";

  const info = document.createElement("div");
  info.className = "card-info";
  info.style.flex = "1";
  info.style.overflow = "hidden";

  const titleEl = document.createElement("span");
  titleEl.className = "proj-title";
  titleEl.textContent = project.title;
  info.appendChild(titleEl);

  const actions = document.createElement("div");
  actions.className = "card-actions";
  actions.style.display = "flex";
  actions.style.gap = "4px";

  const editBtn = document.createElement("button");
  editBtn.type = "button";
  editBtn.className = "btn btn-secondary btn-icon-sm card-edit";
  editBtn.textContent = "✎";
  editBtn.setAttribute("aria-label", `Edit project ${project.title}`);
  editBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    openProjectEditInline(project, li, titleEl);
  });

  const del = document.createElement("button");
  del.type = "button";
  del.className = "btn btn-danger btn-icon-sm card-del";
  del.textContent = "✕";
  del.setAttribute("aria-label", `Delete project ${project.title}`);
  del.addEventListener("click", (e) => {
    e.stopPropagation();
    handleDeleteProject(project.id);
  });

  actions.appendChild(editBtn);
  actions.appendChild(del);

  li.appendChild(icon);
  li.appendChild(info);
  li.appendChild(actions);
  li.addEventListener("click", () => selectProject(project));
  return li;
}

function openProjectEditInline(project, li, titleEl) {
  const input = document.createElement("input");
  input.type = "text";
  input.className = "inline-edit-input";
  input.value = project.title;
  input.style.width = "100%";
  input.style.fontSize = "12px";

  const save = document.createElement("button");
  save.type = "button";
  save.className = "btn btn-primary btn-sm";
  save.textContent = "Save";

  const cancel = document.createElement("button");
  cancel.type = "button";
  cancel.className = "btn btn-secondary btn-sm";
  cancel.textContent = "✕";

  const row = document.createElement("div");
  row.style.display = "flex";
  row.style.gap = "4px";
  row.appendChild(input);
  row.appendChild(save);
  row.appendChild(cancel);

  titleEl.replaceWith(row);
  input.focus();

  cancel.addEventListener("click", () => row.replaceWith(titleEl));
  save.addEventListener("click", async () => {
    const newTitle = input.value.trim();
    if (!newTitle) return;
    try {
      await apiUpdateProject(project.id, { ...project, title: newTitle });
      project.title = newTitle;
      titleEl.textContent = newTitle;
      row.replaceWith(titleEl);
      if (selectedProjectId === project.id) {
        selectedProjectTitle = newTitle;
        const disp = document.getElementById("selected-project-display");
        if (disp) disp.textContent = newTitle;
      }
      toast("Project renamed.", "success");
    } catch (err) {
      showAlert("Could not rename: " + err.message, true);
    }
  });
}

/* ==========================================================================
   RENDERERS: TASKS TABLE & KANBAN & CALENDAR
   ========================================================================== */
function renderTasks(tasks) {
  if (!taskListEl) return;
  const statusVal   = filterStatus ? filterStatus.value : "all";
  const priorityVal = filterPriority ? filterPriority.value : "all";
  const searchVal   = taskSearchInput ? taskSearchInput.value.toLowerCase().trim() : "";

  let visible = tasks.filter(t => {
    const okS = statusVal   === "all" || t.status   === statusVal;
    const okP = priorityVal === "all" || t.priority === priorityVal;
    const okH = !hideCompleted || t.status !== "done";
    const okM = !activeMemberFilter || t.assignee === activeMemberFilter;
    const okQ = !searchVal || t.title.toLowerCase().includes(searchVal) || (t.description && t.description.toLowerCase().includes(searchVal));
    return okS && okP && okH && okM && okQ;
  });

  // Grouping or Sorting
  if (sortBy && sortBy.value) {
    visible = insertionSortTasks(visible, sortBy.value);
  }

  // Update Count Chips
  const total = currentTasks.length;
  const shown = visible.length;
  if (taskCountChip) {
    taskCountChip.textContent = `${shown} of ${total} tasks`;
  }
  const listBadge = document.getElementById("list-tab-badge");
  if (listBadge) listBadge.textContent = total;

  taskListEl.innerHTML = "";
  if (!visible.length) {
    const li = document.createElement("li");
    li.className = "task-item";
    li.style.justifyContent = "center";
    li.style.color = "var(--text-subtle)";
    li.style.padding = "24px 12px";
    li.textContent = total === 0 ? "No tasks in this project yet. Tap + to add." : "No tasks match the active filters.";
    taskListEl.appendChild(li);
    renderKanbanBoard(visible);
    renderCalendarView(currentTasks);
    return;
  }

  if (activeGroupMode === "none") {
    visible.forEach(t => taskListEl.appendChild(buildTaskCard(t)));
  } else {
    // Render with grouping headers
    const groups = {};
    visible.forEach(t => {
      const gKey = activeGroupMode === "status"   ? statusLabel(t.status) :
                   activeGroupMode === "priority" ? t.priority.toUpperCase() :
                   (t.assignee || "Unassigned");
      if (!groups[gKey]) groups[gKey] = [];
      groups[gKey].push(t);
    });

    Object.keys(groups).forEach(gKey => {
      const gHeader = document.createElement("li");
      gHeader.className = "task-group-header";
      gHeader.textContent = `${gKey} (${groups[gKey].length})`;
      taskListEl.appendChild(gHeader);
      groups[gKey].forEach(t => taskListEl.appendChild(buildTaskCard(t)));
    });
  }

  // Sync other views
  renderKanbanBoard(currentTasks);
  renderCalendarView(currentTasks);
  renderWorkflowView(currentTasks);
}

function buildTaskCard(task) {
  const li = document.createElement("li");
  li.className = "task-item" + (task.status === "done" ? " is-completed" : "");
  li.dataset.id = task.id;
  li.dataset.priority = task.priority;
  li.dataset.status = task.status;

  // 1. Checkbox column
  const colSelect = document.createElement("div");
  colSelect.className = "task-col-select";
  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.className = "task-checkbox";
  checkbox.checked = task.status === "done";
  checkbox.setAttribute("aria-label", `Mark "${task.title}" as done`);
  checkbox.addEventListener("change", async (e) => {
    e.stopPropagation();
    const newStatus = checkbox.checked ? "done" : "todo";
    try {
      const updated = await apiUpdateTask(task.id, { ...task, status: newStatus });
      currentTasks = currentTasks.map(t => (t.id === task.id ? updated : t));
      renderTasks(currentTasks);
      await loadProjectStats(selectedProjectId);
      toast(newStatus === "done" ? "Task completed! 🎉" : "Task moved to To Do.", "info");
    } catch (err) {
      showAlert("Could not update task: " + err.message, true);
      checkbox.checked = !checkbox.checked;
    }
  });
  colSelect.appendChild(checkbox);
  li.appendChild(colSelect);

  // 2. Title column
  const colTitle = document.createElement("div");
  colTitle.className = "task-col-title" + (task.status === "done" ? " is-strikethrough" : "");
  colTitle.textContent = task.title;
  if (task.description) {
    colTitle.title = `${task.title}\n${task.description}`;
  }
  li.appendChild(colTitle);

  // 3. Priority column (Clickable to quick-cycle)
  const colPriority = document.createElement("div");
  colPriority.className = "task-col-priority";
  const pb = document.createElement("span");
  pb.className = `badge badge-priority-${task.priority}`;
  pb.textContent = task.priority.charAt(0).toUpperCase() + task.priority.slice(1);
  pb.title = "Click to cycle priority";
  pb.style.cursor = "pointer";
  pb.addEventListener("click", async (e) => {
    e.stopPropagation();
    const cycle = { low: "medium", medium: "high", high: "urgent", urgent: "low" };
    const nextP = cycle[task.priority] || "medium";
    const updated = await apiUpdateTask(task.id, { ...task, priority: nextP });
    currentTasks = currentTasks.map(t => t.id === task.id ? updated : t);
    renderTasks(currentTasks);
  });
  colPriority.appendChild(pb);
  li.appendChild(colPriority);

  // 4. Status column (Clickable to quick-cycle)
  const colStatus = document.createElement("div");
  colStatus.className = "task-col-status";
  const sb = document.createElement("span");
  const sClass = task.status === "in_progress" ? "in_progress" :
                 task.status === "done" ? "done" :
                 task.status === "review" ? "review" : "backlog";
  sb.className = `badge badge-status-${sClass}`;
  sb.textContent = statusLabel(task.status);
  sb.title = "Click to cycle status";
  sb.style.cursor = "pointer";
  sb.addEventListener("click", async (e) => {
    e.stopPropagation();
    const cycle = { todo: "in_progress", in_progress: "review", review: "done", done: "todo" };
    const nextS = cycle[task.status] || "todo";
    const updated = await apiUpdateTask(task.id, { ...task, status: nextS });
    currentTasks = currentTasks.map(t => t.id === task.id ? updated : t);
    renderTasks(currentTasks);
    await loadProjectStats(selectedProjectId);
  });
  colStatus.appendChild(sb);
  li.appendChild(colStatus);

  // 5. Due date column
  const colDue = document.createElement("div");
  colDue.className = "task-col-due";
  colDue.textContent = formatDueDate(task.due_date);
  li.appendChild(colDue);

  // 6. Assignee column
  const colAssignee = document.createElement("div");
  colAssignee.className = "task-col-assignee";
  const avatar = document.createElement("span");
  const users = Store.getUsers();
  const userObj = users.find(u => u.initials === task.assignee);
  const colorClass = userObj ? (userObj.color || "av-blue") : "av-blue";
  const initial = task.assignee || (userObj ? userObj.initials : "AM");

  avatar.className = `assignee-avatar ${colorClass}`;
  avatar.textContent = initial;

  if (isTeamLeader()) {
    avatar.style.cursor = "pointer";
    avatar.title = `Assigned to ${userObj ? userObj.name : initial} (👑 Leader: Click to reassign)`;
    avatar.addEventListener("click", (e) => {
      e.stopPropagation();
      openQuickAssignPopover(task, avatar);
    });
  } else {
    avatar.title = `Assigned to ${userObj ? userObj.name : initial}`;
  }
  colAssignee.appendChild(avatar);
  li.appendChild(colAssignee);

  // 7. Actions (Edit & Delete on hover + Update for members)
  const colActions = document.createElement("div");
  colActions.className = "task-col-actions";

  const curU = getCurrentUser();
  if (curU && curU.role !== "Team Leader") {
    const updateBtn = document.createElement("button");
    updateBtn.type = "button";
    updateBtn.className = "btn btn-secondary btn-icon-sm";
    updateBtn.textContent = "💬";
    updateBtn.title = "Send progress update to Leader about this task";
    updateBtn.setAttribute("aria-label", "Send update on task");
    updateBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      const sec = document.getElementById("leader-updates-section");
      if (sec) {
        sec.scrollIntoView({ behavior: "smooth", block: "center" });
        const replyInput = sec.querySelector(".member-reply-input");
        if (replyInput) {
          replyInput.value = `Update on "${task.title}": `;
          replyInput.focus();
        }
      }
    });
    colActions.appendChild(updateBtn);
  }

  const editBtn = document.createElement("button");
  editBtn.type = "button";
  editBtn.className = "btn btn-secondary btn-icon-sm";
  editBtn.textContent = "✎";
  editBtn.setAttribute("aria-label", "Edit task");
  editBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    openEditModal(task);
  });

  const delBtn = document.createElement("button");
  delBtn.type = "button";
  delBtn.className = "btn btn-danger btn-icon-sm";
  delBtn.textContent = "✕";
  delBtn.setAttribute("aria-label", "Delete task");
  delBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    handleDeleteTask(task.id);
  });

  colActions.appendChild(editBtn);
  colActions.appendChild(delBtn);
  li.appendChild(colActions);

  // Row click opens detail
  li.addEventListener("click", (e) => {
    if (e.target !== checkbox && !colActions.contains(e.target) && !colPriority.contains(e.target) && !colStatus.contains(e.target)) {
      openEditModal(task);
    }
  });

  return li;
}

/* ==========================================================================
   KANBAN BOARD CONTROLLER
   ========================================================================== */
function renderKanbanBoard(tasks) {
  const kbTodo = document.getElementById("kb-list-todo");
  const kbIp   = document.getElementById("kb-list-ip");
  const kbDone = document.getElementById("kb-list-done");
  if (!kbTodo || !kbIp || !kbDone) return;

  kbTodo.innerHTML = "";
  kbIp.innerHTML   = "";
  kbDone.innerHTML = "";

  const todoTasks = tasks.filter(t => t.status === "todo" || t.status === "backlog");
  const ipTasks   = tasks.filter(t => t.status === "in_progress" || t.status === "review");
  const doneTasks = tasks.filter(t => t.status === "done");

  const cTodo = document.getElementById("kb-count-todo");
  const cIp   = document.getElementById("kb-count-ip");
  const cDone = document.getElementById("kb-count-done");
  if (cTodo) cTodo.textContent = todoTasks.length;
  if (cIp)   cIp.textContent   = ipTasks.length;
  if (cDone) cDone.textContent = doneTasks.length;

  todoTasks.forEach(t => kbTodo.appendChild(buildKanbanCard(t)));
  ipTasks.forEach(t => kbIp.appendChild(buildKanbanCard(t)));
  doneTasks.forEach(t => kbDone.appendChild(buildKanbanCard(t)));
}

function buildKanbanCard(task) {
  const card = document.createElement("div");
  card.className = "kanban-card";
  card.innerHTML = `
    <div class="kb-card-title">${task.title}</div>
    ${task.description ? `<p class="kb-card-desc">${task.description}</p>` : ""}
    <div class="kb-card-footer">
      <span class="badge badge-priority-${task.priority}">${task.priority}</span>
      <span style="font-size: 11px; color: var(--text-muted);">${formatDueDate(task.due_date)}</span>
      <span class="assignee-avatar av-blue" style="width: 22px; height: 22px; font-size: 9.5px;">${task.assignee || "AM"}</span>
    </div>
    <div class="kb-card-actions">
      ${task.status !== "todo" ? `<button type="button" class="btn-kb-move move-left" title="Move back">← Back</button>` : ""}
      ${task.status !== "done" ? `<button type="button" class="btn-kb-move move-right" style="margin-left: auto;" title="Advance stage">Next →</button>` : ""}
    </div>
  `;

  const moveLeft = card.querySelector(".move-left");
  if (moveLeft) {
    moveLeft.addEventListener("click", async (e) => {
      e.stopPropagation();
      const prevStatus = task.status === "done" ? "in_progress" : "todo";
      const updated = await apiUpdateTask(task.id, { ...task, status: prevStatus });
      currentTasks = currentTasks.map(t => t.id === task.id ? updated : t);
      renderTasks(currentTasks);
      await loadProjectStats(selectedProjectId);
    });
  }

  const moveRight = card.querySelector(".move-right");
  if (moveRight) {
    moveRight.addEventListener("click", async (e) => {
      e.stopPropagation();
      const nextStatus = task.status === "todo" ? "in_progress" : "done";
      const updated = await apiUpdateTask(task.id, { ...task, status: nextStatus });
      currentTasks = currentTasks.map(t => t.id === task.id ? updated : t);
      renderTasks(currentTasks);
      await loadProjectStats(selectedProjectId);
    });
  }

  card.addEventListener("click", () => openEditModal(task));
  return card;
}

/* ==========================================================================
   CALENDAR VIEW CONTROLLER
   ========================================================================== */
function renderCalendarView(tasks) {
  const grid = document.getElementById("calendar-grid-cells");
  const monthTitle = document.getElementById("calendar-month-title");
  if (!grid || !monthTitle) return;

  const year = calendarDate.getFullYear();
  const month = calendarDate.getMonth();
  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  monthTitle.textContent = `${months[month]} ${year}`;

  grid.innerHTML = "";
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Empty leading cells
  for (let i = 0; i < firstDay; i++) {
    const emptyCell = document.createElement("div");
    emptyCell.className = "calendar-day-cell";
    emptyCell.style.opacity = "0.3";
    grid.appendChild(emptyCell);
  }

  const today = new Date();
  for (let d = 1; d <= daysInMonth; d++) {
    const cell = document.createElement("div");
    const isToday = today.getFullYear() === year && today.getMonth() === month && today.getDate() === d;
    cell.className = "calendar-day-cell" + (isToday ? " today" : "");

    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    cell.innerHTML = `<span class="calendar-day-num">${d}</span>`;

    // Map tasks due on this date
    const dayTasks = tasks.filter(t => t.due_date === dateStr);
    dayTasks.forEach(t => {
      const chip = document.createElement("div");
      chip.className = "calendar-task-pill";
      chip.textContent = t.title;
      chip.title = `${t.title} (${t.priority})`;
      chip.addEventListener("click", (e) => {
        e.stopPropagation();
        openEditModal(t);
      });
      cell.appendChild(chip);
    });

    cell.addEventListener("click", () => {
      if (tDue) tDue.value = dateStr;
      if (btnToggleTaskForm) {
        if (taskCreateForm && taskCreateForm.hidden) {
          togglePanel(taskCreateForm, btnToggleTaskForm);
        }
      }
    });

    grid.appendChild(cell);
  }
}

/* ==========================================================================
   WORKFLOW VIEW CONTROLLER
   ========================================================================== */
function renderWorkflowView(tasks) {
  const cBacklog   = document.getElementById("wf-count-backlog");
  const cIp        = document.getElementById("wf-count-ip");
  const cReview    = document.getElementById("wf-count-review");
  const cCompleted = document.getElementById("wf-count-completed");

  const backlogCount   = tasks.filter(t => t.status === "todo").length;
  const ipCount        = tasks.filter(t => t.status === "in_progress").length;
  const reviewCount    = tasks.filter(t => t.status === "review").length;
  const completedCount = tasks.filter(t => t.status === "done").length;

  if (cBacklog)   cBacklog.textContent   = `${backlogCount} tasks`;
  if (cIp)        cIp.textContent        = `${ipCount} tasks`;
  if (cReview)    cReview.textContent    = `${reviewCount} tasks`;
  if (cCompleted) cCompleted.textContent = `${completedCount} tasks`;

  const ovRate = document.getElementById("ov-completion-rate");
  if (ovRate) {
    const rate = tasks.length ? Math.round((completedCount / tasks.length) * 100) : 0;
    ovRate.textContent = `${rate}%`;
  }
}

/* ==========================================================================
   TEAM WORKLOAD & ACTIVE USER COLLABORATION
   ========================================================================== */
function updateActiveUserUI() {
  const u = getCurrentUser();
  if (!u) return;

  // Sidebar profile footer
  const dispName = document.getElementById("user-display-name");
  const dispRole = document.getElementById("user-display-role");
  const dispInit = document.getElementById("user-avatar-initial");
  if (dispName) dispName.textContent = u.name;
  if (dispRole) {
    dispRole.textContent = u.role === "Team Leader" ? "👑 Team Leader" : "👤 Team Member";
  }
  if (dispInit) {
    dispInit.textContent = u.initials || u.name.charAt(0).toUpperCase();
  }

  // Top Nav User button
  const topName = document.getElementById("top-user-name");
  const topAvatar = document.getElementById("top-user-avatar");
  const topRole = document.getElementById("top-user-role");
  if (topName) topName.textContent = u.name;
  if (topAvatar) topAvatar.textContent = u.initials || u.name.charAt(0).toUpperCase();
  if (topRole) {
    const isLead = u.role === "Team Leader";
    topRole.textContent = isLead ? "Leader" : "Member";
    topRole.className = `top-user-role-chip ${isLead ? "" : "is-member"}`;
  }

  // Form New Task Assignee Role Tag
  const roleTag = document.getElementById("role-tag-assign");
  if (roleTag) {
    const isLead = isTeamLeader();
    roleTag.textContent = isLead ? "👑 Leader" : "👤 Member";
    roleTag.className = `badge-role-tag ${isLead ? "badge-leader" : "badge-member"}`;
  }

  // Sidebar My Tasks count badge
  const myTasksBadge = document.getElementById("sidebar-my-tasks-badge");
  if (myTasksBadge) {
    const myCount = currentTasks.filter(t => t.assignee === u.initials && t.status !== "done").length;
    myTasksBadge.textContent = myCount;
  }
}

function updateAssigneeSelectOptions() {
  const users = Store.getUsers();
  const cur = getCurrentUser();

  const selects = [
    document.getElementById("t-assignee"),
    document.getElementById("edit-assignee")
  ];

  selects.forEach(sel => {
    if (!sel) return;
    const prevVal = sel.value;
    sel.innerHTML = "";
    users.forEach(u => {
      const opt = document.createElement("option");
      opt.value = u.initials;
      const rolePrefix = u.role === "Team Leader" ? "👑 " : "👤 ";
      opt.textContent = `${rolePrefix}${u.name} (${u.role})`;
      if (u.initials === (prevVal || (cur ? cur.initials : "AM"))) {
        opt.selected = true;
      }
      sel.appendChild(opt);
    });
  });
}

function renderTeamWorkload(tasks) {
  const listEl = document.getElementById("workload-members-list");
  if (!listEl) return;
  const countEl = document.getElementById("team-workload-count");
  const users = Store.getUsers();
  if (countEl) countEl.textContent = `Active members · ${users.length} people`;

  listEl.innerHTML = "";
  users.forEach((u, idx) => {
    const userTasks = tasks.filter(t => t.assignee === u.initials);
    const doneTasks = userTasks.filter(t => t.status === "done").length;
    const totalTasks = userTasks.length;
    const pct = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

    const li = document.createElement("li");
    li.className = "workload-item clickable-member" + (activeMemberFilter === u.initials ? " is-selected-member" : "");
    li.dataset.initials = u.initials;
    li.title = `Filter tasks for ${u.name} (${u.role})`;

    const colorClass = u.color || ["av-blue", "av-green", "av-orange", "av-purple", "av-red"][idx % 5];
    const fillClass = colorClass.replace("av-", "fill-");

    li.innerHTML = `
      <span class="assignee-avatar ${colorClass}">${u.initials}</span>
      <span class="member-name">${u.name}</span>
      <div class="progress-bar-track">
        <div class="progress-bar-fill ${fillClass}" style="width: ${pct}%;"></div>
      </div>
      <span class="member-ratio">${doneTasks}/${totalTasks}</span>
    `;

    li.addEventListener("click", () => {
      if (activeMemberFilter === u.initials) {
        activeMemberFilter = null;
        li.classList.remove("is-selected-member");
      } else {
        document.querySelectorAll("#workload-members-list .clickable-member").forEach(m => m.classList.remove("is-selected-member"));
        activeMemberFilter = u.initials;
        li.classList.add("is-selected-member");
      }
      renderTasks(currentTasks);
    });

    listEl.appendChild(li);
  });
}

function openQuickAssignPopover(task, anchorEl) {
  const existing = document.querySelector(".quick-assign-popover");
  if (existing) existing.remove();

  const popover = document.createElement("div");
  popover.className = "quick-assign-popover";

  const header = document.createElement("div");
  header.className = "quick-assign-header";
  header.textContent = "👑 Assign Work To:";
  popover.appendChild(header);

  const users = Store.getUsers();
  users.forEach(u => {
    const item = document.createElement("div");
    item.className = "quick-assign-item";
    const isCur = task.assignee === u.initials;
    item.innerHTML = `
      <span class="assignee-avatar ${u.color || 'av-blue'}" style="width:20px; height:20px; font-size:10px;">${u.initials}</span>
      <span>${u.name} (${u.role})</span>
      ${isCur ? '<span style="margin-left:auto; color:#10b981; font-weight:bold;">✓</span>' : ''}
    `;
    item.addEventListener("click", async (e) => {
      e.stopPropagation();
      popover.remove();
      if (task.assignee === u.initials) return;
      await apiUpdateTask(task.id, { ...task, assignee: u.initials });
      currentTasks = currentTasks.map(t => t.id === task.id ? { ...t, assignee: u.initials } : t);
      renderTasks(currentTasks);
      renderTeamWorkload(currentTasks);
      toast(`Work reassigned to ${u.name}!`, "success");
    });
    popover.appendChild(item);
  });

  const rect = anchorEl.getBoundingClientRect();
  popover.style.top = `${rect.bottom + window.scrollY + 4}px`;
  popover.style.left = `${rect.left + window.scrollX - 40}px`;
  document.body.appendChild(popover);

  const closeFn = (e) => {
    if (!popover.contains(e.target) && e.target !== anchorEl) {
      popover.remove();
      document.removeEventListener("click", closeFn);
    }
  };
  setTimeout(() => document.addEventListener("click", closeFn), 10);
}

/* ==========================================================================
   ROLE-AWARE DASHBOARD CONTROLLER (Leader Oversight vs Member Deliverables)
   ========================================================================== */
function renderRoleDashboardBanner() {
  const banner = document.getElementById("role-dashboard-banner");
  if (!banner) return;

  const user = getCurrentUser();
  const isLeader = isTeamLeader();
  const allTasks = Store.getTasks();
  const myTasks = allTasks.filter(t => t.assignee === user.initials);
  const users = Store.getUsers();

  if (isLeader) {
    banner.innerHTML = `
      <div class="role-banner-inner is-leader">
        <div class="rb-left">
          <div class="top-user-avatar" style="width: 44px; height: 44px; font-size: 16px; background: #5b5df8; flex-shrink: 0;">${user.initials || "AM"}</div>
          <div>
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 2px;">
              <span style="font-size: 11px; font-weight: 800; padding: 2px 8px; border-radius: 99px; background: #e0e7ff; color: #4338ca; letter-spacing: 0.04em;">🛡️ TEAM LEADER CONTROL</span>
              <span style="font-size: 12px; color: var(--text-subtle);">${users.length} Active Members</span>
            </div>
            <h3 style="font-size: 16px; font-weight: 700; color: var(--text-main); margin: 0 0 2px 0;">Welcome, ${escapeHtml(user.name)}!</h3>
            <p style="font-size: 12.5px; color: var(--text-muted); margin: 0;">Full Team Oversight Mode &bull; Delegate tasks, broadcast directives, and inspect all team member workloads.</p>
          </div>
        </div>
        <div class="rb-actions">
          <button type="button" class="btn btn-primary" id="btn-banner-new-task" style="padding: 7px 14px; font-size: 12.5px;">+ Assign Task</button>
          <button type="button" class="btn btn-secondary" id="btn-banner-scroll-directives" style="padding: 7px 14px; font-size: 12.5px;">📢 Directives (${Store.getTeamUpdates().length})</button>
          <button type="button" class="btn ${activeMemberFilter === null ? 'btn-dark' : 'btn-secondary'}" id="btn-banner-view-all" style="padding: 7px 14px; font-size: 12.5px;">👥 All Work (${allTasks.length})</button>
        </div>
      </div>
    `;

    const btnNewTask = document.getElementById("btn-banner-new-task");
    if (btnNewTask) btnNewTask.addEventListener("click", () => openCreateModal());

    const btnScrollDir = document.getElementById("btn-banner-scroll-directives");
    if (btnScrollDir) {
      btnScrollDir.addEventListener("click", () => {
        const sec = document.getElementById("leader-updates-section");
        if (sec) {
          sec.scrollIntoView({ behavior: "smooth", block: "start" });
          const inp = document.getElementById("leader-directive-input");
          if (inp) inp.focus();
        }
      });
    }

    const btnViewAll = document.getElementById("btn-banner-view-all");
    if (btnViewAll) {
      btnViewAll.addEventListener("click", () => {
        activeMemberFilter = null;
        renderTasks(currentTasks);
        renderTeamWorkload(currentTasks);
        renderRoleDashboardBanner();
        toast("Showing all team tasks", "info");
      });
    }
  } else {
    // Member view
    const isFilteredToMe = activeMemberFilter === user.initials;
    banner.innerHTML = `
      <div class="role-banner-inner is-member">
        <div class="rb-left">
          <div class="top-user-avatar" style="width: 44px; height: 44px; font-size: 16px; background: #10b981; flex-shrink: 0;">${user.initials || "SK"}</div>
          <div>
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 2px;">
              <span style="font-size: 11px; font-weight: 800; padding: 2px 8px; border-radius: 99px; background: #d1fae5; color: #065f46; letter-spacing: 0.04em;">👤 TEAM MEMBER WORKSPACE</span>
              <span style="font-size: 12px; color: var(--text-subtle);">${user.title || 'Engineer'}</span>
            </div>
            <h3 style="font-size: 16px; font-weight: 700; color: var(--text-main); margin: 0 0 2px 0;">Welcome, ${escapeHtml(user.name)}!</h3>
            <p style="font-size: 12.5px; color: var(--text-muted); margin: 0;">Assigned Work View &bull; Review your deliverables, receive directives from Team Leader, and reply with progress updates.</p>
          </div>
        </div>
        <div class="rb-actions">
          <button type="button" class="btn ${isFilteredToMe ? 'btn-primary' : 'btn-secondary'}" id="btn-banner-my-work" style="padding: 7px 14px; font-size: 12.5px;">🎯 My Tasks (${myTasks.length})</button>
          <button type="button" class="btn ${!isFilteredToMe ? 'btn-primary' : 'btn-secondary'}" id="btn-banner-team-work" style="padding: 7px 14px; font-size: 12.5px;">🌐 Team Overview (${allTasks.length})</button>
          <button type="button" class="btn btn-secondary" id="btn-banner-respond" style="padding: 7px 14px; font-size: 12.5px;">💬 Reply to Leader</button>
        </div>
      </div>
    `;

    const btnMyWork = document.getElementById("btn-banner-my-work");
    if (btnMyWork) {
      btnMyWork.addEventListener("click", () => {
        activeMemberFilter = user.initials;
        renderTasks(currentTasks);
        renderTeamWorkload(currentTasks);
        renderRoleDashboardBanner();
        toast("Filtered to your assigned tasks", "info");
      });
    }

    const btnTeamWork = document.getElementById("btn-banner-team-work");
    if (btnTeamWork) {
      btnTeamWork.addEventListener("click", () => {
        activeMemberFilter = null;
        renderTasks(currentTasks);
        renderTeamWorkload(currentTasks);
        renderRoleDashboardBanner();
        toast("Showing all team tasks", "info");
      });
    }

    const btnRespond = document.getElementById("btn-banner-respond");
    if (btnRespond) {
      btnRespond.addEventListener("click", () => {
        const sec = document.getElementById("leader-updates-section");
        if (sec) {
          sec.scrollIntoView({ behavior: "smooth", block: "start" });
          const inp = sec.querySelector(".member-reply-input");
          if (inp) inp.focus();
        }
      });
    }
  }
}

function renderLeaderUpdatesSection() {
  const container = document.getElementById("leader-updates-section");
  if (!container) return;

  const user = getCurrentUser();
  const isLeader = isTeamLeader();
  const updates = Store.getTeamUpdates();
  const users = Store.getUsers();

  let html = `
    <div class="directives-panel" id="directives-feed-container">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; flex-wrap: wrap; gap: 8px;">
        <div>
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="font-size: 18px;">⚡</span>
            <h2 style="font-size: 16px; font-weight: 700; color: var(--text-main); margin: 0;">Team Directives & Leader Updates</h2>
            <span style="font-size: 11px; font-weight: 700; padding: 2px 7px; border-radius: 99px; background: #e0e7ff; color: #4338ca;">${updates.length} Active</span>
          </div>
          <p style="font-size: 12.5px; color: var(--text-muted); margin: 3px 0 0 0;">
            ${isLeader ? "Broadcast priorities, sprint notes, and instructions to your team members." : "Read directives from your Team Leader and reply with your real-time status."}
          </p>
        </div>
      </div>
  `;

  // Leader Composer
  if (isLeader) {
    html += `
      <div class="directive-composer-box">
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; flex-wrap: wrap; gap: 8px;">
          <span style="font-size: 12.5px; font-weight: 700; color: var(--text-main);">📢 Broadcast New Directive to Team</span>
          <div style="display: flex; align-items: center; gap: 6px;">
            <label for="directive-target-select" style="font-size: 11.5px; color: var(--text-subtle);">Direct to:</label>
            <select id="directive-target-select" style="padding: 3px 8px; border-radius: 6px; border: 1px solid var(--border-subtle); background: var(--bg-card); color: var(--text-main); font-size: 12px;">
              <option value="All Team">@All Team</option>
              ${users.filter(u => u.id !== user.id).map(u => `<option value="${escapeHtml(u.name)}">@${escapeHtml(u.name)} (${escapeHtml(u.role)})</option>`).join("")}
            </select>
          </div>
        </div>
        <textarea id="leader-directive-input" class="directive-textarea" rows="2" placeholder="Write instructions, sprint priorities, or assign deliverables to the team..."></textarea>
        <div class="directive-composer-footer">
          <div style="display: flex; gap: 6px; flex-wrap: wrap;">
            <button type="button" class="btn-quick-fill directive-template-btn" data-tmpl="Please update your task statuses and add progress notes before EOD sprint sync.">📋 Sprint Sync Reminder</button>
            <button type="button" class="btn-quick-fill directive-template-btn" data-tmpl="Priority shift: focus on Mobile Responsive Testing and Checkout bug before new features.">🎯 Priority Focus</button>
            <button type="button" class="btn-quick-fill directive-template-btn" data-tmpl="Staging environment is updated and ready for QA verification.">🚀 Staging Ready</button>
          </div>
          <button type="button" class="btn btn-primary" id="btn-broadcast-directive" style="padding: 7px 16px; font-size: 13px;">📢 Broadcast Directive</button>
        </div>
      </div>
    `;
  }

  // Directives Feed
  html += `<div style="display: flex; flex-direction: column; gap: 14px;">`;
  if (updates.length === 0) {
    html += `<div style="text-align: center; padding: 24px; color: var(--text-subtle); font-size: 13px;">No directives posted yet.</div>`;
  } else {
    updates.forEach(d => {
      const respCount = (d.responses || []).length;
      html += `
        <div class="directive-item-card" data-id="${d.id}">
          <div class="directive-head">
            <div style="display: flex; align-items: center; gap: 10px;">
              <span class="assignee-avatar ${d.fromColor || 'av-blue'}" style="width: 28px; height: 28px; font-size: 11px;">${escapeHtml(d.fromInitials || 'AM')}</span>
              <div>
                <div style="display: flex; align-items: center; gap: 6px;">
                  <strong style="font-size: 13px; color: var(--text-main);">${escapeHtml(d.from)}</strong>
                  <span style="font-size: 9.5px; font-weight: 700; padding: 1px 6px; border-radius: 99px; background: #e0e7ff; color: #4338ca;">${escapeHtml(d.fromRole || 'Team Leader')}</span>
                  <span style="font-size: 11px; padding: 1px 6px; border-radius: 4px; background: var(--bg-hover); color: var(--text-muted); font-weight: 600;">To: @${escapeHtml(d.to || 'All Team')}</span>
                </div>
                <span style="font-size: 11px; color: var(--text-subtle);">${escapeHtml(d.timestamp || 'Today')}</span>
              </div>
            </div>
            <span style="font-size: 11px; color: var(--text-subtle); font-weight: 600;">${respCount} ${respCount === 1 ? 'Response' : 'Responses'}</span>
          </div>

          <p class="directive-body-text">${escapeHtml(d.message)}</p>

          <!-- Responses Box -->
          <div class="directive-responses-box">
            <div style="display: flex; flex-direction: column; gap: 8px;">
              ${(d.responses || []).map(r => `
                <div class="member-response-item">
                  <span class="assignee-avatar ${r.memberColor || 'av-green'}" style="width: 22px; height: 22px; font-size: 9.5px; flex-shrink: 0;">${escapeHtml(r.memberInitials || 'SK')}</span>
                  <div style="flex: 1;">
                    <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 2px;">
                      <strong style="font-size: 11.5px; color: var(--text-main);">${escapeHtml(r.memberName)}</strong>
                      <span style="font-size: 10px; color: var(--text-subtle);">${escapeHtml(r.timestamp || 'Just now')}</span>
                    </div>
                    <div style="font-size: 12px; color: var(--text-body);">${escapeHtml(r.text)}</div>
                  </div>
                </div>
              `).join("")}
              ${(!d.responses || d.responses.length === 0) ? `<div style="font-size: 11.5px; color: var(--text-subtle); padding: 4px 0;">No responses from team members yet.</div>` : ''}
            </div>

            <!-- Member Reply Box -->
            ${!isLeader ? `
              <div class="member-reply-composer-box" style="margin-top: 10px; margin-bottom: 0;">
                <div style="display: flex; gap: 6px; margin-bottom: 8px; flex-wrap: wrap;">
                  <button type="button" class="btn-quick-fill member-quick-pill" data-dir-id="${d.id}" data-text="✅ Finished: ">✅ Finished</button>
                  <button type="button" class="btn-quick-fill member-quick-pill" data-dir-id="${d.id}" data-text="⏳ Working on this: ">⏳ In Progress</button>
                  <button type="button" class="btn-quick-fill member-quick-pill" data-dir-id="${d.id}" data-text="⚠️ Blocked on: ">⚠️ Blocked</button>
                  <button type="button" class="btn-quick-fill member-quick-pill" data-dir-id="${d.id}" data-text="🚀 Ready for QA Review: ">🚀 Ready for QA</button>
                </div>
                <div style="display: flex; gap: 8px;">
                  <input type="text" class="form-input member-reply-input" id="reply-input-${d.id}" data-directive-id="${d.id}" placeholder="Reply to ${escapeHtml(d.from)} with your progress update..." style="font-size: 12.5px; padding: 6px 10px; flex: 1;">
                  <button type="button" class="btn btn-primary btn-submit-member-reply" data-directive-id="${d.id}" style="padding: 6px 14px; font-size: 12px; flex-shrink: 0;">Send Update</button>
                </div>
              </div>
            ` : ''}
          </div>
        </div>
      `;
    });
  }
  html += `</div></div>`;

  container.innerHTML = html;

  // Leader Broadcast Handler
  if (isLeader) {
    const btnBroadcast = document.getElementById("btn-broadcast-directive");
    const inputDir = document.getElementById("leader-directive-input");
    const targetSelect = document.getElementById("directive-target-select");

    // Template buttons
    container.querySelectorAll(".directive-template-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        if (inputDir) {
          inputDir.value = btn.dataset.tmpl || "";
          inputDir.focus();
        }
      });
    });

    if (btnBroadcast && inputDir) {
      btnBroadcast.addEventListener("click", () => {
        const text = inputDir.value.trim();
        if (!text) {
          toast("Please enter a directive message", "warning");
          return;
        }
        const target = targetSelect ? targetSelect.value : "All Team";
        const newDir = {
          id: Date.now(),
          from: user.name,
          fromRole: user.role,
          fromInitials: user.initials,
          fromColor: user.color || "av-blue",
          to: target,
          message: text,
          timestamp: "Just now",
          responses: []
        };
        const allUpdates = Store.getTeamUpdates();
        allUpdates.unshift(newDir);
        Store.saveTeamUpdates(allUpdates);
        inputDir.value = "";
        renderLeaderUpdatesSection();
        renderRoleDashboardBanner();
        toast(`Directive broadcast to ${target}!`, "success");
      });
    }
  }

  // Member Quick Pills & Reply Handlers
  container.querySelectorAll(".member-quick-pill").forEach(pill => {
    pill.addEventListener("click", () => {
      const dirId = pill.dataset.dirId;
      const inp = document.getElementById(`reply-input-${dirId}`);
      if (inp) {
        inp.value = pill.dataset.text || "";
        inp.focus();
      }
    });
  });

  container.querySelectorAll(".btn-submit-member-reply").forEach(btn => {
    btn.addEventListener("click", () => {
      const dirId = parseInt(btn.dataset.directiveId, 10);
      const inp = document.getElementById(`reply-input-${dirId}`);
      if (!inp) return;
      const text = inp.value.trim();
      if (!text) {
        toast("Please write your update message", "warning");
        return;
      }
      const allUpdates = Store.getTeamUpdates();
      const targetDir = allUpdates.find(d => d.id === dirId);
      if (targetDir) {
        targetDir.responses = targetDir.responses || [];
        targetDir.responses.push({
          id: Date.now(),
          memberName: user.name,
          memberInitials: user.initials,
          memberColor: user.color || "av-emerald",
          text: text,
          timestamp: "Just now"
        });
        Store.saveTeamUpdates(allUpdates);
        renderLeaderUpdatesSection();
        toast(`Progress update submitted to ${targetDir.from}!`, "success");
      }
    });
  });
}

/* ==========================================================================
   VIEW CONTROLLER: LANDING PAGE VS WORKSPACE
   ========================================================================== */
function showLandingPage() {
  const landing = document.getElementById("landing-page-view");
  const workspace = document.getElementById("workspace");
  const mobileHeader = document.getElementById("mobile-header");

  document.body.classList.add("has-landing-active");
  if (landing) landing.hidden = false;
  if (workspace) workspace.hidden = true;
  if (mobileHeader) mobileHeader.style.display = "none";

  try {
    sessionStorage.setItem("flowtask_view", "landing");
    if (window.location.hash !== "#landing") {
      history.replaceState(null, "", "#landing");
    }
  } catch (_) {}
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function showWorkspace() {
  const landing = document.getElementById("landing-page-view");
  const workspace = document.getElementById("workspace");
  const mobileHeader = document.getElementById("mobile-header");

  document.body.classList.remove("has-landing-active");
  if (landing) landing.hidden = true;
  if (workspace) workspace.hidden = false;
  if (mobileHeader && isMobile()) mobileHeader.style.display = "flex";

  try {
    sessionStorage.setItem("flowtask_view", "workspace");
    if (window.location.hash === "#landing") {
      history.replaceState(null, "", "#workspace");
    }
  } catch (_) {}
  applyMobileLayout();
  renderRoleDashboardBanner();
  renderLeaderUpdatesSection();
}

function openAuthModal(tab = "switch") {
  const authModal = document.getElementById("auth-modal");
  if (!authModal) return;
  renderAuthModalContent();
  switchAuthTab(tab);
  authModal.showModal();
}

function renderAuthModalContent() {
  const u = getCurrentUser();
  const csbAvatar = document.getElementById("csb-avatar");
  const csbName = document.getElementById("csb-name");
  const csbEmail = document.getElementById("csb-email");
  const csbRole = document.getElementById("csb-role");
  const rosterCount = document.getElementById("team-roster-count");

  if (csbAvatar && u) csbAvatar.textContent = u.initials;
  if (csbName && u) csbName.textContent = u.name;
  if (csbEmail && u) csbEmail.textContent = u.email;
  if (csbRole && u) {
    const isLead = u.role === "Team Leader";
    csbRole.textContent = isLead ? "👑 Team Leader" : "👤 Team Member";
    csbRole.className = `badge-role-tag ${isLead ? "badge-leader" : "badge-member"}`;
  }

  const users = Store.getUsers();
  if (rosterCount) rosterCount.textContent = users.length;

  const grid = document.getElementById("auth-team-cards-grid");
  if (!grid) return;
  grid.innerHTML = "";

  users.forEach(user => {
    const card = document.createElement("div");
    const isCurrent = u && u.id === user.id;
    card.className = "team-card-item" + (isCurrent ? " is-current" : "");

    const isLead = user.role === "Team Leader";
    const roleBadge = isLead
      ? `<span class="badge-role-tag badge-leader" style="font-size:10px; padding:2px 8px;">👑 Team Leader</span>`
      : `<span class="badge-role-tag badge-member" style="font-size:10px; padding:2px 8px;">👤 Member</span>`;

    card.innerHTML = `
      <div class="tci-left">
        <span class="assignee-avatar ${user.color || 'av-blue'}">${user.initials}</span>
        <div class="tci-info">
          <div class="tci-name">${user.name} ${roleBadge}</div>
          <div class="tci-meta">${user.email} · ${user.title || user.role}</div>
        </div>
      </div>
      <div>
        ${isCurrent 
          ? `<span class="btn-switch-user is-active-btn">✓ Active Session</span>`
          : `<button type="button" class="btn-switch-user">Switch to user</button>`}
      </div>
    `;

    card.addEventListener("click", () => {
      setCurrentUser(user);
      renderAuthModalContent();
      const authModal = document.getElementById("auth-modal");
      if (authModal) authModal.close();
      showWorkspace();
      toast(`Switched session to: ${user.name} (${user.role})!`, "success");
    });

    grid.appendChild(card);
  });
}

function switchAuthTab(tabId) {
  const tabs = ["switch", "create", "login"];
  tabs.forEach(t => {
    const btn = document.getElementById(`auth-tab-${t}`);
    const panel = document.getElementById(`auth-panel-${t}`);
    if (btn) btn.classList.toggle("is-active", t === tabId);
    if (panel) panel.hidden = (t !== tabId);
  });
}

/* ==========================================================================
   STATS BAR & METRIC CARDS UPDATER
   ========================================================================== */
async function loadProjectStats(projectId) {
  try {
    const stats    = await apiProjectStats(projectId);
    const byStatus = Object.fromEntries(stats.by_status.map(r => [r.status, r.count]));

    if (statTotal) statTotal.textContent = `Total: ${stats.total_tasks}`;
    if (statTodo)  statTodo.textContent  = `To Do: ${byStatus.todo ?? 0}`;
    if (statIp)    statIp.textContent    = `In Progress: ${byStatus.in_progress ?? 0}`;
    if (statDone)  statDone.textContent  = `Done: ${byStatus.done ?? 0}`;
    if (projectStats) projectStats.hidden = false;

    // Update 4 Top Metric Cards
    const mTotal = document.getElementById("card-metric-total");
    const mDone  = document.getElementById("card-metric-completed");
    const mIp    = document.getElementById("card-metric-inprogress");
    const mTodo  = document.getElementById("card-metric-overdue");
    const gTotal = document.getElementById("gauge-total-val");
    const lDone  = document.getElementById("legend-completed-val");
    const lIp    = document.getElementById("legend-ip-val");
    const lRev   = document.getElementById("legend-review-val");
    const lBack  = document.getElementById("legend-backlog-val");

    const totalTasks     = stats.total_tasks;
    const completedTasks = byStatus.done ?? 0;
    const inProgTasks    = byStatus.in_progress ?? 0;
    const reviewTasks    = byStatus.review ?? 0;
    const backlogTasks   = byStatus.todo ?? 0;

    if (mTotal) mTotal.textContent = totalTasks;
    if (mDone)  mDone.textContent  = completedTasks;
    if (mIp)    mIp.textContent    = inProgTasks;
    if (mTodo)  mTodo.textContent  = backlogTasks;
    if (gTotal) gTotal.textContent = totalTasks;
    if (lDone)  lDone.textContent  = completedTasks;
    if (lIp)    lIp.textContent    = inProgTasks;
    if (lRev)   lRev.textContent   = reviewTasks;
    if (lBack)  lBack.textContent  = backlogTasks;

    // Update Sprint Box Progress
    const sprintText = document.getElementById("sprint-details-text");
    const sprintFill = document.getElementById("sprint-progress-fill");
    if (sprintText && sprintFill) {
      const pct = totalTasks ? Math.round((completedTasks / totalTasks) * 100) : 75;
      sprintText.textContent = `${completedTasks}/${totalTasks} tasks done · 2 days left`;
      sprintFill.style.width = `${pct}%`;
    }

    const myBadge = document.getElementById("sidebar-my-tasks-badge");
    if (myBadge) myBadge.textContent = inProgTasks + backlogTasks;

  } catch (_) {
    if (projectStats) projectStats.hidden = true;
  }
}

/* ==========================================================================
   NAVIGATION & ACTIONS
   ========================================================================== */
async function selectUser(user) {
  selectedUserId   = user.id;
  selectedUserName = user.name;

  document.querySelectorAll("#user-list .entity-card").forEach(el =>
    el.classList.toggle("is-selected", Number(el.dataset.id) === user.id)
  );

  const dispUser = document.getElementById("user-display-name");
  if (dispUser) dispUser.textContent = user.name;
  const dispInit = document.getElementById("user-avatar-initial");
  if (dispInit) dispInit.textContent = (user.name || "A").charAt(0).toUpperCase();

  updateBreadcrumb(user.name, selectedProjectTitle);
  if (btnToggleProjectForm) btnToggleProjectForm.disabled = false;

  if (isMobile()) pushView("projects");
}

async function selectProject(project) {
  selectedProjectId    = project.id;
  selectedProjectTitle = project.title;

  document.querySelectorAll("#project-list .entity-card").forEach(el =>
    el.classList.toggle("is-selected", Number(el.dataset.id) === project.id)
  );

  const disp = document.getElementById("selected-project-display");
  if (disp) disp.textContent = project.title;
  if (bcProject) bcProject.textContent = project.title;
  if (btnToggleTaskForm) btnToggleTaskForm.disabled = false;

  await loadTasksForProject(project.id);
  await loadProjectStats(project.id);

  const dashContent = document.getElementById("dashboard-view-content");
  if (dashContent) dashContent.scrollTop = 0;

  if (isMobile()) pushView("tasks");
}

async function loadTasksForProject(projectId) {
  const sort = sortBy ? sortBy.value || undefined : undefined;
  try {
    const live = await apiListTasks(projectId, sort);
    currentTasks = live;
    renderTasks(currentTasks);
    renderTeamWorkload(currentTasks);
    updateActiveUserUI();
  } catch (err) {
    showAlert("Failed to load tasks: " + err.message, true);
  }
}

async function loadUsers() {
  try {
    const users = await apiListUsers();
    renderUsers(users);
    updateAssigneeSelectOptions();
    renderTeamWorkload(currentTasks);
  } catch (_) {
    const users = Store.getUsers();
    renderUsers(users);
    updateAssigneeSelectOptions();
    renderTeamWorkload(currentTasks);
  }
}

async function loadProjects() {
  try {
    const projs = await apiListProjects();
    renderProjects(projs);
  } catch (_) {
    renderProjects(Store.getProjects());
  }
}

function updateBreadcrumb(userName, projectTitle) {
  if (bcUser)    bcUser.textContent    = userName     ?? "Alex Morgan";
  if (bcProject) bcProject.textContent = projectTitle ?? "FlowTask App";
}

/* ==========================================================================
   CRUD HANDLERS (Users, Projects, Tasks)
   ========================================================================== */
async function handleDeleteUser(id) {
  if (!confirm("Delete this user?")) return;
  try {
    await apiDeleteUser(id);
    await loadUsers();
    toast("User removed.", "info");
  } catch (err) {
    showAlert("Could not delete user: " + err.message, true);
  }
}

async function handleDeleteProject(id) {
  if (!confirm("Delete this project and all its tasks?")) return;
  try {
    await apiDeleteProject(id);
    const remaining = Store.getProjects();
    renderProjects(remaining);
    if (remaining.length) {
      await selectProject(remaining[0]);
    } else {
      currentTasks = [];
      renderTasks(currentTasks);
    }
    toast("Project deleted.", "info");
  } catch (err) {
    showAlert("Could not delete project: " + err.message, true);
  }
}

async function handleDeleteTask(id) {
  if (!confirm("Delete this task?")) return;
  try {
    await apiDeleteTask(id);
    currentTasks = currentTasks.filter(t => t.id !== id);
    renderTasks(currentTasks);
    await loadProjectStats(selectedProjectId);
    toast("Task deleted.", "info");
  } catch (err) {
    showAlert("Could not delete task: " + err.message, true);
  }
}

function openEditModal(task) {
  if (!editModal) return;
  editTaskId.value    = task.id;
  editTitle.value     = task.title;
  editDesc.value      = task.description || "";
  editPriority.value  = task.priority || "medium";
  editStatus.value    = task.status || "todo";
  editDue.value       = task.due_date || "";
  const editAssignee  = document.getElementById("edit-assignee");
  if (editAssignee) editAssignee.value = task.assignee || "AM";
  if (editTitleErr) editTitleErr.textContent = "";
  editModal.showModal();
}

function togglePanel(formEl, btnEl) {
  if (!formEl) return;
  const isHidden = formEl.hidden;
  formEl.hidden = !isHidden;
  if (btnEl) btnEl.setAttribute("aria-expanded", String(isHidden));
  if (isHidden) {
    const firstInput = formEl.querySelector("input, select, textarea");
    if (firstInput) firstInput.focus();
  }
}

/* ==========================================================================
   EVENT WIRING & PRODUCTION INTERACTIONS
   ========================================================================== */
function setupAllButtonsAndListeners() {
  
  // 1. Sidebar Toggle
  const sidebarToggle = document.getElementById("btn-sidebar-toggle");
  const sidebar = document.getElementById("app-sidebar");
  if (sidebarToggle && sidebar) {
    sidebarToggle.addEventListener("click", () => {
      sidebar.classList.toggle("collapsed");
    });
  }

  // 2. Brand logo returns to Dashboard
  const brandBtn = document.getElementById("brand-home-btn");
  if (brandBtn) {
    brandBtn.addEventListener("click", () => {
      const tabDash = document.getElementById("tab-dashboard");
      if (tabDash) tabDash.click();
    });
  }

  // 3. Navigation Links
  const navHome     = document.getElementById("nav-home");
  const navMyTasks  = document.getElementById("nav-my-tasks");
  const navInbox    = document.getElementById("nav-inbox");
  const navMessages = document.getElementById("nav-messages");
  const navReport   = document.getElementById("nav-reporting");
  const navPorts    = document.getElementById("nav-portfolios");
  const navGoals    = document.getElementById("nav-goals");

  if (navHome) {
    navHome.addEventListener("click", (e) => {
      e.preventDefault();
      document.querySelectorAll(".nav-link").forEach(l => l.classList.remove("is-active"));
      navHome.classList.add("is-active");
      activeMemberFilter = null;
      document.querySelectorAll("#workload-members-list .clickable-member").forEach(m => m.classList.remove("is-selected-member"));
      const tabDash = document.getElementById("tab-dashboard");
      if (tabDash) tabDash.click();
      renderRoleDashboardBanner();
      renderTasks(currentTasks);
      renderTeamWorkload(currentTasks);
    });
  }

  if (navMyTasks) {
    navMyTasks.addEventListener("click", (e) => {
      e.preventDefault();
      document.querySelectorAll(".nav-link").forEach(l => l.classList.remove("is-active"));
      navMyTasks.classList.add("is-active");
      const cur = getCurrentUser();
      activeMemberFilter = cur ? cur.initials : "AM";
      const tabDash = document.getElementById("tab-dashboard");
      if (tabDash) tabDash.click();
      renderRoleDashboardBanner();
      renderTasks(currentTasks);
      renderTeamWorkload(currentTasks);
      toast(`Showing tasks assigned to ${cur ? cur.name : 'you'}`, "info");
    });
  }

  if (navInbox) {
    navInbox.addEventListener("click", (e) => {
      e.preventDefault();
      const notifPopover = document.getElementById("notifications-popover");
      if (notifPopover) notifPopover.hidden = !notifPopover.hidden;
    });
  }

  if (navMessages) {
    navMessages.addEventListener("click", (e) => {
      e.preventDefault();
      const notifPopover = document.getElementById("notifications-popover");
      if (notifPopover) notifPopover.hidden = false;
    });
  }

  if (navReport) {
    navReport.addEventListener("click", (e) => {
      e.preventDefault();
      const tabOv = document.getElementById("tab-overview");
      if (tabOv) tabOv.click();
    });
  }

  if (navPorts) {
    navPorts.addEventListener("click", (e) => {
      e.preventDefault();
      const tabWf = document.getElementById("tab-workflow");
      if (tabWf) tabWf.click();
    });
  }

  if (navGoals) {
    navGoals.addEventListener("click", (e) => {
      e.preventDefault();
      const tabOv = document.getElementById("tab-overview");
      if (tabOv) tabOv.click();
    });
  }

  // 4. View Tabs Controller
  const tabIds = ["dashboard", "overview", "list", "board", "calendar", "workflow"];
  tabIds.forEach(id => {
    const tabBtn = document.getElementById(`tab-${id}`);
    if (tabBtn) {
      tabBtn.addEventListener("click", () => {
        tabIds.forEach(otherId => {
          const b = document.getElementById(`tab-${otherId}`);
          if (b) b.classList.toggle("is-active", otherId === id);
        });

        // Toggle content containers
        const dashContent   = document.getElementById("dashboard-view-content");
        const ovContent     = document.getElementById("overview-view-content");
        const boardContent  = document.getElementById("board-view-content");
        const calContent    = document.getElementById("calendar-view-content");
        const wfContent     = document.getElementById("workflow-view-content");
        const filterToolbar = document.getElementById("filter-toolbar");
        const chartsRow     = document.querySelector(".charts-row");
        const metricsGrid   = document.querySelector(".metrics-grid");

        if (id === "dashboard") {
          if (dashContent) {
            dashContent.hidden = false;
            dashContent.scrollTop = 0;
          }
          if (ovContent)    ovContent.hidden    = true;
          if (boardContent) boardContent.hidden = true;
          if (calContent)   calContent.hidden   = true;
          if (wfContent)    wfContent.hidden    = true;
          if (filterToolbar) filterToolbar.classList.remove("is-open");
          if (chartsRow)    chartsRow.style.display = "";
          if (metricsGrid)  metricsGrid.style.display = "";
        } else if (id === "overview") {
          if (dashContent)  dashContent.hidden  = true;
          if (ovContent)    ovContent.hidden    = false;
          if (boardContent) boardContent.hidden = true;
          if (calContent)   calContent.hidden   = true;
          if (wfContent)    wfContent.hidden    = true;
          renderWorkflowView(currentTasks);
        } else if (id === "list") {
          if (dashContent) {
            dashContent.hidden = false;
            dashContent.scrollTop = 0;
          }
          if (ovContent)    ovContent.hidden    = true;
          if (boardContent) boardContent.hidden = true;
          if (calContent)   calContent.hidden   = true;
          if (wfContent)    wfContent.hidden    = true;
          if (filterToolbar) filterToolbar.classList.add("is-open");
          if (chartsRow)    chartsRow.style.display = "none";
          if (metricsGrid)  metricsGrid.style.display = "none";
        } else if (id === "board") {
          if (dashContent)  dashContent.hidden  = true;
          if (ovContent)    ovContent.hidden    = true;
          if (boardContent) boardContent.hidden = false;
          if (calContent)   calContent.hidden   = true;
          if (wfContent)    wfContent.hidden    = true;
          renderKanbanBoard(currentTasks);
        } else if (id === "calendar") {
          if (dashContent)  dashContent.hidden  = true;
          if (ovContent)    ovContent.hidden    = true;
          if (boardContent) boardContent.hidden = true;
          if (calContent)   calContent.hidden   = false;
          if (wfContent)    wfContent.hidden    = true;
          renderCalendarView(currentTasks);
        } else if (id === "workflow") {
          if (dashContent)  dashContent.hidden  = true;
          if (ovContent)    ovContent.hidden    = true;
          if (boardContent) boardContent.hidden = true;
          if (calContent)   calContent.hidden   = true;
          if (wfContent)    wfContent.hidden    = false;
          renderWorkflowView(currentTasks);
        }
      });
    }
  });

  // 5. Sub-header Actions (Group, Hide, Filter)
  const btnGroup = document.getElementById("btn-group-view");
  const groupText = document.getElementById("group-btn-text");
  if (btnGroup) {
    btnGroup.addEventListener("click", () => {
      const modes = ["none", "status", "priority", "assignee"];
      const nextIdx = (modes.indexOf(activeGroupMode) + 1) % modes.length;
      activeGroupMode = modes[nextIdx];
      if (groupText) {
        groupText.textContent = activeGroupMode === "none" ? "Group" : `Group: ${activeGroupMode.toUpperCase()}`;
      }
      btnGroup.classList.toggle("is-active-action", activeGroupMode !== "none");
      renderTasks(currentTasks);
    });
  }

  const btnHide = document.getElementById("btn-hide-view");
  const hideText = document.getElementById("hide-btn-text");
  if (btnHide) {
    btnHide.addEventListener("click", () => {
      hideCompleted = !hideCompleted;
      btnHide.classList.toggle("is-active-action", hideCompleted);
      if (hideText) hideText.textContent = hideCompleted ? "Show All" : "Hide";
      renderTasks(currentTasks);
    });
  }

  const btnFilterToggle = document.getElementById("btn-filter-toggle");
  const filterToolbar = document.getElementById("filter-toolbar");
  if (btnFilterToggle && filterToolbar) {
    btnFilterToggle.addEventListener("click", () => {
      filterToolbar.classList.toggle("is-open");
    });
  }

  // 6. Top Header Actions (Project Dropdown, New Page, Search, Notifications, Theme, New Task)
  const btnProjectDropdown = document.getElementById("btn-project-dropdown");
  const projectDropdownMenu = document.getElementById("project-dropdown-menu");
  const btnCloseProjectDropdown = document.getElementById("btn-close-project-dropdown");
  if (btnProjectDropdown && projectDropdownMenu) {
    btnProjectDropdown.addEventListener("click", (e) => {
      e.stopPropagation();
      projectDropdownMenu.hidden = !projectDropdownMenu.hidden;
    });
  }
  if (btnCloseProjectDropdown && projectDropdownMenu) {
    btnCloseProjectDropdown.addEventListener("click", () => {
      projectDropdownMenu.hidden = true;
    });
  }

  const btnDropdownAddProject = document.getElementById("btn-dropdown-add-project");
  if (btnDropdownAddProject) {
    btnDropdownAddProject.addEventListener("click", () => {
      if (projectDropdownMenu) projectDropdownMenu.hidden = true;
      if (projectCreateForm && btnToggleProjectForm) togglePanel(projectCreateForm, btnToggleProjectForm);
    });
  }

  const btnNewPage = document.getElementById("btn-new-page");
  if (btnNewPage) {
    btnNewPage.addEventListener("click", async () => {
      const title = prompt("Enter new project / page title:");
      if (!title || !title.trim()) return;
      const created = await apiCreateProject({ title: title.trim(), owner_id: selectedUserId });
      await loadProjects();
      await selectProject(created);
      toast(`Created page: ${created.title}!`, "success");
    });
  }

  // 7. Search Input & Algorithms Benchmark Reporting
  if (taskSearchInput) {
    taskSearchInput.addEventListener("input", () => {
      const q = taskSearchInput.value.trim();
      if (btnSearchClear) btnSearchClear.hidden = q === "";
      renderTasks(currentTasks);
    });

    taskSearchInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        runSearchAlgorithm();
      }
    });
  }

  if (btnSearch) btnSearch.addEventListener("click", runSearchAlgorithm);

  async function runSearchAlgorithm() {
    const q = taskSearchInput.value.trim();
    if (!q) return;
    const algo = searchAlgo ? searchAlgo.value : "binary";
    try {
      const found = await apiSearchTask(q, algo);
      renderTasks([found]);
      if (btnSearchClear) btnSearchClear.hidden = false;
      const comps = found._comparisons ?? (algo === "binary" ? 2 : 5);
      toast(`Found "${found.title}" via ${algo} search (${comps} comparisons).`, "info");
    } catch (err) {
      toast(err.message, "error");
    }
  }

  if (btnSearchClear) {
    btnSearchClear.addEventListener("click", () => {
      taskSearchInput.value = "";
      btnSearchClear.hidden = true;
      renderTasks(currentTasks);
    });
  }

  // 8. Notifications Bell
  const btnBell = document.getElementById("btn-notification-bell");
  const notifPopover = document.getElementById("notifications-popover");
  if (btnBell && notifPopover) {
    btnBell.addEventListener("click", (e) => {
      e.stopPropagation();
      notifPopover.hidden = !notifPopover.hidden;
    });
  }

  const btnMarkRead = document.getElementById("btn-mark-all-read");
  const notifDot = document.getElementById("nav-notification-dot");
  if (btnMarkRead) {
    btnMarkRead.addEventListener("click", () => {
      document.querySelectorAll(".notif-item").forEach(item => item.classList.remove("unread"));
      if (notifDot) notifDot.style.display = "none";
      toast("All notifications marked as read.", "info");
    });
  }

  // 9. Theme Toggle
  const btnThemeToggle = document.getElementById("btn-theme-toggle");
  if (btnThemeToggle) {
    btnThemeToggle.addEventListener("click", () => {
      const isDark = document.body.classList.toggle("dark-theme");
      localStorage.setItem(STORE_KEY_THEME, isDark ? "dark" : "light");
      if (settingsToggleTheme) settingsToggleTheme.checked = isDark;
      toast(`Switched to ${isDark ? "Dark" : "Light"} mode.`, "info");
    });
  }

  // Load saved theme
  const savedTheme = localStorage.getItem(STORE_KEY_THEME);
  if (savedTheme === "dark") {
    document.body.classList.add("dark-theme");
    if (settingsToggleTheme) settingsToggleTheme.checked = true;
  }

  // 10. Metric Cards Quick Filter Clicks
  const cardAll = document.getElementById("card-filter-all");
  const cardDone = document.getElementById("card-filter-done");
  const cardIp = document.getElementById("card-filter-ip");
  const cardOverdue = document.getElementById("card-filter-overdue");

  if (cardAll) {
    cardAll.addEventListener("click", () => {
      if (filterStatus) filterStatus.value = "all";
      activeMemberFilter = null;
      renderTasks(currentTasks);
    });
  }

  if (cardDone) {
    cardDone.addEventListener("click", () => {
      if (filterStatus) filterStatus.value = "done";
      activeMemberFilter = null;
      renderTasks(currentTasks);
    });
  }

  if (cardIp) {
    cardIp.addEventListener("click", () => {
      if (filterStatus) filterStatus.value = "in_progress";
      activeMemberFilter = null;
      renderTasks(currentTasks);
    });
  }

  if (cardOverdue) {
    cardOverdue.addEventListener("click", () => {
      if (filterStatus) filterStatus.value = "todo";
      activeMemberFilter = null;
      renderTasks(currentTasks);
    });
  }

  // 11. Status Gauge Legend Clicks
  document.querySelectorAll(".status-legend-list .legend-clickable").forEach(row => {
    row.addEventListener("click", () => {
      const st = row.dataset.status;
      if (filterStatus) filterStatus.value = st;
      renderTasks(currentTasks);
    });
  });

  // 12. Team Workload Member Clicks
  document.querySelectorAll("#workload-members-list .clickable-member").forEach(item => {
    item.addEventListener("click", () => {
      const initials = item.dataset.initials;
      if (activeMemberFilter === initials) {
        activeMemberFilter = null;
        item.classList.remove("is-selected-member");
      } else {
        document.querySelectorAll("#workload-members-list .clickable-member").forEach(m => m.classList.remove("is-selected-member"));
        activeMemberFilter = initials;
        item.classList.add("is-selected-member");
      }
      renderTasks(currentTasks);
    });
  });

  // 13. Sprint Box Click
  const sprintBox = document.getElementById("btn-sprint-info");
  if (sprintBox) {
    sprintBox.addEventListener("click", () => {
      const tabOv = document.getElementById("tab-overview");
      if (tabOv) tabOv.click();
    });
  }

  // 14. View All Link
  const viewAllLink = document.getElementById("link-view-all");
  if (viewAllLink) {
    viewAllLink.addEventListener("click", (e) => {
      e.preventDefault();
      const tabList = document.getElementById("tab-list");
      if (tabList) tabList.click();
    });
  }

  // 15. Task Form Toggle & Submissions
  if (btnToggleTaskForm) {
    btnToggleTaskForm.addEventListener("click", () => {
      togglePanel(taskCreateForm, btnToggleTaskForm);
    });
  }

  if (btnCancelTask) {
    btnCancelTask.addEventListener("click", () => {
      formNewTask.reset();
      if (tTitleErr) tTitleErr.textContent = "";
      togglePanel(taskCreateForm, btnToggleTaskForm);
    });
  }

  const btnCloseTaskForm = document.getElementById("btn-close-task-form");
  if (btnCloseTaskForm) {
    btnCloseTaskForm.addEventListener("click", () => {
      togglePanel(taskCreateForm, btnToggleTaskForm);
    });
  }

  if (formNewTask) {
    formNewTask.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (!validateField(tTitle, tTitleErr, "Task title is required.")) return;

      const tAssignee = document.getElementById("t-assignee");
      const cur = getCurrentUser();
      const assigneeVal = tAssignee && tAssignee.value ? tAssignee.value : (cur ? cur.initials : "AM");

      try {
        const created = await apiCreateTask({
          title: tTitle.value.trim(),
          description: tDesc.value.trim() || null,
          priority: tPriority.value,
          due_date: tDue.value || null,
          status: "todo",
          project_id: selectedProjectId,
          assignee: assigneeVal
        });

        currentTasks.unshift(created);
        formNewTask.reset();
        togglePanel(taskCreateForm, btnToggleTaskForm);
        renderTasks(currentTasks);
        renderTeamWorkload(currentTasks);
        await loadProjectStats(selectedProjectId);

        const assignedUser = Store.getUsers().find(u => u.initials === assigneeVal);
        const assigneeName = assignedUser ? assignedUser.name : assigneeVal;
        toast(`Task created and assigned to ${assigneeName}!`, "success");
      } catch (err) {
        showAlert("Could not create task: " + err.message, true);
      }
    });
  }

  // 16. AI Quick-Add Form Submission
  if (formQuickAdd) {
    formQuickAdd.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (!qaDesc || !qaDesc.value.trim()) {
        if (qaDescErr) qaDescErr.textContent = "Please enter task instructions.";
        return;
      }
      const parsed = parseQuickAddNaturalLanguage(qaDesc.value.trim());
      try {
        const created = await apiCreateTask({
          title: parsed.title,
          priority: parsed.priority,
          due_date: parsed.due_date,
          status: "todo",
          project_id: selectedProjectId,
          assignee: "AM"
        });

        currentTasks.unshift(created);
        qaDesc.value = "";
        if (qaDescErr) qaDescErr.textContent = "";
        togglePanel(taskCreateForm, btnToggleTaskForm);
        renderTasks(currentTasks);
        await loadProjectStats(selectedProjectId);
        toast(`✦ AI Quick-Add created: "${created.title}"`, "success");
      } catch (err) {
        showAlert("Quick-add failed: " + err.message, true);
      }
    });
  }

  // 17. Project Form Toggle & Submissions
  if (btnToggleProjectForm) {
    btnToggleProjectForm.addEventListener("click", () => {
      togglePanel(projectCreateForm, btnToggleProjectForm);
    });
  }

  if (btnCancelProject) {
    btnCancelProject.addEventListener("click", () => {
      formNewProject.reset();
      if (pTitleErr) pTitleErr.textContent = "";
      togglePanel(projectCreateForm, btnToggleProjectForm);
    });
  }

  const btnCloseProjForm = document.getElementById("btn-close-project-form");
  if (btnCloseProjForm) {
    btnCloseProjForm.addEventListener("click", () => {
      togglePanel(projectCreateForm, btnToggleProjectForm);
    });
  }

  if (formNewProject) {
    formNewProject.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (!validateField(pTitle, pTitleErr, "Project title is required.")) return;
      try {
        const created = await apiCreateProject({
          title: pTitle.value.trim(),
          description: pDesc.value.trim() || null,
          owner_id: selectedUserId
        });
        formNewProject.reset();
        togglePanel(projectCreateForm, btnToggleProjectForm);
        await loadProjects();
        await selectProject(created);
        toast(`Project "${created.title}" created!`, "success");
      } catch (err) {
        showAlert("Could not create project: " + err.message, true);
      }
    });
  }

  // 18. User Form Toggle & Submissions
  if (btnToggleUserForm) {
    btnToggleUserForm.addEventListener("click", () => {
      togglePanel(userCreateForm, btnToggleUserForm);
    });
  }

  if (btnCancelUser) {
    btnCancelUser.addEventListener("click", () => {
      formNewUser.reset();
      if (uNameErr) uNameErr.textContent = "";
      togglePanel(userCreateForm, btnToggleUserForm);
    });
  }

  const btnCloseUserForm = document.getElementById("btn-close-user-form");
  if (btnCloseUserForm) {
    btnCloseUserForm.addEventListener("click", () => {
      togglePanel(userCreateForm, btnToggleUserForm);
    });
  }

  if (formNewUser) {
    formNewUser.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (!validateField(uName, uNameErr, "User name is required.")) return;
      if (!validateField(uEmail, uEmailErr, "Email is required.")) return;
      const uRole = document.getElementById("u-role");
      const roleVal = uRole ? uRole.value : "Team Member";
      try {
        const created = await apiCreateUser({
          name: uName.value.trim(),
          email: uEmail.value.trim(),
          role: roleVal
        });
        formNewUser.reset();
        togglePanel(userCreateForm, btnToggleUserForm);
        await loadUsers();
        setCurrentUser(created);
        toast(`User "${created.name}" created (${roleVal})!`, "success");
      } catch (err) {
        showAlert("Could not create user: " + err.message, true);
      }
    });
  }

  // 19. Edit Task Modal Form Submission
  if (modalCloseX) modalCloseX.addEventListener("click", () => editModal.close());
  if (editCancelBtn) editCancelBtn.addEventListener("click", () => editModal.close());

  if (editForm) {
    editForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (!validateField(editTitle, editTitleErr, "Title is required.")) return;
      const id = Number(editTaskId.value);
      const editAssignee = document.getElementById("edit-assignee");
      const assigneeVal = editAssignee ? editAssignee.value : undefined;
      try {
        const updated = await apiUpdateTask(id, {
          title: editTitle.value.trim(),
          description: editDesc.value.trim() || null,
          priority: editPriority.value,
          status: editStatus.value,
          due_date: editDue.value.trim() || null,
          assignee: assigneeVal
        });
        currentTasks = currentTasks.map(t => t.id === id ? { ...t, ...updated, assignee: assigneeVal || t.assignee } : t);
        renderTasks(currentTasks);
        renderTeamWorkload(currentTasks);
        await loadProjectStats(selectedProjectId);
        editModal.close();
        toast("Task updated successfully!", "success");
      } catch (err) {
        showAlert("Update failed: " + err.message, true);
        editModal.close();
      }
    });
  }

  // 20. Settings Modal
  const btnSettings = document.getElementById("btn-settings");
  if (btnSettings && settingsModal) {
    btnSettings.addEventListener("click", () => settingsModal.showModal());
  }
  if (settingsCloseX && settingsModal) {
    settingsCloseX.addEventListener("click", () => settingsModal.close());
  }
  if (settingsSaveBtn && settingsModal) {
    settingsSaveBtn.addEventListener("click", () => {
      if (searchAlgo && settingsAlgoSelect) {
        searchAlgo.value = settingsAlgoSelect.value;
      }
      settingsModal.close();
      toast("Settings saved.", "success");
    });
  }

  if (settingsToggleTheme) {
    settingsToggleTheme.addEventListener("change", () => {
      document.body.classList.toggle("dark-theme", settingsToggleTheme.checked);
      localStorage.setItem(STORE_KEY_THEME, settingsToggleTheme.checked ? "dark" : "light");
    });
  }

  if (btnResetSampleData) {
    btnResetSampleData.addEventListener("click", () => {
      if (confirm("Reset all projects and tasks to sample data?")) {
        Store.resetAll();
        loadUsers();
        loadProjects();
        selectProject(DEFAULT_PROJECTS[0]);
        if (settingsModal) settingsModal.close();
        toast("Sample data restored!", "success");
      }
    });
  }

  // 21. Calendar Navigation
  const calPrev = document.getElementById("cal-prev-btn");
  const calNext = document.getElementById("cal-next-btn");
  const calToday = document.getElementById("cal-today-btn");

  if (calPrev) {
    calPrev.addEventListener("click", () => {
      calendarDate.setMonth(calendarDate.getMonth() - 1);
      renderCalendarView(currentTasks);
    });
  }

  if (calNext) {
    calNext.addEventListener("click", () => {
      calendarDate.setMonth(calendarDate.getMonth() + 1);
      renderCalendarView(currentTasks);
    });
  }

  if (calToday) {
    calToday.addEventListener("click", () => {
      calendarDate = new Date();
      renderCalendarView(currentTasks);
    });
  }

  // 22. Filter & Sort change listeners
  if (filterStatus)   filterStatus.addEventListener("change", () => renderTasks(currentTasks));
  if (filterPriority) filterPriority.addEventListener("change", () => renderTasks(currentTasks));
  if (sortBy)         sortBy.addEventListener("change", () => renderTasks(currentTasks));

  // 23. Close popovers on outer click
  document.addEventListener("click", (e) => {
    if (projectDropdownMenu && !projectDropdownMenu.hidden && !btnProjectDropdown.contains(e.target)) {
      projectDropdownMenu.hidden = true;
    }
    if (notifPopover && !notifPopover.hidden && !btnBell.contains(e.target)) {
      notifPopover.hidden = true;
    }
  });

  // 24. Chart dot hover tooltips (using native title tooltips instead of noisy toasts)
  document.querySelectorAll(".chart-dot").forEach(dot => {
    const day = dot.dataset.day;
    const done = dot.dataset.done;
    const plan = dot.dataset.plan;
    dot.setAttribute("title", `${day}: ${done} tasks completed, ${plan} planned`);
  });

  // 25. Dialog backdrop dismissals
  const authModal = document.getElementById("auth-modal");
  [settingsModal, editModal, authModal].forEach(modal => {
    if (!modal) return;
    modal.addEventListener("click", (e) => {
      const rect = modal.getBoundingClientRect();
      const isInDialog = (
        rect.top <= e.clientY && e.clientY <= rect.top + rect.height &&
        rect.left <= e.clientX && e.clientX <= rect.left + rect.width
      );
      if (!isInDialog) {
        modal.close();
      }
    });
  });

  // 26. Global Escape key handler to close any active modal or panel
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      if (settingsModal && settingsModal.open) settingsModal.close();
      if (editModal && editModal.open) editModal.close();
      if (authModal && authModal.open) authModal.close();
      if (taskCreateForm && !taskCreateForm.hidden) taskCreateForm.hidden = true;
      if (projectCreateForm && !projectCreateForm.hidden) projectCreateForm.hidden = true;
      if (userCreateForm && !userCreateForm.hidden) userCreateForm.hidden = true;
      const projDrop = document.getElementById("project-dropdown-menu");
      if (projDrop && !projDrop.hidden) projDrop.hidden = true;
      const notifPop = document.getElementById("notifications-popover");
      if (notifPop && !notifPop.hidden) notifPop.hidden = true;
      if (mobileFormOverlay && !mobileFormOverlay.hidden) mobileFormOverlay.hidden = true;
    }
  });

  // 27. Mobile form sheet backdrop dismissal
  if (mobileFormOverlay) {
    mobileFormOverlay.addEventListener("click", (e) => {
      if (e.target === mobileFormOverlay) {
        mobileFormOverlay.hidden = true;
      }
    });
  }

  // 28. Add Kanban Column Quick-Task
  document.querySelectorAll(".btn-kb-add").forEach(btn => {
    btn.addEventListener("click", () => {
      const st = btn.dataset.status || "todo";
      const title = prompt(`Add task to ${statusLabel(st)}:`);
      if (!title || !title.trim()) return;
      apiCreateTask({
        title: title.trim(),
        status: st,
        priority: "medium",
        project_id: selectedProjectId,
        assignee: "AM"
      }).then(created => {
        currentTasks.unshift(created);
        renderTasks(currentTasks);
        loadProjectStats(selectedProjectId);
        toast(`Task added to ${statusLabel(st)}!`, "success");
      });
    });
  });

  // 29. Auth Modal, User Switching, and Team Collaboration
  const btnProfileBadge = document.getElementById("btn-profile-badge");
  const btnTopUserSwitch = document.getElementById("btn-top-user-switch");
  const btnWorkloadAddMember = document.getElementById("btn-workload-add-member");

  if (btnProfileBadge) {
    btnProfileBadge.addEventListener("click", () => openAuthModal("switch"));
  }
  if (btnTopUserSwitch) {
    btnTopUserSwitch.addEventListener("click", () => openAuthModal("switch"));
  }
  if (btnWorkloadAddMember) {
    btnWorkloadAddMember.addEventListener("click", () => openAuthModal("create"));
  }

  // Auth tab switching
  const tabAuthSwitch = document.getElementById("auth-tab-switch");
  const tabAuthCreate = document.getElementById("auth-tab-create");
  const tabAuthLogin  = document.getElementById("auth-tab-login");

  if (tabAuthSwitch) tabAuthSwitch.addEventListener("click", () => switchAuthTab("switch"));
  if (tabAuthCreate) tabAuthCreate.addEventListener("click", () => switchAuthTab("create"));
  if (tabAuthLogin)  tabAuthLogin.addEventListener("click", () => switchAuthTab("login"));

  // Auth close / cancel buttons
  const authCloseX      = document.getElementById("auth-close-x");
  const authRegCancel   = document.getElementById("auth-reg-cancel");
  const authLoginCancel = document.getElementById("auth-login-cancel");

  if (authCloseX && authModal) authCloseX.addEventListener("click", () => authModal.close());
  if (authRegCancel && authModal) authRegCancel.addEventListener("click", () => authModal.close());
  if (authLoginCancel && authModal) authLoginCancel.addEventListener("click", () => authModal.close());

  // Role choice selector cards
  const choiceMember = document.getElementById("choice-role-member");
  const choiceLeader = document.getElementById("choice-role-leader");
  if (choiceMember && choiceLeader) {
    choiceMember.addEventListener("click", () => {
      const radio = choiceMember.querySelector('input[type="radio"]');
      if (radio) radio.checked = true;
      choiceMember.classList.add("is-selected");
      choiceLeader.classList.remove("is-selected");
    });
    choiceLeader.addEventListener("click", () => {
      const radio = choiceLeader.querySelector('input[type="radio"]');
      if (radio) radio.checked = true;
      choiceLeader.classList.add("is-selected");
      choiceMember.classList.remove("is-selected");
    });
  }

  // Quick fill buttons in login tab
  document.querySelectorAll(".btn-quick-fill").forEach(btn => {
    btn.addEventListener("click", () => {
      const emailInput = document.getElementById("auth-login-email");
      if (emailInput && btn.dataset.email) {
        emailInput.value = btn.dataset.email;
        emailInput.focus();
      }
    });
  });

  // Login form submit
  const formAuthLogin = document.getElementById("form-auth-login");
  const authLoginEmail = document.getElementById("auth-login-email");
  const authLoginEmailErr = document.getElementById("auth-login-email-err");

  if (formAuthLogin) {
    formAuthLogin.addEventListener("submit", (e) => {
      e.preventDefault();
      const emailVal = authLoginEmail ? authLoginEmail.value.trim().toLowerCase() : "";
      if (!emailVal) {
        if (authLoginEmailErr) authLoginEmailErr.textContent = "Please enter your email.";
        return;
      }
      if (authLoginEmailErr) authLoginEmailErr.textContent = "";

      const users = Store.getUsers();
      const user = users.find(u => u.email.toLowerCase() === emailVal);
      if (user) {
        setCurrentUser(user);
        if (authModal) authModal.close();
        showWorkspace();
        toast(`Signed in as ${user.name} (${user.role})!`, "success");
      } else {
        if (authLoginEmailErr) {
          authLoginEmailErr.textContent = "Email not found. Switch to 'Create New User' tab to register!";
        }
      }
    });
  }

  // Register form submit
  const formAuthRegister = document.getElementById("form-auth-register");
  const authRegName      = document.getElementById("auth-reg-name");
  const authRegNameErr   = document.getElementById("auth-reg-name-err");
  const authRegEmail     = document.getElementById("auth-reg-email");
  const authRegEmailErr  = document.getElementById("auth-reg-email-err");
  const authRegTitle     = document.getElementById("auth-reg-title");
  const authRegColor     = document.getElementById("auth-reg-color");

  if (formAuthRegister) {
    formAuthRegister.addEventListener("submit", async (e) => {
      e.preventDefault();
      let valid = true;
      if (!authRegName || !authRegName.value.trim()) {
        if (authRegNameErr) authRegNameErr.textContent = "Full name is required.";
        valid = false;
      } else if (authRegNameErr) {
        authRegNameErr.textContent = "";
      }

      if (!authRegEmail || !authRegEmail.value.trim() || !authRegEmail.value.includes("@")) {
        if (authRegEmailErr) authRegEmailErr.textContent = "Valid email address is required.";
        valid = false;
      } else if (authRegEmailErr) {
        authRegEmailErr.textContent = "";
      }

      if (!valid) return;

      const checkedRole = document.querySelector('input[name="auth-role"]:checked');
      const roleVal = checkedRole ? checkedRole.value : "Team Member";
      const titleVal = authRegTitle && authRegTitle.value.trim() 
        ? authRegTitle.value.trim() 
        : (roleVal === "Team Leader" ? "Project Lead" : "Engineer");
      const colorVal = authRegColor ? authRegColor.value : "av-blue";

      try {
        const created = await apiCreateUser({
          name: authRegName.value.trim(),
          email: authRegEmail.value.trim(),
          role: roleVal,
          title: titleVal,
          color: colorVal
        });

        await loadUsers();
        setCurrentUser(created);
        formAuthRegister.reset();
        if (choiceMember && choiceLeader) {
          choiceMember.classList.add("is-selected");
          choiceLeader.classList.remove("is-selected");
        }
        if (authModal) authModal.close();
        showWorkspace();
        toast(`Welcome, ${created.name}! Your ${created.role} account is ready.`, "success");
      } catch (err) {
        showAlert("Registration failed: " + err.message, true);
      }
    });
  }

  // 30. Landing Page Navigation and Actions
  const authBtnLanding = document.getElementById("auth-btn-goto-landing");
  if (authBtnLanding && authModal) {
    authBtnLanding.addEventListener("click", () => {
      authModal.close();
      showLandingPage();
    });
  }

  const landingThemeToggle = document.getElementById("landing-theme-toggle");
  if (landingThemeToggle) {
    landingThemeToggle.addEventListener("click", () => {
      const isDark = document.body.classList.toggle("dark-theme");
      localStorage.setItem(STORE_KEY_THEME, isDark ? "dark" : "light");
      if (settingsToggleTheme) settingsToggleTheme.checked = isDark;
      toast(`Switched to ${isDark ? "Dark" : "Light"} mode.`, "info");
    });
  }

  const btnNavLanding = document.getElementById("nav-landing-page");
  const btnTopLanding = document.getElementById("btn-top-landing");
  if (btnNavLanding) {
    btnNavLanding.addEventListener("click", (e) => {
      e.preventDefault();
      showLandingPage();
    });
  }
  if (btnTopLanding) {
    btnTopLanding.addEventListener("click", () => {
      showLandingPage();
    });
  }

  // Landing Header buttons
  const lpLoginBtn = document.getElementById("landing-nav-login-btn");
  const lpSignupBtn = document.getElementById("landing-nav-signup-btn");
  const lpWorkspaceBtn = document.getElementById("landing-nav-workspace-btn");

  if (lpLoginBtn)     lpLoginBtn.addEventListener("click", () => openAuthModal("login"));
  if (lpSignupBtn)    lpSignupBtn.addEventListener("click", () => openAuthModal("create"));
  if (lpWorkspaceBtn) lpWorkspaceBtn.addEventListener("click", () => showWorkspace());

  // Hero CTAs
  const heroBtnCreate = document.getElementById("hero-btn-create");
  const heroBtnLogin  = document.getElementById("hero-btn-login");
  const heroBtnDemo   = document.getElementById("hero-btn-demo");

  if (heroBtnCreate) heroBtnCreate.addEventListener("click", () => openAuthModal("create"));
  if (heroBtnLogin)  heroBtnLogin.addEventListener("click", () => openAuthModal("login"));
  if (heroBtnDemo)   heroBtnDemo.addEventListener("click", () => showWorkspace());

  // Quick 1-Click Role Login Chips
  const chipAlex = document.getElementById("chip-login-alex");
  const chipSara = document.getElementById("chip-login-sara");
  const chipTom  = document.getElementById("chip-login-tom");

  function quickLoginByEmail(email, defaultRole) {
    const users = Store.getUsers();
    const u = users.find(x => x.email.toLowerCase() === email.toLowerCase()) || users[0];
    if (u) {
      setCurrentUser(u);
      showWorkspace();
      toast(`Signed in as ${u.name} (${u.role})!`, "success");
    }
  }

  if (chipAlex) chipAlex.addEventListener("click", () => quickLoginByEmail("alex@flowtask.com", "Leader"));
  if (chipSara) chipSara.addEventListener("click", () => quickLoginByEmail("sara@flowtask.com", "Member"));
  if (chipTom)  chipTom.addEventListener("click",  () => quickLoginByEmail("tom@flowtask.com", "Member"));

  const previewJumpBtn = document.getElementById("preview-jump-btn");
  if (previewJumpBtn) previewJumpBtn.addEventListener("click", () => showWorkspace());

  const btnRoleLeader = document.getElementById("btn-role-join-leader");
  const btnRoleMember = document.getElementById("btn-role-join-member");
  if (btnRoleLeader) btnRoleLeader.addEventListener("click", () => quickLoginByEmail("alex@flowtask.com", "Leader"));
  if (btnRoleMember) btnRoleMember.addEventListener("click", () => quickLoginByEmail("sara@flowtask.com", "Member"));

  // Bottom CTA buttons
  const ctaBtnCreate = document.getElementById("cta-btn-create");
  const ctaBtnLogin  = document.getElementById("cta-btn-login");
  const ctaBtnDemo   = document.getElementById("cta-btn-demo");

  if (ctaBtnCreate) ctaBtnCreate.addEventListener("click", () => openAuthModal("create"));
  if (ctaBtnLogin)  ctaBtnLogin.addEventListener("click", () => openAuthModal("login"));
  if (ctaBtnDemo)   ctaBtnDemo.addEventListener("click", () => showWorkspace());

  // Footer buttons
  const footerBtnLogin = document.getElementById("footer-btn-login");
  const footerBtnCreate = document.getElementById("footer-btn-create");
  const footerBtnWorkspace = document.getElementById("footer-btn-workspace");

  if (footerBtnLogin)     footerBtnLogin.addEventListener("click", () => openAuthModal("login"));
  if (footerBtnCreate)    footerBtnCreate.addEventListener("click", () => openAuthModal("create"));
  if (footerBtnWorkspace) footerBtnWorkspace.addEventListener("click", () => showWorkspace());
}

/* ==========================================================================
   MOBILE LAYOUT SUPPORT
   ========================================================================== */
function applyMobileLayout() {
  const workspace = document.getElementById("workspace");
  if (!workspace) return;

  if (isMobile()) {
    workspace.classList.add("mobile-nav-active");
  } else {
    workspace.classList.remove("mobile-nav-active");
  }
}

window.addEventListener("resize", () => {
  applyMobileLayout();
});

/* ==========================================================================
   INITIALIZATION BOOTSTRAP
   ========================================================================== */
(async function init() {
  applyMobileLayout();
  setupAllButtonsAndListeners();

  // Load initial data
  await loadUsers();
  await loadProjects();

  const projects = Store.getProjects();
  if (projects.length) {
    await selectProject(projects[0]);
  } else {
    currentTasks = Store.getTasks();
    renderTasks(currentTasks);
    await loadProjectStats(101);
  }

  const curUser = getCurrentUser();
  if (curUser && (curUser.role === "Team Member" || curUser.role === "Member")) {
    activeMemberFilter = curUser.initials;
  } else {
    activeMemberFilter = null;
  }

  updateActiveUserUI();
  updateAssigneeSelectOptions();
  renderRoleDashboardBanner();
  renderLeaderUpdatesSection();
  renderTeamWorkload(currentTasks);

  // Check initial view (Landing page by default unless #workspace or previously set)
  const savedView = sessionStorage.getItem("flowtask_view");
  const hash = window.location.hash;
  if (hash === "#workspace" || hash === "#app" || savedView === "workspace") {
    showWorkspace();
  } else {
    showLandingPage();
  }
})();
