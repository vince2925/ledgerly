from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List
from enum import Enum


class TemplateStatus(str, Enum):
    DRAFT = "draft"
    ACTIVE = "active"
    ARCHIVED = "archived"


class AuditTemplateBase(BaseModel):
    name: str
    description: Optional[str] = None
    content: str
    tags: List[str] = []
    status: TemplateStatus = TemplateStatus.DRAFT


class AuditTemplateCreate(AuditTemplateBase):
    pass


class AuditTemplateUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    content: Optional[str] = None
    tags: Optional[List[str]] = None
    status: Optional[TemplateStatus] = None


class AuditTemplateResponse(AuditTemplateBase):
    id: int
    version: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class AuditReportCreate(BaseModel):
    template_id: int
    title: str
    due_date: Optional[datetime] = None


class AuditReportResponse(BaseModel):
    id: int
    template_id: int
    title: str
    generated_by: str
    due_date: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True


class TemplateCommentCreate(BaseModel):
    content: str


class TemplateCommentResponse(BaseModel):
    id: int
    template_id: int
    author: str
    content: str
    created_at: datetime

    class Config:
        from_attributes = True


class TemplateVersionResponse(BaseModel):
    id: int
    template_id: int
    version: int
    name: str
    description: Optional[str] = None
    content: str
    tags: List[str] = []
    status: str
    changed_by: str
    created_at: datetime

    class Config:
        from_attributes = True


class AttachmentResponse(BaseModel):
    id: int
    template_id: Optional[int] = None
    report_id: Optional[int] = None
    filename: str
    original_filename: str
    file_size: int
    mime_type: str
    uploaded_by: str
    created_at: datetime

    class Config:
        from_attributes = True


class ChecklistItemCreate(BaseModel):
    title: str
    description: Optional[str] = None
    is_mandatory: bool = False
    order: int = 0
    depends_on_id: Optional[int] = None
    due_date: Optional[datetime] = None


class ChecklistItemUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    is_completed: Optional[bool] = None
    is_mandatory: Optional[bool] = None
    order: Optional[int] = None
    depends_on_id: Optional[int] = None
    due_date: Optional[datetime] = None


class ChecklistItemResponse(BaseModel):
    id: int
    checklist_id: int
    title: str
    description: Optional[str] = None
    is_completed: bool
    is_mandatory: bool
    order: int
    depends_on_id: Optional[int] = None
    completed_by: Optional[str] = None
    completed_at: Optional[datetime] = None
    due_date: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True


class ChecklistCreate(BaseModel):
    name: str
    description: Optional[str] = None
    template_id: Optional[int] = None
    report_id: Optional[int] = None


class ChecklistResponse(BaseModel):
    id: int
    template_id: Optional[int] = None
    report_id: Optional[int] = None
    name: str
    description: Optional[str] = None
    created_by: str
    created_at: datetime
    updated_at: datetime
    items: List[ChecklistItemResponse] = []

    class Config:
        from_attributes = True
