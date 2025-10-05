from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, extract
from datetime import datetime, timedelta
from typing import Dict, List, Any

from ..database import get_db
from ..models import AuditTemplate, AuditReport, TemplateComment, Attachment
from ..auth import get_current_user

router = APIRouter(prefix="/analytics", tags=["analytics"])


@router.get("/dashboard")
def get_dashboard_stats(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
) -> Dict[str, Any]:
    """Get comprehensive dashboard statistics"""

    # Basic counts
    total_templates = db.query(func.count(AuditTemplate.id)).scalar()
    total_reports = db.query(func.count(AuditReport.id)).scalar()
    total_comments = db.query(func.count(TemplateComment.id)).scalar()
    total_attachments = db.query(func.count(Attachment.id)).scalar()

    # Templates by status
    templates_by_status = (
        db.query(AuditTemplate.status, func.count(AuditTemplate.id))
        .group_by(AuditTemplate.status)
        .all()
    )
    status_counts = {status: count for status, count in templates_by_status}

    # Recent templates (last 30 days)
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    recent_templates = (
        db.query(func.count(AuditTemplate.id))
        .filter(AuditTemplate.created_at >= thirty_days_ago)
        .scalar()
    )

    # Recent reports (last 30 days)
    recent_reports = (
        db.query(func.count(AuditReport.id))
        .filter(AuditReport.created_at >= thirty_days_ago)
        .scalar()
    )

    # Templates created per month (last 12 months)
    twelve_months_ago = datetime.utcnow() - timedelta(days=365)
    templates_per_month = (
        db.query(
            extract("year", AuditTemplate.created_at).label("year"),
            extract("month", AuditTemplate.created_at).label("month"),
            func.count(AuditTemplate.id).label("count")
        )
        .filter(AuditTemplate.created_at >= twelve_months_ago)
        .group_by("year", "month")
        .order_by("year", "month")
        .all()
    )

    monthly_data = [
        {
            "year": int(year),
            "month": int(month),
            "count": count,
            "label": f"{int(year)}-{int(month):02d}"
        }
        for year, month, count in templates_per_month
    ]

    # Reports created per month (last 12 months)
    reports_per_month = (
        db.query(
            extract("year", AuditReport.created_at).label("year"),
            extract("month", AuditReport.created_at).label("month"),
            func.count(AuditReport.id).label("count")
        )
        .filter(AuditReport.created_at >= twelve_months_ago)
        .group_by("year", "month")
        .order_by("year", "month")
        .all()
    )

    reports_monthly_data = [
        {
            "year": int(year),
            "month": int(month),
            "count": count,
            "label": f"{int(year)}-{int(month):02d}"
        }
        for year, month, count in reports_per_month
    ]

    # Most commented templates
    most_commented = (
        db.query(
            AuditTemplate.id,
            AuditTemplate.name,
            func.count(TemplateComment.id).label("comment_count")
        )
        .outerjoin(TemplateComment)
        .group_by(AuditTemplate.id, AuditTemplate.name)
        .order_by(func.count(TemplateComment.id).desc())
        .limit(5)
        .all()
    )

    top_commented = [
        {
            "id": template_id,
            "name": name,
            "comments": count
        }
        for template_id, name, count in most_commented
    ]

    # Templates with most attachments
    most_attachments = (
        db.query(
            AuditTemplate.id,
            AuditTemplate.name,
            func.count(Attachment.id).label("attachment_count")
        )
        .outerjoin(Attachment, AuditTemplate.id == Attachment.template_id)
        .group_by(AuditTemplate.id, AuditTemplate.name)
        .order_by(func.count(Attachment.id).desc())
        .limit(5)
        .all()
    )

    top_attachments = [
        {
            "id": template_id,
            "name": name,
            "attachments": count
        }
        for template_id, name, count in most_attachments
    ]

    # Storage usage
    total_storage = db.query(func.sum(Attachment.file_size)).scalar() or 0

    return {
        "overview": {
            "total_templates": total_templates,
            "total_reports": total_reports,
            "total_comments": total_comments,
            "total_attachments": total_attachments,
            "recent_templates_30d": recent_templates,
            "recent_reports_30d": recent_reports,
            "total_storage_bytes": total_storage,
            "total_storage_mb": round(total_storage / (1024 * 1024), 2),
        },
        "templates_by_status": {
            "draft": status_counts.get("draft", 0),
            "active": status_counts.get("active", 0),
            "archived": status_counts.get("archived", 0),
        },
        "trends": {
            "templates_per_month": monthly_data,
            "reports_per_month": reports_monthly_data,
        },
        "top_templates": {
            "most_commented": top_commented,
            "most_attachments": top_attachments,
        },
    }


@router.get("/activity")
def get_recent_activity(
    limit: int = 20,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
) -> List[Dict[str, Any]]:
    """Get recent activity feed"""

    activities = []

    # Recent templates
    recent_templates = (
        db.query(AuditTemplate)
        .order_by(AuditTemplate.created_at.desc())
        .limit(limit // 2)
        .all()
    )

    for template in recent_templates:
        activities.append({
            "type": "template_created",
            "timestamp": template.created_at.isoformat(),
            "data": {
                "id": template.id,
                "name": template.name,
                "status": template.status,
            }
        })

    # Recent reports
    recent_reports = (
        db.query(AuditReport)
        .order_by(AuditReport.created_at.desc())
        .limit(limit // 2)
        .all()
    )

    for report in recent_reports:
        activities.append({
            "type": "report_generated",
            "timestamp": report.created_at.isoformat(),
            "data": {
                "id": report.id,
                "title": report.title,
                "generated_by": report.generated_by,
            }
        })

    # Sort by timestamp and limit
    activities.sort(key=lambda x: x["timestamp"], reverse=True)
    return activities[:limit]
