"""
Task endpoints — full CRUD plus search and team isolation.
"""

from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

import models
import schemas
from algorithms import binary_search, insertion_sort, linear_search
from database import get_db

router = APIRouter(prefix="/tasks", tags=["tasks"])

PRIORITY_RANK = {"low": 1, "medium": 2, "high": 3}


def _get_task_or_404(task_id: int, db: Session) -> models.Task:
    task = db.query(models.Task).filter(models.Task.id == task_id).first()
    if task is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Task with id={task_id} not found.",
        )
    return task


def _task_to_dict(task: models.Task) -> dict:
    return {
        "id":            task.id,
        "title":         task.title,
        "description":   task.description,
        "status":        task.status,
        "priority":      task.priority,
        "due_date":      task.due_date,
        "assignee":      task.assignee,
        "assignee_id":   task.assignee_id,
        "leader_id":     task.leader_id,
        "project_id":    task.project_id,
        "project_title": getattr(task.project, "title", None) if task.project else None,
        "created_at":    task.created_at,
        "_priority_rank": PRIORITY_RANK.get(task.priority, 0),
    }


def _attach_task_metadata(task: models.Task, db: Session) -> schemas.TaskOut:
    d = _task_to_dict(task)
    if not d.get("project_title") and task.project_id:
        p = db.query(models.Project).filter(models.Project.id == task.project_id).first()
        if p:
            d["project_title"] = p.title
    if task.leader_id:
        lead = db.query(models.User).filter(models.User.id == task.leader_id).first()
        if lead:
            d["leader_name"] = lead.name
    return schemas.TaskOut.model_validate(d)


@router.post("/", response_model=schemas.TaskOut, status_code=status.HTTP_201_CREATED)
def create_task(
    payload: schemas.TaskCreate,
    requester_id: Optional[int] = Query(default=None, description="User ID creating the task"),
    db: Session = Depends(get_db),
):
    """
    Create a new task associated with project and Team Leader.
    Strict Rule: Only Team Leaders can create and assign tasks.
    """
    if requester_id is not None:
        requester = db.query(models.User).filter(models.User.id == requester_id).first()
        if not requester or requester.role != "Team Leader":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Permission Denied: Only Team Leaders can create and assign tasks.",
            )

    project = db.query(models.Project).filter(
        models.Project.id == payload.project_id
    ).first()
    if project is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Project with id={payload.project_id} not found.",
        )

    leader_id = payload.leader_id or project.owner_id
    leader = db.query(models.User).filter(models.User.id == leader_id).first()
    if leader and leader.role != "Team Leader":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Permission Denied: Only Team Leaders can create and assign tasks.",
        )

    # Sync assignee and assignee_id
    assignee_id = payload.assignee_id
    assignee_initials = payload.assignee
    if not assignee_id and assignee_initials:
        member = db.query(models.User).filter(
            models.User.leader_id == leader_id,
            models.User.initials == assignee_initials,
        ).first()
        if member:
            assignee_id = member.id
    elif assignee_id and not assignee_initials:
        member = db.query(models.User).filter(models.User.id == assignee_id).first()
        if member:
            assignee_initials = member.initials

    # Validate project-member relationship in FastAPI
    if assignee_id:
        member = db.query(models.User).filter(models.User.id == assignee_id).first()
        if not member:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Assignee user with id={assignee_id} not found.",
            )
        if member.role == "Team Leader":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Rule Enforced: Team Leaders cannot be assigned tasks.",
            )

        # Check if project has configured members in team_member_projects
        has_assignments = (
            db.query(models.TeamMemberProject)
            .filter(models.TeamMemberProject.project_id == payload.project_id)
            .first()
            is not None
        )
        is_assigned = (
            db.query(models.TeamMemberProject)
            .filter(
                models.TeamMemberProject.project_id == payload.project_id,
                models.TeamMemberProject.team_member_id == assignee_id,
            )
            .first()
            is not None
        )

        if has_assignments and not is_assigned:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Team Member '{member.name}' is not assigned to this project. Please assign them to the project first.",
            )
        elif not is_assigned:
            # If project had no members assigned yet, associate this member
            assignment = models.TeamMemberProject(
                team_member_id=assignee_id,
                project_id=payload.project_id,
                assigned_by=leader_id,
            )
            db.add(assignment)
            db.commit()

    task = models.Task(
        title=payload.title,
        description=payload.description,
        priority=payload.priority,
        status=payload.status,
        due_date=payload.due_date,
        assignee=assignee_initials,
        assignee_id=assignee_id,
        leader_id=leader_id,
        project_id=payload.project_id,
    )
    db.add(task)
    db.commit()
    db.refresh(task)
    return _attach_task_metadata(task, db)


@router.get("/search", status_code=status.HTTP_200_OK)
def search_tasks(
    title: str = Query(..., description="Exact task title to search for"),
    algo: str  = Query(default="binary", description="'binary' or 'linear'"),
    leader_id: Optional[int] = Query(default=None, description="Scope search to team leader workspace"),
    db: Session = Depends(get_db),
):
    """Search for a task by exact title."""
    if algo not in ("binary", "linear"):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="algo must be 'binary' or 'linear'.",
        )

    query = db.query(models.Task)
    if leader_id is not None:
        query = query.filter(models.Task.leader_id == leader_id)
    rows = query.all()
    index = [{"id": t.id, "title": t.title} for t in rows]

    if not index:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No tasks exist in the database.",
        )

    if algo == "binary":
        insertion_sort(index, key="title")
        found_idx = binary_search(index, target_value=title, key="title")
    else:
        found_idx = linear_search(index, target_value=title, key="title")

    if found_idx == -1:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No task found with title '{title}'.",
        )

    task_id = index[found_idx]["id"]
    task = db.query(models.Task).filter(models.Task.id == task_id).first()
    return schemas.TaskOut.model_validate(task)


@router.get("/", response_model=List[schemas.TaskOut], status_code=status.HTTP_200_OK)
def list_tasks(
    leader_id:    Optional[int] = Query(default=None, description="Filter by Team Leader workspace"),
    project_id:   Optional[int] = Query(default=None, description="Filter by project"),
    assignee:     Optional[str] = Query(default=None, description="Filter by assignee initials"),
    assignee_id:  Optional[int] = Query(default=None, description="Filter by assignee user ID"),
    status:       Optional[str] = Query(default=None, description="Filter by status"),
    requester_id: Optional[int] = Query(default=None, description="User ID making the request"),
    sort:         Optional[str] = Query(default=None, description="Sort field: 'priority' or 'due_date'"),
    skip: int = 0,
    limit: int = 500,
    db: Session = Depends(get_db),
):
    """
    Return tasks, optionally filtered.
    Strict Rule: If requester is a Team Member, they can ONLY see tasks assigned to them.
    """
    from sqlalchemy import or_

    query = db.query(models.Task)

    if requester_id is not None:
        requester = db.query(models.User).filter(models.User.id == requester_id).first()
        if requester and requester.role == "Team Member":
            from sqlalchemy import or_, and_
            filter_conditions = [
                or_(
                    models.Task.assignee_id == requester.id,
                    and_(
                        models.Task.assignee_id.is_(None),
                        models.Task.assignee == requester.initials,
                    ),
                )
            ]
            if requester.leader_id is not None:
                filter_conditions.append(models.Task.leader_id == requester.leader_id)
            query = query.filter(and_(*filter_conditions))

    if leader_id is not None:
        query = query.filter(models.Task.leader_id == leader_id)
    if project_id is not None:
        query = query.filter(models.Task.project_id == project_id)
    if assignee_id is not None:
        query = query.filter(models.Task.assignee_id == assignee_id)
    elif assignee is not None and assignee.strip():
        query = query.filter(models.Task.assignee == assignee.strip())
    if status is not None and status.strip() and status != "all":
        query = query.filter(models.Task.status == status.strip())

    rows = query.order_by(models.Task.id.desc()).offset(skip).limit(limit).all()

    if sort is None:
        return [_attach_task_metadata(t, db) for t in rows]

    if sort not in ("priority", "due_date"):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="sort must be 'priority' or 'due_date'.",
        )

    task_dicts = [_task_to_dict(t) for t in rows]

    if sort == "priority":
        insertion_sort(task_dicts, key="_priority_rank")
    else:
        SENTINEL = "\xff\xff"
        for d in task_dicts:
            if d["due_date"] is None:
                d["due_date"] = SENTINEL
        insertion_sort(task_dicts, key="due_date")
        for d in task_dicts:
            if d["due_date"] == SENTINEL:
                d["due_date"] = None

    for d in task_dicts:
        d.pop("_priority_rank", None)

    return [schemas.TaskOut.model_validate(d) for d in task_dicts]


@router.get("/{task_id}", response_model=schemas.TaskOut, status_code=status.HTTP_200_OK)
def get_task(task_id: int, db: Session = Depends(get_db)):
    """Fetch one task by primary key; 404 if it does not exist."""
    task = _get_task_or_404(task_id, db)
    return _attach_task_metadata(task, db)


@router.put("/{task_id}", response_model=schemas.TaskOut, status_code=status.HTTP_200_OK)
def update_task(
    task_id: int,
    payload: schemas.TaskUpdate,
    requester_id: Optional[int] = Query(default=None, description="User ID making the update"),
    db: Session = Depends(get_db),
):
    """
    Partially update a task.
    Strict Rules:
    - Team Member can ONLY update the status of tasks assigned to them.
    - Team Member cannot modify title, description, due_date, priority, assignee, or project.
    - Team Member cannot update tasks assigned to other members.
    - Team Leader can update any details of tasks within their workspace.
    """
    task = _get_task_or_404(task_id, db)

    if requester_id is not None:
        requester = db.query(models.User).filter(models.User.id == requester_id).first()
        if requester and requester.role == "Team Member":
            is_assigned = (task.assignee_id == requester.id) or (
                task.assignee_id is None and task.assignee == requester.initials
            )
            if not is_assigned:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Permission Denied: You can only update tasks assigned to you.",
                )
            update_fields = payload.model_dump(exclude_unset=True)
            disallowed_fields = [k for k in update_fields.keys() if k != "status"]
            if disallowed_fields:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Permission Denied: Team Members can only update task status, not {', '.join(disallowed_fields)}.",
                )
        elif requester and requester.role == "Team Leader":
            if task.leader_id is not None and task.leader_id != requester.id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Permission Denied: You can only edit tasks in your own workspace.",
                )

    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(task, field, value)

    db.commit()
    db.refresh(task)
    return _attach_task_metadata(task, db)


@router.delete("/{task_id}", status_code=status.HTTP_200_OK)
def delete_task(
    task_id: int,
    requester_id: Optional[int] = Query(default=None, description="User ID deleting the task"),
    db: Session = Depends(get_db),
):
    """
    Delete a task by primary key.
    Strict Rule: Only Team Leaders can delete tasks.
    """
    task = _get_task_or_404(task_id, db)

    if requester_id is not None:
        requester = db.query(models.User).filter(models.User.id == requester_id).first()
        if not requester or requester.role != "Team Leader":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Permission Denied: Only Team Leaders can delete tasks.",
            )
        if task.leader_id is not None and task.leader_id != requester.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Permission Denied: You can only delete tasks in your own workspace.",
            )

    db.delete(task)
    db.commit()
    return {"detail": f"Task with id={task_id} deleted successfully."}
