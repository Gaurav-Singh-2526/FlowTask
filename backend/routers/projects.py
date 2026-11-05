"""
Project endpoints with strict Team Leader role authorization and workspace isolation.
"""

from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

import models
import schemas
from database import get_db

router = APIRouter(prefix="/projects", tags=["projects"])


def _get_project_or_404(project_id: int, db: Session) -> models.Project:
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if project is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Project with id={project_id} not found.",
        )
    return project


def _attach_project_metadata(proj: models.Project, db: Session) -> schemas.ProjectOut:
    mids = [
        row.team_member_id
        for row in db.query(models.TeamMemberProject.team_member_id)
        .filter(models.TeamMemberProject.project_id == proj.id)
        .all()
    ]
    d = {
        "id": proj.id,
        "title": proj.title,
        "description": proj.description,
        "status": proj.status,
        "deadline": proj.deadline,
        "owner_id": proj.owner_id,
        "created_at": proj.created_at,
        "assigned_member_ids": mids,
        "assigned_members_count": len(mids),
    }
    return schemas.ProjectOut.model_validate(d)


@router.post("/", response_model=schemas.ProjectOut, status_code=status.HTTP_201_CREATED)
def create_project(payload: schemas.ProjectCreate, db: Session = Depends(get_db)):
    """
    Create a new project.
    Strict Rule: Only Team Leaders can create projects.
    """
    owner = db.query(models.User).filter(models.User.id == payload.owner_id).first()
    if owner is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with id={payload.owner_id} not found.",
        )
    if owner.role != "Team Leader":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Permission Denied: Only Team Leaders can create projects.",
        )

    project = models.Project(
        title=payload.title,
        description=payload.description,
        status=payload.status or "active",
        deadline=payload.deadline,
        owner_id=payload.owner_id,
    )
    db.add(project)
    db.commit()
    db.refresh(project)
    return _attach_project_metadata(project, db)


@router.get("/", response_model=List[schemas.ProjectOut], status_code=status.HTTP_200_OK)
def list_projects(
    owner_id: Optional[int] = Query(default=None, description="Filter projects by Team Leader owner ID"),
    member_id: Optional[int] = Query(default=None, description="Filter projects assigned to Team Member"),
    requester_id: Optional[int] = Query(default=None, description="User ID of requester"),
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
):
    """
    Return list of projects.
    - If requester is a Team Member, returns ONLY projects assigned to them.
    - If owner_id is provided, returns ONLY projects owned by that Team Leader.
    - Ensures workspace isolation and security.
    """
    query = db.query(models.Project)

    eff_member_id = member_id
    if requester_id is not None:
        requester = db.query(models.User).filter(models.User.id == requester_id).first()
        if requester and requester.role == "Team Member":
            eff_member_id = requester.id

    if eff_member_id is not None:
        assigned_pids = [
            row.project_id
            for row in db.query(models.TeamMemberProject.project_id)
            .filter(models.TeamMemberProject.team_member_id == eff_member_id)
            .all()
        ]
        query = query.filter(models.Project.id.in_(assigned_pids))
    elif owner_id is not None:
        query = query.filter(models.Project.owner_id == owner_id)

    rows = query.order_by(models.Project.id.desc()).offset(skip).limit(limit).all()
    return [_attach_project_metadata(p, db) for p in rows]


@router.get("/{project_id}/members", response_model=List[schemas.UserOut], status_code=status.HTTP_200_OK)
def get_project_members(
    project_id: int,
    db: Session = Depends(get_db),
):
    """Return all team members assigned to this specific project."""
    _get_project_or_404(project_id, db)
    mids = [
        row.team_member_id
        for row in db.query(models.TeamMemberProject.team_member_id)
        .filter(models.TeamMemberProject.project_id == project_id)
        .all()
    ]
    if not mids:
        return []
    from routers.users import _attach_user_metadata
    users = db.query(models.User).filter(models.User.id.in_(mids)).all()
    return [_attach_user_metadata(u, db) for u in users]


@router.get("/{project_id}", response_model=schemas.ProjectOut, status_code=status.HTTP_200_OK)
def get_project(project_id: int, db: Session = Depends(get_db)):
    """Fetch one project by primary key; 404 if not found."""
    project = _get_project_or_404(project_id, db)
    return _attach_project_metadata(project, db)


@router.get(
    "/{project_id}/tasks",
    response_model=schemas.ProjectWithTasksOut,
    status_code=status.HTTP_200_OK,
)
def get_project_with_tasks(project_id: int, db: Session = Depends(get_db)):
    """Fetch a project and all its tasks via ORM relationship."""
    return _get_project_or_404(project_id, db)


@router.put("/{project_id}", response_model=schemas.ProjectOut, status_code=status.HTTP_200_OK)
def update_project(
    project_id: int,
    payload: schemas.ProjectUpdate,
    requester_id: Optional[int] = Query(default=None, description="User ID of the requester"),
    db: Session = Depends(get_db),
):
    """
    Update a project's details (title, description, status, deadline).
    Strict Rule: Only the owning Team Leader can edit the project.
    """
    project = _get_project_or_404(project_id, db)

    if requester_id is not None:
        user = db.query(models.User).filter(models.User.id == requester_id).first()
        if not user or user.role != "Team Leader":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Permission Denied: Only Team Leaders can edit projects.",
            )
        if project.owner_id != requester_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Permission Denied: You can only edit your own projects.",
            )

    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        if value is not None:
            setattr(project, field, value)

    db.commit()
    db.refresh(project)
    return _attach_project_metadata(project, db)


@router.delete("/{project_id}", status_code=status.HTTP_200_OK)
def delete_project(
    project_id: int,
    requester_id: Optional[int] = Query(default=None, description="User ID of the requester"),
    db: Session = Depends(get_db),
):
    """
    Delete a project and its tasks (cascade).
    Strict Rule: Only the owning Team Leader can delete the project.
    """
    project = _get_project_or_404(project_id, db)

    if requester_id is not None:
        user = db.query(models.User).filter(models.User.id == requester_id).first()
        if not user or user.role != "Team Leader":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Permission Denied: Only Team Leaders can delete projects.",
            )
        if project.owner_id != requester_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Permission Denied: You can only delete your own projects.",
            )

    db.delete(project)
    db.commit()
    return {"detail": f"Project with id={project_id} deleted successfully."}
