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
