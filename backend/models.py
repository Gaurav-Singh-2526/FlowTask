"""
SQLAlchemy ORM models.

Schema:
  users         — id (PK), name, email, password, role, title, initials, color, leader_id, created_at
  projects      — id (PK), title, description, status, deadline, owner_id (FK → users.id), created_at
  tasks         — id (PK), title, description, status, priority, due_date, assignee, assignee_id,
                  leader_id, project_id (FK → projects.id), created_at
  messages      — id (PK), leader_id, sender_id, sender_name, sender_role, sender_initials,
                  sender_color, target, message, parent_id, created_at
  notifications — id (PK), user_id, title, content, is_read, created_at
"""

from sqlalchemy import (
    Column,
    Integer,
    String,
    Text,
    DateTime,
    Boolean,
    ForeignKey,
    CheckConstraint,
    UniqueConstraint,
    func,
)
from sqlalchemy.orm import relationship, DeclarativeBase


class Base(DeclarativeBase):
    """Shared declarative base for all ORM models."""
    pass


# ===========================================================================
# User
# ===========================================================================

class User(Base):
    __tablename__ = "users"

    id         = Column(Integer, primary_key=True, index=True)
    name       = Column(String(255), nullable=False)
    email      = Column(String(255), nullable=False, unique=True, index=True)
    password   = Column(String(255), nullable=False, default="password123")
    role       = Column(String(50), nullable=False, default="Team Leader")
    title      = Column(String(100), nullable=True)
    initials   = Column(String(10), nullable=True)
    color      = Column(String(50), nullable=True, default="av-blue")
    phone      = Column(String(50), nullable=True)
    bio        = Column(Text, nullable=True)
    avatar_url = Column(Text, nullable=True)
    leader_id  = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=True, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Relationship: one user → many projects
    projects = relationship(
        "Project",
        back_populates="owner",
        cascade="all, delete-orphan",
        lazy="select",
    )

    def __repr__(self) -> str:
        return f"<User id={self.id} email={self.email!r} role={self.role!r}>"


# ===========================================================================
# Project
# ===========================================================================

class Project(Base):
    __tablename__ = "projects"

    id          = Column(Integer, primary_key=True, index=True)
    title       = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    status      = Column(String(50), nullable=True, default="active")
    deadline    = Column(String(100), nullable=True)
    owner_id    = Column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    created_at  = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    owner = relationship(
        "User",
        back_populates="projects",
        lazy="select",
    )

    tasks = relationship(
        "Task",
        back_populates="project",
        cascade="all, delete-orphan",
        lazy="select",
    )

    def __repr__(self) -> str:
        return f"<Project id={self.id} title={self.title!r} owner_id={self.owner_id}>"


# ===========================================================================
# Task
# ===========================================================================

class Task(Base):
    __tablename__ = "tasks"

    PRIORITY_VALUES = ("low", "medium", "high")
    STATUS_VALUES   = ("todo", "in_progress", "done")

    id          = Column(Integer, primary_key=True, index=True)
    title       = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    status      = Column(
        String(20),
        nullable=False,
        default="todo",
        server_default="todo",
    )
    priority    = Column(
        String(10),
        nullable=False,
        default="medium",
        server_default="medium",
    )
    due_date    = Column(String(100), nullable=True)
    assignee    = Column(String(50), nullable=True)
    assignee_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    leader_id   = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=True, index=True)
    project_id  = Column(
        Integer,
        ForeignKey("projects.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    created_at  = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    project = relationship(
        "Project",
        back_populates="tasks",
        lazy="select",
    )

    __table_args__ = (
        CheckConstraint(
            "priority IN ('low', 'medium', 'high')",
            name="ck_task_priority",
        ),
        CheckConstraint(
            "status IN ('todo', 'in_progress', 'done')",
            name="ck_task_status",
        ),
    )

    def __repr__(self) -> str:
        return f"<Task id={self.id} title={self.title!r} priority={self.priority!r}>"


# ===========================================================================
# Message (Chat / Directives / Announcements)
# ===========================================================================

class Message(Base):
    __tablename__ = "messages"

    id              = Column(Integer, primary_key=True, index=True)
    leader_id       = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    sender_id       = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    sender_name     = Column(String(255), nullable=False)
    sender_role     = Column(String(50), nullable=False)
    sender_initials = Column(String(10), nullable=True)
    sender_color    = Column(String(50), nullable=True)
    target          = Column(String(255), default="All Members")
    message         = Column(Text, nullable=False)
    parent_id       = Column(Integer, ForeignKey("messages.id", ondelete="CASCADE"), nullable=True)
    created_at      = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)


# ===========================================================================
# Notification
# ===========================================================================

class Notification(Base):
    __tablename__ = "notifications"

    id         = Column(Integer, primary_key=True, index=True)
    user_id    = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title      = Column(String(255), nullable=False)
    content    = Column(Text, nullable=False)
    is_read    = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)


# ===========================================================================
# TeamMemberProject (Many-to-Many between Team Members and Projects)
# ===========================================================================

class TeamMemberProject(Base):
    __tablename__ = "team_member_projects"

    id             = Column(Integer, primary_key=True, index=True)
    team_member_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    project_id     = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True)
    assigned_by    = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at     = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    __table_args__ = (
        UniqueConstraint("team_member_id", "project_id", name="uq_member_project"),
    )

    team_member = relationship("User", foreign_keys=[team_member_id], lazy="select")
    project     = relationship("Project", foreign_keys=[project_id], lazy="select")
    assigner    = relationship("User", foreign_keys=[assigned_by], lazy="select")

    def __repr__(self) -> str:
        return f"<TeamMemberProject id={self.id} member={self.team_member_id} project={self.project_id}>"
