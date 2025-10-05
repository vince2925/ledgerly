from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime

from ..database import get_db
from ..models import Checklist, ChecklistItem, AuditTemplate, AuditReport
from ..schemas import (
    ChecklistCreate,
    ChecklistResponse,
    ChecklistItemCreate,
    ChecklistItemUpdate,
    ChecklistItemResponse,
)
from ..auth import get_current_user

router = APIRouter(prefix="/checklists", tags=["checklists"])


@router.post("/", response_model=ChecklistResponse, status_code=status.HTTP_201_CREATED)
def create_checklist(
    checklist: ChecklistCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Create a new checklist"""
    # Validate template or report exists
    if checklist.template_id:
        template = db.query(AuditTemplate).filter(AuditTemplate.id == checklist.template_id).first()
        if not template:
            raise HTTPException(status_code=404, detail="Template not found")
    elif checklist.report_id:
        report = db.query(AuditReport).filter(AuditReport.id == checklist.report_id).first()
        if not report:
            raise HTTPException(status_code=404, detail="Report not found")

    new_checklist = Checklist(
        name=checklist.name,
        description=checklist.description,
        template_id=checklist.template_id,
        report_id=checklist.report_id,
        created_by=current_user.get("preferred_username", current_user.get("email", "Unknown")),
    )
    db.add(new_checklist)
    db.commit()
    db.refresh(new_checklist)
    return new_checklist


@router.get("/{checklist_id}", response_model=ChecklistResponse)
def get_checklist(
    checklist_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Get a checklist with all its items"""
    checklist = db.query(Checklist).filter(Checklist.id == checklist_id).first()
    if not checklist:
        raise HTTPException(status_code=404, detail="Checklist not found")
    return checklist


@router.get("/template/{template_id}", response_model=List[ChecklistResponse])
def get_template_checklists(
    template_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Get all checklists for a template"""
    template = db.query(AuditTemplate).filter(AuditTemplate.id == template_id).first()
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")

    checklists = db.query(Checklist).filter(Checklist.template_id == template_id).all()
    return checklists


@router.delete("/{checklist_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_checklist(
    checklist_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Delete a checklist"""
    checklist = db.query(Checklist).filter(Checklist.id == checklist_id).first()
    if not checklist:
        raise HTTPException(status_code=404, detail="Checklist not found")

    db.delete(checklist)
    db.commit()
    return None


@router.post("/{checklist_id}/items", response_model=ChecklistItemResponse, status_code=status.HTTP_201_CREATED)
def create_checklist_item(
    checklist_id: int,
    item: ChecklistItemCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Add an item to a checklist"""
    checklist = db.query(Checklist).filter(Checklist.id == checklist_id).first()
    if not checklist:
        raise HTTPException(status_code=404, detail="Checklist not found")

    # Validate dependency if specified
    if item.depends_on_id:
        dep_item = db.query(ChecklistItem).filter(
            ChecklistItem.id == item.depends_on_id,
            ChecklistItem.checklist_id == checklist_id
        ).first()
        if not dep_item:
            raise HTTPException(status_code=404, detail="Dependency item not found in this checklist")

    new_item = ChecklistItem(
        checklist_id=checklist_id,
        **item.model_dump()
    )
    db.add(new_item)
    db.commit()
    db.refresh(new_item)
    return new_item


@router.put("/{checklist_id}/items/{item_id}", response_model=ChecklistItemResponse)
def update_checklist_item(
    checklist_id: int,
    item_id: int,
    item_update: ChecklistItemUpdate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Update a checklist item"""
    item = db.query(ChecklistItem).filter(
        ChecklistItem.id == item_id,
        ChecklistItem.checklist_id == checklist_id
    ).first()
    if not item:
        raise HTTPException(status_code=404, detail="Checklist item not found")

    # Check if marking as complete
    if item_update.is_completed is not None and item_update.is_completed != item.is_completed:
        if item_update.is_completed:
            # Check dependencies are met
            if item.depends_on_id:
                dependency = db.query(ChecklistItem).filter(ChecklistItem.id == item.depends_on_id).first()
                if dependency and not dependency.is_completed:
                    raise HTTPException(
                        status_code=400,
                        detail=f"Cannot complete this item. Dependency '{dependency.title}' must be completed first."
                    )

            item.completed_by = current_user.get("preferred_username", current_user.get("email", "Unknown"))
            item.completed_at = datetime.utcnow()
        else:
            item.completed_by = None
            item.completed_at = None

    # Update other fields
    update_data = item_update.model_dump(exclude_unset=True, exclude={"is_completed"})
    for key, value in update_data.items():
        setattr(item, key, value)

    if item_update.is_completed is not None:
        item.is_completed = item_update.is_completed

    db.commit()
    db.refresh(item)
    return item


@router.delete("/{checklist_id}/items/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_checklist_item(
    checklist_id: int,
    item_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Delete a checklist item"""
    item = db.query(ChecklistItem).filter(
        ChecklistItem.id == item_id,
        ChecklistItem.checklist_id == checklist_id
    ).first()
    if not item:
        raise HTTPException(status_code=404, detail="Checklist item not found")

    db.delete(item)
    db.commit()
    return None


@router.get("/{checklist_id}/progress")
def get_checklist_progress(
    checklist_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Get progress statistics for a checklist"""
    checklist = db.query(Checklist).filter(Checklist.id == checklist_id).first()
    if not checklist:
        raise HTTPException(status_code=404, detail="Checklist not found")

    items = db.query(ChecklistItem).filter(ChecklistItem.checklist_id == checklist_id).all()

    total_items = len(items)
    completed_items = sum(1 for item in items if item.is_completed)
    mandatory_items = sum(1 for item in items if item.is_mandatory)
    completed_mandatory = sum(1 for item in items if item.is_mandatory and item.is_completed)

    return {
        "checklist_id": checklist_id,
        "total_items": total_items,
        "completed_items": completed_items,
        "mandatory_items": mandatory_items,
        "completed_mandatory": completed_mandatory,
        "completion_percentage": (completed_items / total_items * 100) if total_items > 0 else 0,
        "mandatory_completion_percentage": (completed_mandatory / mandatory_items * 100) if mandatory_items > 0 else 0,
    }
