from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, ARRAY, Enum as SQLEnum
from sqlalchemy.orm import relationship
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime
import enum

Base = declarative_base()


class TemplateStatus(str, enum.Enum):
    DRAFT = "draft"
    ACTIVE = "active"
    ARCHIVED = "archived"


class AuditTemplate(Base):
    __tablename__ = "audit_templates"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True, nullable=False)
    description = Column(Text, nullable=True)
    content = Column(Text, nullable=False)
    tags = Column(ARRAY(String), default=list, nullable=False, server_default='{}')
    status = Column(String(20), default="draft", nullable=False)
    version = Column(Integer, default=1, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    reports = relationship("AuditReport", back_populates="template")
    comments = relationship("TemplateComment", back_populates="template", cascade="all, delete-orphan")
    versions = relationship("TemplateVersion", back_populates="template", cascade="all, delete-orphan")
    attachments = relationship("Attachment", back_populates="template", cascade="all, delete-orphan")


class AuditReport(Base):
    __tablename__ = "audit_reports"

    id = Column(Integer, primary_key=True, index=True)
    template_id = Column(Integer, ForeignKey("audit_templates.id"), nullable=False)
    title = Column(String, nullable=False)
    generated_by = Column(String, nullable=False)
    due_date = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    template = relationship("AuditTemplate", back_populates="reports")
    attachments = relationship("Attachment", back_populates="report", cascade="all, delete-orphan")


class TemplateComment(Base):
    __tablename__ = "template_comments"

    id = Column(Integer, primary_key=True, index=True)
    template_id = Column(Integer, ForeignKey("audit_templates.id"), nullable=False)
    author = Column(String, nullable=False)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    template = relationship("AuditTemplate", back_populates="comments")


class TemplateVersion(Base):
    __tablename__ = "template_versions"

    id = Column(Integer, primary_key=True, index=True)
    template_id = Column(Integer, ForeignKey("audit_templates.id"), nullable=False)
    version = Column(Integer, nullable=False)
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    content = Column(Text, nullable=False)
    tags = Column(ARRAY(String), default=list, nullable=False, server_default='{}')
    status = Column(String(20), nullable=False)
    changed_by = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    template = relationship("AuditTemplate", back_populates="versions")


class Attachment(Base):
    __tablename__ = "attachments"

    id = Column(Integer, primary_key=True, index=True)
    template_id = Column(Integer, ForeignKey("audit_templates.id"), nullable=True)
    report_id = Column(Integer, ForeignKey("audit_reports.id"), nullable=True)
    filename = Column(String, nullable=False)
    original_filename = Column(String, nullable=False)
    file_path = Column(String, nullable=False)
    file_size = Column(Integer, nullable=False)
    mime_type = Column(String, nullable=False)
    uploaded_by = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    template = relationship("AuditTemplate", back_populates="attachments")
    report = relationship("AuditReport", back_populates="attachments")
