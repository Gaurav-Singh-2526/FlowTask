"""
User endpoints with team isolation and authentication.
"""

from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

import models
import schemas
from database import get_db

router = APIRouter(prefix="/users", tags=["users"])


def _compute_initials(name: str) -> str:
    parts = name.strip().split()
    if len(parts) >= 2:
        return f"{parts[0][0]}{parts[1][0]}".upper()
    elif len(parts) == 1 and parts[0]:
        return parts[0][:2].upper()
    return "TM"


def _get_user_or_404(user_id: int, db: Session) -> models.User:
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with id={user_id} not found.",
        )
    return user


def _attach_user_metadata(user: models.User, db: Session) -> schemas.UserOut:
    assignments = (
        db.query(models.TeamMemberProject)
        .filter(models.TeamMemberProject.team_member_id == user.id)
        .all()
    )
    pids = [a.project_id for a in assignments]
    project_briefs = []
    if pids:
        projs = db.query(models.Project).filter(models.Project.id.in_(pids)).all()
        project_briefs = [schemas.ProjectBrief.model_validate(p) for p in projs]

    return schemas.UserOut(
        id=user.id,
        name=user.name,
        email=user.email,
        role=user.role,
        title=user.title,
        initials=user.initials,
        color=user.color,
        phone=user.phone,
        bio=user.bio,
        avatar_url=user.avatar_url,
        leader_id=user.leader_id,
        created_at=user.created_at,
        assigned_project_ids=pids,
        assigned_projects=project_briefs,
    )


@router.post("/login", response_model=schemas.UserOut, status_code=status.HTTP_200_OK)
def login_user(payload: schemas.UserLogin, db: Session = Depends(get_db)):
    """Authenticate user with email and password from Supabase database."""
    user = (
        db.query(models.User)
        .filter(models.User.email.ilike(payload.email.strip()))
        .first()
    )
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="No account found with this email address.",
        )
    if user.password != payload.password:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect password. Please try again.",
        )
    return _attach_user_metadata(user, db)


@router.post("/", response_model=schemas.UserOut, status_code=status.HTTP_201_CREATED)
def create_user(payload: schemas.UserCreate, db: Session = Depends(get_db)):
    """Create a new user or team member in Supabase with project assignments."""
    existing = (
        db.query(models.User)
        .filter(models.User.email.ilike(payload.email.strip()))
        .first()
    )
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"A user with email '{payload.email}' already exists.",
        )

    role = payload.role or "Team Leader"

    # Strict Rule: Team Members can ONLY be created by a Team Leader within a workspace
    if role == "Team Member":
        if not payload.leader_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Permission Denied: Team Members can only be created by an authenticated Team Leader within an active workspace.",
            )
        leader = db.query(models.User).filter(models.User.id == payload.leader_id).first()
        if not leader or leader.role != "Team Leader":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Permission Denied: Only verified Team Leaders can create team members.",
            )

    initials = (payload.initials or _compute_initials(payload.name)).strip()
    user = models.User(
        name=payload.name.strip(),
        email=payload.email.strip().lower(),
        password=payload.password or "password123",
        role=role,
        title=payload.title or ("Team Leader" if role == "Team Leader" else "Team Member"),
        initials=initials,
        color=payload.color or ("av-blue" if role == "Team Leader" else "av-green"),
        phone=payload.phone,
        bio=payload.bio,
        avatar_url=payload.avatar_url,
        leader_id=payload.leader_id,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # Save multiple project assignments in Supabase (team_member_projects)
    if payload.project_ids and user.role == "Team Member":
        unique_pids = list(dict.fromkeys(payload.project_ids))
        for pid in unique_pids:
            proj = db.query(models.Project).filter(models.Project.id == pid).first()
            if proj and (user.leader_id is None or proj.owner_id == user.leader_id):
                assignment = models.TeamMemberProject(
                    team_member_id=user.id,
                    project_id=pid,
                    assigned_by=user.leader_id,
                )
                db.add(assignment)
        db.commit()

    return _attach_user_metadata(user, db)


@router.get("/", response_model=List[schemas.UserOut], status_code=status.HTTP_200_OK)
def list_users(
    leader_id: Optional[int] = Query(default=None, description="Filter team members by leader ID"),
    role: Optional[str] = Query(default=None, description="Filter by user role"),
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
):
    """
    Return team members.
    If leader_id is provided, returns ONLY team members belonging to that leader.
    This guarantees 100% team isolation between Team Leaders.
    """
    query = db.query(models.User)
    if leader_id is not None:
        query = query.filter(models.User.leader_id == leader_id)
    if role is not None:
        query = query.filter(models.User.role == role)
    rows = query.offset(skip).limit(limit).all()
    return [_attach_user_metadata(u, db) for u in rows]


@router.get("/{user_id}", response_model=schemas.UserOut, status_code=status.HTTP_200_OK)
def get_user(user_id: int, db: Session = Depends(get_db)):
    """Fetch one user by primary key; 404 if not found."""
    user = _get_user_or_404(user_id, db)
    return _attach_user_metadata(user, db)


@router.put("/{user_id}", response_model=schemas.UserOut, status_code=status.HTTP_200_OK)
def update_user(
    user_id: int,
    payload: schemas.UserUpdate,
    requester_id: Optional[int] = Query(default=None, description="ID of user making update"),
    db: Session = Depends(get_db),
):
    """Update team member or user details in database, including assigned projects."""
    user = _get_user_or_404(user_id, db)

    if requester_id is not None:
        requester = _get_user_or_404(requester_id, db)
        if requester.role == "Team Member":
            if requester.id != user_id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Permission Denied: Team Members can only update their own profile.",
                )
            if payload.role is not None and payload.role != "Team Member":
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Permission Denied: Team Members cannot change account role.",
                )
            if payload.project_ids is not None:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Permission Denied: Team Members cannot assign projects to themselves.",
                )

    if payload.name is not None:
        user.name = payload.name.strip()
        if not payload.initials:
            user.initials = _compute_initials(payload.name)
    if payload.email is not None and (requester_id is None or requester_id == user_id):
        user.email = payload.email.strip().lower()
    if payload.password is not None:
        user.password = payload.password
    if payload.title is not None:
        user.title = payload.title.strip()
    if payload.initials is not None:
        user.initials = payload.initials.strip()
    if payload.color is not None:
        user.color = payload.color.strip()
    if payload.phone is not None:
        user.phone = payload.phone.strip()
    if payload.bio is not None:
        user.bio = payload.bio.strip()
    if payload.avatar_url is not None:
        user.avatar_url = payload.avatar_url.strip()
    if payload.role is not None and (requester_id is None or requester.role == "Team Leader"):
        user.role = payload.role.strip()
    if payload.leader_id is not None:
        user.leader_id = payload.leader_id

    # Synchronize project assignments if provided
    if payload.project_ids is not None:
        # Check that requester is Team Leader if requester_id provided
        if requester_id is not None:
            requester = _get_user_or_404(requester_id, db)
            if requester.role != "Team Leader":
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Permission Denied: Only Team Leaders can assign projects.",
                )
            if user.leader_id is not None and user.leader_id != requester.id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Permission Denied: You can only manage projects for members in your own workspace.",
                )

        db.query(models.TeamMemberProject).filter(
            models.TeamMemberProject.team_member_id == user.id
        ).delete(synchronize_session=False)

        unique_pids = list(dict.fromkeys(payload.project_ids))
        for pid in unique_pids:
            proj = db.query(models.Project).filter(models.Project.id == pid).first()
            if proj and (user.leader_id is None or proj.owner_id == user.leader_id):
                assignment = models.TeamMemberProject(
                    team_member_id=user.id,
                    project_id=pid,
                    assigned_by=requester_id or user.leader_id,
                )
                db.add(assignment)

    db.commit()
    db.refresh(user)
    return _attach_user_metadata(user, db)


@router.put("/{user_id}/projects", response_model=schemas.UserOut, status_code=status.HTTP_200_OK)
def update_member_projects(
    user_id: int,
    payload: schemas.MemberProjectAssign,
    requester_id: Optional[int] = Query(default=None, description="ID of Team Leader setting projects"),
    db: Session = Depends(get_db),
):
    """
    Dedicated endpoint for Team Leaders to assign/unassign multiple projects to a member.
    Enforces that Team Members cannot assign projects to themselves.
    """
    user = _get_user_or_404(user_id, db)
    if requester_id is not None:
        requester = _get_user_or_404(requester_id, db)
        if requester.role != "Team Leader":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Permission Denied: Only Team Leaders can manage project assignments.",
            )
        if user.leader_id is not None and user.leader_id != requester.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Permission Denied: You can only assign projects within your own workspace.",
            )

    # Clean existing and set new unique assignments
    db.query(models.TeamMemberProject).filter(
        models.TeamMemberProject.team_member_id == user.id
    ).delete(synchronize_session=False)

    unique_pids = list(dict.fromkeys(payload.project_ids))
    for pid in unique_pids:
        proj = db.query(models.Project).filter(models.Project.id == pid).first()
        if proj and (user.leader_id is None or proj.owner_id == user.leader_id):
            assignment = models.TeamMemberProject(
                team_member_id=user.id,
                project_id=pid,
                assigned_by=requester_id or user.leader_id,
            )
            db.add(assignment)

    db.commit()
    db.refresh(user)
    return _attach_user_metadata(user, db)


@router.put("/{user_id}/profile", response_model=schemas.UserOut, status_code=status.HTTP_200_OK)
def update_user_profile(
    user_id: int,
    payload: schemas.UserProfileUpdate,
    requester_id: Optional[int] = Query(default=None, description="ID of user requesting update"),
    db: Session = Depends(get_db),
):
    """
    Profile editing endpoint for Team Leaders and Team Members to edit their OWN profile.
    Allows editing Name, Phone, Bio, Avatar / Color, Title.
    Role and Email are protected and cannot be changed here.
    """
    user = _get_user_or_404(user_id, db)

    if requester_id is not None:
        requester = _get_user_or_404(requester_id, db)
        if requester.id != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Permission Denied: You can only edit your own personal profile.",
            )

    if payload.name is not None and payload.name.strip():
        user.name = payload.name.strip()
        user.initials = _compute_initials(payload.name)
    if payload.phone is not None:
        user.phone = payload.phone.strip()
    if payload.bio is not None:
        user.bio = payload.bio.strip()
    if payload.avatar_url is not None:
        user.avatar_url = payload.avatar_url.strip()
    if payload.color is not None:
        user.color = payload.color.strip()
    if payload.title is not None:
        user.title = payload.title.strip()

    db.commit()
    db.refresh(user)
    return _attach_user_metadata(user, db)


@router.delete("/{user_id}", status_code=status.HTTP_200_OK)
def delete_user(user_id: int, db: Session = Depends(get_db)):
    """Delete a user or team member from Supabase."""
    user = _get_user_or_404(user_id, db)
    db.delete(user)
    db.commit()
    return {"detail": f"User with id={user_id} deleted successfully."}
