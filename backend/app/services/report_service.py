import os
import uuid
from datetime import datetime, timezone
from pathlib import Path
from sqlalchemy.orm import Session
from app.core.config import settings
from app.database.models import Case, Evidence, DetectedEvent, ChainOfCustody, GeneratedReport, EvidenceHash

from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, KeepTogether, HRFlowable
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch

class ReportService:
    @staticmethod
    def generate_case_pdf_report(
        db: Session,
        case_id: str,
        generated_by: str = "Lead Investigator",
        report_title: str | None = None,
        summary_notes: str | None = None
    ) -> GeneratedReport:
        case = db.query(Case).filter(Case.id == case_id).first()
        if not case:
            raise ValueError(f"Case with ID '{case_id}' not found.")

        evidence_items = db.query(Evidence).filter(Evidence.case_id == case_id).all()
        events = db.query(DetectedEvent).filter(DetectedEvent.case_id == case_id).all()
        custody_records = (
            db.query(ChainOfCustody)
            .filter(ChainOfCustody.case_id == case_id)
            .order_by(ChainOfCustody.timestamp.asc())
            .all()
        )

        report_id = f"TRX-RPT-{datetime.now(timezone.utc).strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}"
        actual_title = report_title or f"Forensic Evidence Report — {case.title}"
        filename = f"{report_id}.pdf"
        pdf_path = settings.REPORTS_DIR / filename

        # Build PDF Document
        doc = SimpleDocTemplate(
            str(pdf_path),
            pagesize=letter,
            rightMargin=36,
            leftMargin=36,
            topMargin=36,
            bottomMargin=36
        )

        styles = getSampleStyleSheet()
        
        # Forensic theme colors
        c_primary = colors.HexColor("#0f172a")    # Slate 900
        c_accent = colors.HexColor("#0284c7")     # Sky 600
        c_dark = colors.HexColor("#1e293b")       # Slate 800
        c_light = colors.HexColor("#f8fafc")      # Slate 50
        c_border = colors.HexColor("#cbd5e1")     # Slate 300

        title_style = ParagraphStyle(
            'ForensicTitle',
            parent=styles['Heading1'],
            fontName='Helvetica-Bold',
            fontSize=20,
            leading=24,
            textColor=c_primary,
            spaceAfter=4
        )

        subtitle_style = ParagraphStyle(
            'ForensicSubtitle',
            parent=styles['Normal'],
            fontName='Helvetica',
            fontSize=10,
            textColor=c_accent,
            spaceAfter=12
        )

        h2_style = ParagraphStyle(
            'ForensicH2',
            parent=styles['Heading2'],
            fontName='Helvetica-Bold',
            fontSize=13,
            leading=16,
            textColor=c_dark,
            spaceBefore=14,
            spaceAfter=6
        )

        body_style = ParagraphStyle(
            'ForensicBody',
            parent=styles['Normal'],
            fontName='Helvetica',
            fontSize=8.5,
            leading=11,
            textColor=c_dark
        )

        mono_style = ParagraphStyle(
            'ForensicMono',
            parent=styles['Normal'],
            fontName='Courier',
            fontSize=7.5,
            leading=9,
            textColor=c_dark
        )

        disclaimer_style = ParagraphStyle(
            'ForensicDisclaimer',
            parent=styles['Normal'],
            fontName='Helvetica-Oblique',
            fontSize=7.5,
            leading=10,
            textColor=colors.HexColor("#475569")
        )

        story = []

        # --- HEADER ---
        story.append(Paragraph("TRACE X — DIGITAL EVIDENCE INTELLIGENCE & FORENSIC PLATFORM", title_style))
        story.append(Paragraph("OFFICIAL FORENSIC EXAMINATION & CHAIN-OF-CUSTODY REPORT", subtitle_style))
        story.append(HRFlowable(width="100%", thickness=2, color=c_accent, spaceAfter=10))

        # --- CASE METADATA TABLE ---
        now_str = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")
        case_info_data = [
            [Paragraph("<b>Report ID:</b>", body_style), Paragraph(report_id, mono_style),
             Paragraph("<b>Generated Date:</b>", body_style), Paragraph(now_str, body_style)],
            [Paragraph("<b>Case ID:</b>", body_style), Paragraph(case.id, mono_style),
             Paragraph("<b>Case Category:</b>", body_style), Paragraph(case.category, body_style)],
            [Paragraph("<b>Case Title:</b>", body_style), Paragraph(case.title, body_style),
             Paragraph("<b>Case Status:</b>", body_style), Paragraph(f"<b>{case.status}</b> ({case.priority} Priority)", body_style)],
            [Paragraph("<b>Investigator:</b>", body_style), Paragraph(case.investigator_name, body_style),
             Paragraph("<b>Reporting Analyst:</b>", body_style), Paragraph(generated_by, body_style)],
        ]
        case_info_table = Table(case_info_data, colWidths=[1.1*inch, 2.5*inch, 1.2*inch, 2.4*inch])
        case_info_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), c_light),
            ('BOX', (0,0), (-1,-1), 1, c_border),
            ('INNERGRID', (0,0), (-1,-1), 0.5, c_border),
            ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
            ('TOPPADDING', (0,0), (-1,-1), 4),
            ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ]))
        story.append(case_info_table)
        story.append(Spacer(1, 12))

        # --- EVIDENCE INVENTORY & SHA-256 HASH VERIFICATION ---
        story.append(Paragraph("1. EVIDENCE INVENTORY & CRYPTOGRAPHIC VERIFICATION", h2_style))
        evidence_rows = [
            [Paragraph("<b>Evidence ID</b>", body_style),
             Paragraph("<b>Source / Device</b>", body_style),
             Paragraph("<b>Original File</b>", body_style),
             Paragraph("<b>Size</b>", body_style),
             Paragraph("<b>Recorded SHA-256 Hash</b>", body_style),
             Paragraph("<b>Status</b>", body_style)]
        ]

        if not evidence_items:
            evidence_rows.append([Paragraph("No evidence items cataloged for this case.", body_style)] + [Paragraph("", body_style)]*5)
        else:
            for ev in evidence_items:
                size_str = f"{ev.file_size / (1024*1024):.2f} MB"
                # Hash display
                hash_display = f"{ev.sha256_hash[:16]}...{ev.sha256_hash[-16:]}" if len(ev.sha256_hash) == 64 else ev.sha256_hash
                evidence_rows.append([
                    Paragraph(ev.id, mono_style),
                    Paragraph(f"{ev.source_device}<br/><font color='#64748b'>{ev.source_vendor}</font>", body_style),
                    Paragraph(ev.original_filename, body_style),
                    Paragraph(size_str, body_style),
                    Paragraph(hash_display, mono_style),
                    Paragraph(f"<b>{ev.status}</b>", body_style)
                ])

        ev_table = Table(evidence_rows, colWidths=[1.1*inch, 1.3*inch, 1.3*inch, 0.7*inch, 2.0*inch, 0.8*inch])
        ev_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#e2e8f0")),
            ('BOX', (0,0), (-1,-1), 1, c_border),
            ('INNERGRID', (0,0), (-1,-1), 0.5, c_border),
            ('VALIGN', (0,0), (-1,-1), 'TOP'),
            ('TOPPADDING', (0,0), (-1,-1), 4),
            ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ]))
        story.append(ev_table)
        story.append(Spacer(1, 12))

        # --- AI-ASSISTED CANDIDATE EVENTS VS INVESTIGATOR CONFIRMED FINDINGS ---
        story.append(Paragraph("2. EVENT DETECTION & INVESTIGATOR FINDINGS", h2_style))
        story.append(Paragraph(
            "<b>Forensic Distinction:</b> 'Candidate' denotes automated system detection pending verification. "
            "'Confirmed' indicates independent affirmation by an authorized forensic investigator.",
            disclaimer_style
        ))
        story.append(Spacer(1, 4))

        event_rows = [
            [Paragraph("<b>Event ID</b>", body_style),
             Paragraph("<b>Evidence ID</b>", body_style),
             Paragraph("<b>Category</b>", body_style),
             Paragraph("<b>Time Offset</b>", body_style),
             Paragraph("<b>Model / Conf.</b>", body_style),
             Paragraph("<b>Review Status</b>", body_style),
             Paragraph("<b>Analyst Notes</b>", body_style)]
        ]

        if not events:
            event_rows.append([Paragraph("No events detected or logged.", body_style)] + [Paragraph("", body_style)]*6)
        else:
            for ev in events:
                conf_str = f"{ev.model_confidence*100:.1f}%" if ev.model_confidence is not None else "N/A"
                model_str = f"{ev.model_name}<br/><font color='#64748b'>{conf_str}</font>"
                status_color = "#15803d" if ev.investigator_review_status == "Confirmed" else "#ca8a04"
                status_html = f"<font color='{status_color}'><b>{ev.investigator_review_status}</b></font>"

                event_rows.append([
                    Paragraph(ev.id, mono_style),
                    Paragraph(ev.evidence_id, mono_style),
                    Paragraph(ev.event_category, body_style),
                    Paragraph(ev.formatted_time, body_style),
                    Paragraph(model_str, body_style),
                    Paragraph(status_html, body_style),
                    Paragraph(ev.review_notes or "No notes recorded.", body_style)
                ])

        evt_table = Table(event_rows, colWidths=[1.1*inch, 1.0*inch, 1.2*inch, 0.7*inch, 1.2*inch, 0.9*inch, 1.1*inch])
        evt_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#e2e8f0")),
            ('BOX', (0,0), (-1,-1), 1, c_border),
            ('INNERGRID', (0,0), (-1,-1), 0.5, c_border),
            ('VALIGN', (0,0), (-1,-1), 'TOP'),
            ('TOPPADDING', (0,0), (-1,-1), 4),
            ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ]))
        story.append(evt_table)
        story.append(Spacer(1, 12))

        # --- CHAIN OF CUSTODY SUMMARY ---
        story.append(Paragraph("3. CHAIN OF CUSTODY AUDIT TRAIL", h2_style))
        custody_rows = [
            [Paragraph("<b>Record ID</b>", body_style),
             Paragraph("<b>Timestamp (UTC)</b>", body_style),
             Paragraph("<b>Action Type</b>", body_style),
             Paragraph("<b>Actor</b>", body_style),
             Paragraph("<b>Description / Integrity Scope</b>", body_style)]
        ]

        if not custody_records:
            custody_rows.append([Paragraph("No chain-of-custody actions recorded.", body_style)] + [Paragraph("", body_style)]*4)
        else:
            for c in custody_records[:15]:  # show up to 15 entries
                t_str = c.timestamp.strftime("%Y-%m-%d %H:%M:%S")
                custody_rows.append([
                    Paragraph(c.id, mono_style),
                    Paragraph(t_str, mono_style),
                    Paragraph(c.action_type, body_style),
                    Paragraph(c.actor, body_style),
                    Paragraph(c.description, body_style)
                ])

        custody_table = Table(custody_rows, colWidths=[1.2*inch, 1.2*inch, 1.4*inch, 1.0*inch, 2.4*inch])
        custody_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#e2e8f0")),
            ('BOX', (0,0), (-1,-1), 1, c_border),
            ('INNERGRID', (0,0), (-1,-1), 0.5, c_border),
            ('VALIGN', (0,0), (-1,-1), 'TOP'),
            ('TOPPADDING', (0,0), (-1,-1), 3),
            ('BOTTOMPADDING', (0,0), (-1,-1), 3),
        ]))
        story.append(custody_table)
        story.append(Spacer(1, 14))

        # --- FORENSIC CONCLUSION & LEGAL DISCLAIMER ---
        story.append(Paragraph("4. INVESTIGATIVE CONCLUSION & LIMITATIONS", h2_style))
        conclusion_text = summary_notes or (
            case.notes or "Evidence processing and candidate correlation conducted in accordance with "
            "TRACE X digital evidence guidelines. All automated detections require judicial verification."
        )
        story.append(Paragraph(f"<b>Analyst Summary:</b> {conclusion_text}", body_style))
        story.append(Spacer(1, 8))
        
        disclaimer_box = [
            [Paragraph(
                "<b>MANDATORY FORENSIC DISCLAIMER:</b> TRACE X automated computer vision detections, optical motion "
                "sentinel triggers, and candidate event intervals are AI decision-support outputs. A matching SHA-256 "
                "hash establishes bitwise verification against original ingested storage bytes, but does not independently "
                "prove camera sensor authenticity prior to ingestion. All candidate findings require corroboration by "
                "authorized human forensic investigators.",
                disclaimer_style
            )]
        ]
        disc_table = Table(disclaimer_box, colWidths=[7.2*inch])
        disc_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#f1f5f9")),
            ('BOX', (0,0), (-1,-1), 1, colors.HexColor("#94a3b8")),
            ('TOPPADDING', (0,0), (-1,-1), 6),
            ('BOTTOMPADDING', (0,0), (-1,-1), 6),
            ('LEFTPADDING', (0,0), (-1,-1), 8),
            ('RIGHTPADDING', (0,0), (-1,-1), 8),
        ]))
        story.append(disc_table)

        # Build PDF
        doc.build(story)

        file_size = os.path.getsize(pdf_path) if pdf_path.exists() else 0

        # Save record in database
        report_record = GeneratedReport(
            id=report_id,
            case_id=case_id,
            report_title=actual_title,
            report_type="FORENSIC_SUMMARY",
            generated_by=generated_by,
            file_path=str(pdf_path),
            file_size=file_size,
            status="COMPLETED",
            summary_notes=summary_notes,
            created_at=datetime.now(timezone.utc)
        )
        db.add(report_record)
        db.commit()
        db.refresh(report_record)

        return report_record

report_service = ReportService()
