from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from typing import List
import os
import uuid
from pathlib import Path

from ..database import get_db
from ..models import Attachment, AuditTemplate, AuditReport
from ..schemas import AttachmentResponse
from ..auth import get_current_user

router = APIRouter(tags=["attachments"])

# Create uploads directory if it doesn't exist
UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)


@router.post("/audit/templates/{template_id}/attachments", response_model=AttachmentResponse, status_code=status.HTTP_201_CREATED)
async def upload_template_attachment(
    template_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Upload an attachment to a template"""
    template = db.query(AuditTemplate).filter(AuditTemplate.id == template_id).first()
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")

    # Generate unique filename
    file_extension = os.path.splitext(file.filename)[1]
    unique_filename = f"{uuid.uuid4()}{file_extension}"
    file_path = UPLOAD_DIR / unique_filename

    # Save file
    try:
        contents = await file.read()
        with open(file_path, "wb") as f:
            f.write(contents)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save file: {str(e)}")

    # Create attachment record
    attachment = Attachment(
        template_id=template_id,
        filename=unique_filename,
        original_filename=file.filename,
        file_path=str(file_path),
        file_size=len(contents),
        mime_type=file.content_type or "application/octet-stream",
        uploaded_by=current_user.get("preferred_username", current_user.get("email", "Unknown")),
    )
    db.add(attachment)
    db.commit()
    db.refresh(attachment)
    return attachment


@router.get("/audit/templates/{template_id}/attachments", response_model=List[AttachmentResponse])
def list_template_attachments(
    template_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Get all attachments for a template"""
    template = db.query(AuditTemplate).filter(AuditTemplate.id == template_id).first()
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")

    attachments = (
        db.query(Attachment)
        .filter(Attachment.template_id == template_id)
        .order_by(Attachment.created_at.desc())
        .all()
    )
    return attachments


@router.get("/audit/templates/{template_id}/attachments/{attachment_id}/download")
async def download_template_attachment(
    template_id: int,
    attachment_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Download a template attachment"""
    attachment = (
        db.query(Attachment)
        .filter(
            Attachment.id == attachment_id,
            Attachment.template_id == template_id,
        )
        .first()
    )
    if not attachment:
        raise HTTPException(status_code=404, detail="Attachment not found")

    if not os.path.exists(attachment.file_path):
        raise HTTPException(status_code=404, detail="File not found on disk")

    return FileResponse(
        path=attachment.file_path,
        filename=attachment.original_filename,
        media_type=attachment.mime_type,
    )


@router.delete("/audit/templates/{template_id}/attachments/{attachment_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_template_attachment(
    template_id: int,
    attachment_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Delete a template attachment"""
    attachment = (
        db.query(Attachment)
        .filter(
            Attachment.id == attachment_id,
            Attachment.template_id == template_id,
        )
        .first()
    )
    if not attachment:
        raise HTTPException(status_code=404, detail="Attachment not found")

    # Delete file from disk
    try:
        if os.path.exists(attachment.file_path):
            os.remove(attachment.file_path)
    except Exception as e:
        print(f"Warning: Failed to delete file from disk: {str(e)}")

    db.delete(attachment)
    db.commit()
    return None


@router.post("/audit/reports/{report_id}/attachments", response_model=AttachmentResponse, status_code=status.HTTP_201_CREATED)
async def upload_report_attachment(
    report_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Upload an attachment to a report"""
    report = db.query(AuditReport).filter(AuditReport.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    # Generate unique filename
    file_extension = os.path.splitext(file.filename)[1]
    unique_filename = f"{uuid.uuid4()}{file_extension}"
    file_path = UPLOAD_DIR / unique_filename

    # Save file
    try:
        contents = await file.read()
        with open(file_path, "wb") as f:
            f.write(contents)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save file: {str(e)}")

    # Create attachment record
    attachment = Attachment(
        report_id=report_id,
        filename=unique_filename,
        original_filename=file.filename,
        file_path=str(file_path),
        file_size=len(contents),
        mime_type=file.content_type or "application/octet-stream",
        uploaded_by=current_user.get("preferred_username", current_user.get("email", "Unknown")),
    )
    db.add(attachment)
    db.commit()
    db.refresh(attachment)
    return attachment


@router.get("/audit/reports/{report_id}/attachments", response_model=List[AttachmentResponse])
def list_report_attachments(
    report_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Get all attachments for a report"""
    report = db.query(AuditReport).filter(AuditReport.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    attachments = (
        db.query(Attachment)
        .filter(Attachment.report_id == report_id)
        .order_by(Attachment.created_at.desc())
        .all()
    )
    return attachments


@router.get("/audit/reports/{report_id}/attachments/{attachment_id}/download")
async def download_report_attachment(
    report_id: int,
    attachment_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Download a report attachment"""
    attachment = (
        db.query(Attachment)
        .filter(
            Attachment.id == attachment_id,
            Attachment.report_id == report_id,
        )
        .first()
    )
    if not attachment:
        raise HTTPException(status_code=404, detail="Attachment not found")

    if not os.path.exists(attachment.file_path):
        raise HTTPException(status_code=404, detail="File not found on disk")

    return FileResponse(
        path=attachment.file_path,
        filename=attachment.original_filename,
        media_type=attachment.mime_type,
    )


@router.delete("/audit/reports/{report_id}/attachments/{attachment_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_report_attachment(
    report_id: int,
    attachment_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Delete a report attachment"""
    attachment = (
        db.query(Attachment)
        .filter(
            Attachment.id == attachment_id,
            Attachment.report_id == report_id,
        )
        .first()
    )
    if not attachment:
        raise HTTPException(status_code=404, detail="Attachment not found")

    # Delete file from disk
    try:
        if os.path.exists(attachment.file_path):
            os.remove(attachment.file_path)
    except Exception as e:
        print(f"Warning: Failed to delete file from disk: {str(e)}")

    db.delete(attachment)
    db.commit()
    return None
