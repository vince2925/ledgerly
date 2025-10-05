from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from ..database import get_db
from ..models import TemplateVersion, AuditTemplate
from ..schemas import TemplateVersionResponse
from ..auth import get_current_user

router = APIRouter(prefix="/audit/templates/{template_id}/versions", tags=["versions"])


@router.get("/", response_model=List[TemplateVersionResponse])
def list_versions(
    template_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Get all versions for a template"""
    template = db.query(AuditTemplate).filter(AuditTemplate.id == template_id).first()
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")

    versions = (
        db.query(TemplateVersion)
        .filter(TemplateVersion.template_id == template_id)
        .order_by(TemplateVersion.version.desc())
        .all()
    )
    return versions


@router.get("/{version_number}", response_model=TemplateVersionResponse)
def get_version(
    template_id: int,
    version_number: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Get a specific version of a template"""
    version = (
        db.query(TemplateVersion)
        .filter(
            TemplateVersion.template_id == template_id,
            TemplateVersion.version == version_number,
        )
        .first()
    )
    if not version:
        raise HTTPException(status_code=404, detail="Version not found")
    return version


@router.post("/{version_number}/restore", status_code=status.HTTP_200_OK)
def restore_version(
    template_id: int,
    version_number: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Restore a template to a specific version"""
    template = db.query(AuditTemplate).filter(AuditTemplate.id == template_id).first()
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")

    version = (
        db.query(TemplateVersion)
        .filter(
            TemplateVersion.template_id == template_id,
            TemplateVersion.version == version_number,
        )
        .first()
    )
    if not version:
        raise HTTPException(status_code=404, detail="Version not found")

    # Create version snapshot of current state before restoring
    current_snapshot = TemplateVersion(
        template_id=template.id,
        version=template.version,
        name=template.name,
        description=template.description,
        content=template.content,
        tags=template.tags,
        status=template.status,
        changed_by=current_user.get("preferred_username", current_user.get("email", "Unknown")),
    )
    db.add(current_snapshot)

    # Restore to selected version
    template.name = version.name
    template.description = version.description
    template.content = version.content
    template.tags = version.tags
    template.status = version.status
    template.version += 1

    db.commit()
    db.refresh(template)

    return {"message": f"Template restored to version {version_number}", "current_version": template.version}
