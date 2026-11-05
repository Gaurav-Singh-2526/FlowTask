"""
Pydantic v2 request / response schemas.
"""

from datetime import datetime
from typing import Any, List, Literal, Optional

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator


# ---------------------------------------------------------------------------
# Priority / status types
# ---------------------------------------------------------------------------

PriorityType = Literal["low", "medium", "high"]
StatusType   = Literal["todo", "in_progress", "done"]


# ===========================================================================
# User schemas
# ===========================================================================

class ProjectBrief(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id:          int
    title:       str
    description: Optional[str] = None
    status:      Optional[str] = "active"
    deadline:    Optional[str] = None


class UserCreate(BaseModel):
    name:        str                = Field(..., min_length=1, max_length=255)
    email:       EmailStr
    password:    Optional[str]      = Field(default="password123", min_length=1)
    role:        Optional[str]      = Field(default="Team Leader")
    title:       Optional[str]      = None
    initials:    Optional[str]      = None
    color:       Optional[str]      = None
    phone:       Optional[str]      = None
    bio:         Optional[str]      = None
    avatar_url:  Optional[str]      = None
    leader_id:   Optional[int]      = None
    project_ids: Optional[List[int]] = None

    @field_validator("name")
    @classmethod
    def name_not_blank(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("name must not be blank or whitespace-only")
        return v.strip()


class UserUpdate(BaseModel):
    name:        Optional[str]       = None
    email:       Optional[EmailStr]  = None
    password:    Optional[str]       = None
    title:       Optional[str]       = None
    initials:    Optional[str]       = None
    color:       Optional[str]       = None
    phone:       Optional[str]       = None
    bio:         Optional[str]       = None
    avatar_url:  Optional[str]       = None
    role:        Optional[str]       = None
    leader_id:   Optional[int]       = None
    project_ids: Optional[List[int]] = None


class UserProfileUpdate(BaseModel):
    name:       Optional[str] = Field(default=None, max_length=255)
    phone:      Optional[str] = Field(default=None, max_length=50)
    bio:        Optional[str] = None
    avatar_url: Optional[str] = None
    color:      Optional[str] = None
    title:      Optional[str] = None


class UserLogin(BaseModel):
    email:    EmailStr
    password: str = Field(..., min_length=1)


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id:                   int
    name:                 str
    email:                str
    role:                 str
    title:                Optional[str]       = None
    initials:             Optional[str]       = None
    color:                Optional[str]       = None
    phone:                Optional[str]       = None
    bio:                  Optional[str]       = None
    avatar_url:           Optional[str]       = None
    leader_id:            Optional[int]       = None
    created_at:           datetime
    assigned_project_ids: List[int]           = Field(default_factory=list)
    assigned_projects:    List[ProjectBrief]  = Field(default_factory=list)


class MemberProjectAssign(BaseModel):
    project_ids: List[int] = Field(default_factory=list)


class TeamMemberProjectOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id:             int
    team_member_id: int
    project_id:     int
    assigned_by:    Optional[int] = None
    created_at:     datetime


# ===========================================================================
# Project schemas
# ===========================================================================

class ProjectCreate(BaseModel):
    title:       str           = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    status:      Optional[str] = Field(default="active")
    deadline:    Optional[str] = None
    owner_id:    int

    @field_validator("title")
    @classmethod
    def title_not_blank(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("title must not be blank or whitespace-only")
        return v.strip()


class ProjectUpdate(BaseModel):
    title:       Optional[str] = None
    description: Optional[str] = None
    status:      Optional[str] = None
    deadline:    Optional[str] = None


class ProjectOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id:                     int
    title:                  str
    description:            Optional[str] = None
    status:                 Optional[str] = "active"
    deadline:               Optional[str] = None
    owner_id:               int
    created_at:             datetime
    assigned_member_ids:    List[int]     = Field(default_factory=list)
    assigned_members_count: int           = 0


# ===========================================================================
# Task schemas
# ===========================================================================

class TaskCreate(BaseModel):
    title:       str                = Field(..., min_length=1, max_length=255)
    description: Optional[str]     = None
    priority:    PriorityType       = Field(default="medium")
    status:      StatusType         = Field(default="todo")
    due_date:    Optional[str]      = Field(default=None, max_length=100)
    assignee:    Optional[str]      = None
    assignee_id: Optional[int]      = None
    leader_id:   Optional[int]      = None
    project_id:  int

    @field_validator("title")
    @classmethod
    def title_not_blank(cls, v: str) -> str:
        stripped = v.strip()
        if not stripped:
            raise ValueError("title must not be blank or whitespace-only")
        return stripped


class TaskUpdate(BaseModel):
    title:       Optional[str]          = Field(default=None, min_length=1, max_length=255)
    description: Optional[str]          = None
    priority:    Optional[PriorityType] = None
    status:      Optional[StatusType]   = None
    due_date:    Optional[str]          = Field(default=None, max_length=100)
    assignee:    Optional[str]          = None
    assignee_id: Optional[int]          = None
    leader_id:   Optional[int]          = None


class TaskOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id:            int
    title:         str
    description:   Optional[str] = None
    status:        str
    priority:      str
    due_date:      Optional[str] = None
    assignee:      Optional[str] = None
    assignee_id:   Optional[int] = None
    leader_id:     Optional[int] = None
    project_id:    int
    project_title: Optional[str] = None
    leader_name:   Optional[str] = None
    created_at:    datetime


# ===========================================================================
# Message & Directives schemas (Chat)
# ===========================================================================

class MessageCreate(BaseModel):
    leader_id:       int
    sender_id:       int
    sender_name:     str
    sender_role:     str
    sender_initials: Optional[str] = None
    sender_color:    Optional[str] = None
    target:          Optional[str] = "All Members"
    message:         str
    parent_id:       Optional[int] = None


class MessageReplyCreate(BaseModel):
    sender_id:       int
    sender_name:     str
    sender_role:     str
    sender_initials: Optional[str] = None
    sender_color:    Optional[str] = None
    message:         str


class MessageOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id:              int
    leader_id:       int
    sender_id:       int
    sender_name:     str
    sender_role:     str
    sender_initials: Optional[str] = None
    sender_color:    Optional[str] = None
    target:          Optional[str] = "All Members"
    message:         str
    parent_id:       Optional[int] = None
    created_at:      datetime
    responses:       List[Any] = []


# ===========================================================================
# Notification schemas
# ===========================================================================

class NotificationCreate(BaseModel):
    user_id: int
    title:   str
    content: str


class NotificationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id:         int
    user_id:    int
    title:      str
    content:    str
    is_read:    bool
    created_at: datetime


# ===========================================================================
# Nested relationship schemas
# ===========================================================================

class ProjectWithTasksOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id:          int
    title:       str
    description: Optional[str] = None
    status:      Optional[str] = "active"
    deadline:    Optional[str] = None
    owner_id:    int
    created_at:  datetime
    tasks:       List[TaskOut] = []


class UserWithProjectsOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id:         int
    name:       str
    email:      str
    role:       str
    created_at: datetime
    projects:   List[ProjectOut] = []


# ===========================================================================
# Statistics schemas
# ===========================================================================

class TaskStatusCount(BaseModel):
    status: str
    count:  int


class ProjectStatsOut(BaseModel):
    project_id:    int
    project_title: str
    total_tasks:   int
    by_status:     List[TaskStatusCount]


class DashboardStatsOut(BaseModel):
    total_tasks:       int
    completed_tasks:   int
    in_progress_tasks: int
    overdue_tasks:     int
    pending_tasks:     int
    completion_rate:   float
    by_status:         List[TaskStatusCount] = []


# ===========================================================================
# Quick-Add schema
# ===========================================================================

class QuickAddRequest(BaseModel):
    description: str = Field(..., min_length=1)
    project_id:  int
