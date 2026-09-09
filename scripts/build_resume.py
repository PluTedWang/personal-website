"""Generate resume.pdf for Ted Wang from the same content the site uses.
Run: python3 scripts/build_resume.py
"""
import json
import os

from reportlab.lib.pagesizes import letter
from reportlab.lib.units import inch
from reportlab.lib import colors
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.enums import TA_LEFT
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    HRFlowable,
)

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

INK = colors.HexColor("#111318")
MUTED = colors.HexColor("#5a5e66")
ACCENT = colors.HexColor("#3a5fe0")
LINE = colors.HexColor("#d8d8d4")

styles = {
    "name": ParagraphStyle("name", fontName="Helvetica-Bold", fontSize=25, leading=28, textColor=INK, spaceAfter=2),
    "title": ParagraphStyle("title", fontName="Helvetica", fontSize=12.5, leading=16, textColor=ACCENT, spaceAfter=6),
    "contact": ParagraphStyle("contact", fontName="Helvetica", fontSize=9.3, leading=13, textColor=MUTED),
    "section": ParagraphStyle("section", fontName="Helvetica-Bold", fontSize=10.5, leading=13, textColor=INK, spaceBefore=9, spaceAfter=5, tracking=1),
    "role_org": ParagraphStyle("role_org", fontName="Helvetica-Bold", fontSize=10.5, leading=12.5, textColor=INK),
    "role_meta": ParagraphStyle("role_meta", fontName="Helvetica-Oblique", fontSize=9, leading=11.5, textColor=MUTED),
    "bullet": ParagraphStyle("bullet", fontName="Helvetica", fontSize=9, leading=12.2, textColor=INK, leftIndent=12, bulletIndent=0, spaceAfter=2),
    "edu_school": ParagraphStyle("edu_school", fontName="Helvetica-Bold", fontSize=10.3, leading=13, textColor=INK),
    "edu_meta": ParagraphStyle("edu_meta", fontName="Helvetica", fontSize=9.3, leading=12.5, textColor=MUTED),
    "skill_cat": ParagraphStyle("skill_cat", fontName="Helvetica-Bold", fontSize=9.3, leading=13, textColor=INK),
    "skill_list": ParagraphStyle("skill_list", fontName="Helvetica", fontSize=9.3, leading=13.5, textColor=MUTED),
}


def section_header(text):
    return [
        Paragraph(text.upper(), styles["section"]),
        HRFlowable(width="100%", thickness=0.8, color=LINE, spaceAfter=6),
    ]


def role_block(org, title, meta, bullets):
    flow = []
    header_table = Table(
        [[Paragraph(org, styles["role_org"]), Paragraph(meta, styles["role_meta"])]],
        colWidths=[4.1 * inch, 2.6 * inch],
    )
    header_table.setStyle(
        TableStyle(
            [
                ("VALIGN", (0, 0), (-1, -1), "BOTTOM"),
                ("ALIGN", (1, 0), (1, 0), "RIGHT"),
                ("LEFTPADDING", (0, 0), (-1, -1), 0),
                ("RIGHTPADDING", (0, 0), (-1, -1), 0),
                ("TOPPADDING", (0, 0), (-1, -1), 0),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
            ]
        )
    )
    flow.append(header_table)
    flow.append(Paragraph(title, ParagraphStyle("role_title", fontName="Helvetica", fontSize=9.2, leading=11.5, textColor=ACCENT, spaceAfter=3)))
    for b in bullets:
        flow.append(Paragraph(f"&bull;&nbsp;&nbsp;{b}", styles["bullet"]))
    flow.append(Spacer(1, 5))
    return flow


def build():
    doc = SimpleDocTemplate(
        os.path.join(ROOT, "resume.pdf"),
        pagesize=letter,
        leftMargin=0.75 * inch,
        rightMargin=0.75 * inch,
        topMargin=0.4 * inch,
        bottomMargin=0.4 * inch,
        title="Ted Wang — Resume",
        author="Zhuoran Ted Wang",
    )

    story = []

    story.append(Paragraph("Zhuoran &ldquo;Ted&rdquo; Wang", styles["name"]))
    story.append(Paragraph("Product Manager &middot; AI &times; Systems &times; Engineering", styles["title"]))
    story.append(
        Paragraph(
            "wangzhuoran.ted@gmail.com &nbsp;&middot;&nbsp; New York, NY &nbsp;&middot;&nbsp; "
            "linkedin.com/in/zhuoranwang &nbsp;&middot;&nbsp; Cornell University",
            styles["contact"],
        )
    )
    story.append(Spacer(1, 2))

    story += section_header("Experience")

    story += role_block(
        "Dreame Technology &mdash; AI NAS Business Unit (Nexus Gen)",
        "Product Manager Intern",
        "Suzhou, China &nbsp;|&nbsp; Apr 2026 &ndash; Jul 2026",
        [
            "Joined 0&rarr;1 development of a privacy-first, AI-powered personal storage platform; product won the CES Asia Best Innovation Award and helped the business unit secure a $2M seed round.",
            "Diagnosed agent timeouts and excessive token use to exhaustive API enumeration; drove adoption of an MCP-based tool registry, cutting tool-selection tokens 80% and eliminating timeouts.",
            "Owned model selection via a 6-dimension evaluation framework, A/B testing 7 LLMs across 1,000+ prompts; selected Qwen + Hermes (4.5/5) and surfaced 40+ release-critical defects.",
            "Validated Home Theater (AI media discovery) with 100+ user interviews and an 80-user beta across 3 iterations, reaching 81% DAU penetration and 60% 2-week retention; won approval for full-scale build.",
            "Defined the dual-volume privacy architecture (isolated offline volume vs. connected service volume) that contributed to the CES Asia award; designed Auto Scan ingestion-time indexing, cutting retrieval time 90%.",
        ],
    )

    story += role_block(
        "Spectrum",
        "Field Operation Designer III &nbsp;(Product Owner, internal GIS/CAD network design tool)",
        "New York, NY &nbsp;|&nbsp; Apr 2023 &ndash; Mar 2026",
        [
            "Owned the product roadmap for an internal GIS/CAD tool supporting 200+ engineers; translated feedback from 30+ users into prioritized improvements, cutting design turnaround time 40%.",
            "Identified manual downstream signal recalculation as a key bottleneck and defined a 3-click Python automation for tracing/recalculation/verification, cutting recalculation time significantly and manual errors 25%, adopted by 3+ regional teams.",
            "Owned the prioritization model for a 30-person cross-functional unit, reducing high-priority delays 40%.",
            "Delivered 150+ FTTH and 620+ enterprise fiber solutions across Manhattan; led a 20-person audit of 1,000+ optical nodes for DOCSIS 4.0 readiness, improving network-data accuracy 28%.",
            "Shipped Auto BOM, an automatic equipment-change recorder used company-wide, cutting report generation time 50%.",
        ],
    )

    story += role_block(
        "Decom Electrical Co., Ltd.",
        "R&amp;D / Project Engineer",
        "Yangzhou, China &nbsp;|&nbsp; May 2022 &ndash; Mar 2023",
        [
            "Co-engineered a 600mm-wide SF6 gas-insulated switchgear (C-GIS) system &mdash; 3D models and assembly drawings in SOLIDWORKS and AutoCAD from concept through prototype.",
            "Applied DFM/DFA and tolerance review to refine component interfaces and installation sequence, reducing assembly errors 15%.",
        ],
    )

    story += role_block(
        "NYU Tandon, Plasma Physics Laboratory",
        "Research Assistant",
        "Brooklyn, NY &nbsp;|&nbsp; Jan 2021 &ndash; Dec 2022",
        [
            "Designed Paschen Curve experiments isolating the effect of magnetic-field orientation on gas-discharge breakdown voltage; built MATLAB models for data processing and curve fitting.",
            "Built a plasma physics lab from an empty facility to operational readiness, including vacuum-system setup and safety integration.",
        ],
    )

    story += role_block(
        "A.T. Kearney",
        "Consulting Intern",
        "Shanghai, China &nbsp;|&nbsp; May 2019 &ndash; Nov 2019",
        [
            "Analyzed customer and store-performance data for Nike Factory Stores China; findings presented to Nike China executives contributed to a 15% sales increase.",
        ],
    )

    story += section_header("Education")
    story.append(Paragraph("Cornell University &mdash; Duffield School of Engineering", styles["edu_school"]))
    story.append(Paragraph("M.Eng, Systems Engineering &nbsp;&middot;&nbsp; Expected Dec 2027 &nbsp;&middot;&nbsp; Research focus: AI and open source bug reports", styles["edu_meta"]))
    story.append(Spacer(1, 3))
    story.append(Paragraph("New York University, Tandon School of Engineering", styles["edu_school"]))
    story.append(Paragraph("B.S., Applied Physics &nbsp;&middot;&nbsp; Sept 2018 &ndash; Dec 2022", styles["edu_meta"]))
    story.append(Spacer(1, 4))

    story += section_header("Skills")
    skill_rows = [
        ("Product", "Product Strategy, Roadmaps, PRDs, User Research, Prioritization, Experimentation, Metrics, Cross-functional Leadership"),
        ("AI", "LLMs, AI Agents, MCP, Tool Calling, Model Evaluation, Prompt Engineering, Local AI"),
        ("Technical", "Python (pandas), SQL, R, MATLAB, APIs, Automation, Networking, Data Analysis, Systems Engineering"),
        ("Tools", "Figma, Canva, JIRA, Git, SolidWorks, AutoCAD"),
    ]
    table_data = [
        [Paragraph(cat, styles["skill_cat"]), Paragraph(items, styles["skill_list"])]
        for cat, items in skill_rows
    ]
    skills_table = Table(table_data, colWidths=[0.95 * inch, 5.75 * inch])
    skills_table.setStyle(
        TableStyle(
            [
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 0),
                ("RIGHTPADDING", (0, 0), (-1, -1), 0),
                ("TOPPADDING", (0, 0), (-1, -1), 3),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
            ]
        )
    )
    story.append(skills_table)

    doc.build(story)
    print("wrote resume.pdf")


if __name__ == "__main__":
    build()
