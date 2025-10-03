from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet
from io import BytesIO
from datetime import datetime, timezone
from ..database import get_db
from ..models import AuditTemplate, AuditReport
from ..schemas import AuditReportCreate

router = APIRouter(prefix="/audit/reports", tags=["reports"])


def generate_pdf(template: AuditTemplate, title: str) -> BytesIO:
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter)
    styles = getSampleStyleSheet()
    story = []

    story.append(Paragraph(f"<b>{title}</b>", styles['Title']))
    story.append(Spacer(1, 12))
    story.append(Paragraph(f"Template: {template.name}", styles['Heading2']))
    story.append(Spacer(1, 12))
    story.append(Paragraph(f"Generated: {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S UTC')}", styles['Normal']))
    story.append(Spacer(1, 12))
    story.append(Paragraph("<b>Description:</b>", styles['Heading3']))
    story.append(Paragraph(template.description or "No description", styles['Normal']))
    story.append(Spacer(1, 12))
    story.append(Paragraph("<b>Content:</b>", styles['Heading3']))
    story.append(Paragraph(template.content, styles['Normal']))

    doc.build(story)
    buffer.seek(0)
    return buffer


@router.post("/generate", response_class=StreamingResponse)
def generate_report(report_data: AuditReportCreate, db: Session = Depends(get_db)):
    template = db.query(AuditTemplate).filter(AuditTemplate.id == report_data.template_id).first()
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")

    new_report = AuditReport(
        template_id=report_data.template_id,
        title=report_data.title,
        generated_by="system"
    )
    db.add(new_report)
    db.commit()

    pdf_buffer = generate_pdf(template, report_data.title)

    return StreamingResponse(
        pdf_buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={report_data.title.replace(' ', '_')}.pdf"}
    )
