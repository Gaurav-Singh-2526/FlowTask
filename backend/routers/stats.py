"""
Statistics endpoints with Team Leader workspace scoping.
"""

from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func
from sqlalchemy.orm import Session

import models
import schemas
from database import get_db

router = APIRouter(prefix="/stats", tags=["statistics"])


@router.get(
    "/overview",
    response_model=schemas.DashboardStatsOut,
    status_code=status.HTTP_200_OK,
)
def dashboard_overview_stats(
    leader_id:  Optional[int] = Query(default=None, description="Scope statistics to specific team leader workspace"),
    member_id:  Optional[int] = Query(default=None, description="Scope statistics to specific Team Member's assigned tasks"),
    assignee:   Optional[str] = Query(default=None, description="Scope statistics to specific assignee initials"),
    project_id: Optional[int] = Query(default=None, description="Scope statistics to specific project"),
    db: Session = Depends(get_db),
):
    """
    Return task overview statistics dynamically calculated from database.
    - If leader_id is provided, scopes calculations strictly to that Team Leader's tasks.
    - If member_id or assignee is provided, scopes strictly to tasks assigned to that member.
    - If project_id is provided, scopes strictly to that project.
    """
    from sqlalchemy import or_

    base_query = db.query(models.Task)
    if leader_id is not None:
        base_query = base_query.filter(models.Task.leader_id == leader_id)
    if project_id is not None:
        base_query = base_query.filter(models.Task.project_id == project_id)

    if member_id is not None:
        user = db.query(models.User).filter(models.User.id == member_id).first()
        if user:
            from sqlalchemy import and_
            filter_conditions = [
                or_(
                    models.Task.assignee_id == user.id,
                    and_(
                        models.Task.assignee_id.is_(None),
                        models.Task.assignee == user.initials,
                    ),
                )
            ]
            if user.leader_id is not None:
                filter_conditions.append(models.Task.leader_id == user.leader_id)
            base_query = base_query.filter(and_(*filter_conditions))
        else:
            base_query = base_query.filter(models.Task.assignee_id == member_id)
    elif assignee is not None and assignee.strip():
        base_query = base_query.filter(models.Task.assignee == assignee.strip())

    total = base_query.with_entities(func.count(models.Task.id)).scalar() or 0
    completed = (
        base_query.filter(models.Task.status == "done")
        .with_entities(func.count(models.Task.id))
        .scalar()
        or 0
    )
    in_progress = (
        base_query.filter(models.Task.status == "in_progress")
        .with_entities(func.count(models.Task.id))
        .scalar()
        or 0
    )

    today_str = datetime.utcnow().strftime("%Y-%m-%d")
    overdue = (
        base_query.filter(models.Task.status != "done")
        .filter(models.Task.due_date.isnot(None))
        .filter(models.Task.due_date != "")
        .filter(models.Task.due_date < today_str)
        .with_entities(func.count(models.Task.id))
        .scalar()
        or 0
    )

    pending = (
        base_query.filter(models.Task.status.in_(["todo", "backlog", "review"]))
        .with_entities(func.count(models.Task.id))
        .scalar()
        or 0
    )

    rows = (
        base_query.with_entities(models.Task.status, func.count(models.Task.id).label("count"))
        .group_by(models.Task.status)
        .all()
    )
    by_status = [schemas.TaskStatusCount(status=row.status, count=row.count) for row in rows]

    completion_rate = round((completed / total * 100), 1) if total > 0 else 0.0

    return schemas.DashboardStatsOut(
        total_tasks=total,
        completed_tasks=completed,
        in_progress_tasks=in_progress,
        overdue_tasks=overdue,
        pending_tasks=pending,
        completion_rate=completion_rate,
        by_status=by_status,
    )


@router.get(
    "/projects/{project_id}",
    response_model=schemas.ProjectStatsOut,
    status_code=status.HTTP_200_OK,
)
def project_task_stats(project_id: int, db: Session = Depends(get_db)):
    """Return task statistics for a single project."""
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if project is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Project with id={project_id} not found.",
        )

    total_tasks = (
        db.query(func.count(models.Task.id))
        .filter(models.Task.project_id == project_id)
        .scalar()
        or 0
    )

    rows = (
        db.query(models.Task.status, func.count(models.Task.id).label("count"))
        .filter(models.Task.project_id == project_id)
        .group_by(models.Task.status)
        .all()
    )
    by_status = [schemas.TaskStatusCount(status=row.status, count=row.count) for row in rows]

    return schemas.ProjectStatsOut(
        project_id=project.id,
        project_title=project.title,
        total_tasks=total_tasks,
        by_status=by_status,
    )
