from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class AuditTemplateBase(BaseModel):
    name: str
    description: Optional[str] = None
    content: str


class AuditTemplateCreate(AuditTemplateBase):
    pass


class AuditTemplateUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    content: Optional[str] = None


class AuditTemplateResponse(AuditTemplateBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class AuditReportCreate(BaseModel):
    template_id: int
    title: str


class AuditReportResponse(BaseModel):
    id: int
    template_id: int
    title: str
    generated_by: str
    created_at: datetime

    class Config:
        from_attributes = True
