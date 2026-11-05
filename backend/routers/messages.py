"""
Messages & Directives endpoints for permanent team chat persistence in Supabase.
"""

from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

import models
import schemas
from database import get_db

router = APIRouter(prefix="/messages", tags=["messages"])


@router.get("/", status_code=status.HTTP_200_OK)
def list_messages(
    leader_id: int = Query(..., description="Team Leader ID to scope chat messages"),
    db: Session = Depends(get_db),
):
    """
    Retrieve all announcements and chat messages for a specific Team Leader workspace.
    Returns root messages with nested reply responses.
    """
    root_messages = (
        db.query(models.Message)
        .filter(models.Message.leader_id == leader_id, models.Message.parent_id == None)
        .order_by(models.Message.created_at.desc())
        .all()
    )

    result = []
    for msg in root_messages:
        replies = (
            db.query(models.Message)
            .filter(models.Message.parent_id == msg.id)
            .order_by(models.Message.created_at.asc())
            .all()
        )
        responses = [
            {
                "id": r.id,
                "memberName": r.sender_name,
                "memberInitials": r.sender_initials or "TM",
                "memberColor": r.sender_color or "av-green",
                "text": r.message,
                "timestamp": r.created_at.strftime("%b %d, %H:%M"),
                "seenBy": [r.sender_name],
            }
            for r in replies
        ]

        result.append(
            {
                "id": msg.id,
                "leader_id": msg.leader_id,
                "from": msg.sender_name,
                "fromRole": msg.sender_role,
                "fromInitials": msg.sender_initials or "AM",
                "fromColor": msg.sender_color or "av-blue",
                "to": msg.target or "All Members",
                "message": msg.message,
                "timestamp": msg.created_at.strftime("%b %d, %H:%M"),
                "seenBy": [msg.sender_name],
                "responses": responses,
            }
        )

    return result


@router.post("/", status_code=status.HTTP_201_CREATED)
def create_message(payload: schemas.MessageCreate, db: Session = Depends(get_db)):
    """Post a team announcement or directive to Supabase."""
    msg = models.Message(
        leader_id=payload.leader_id,
        sender_id=payload.sender_id,
        sender_name=payload.sender_name,
        sender_role=payload.sender_role,
        sender_initials=payload.sender_initials,
        sender_color=payload.sender_color,
        target=payload.target or "All Members",
        message=payload.message,
        parent_id=payload.parent_id,
    )
    db.add(msg)
    db.commit()
    db.refresh(msg)

    return {
        "id": msg.id,
        "leader_id": msg.leader_id,
        "from": msg.sender_name,
        "fromRole": msg.sender_role,
        "fromInitials": msg.sender_initials or "AM",
        "fromColor": msg.sender_color or "av-blue",
        "to": msg.target or "All Members",
        "message": msg.message,
        "timestamp": msg.created_at.strftime("%b %d, %H:%M"),
        "seenBy": [msg.sender_name],
        "responses": [],
    }


@router.post("/{message_id}/responses", status_code=status.HTTP_201_CREATED)
def reply_to_message(
    message_id: int,
    payload: schemas.MessageReplyCreate,
    db: Session = Depends(get_db),
):
    """Reply to an announcement or directive."""
    parent = db.query(models.Message).filter(models.Message.id == message_id).first()
    if not parent:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Message with id={message_id} not found.",
        )

    reply = models.Message(
        leader_id=parent.leader_id,
        sender_id=payload.sender_id,
        sender_name=payload.sender_name,
        sender_role=payload.sender_role,
        sender_initials=payload.sender_initials,
        sender_color=payload.sender_color,
        target=parent.sender_name,
        message=payload.message,
        parent_id=message_id,
    )
    db.add(reply)
    db.commit()
    db.refresh(reply)

    return {
        "id": reply.id,
        "memberName": reply.sender_name,
        "memberInitials": reply.sender_initials or "TM",
        "memberColor": reply.sender_color or "av-green",
        "text": reply.message,
        "timestamp": reply.created_at.strftime("%b %d, %H:%M"),
        "seenBy": [reply.sender_name],
    }
