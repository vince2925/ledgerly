from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from ..database import get_db
from ..models import TemplateComment, AuditTemplate
from ..schemas import TemplateCommentCreate, TemplateCommentResponse
from ..auth import get_current_user

router = APIRouter(prefix="/audit/templates/{template_id}/comments", tags=["comments"])


@router.get("/", response_model=List[TemplateCommentResponse])
def list_comments(
    template_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Get all comments for a template"""
    template = db.query(AuditTemplate).filter(AuditTemplate.id == template_id).first()
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")

    comments = (
        db.query(TemplateComment)
        .filter(TemplateComment.template_id == template_id)
        .order_by(TemplateComment.created_at.desc())
        .all()
    )
    return comments


@router.post("/", response_model=TemplateCommentResponse, status_code=status.HTTP_201_CREATED)
def create_comment(
    template_id: int,
    comment: TemplateCommentCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Create a new comment on a template"""
    template = db.query(AuditTemplate).filter(AuditTemplate.id == template_id).first()
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")

    new_comment = TemplateComment(
        template_id=template_id,
        author=current_user.get("preferred_username", current_user.get("email", "Unknown")),
        content=comment.content,
    )
    db.add(new_comment)
    db.commit()
    db.refresh(new_comment)
    return new_comment


@router.delete("/{comment_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_comment(
    template_id: int,
    comment_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Delete a comment"""
    comment = (
        db.query(TemplateComment)
        .filter(
            TemplateComment.id == comment_id,
            TemplateComment.template_id == template_id,
        )
        .first()
    )
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")

    db.delete(comment)
    db.commit()
    return None
