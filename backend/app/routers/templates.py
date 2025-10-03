from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from ..models import AuditTemplate
from ..schemas import AuditTemplateCreate, AuditTemplateUpdate, AuditTemplateResponse
from ..auth import get_current_user

router = APIRouter(prefix="/audit/templates", tags=["templates"])


@router.post("/", response_model=AuditTemplateResponse, status_code=status.HTTP_201_CREATED)
def create_template(
    template: AuditTemplateCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    db_template = db.query(AuditTemplate).filter(AuditTemplate.name == template.name).first()
    if db_template:
        raise HTTPException(status_code=400, detail="Template with this name already exists")

    new_template = AuditTemplate(**template.model_dump())
    db.add(new_template)
    db.commit()
    db.refresh(new_template)
    return new_template


@router.get("/", response_model=List[AuditTemplateResponse])
def list_templates(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    templates = db.query(AuditTemplate).offset(skip).limit(limit).all()
    return templates


@router.get("/{template_id}", response_model=AuditTemplateResponse)
def get_template(template_id: int, db: Session = Depends(get_db)):
    template = db.query(AuditTemplate).filter(AuditTemplate.id == template_id).first()
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    return template


@router.put("/{template_id}", response_model=AuditTemplateResponse)
def update_template(template_id: int, template_update: AuditTemplateUpdate, db: Session = Depends(get_db)):
    template = db.query(AuditTemplate).filter(AuditTemplate.id == template_id).first()
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")

    update_data = template_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(template, key, value)

    db.commit()
    db.refresh(template)
    return template


@router.delete("/{template_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_template(template_id: int, db: Session = Depends(get_db)):
    template = db.query(AuditTemplate).filter(AuditTemplate.id == template_id).first()
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")

    db.delete(template)
    db.commit()
    return None
