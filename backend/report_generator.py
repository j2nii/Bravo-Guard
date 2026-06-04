import io
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.cidfonts import UnicodeCIDFont

# 한국어 폰트 등록
pdfmetrics.registerFont(UnicodeCIDFont("HYGothic-Medium"))

FONT = "HYGothic-Medium"

GRADE_COLOR = {
    "🔴 위반": colors.HexColor("#EF4444"),
    "🟡 주의": colors.HexColor("#F97316"),
    "🟢 통과": colors.HexColor("#22C55E"),
}

GRADE_LABEL = {
    "🔴 위반": "위반",
    "🟡 주의": "주의",
    "🟢 통과": "통과",
}


def _style(size=10, bold=False, color=colors.black):
    return ParagraphStyle(
        name="custom",
        fontName=FONT,
        fontSize=size,
        textColor=color,
        leading=size * 1.5,
        wordWrap="CJK",
    )


def generate_report_pdf(record: dict, report_type: str = "full") -> bytes:
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        leftMargin=2 * cm,
        rightMargin=2 * cm,
        topMargin=2 * cm,
        bottomMargin=2 * cm,
    )

    result = record.get("result", {})
    review = result.get("review", {})
    compare = result.get("compare", {})
    grade = review.get("grade", "")
    grade_color = GRADE_COLOR.get(grade, colors.gray)
    grade_label = GRADE_LABEL.get(grade, grade)

    elements = []

    # --- 헤더 ---
    elements.append(Paragraph("금융 준법 심의 리포트", _style(18, bold=True)))
    elements.append(Spacer(1, 0.3 * cm))
    elements.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#1E3A5F")))
    elements.append(Spacer(1, 0.5 * cm))

    # --- 심의 개요 ---
    elements.append(Paragraph("심의 개요", _style(13, bold=True, color=colors.HexColor("#1E3A5F"))))
    elements.append(Spacer(1, 0.3 * cm))

    overview_data = [
        ["상품명", record.get("content_name", "-")],
        ["언어", record.get("language", "-")],
        ["상품 유형", record.get("input", {}).get("product_type", "-")],
        ["심의일", record.get("created_at", "")[:10]],
        ["최종 등급", grade_label],
    ]
    overview_table = Table(overview_data, colWidths=[4 * cm, 13 * cm])
    overview_table.setStyle(TableStyle([
        ("FONTNAME", (0, 0), (-1, -1), FONT),
        ("FONTSIZE", (0, 0), (-1, -1), 10),
        ("BACKGROUND", (0, 0), (0, -1), colors.HexColor("#F1F5F9")),
        ("TEXTCOLOR", (0, 0), (0, -1), colors.HexColor("#1E3A5F")),
        ("TEXTCOLOR", (1, 4), (1, 4), grade_color),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#E2E8F0")),
        ("PADDING", (0, 0), (-1, -1), 6),
    ]))
    elements.append(overview_table)
    elements.append(Spacer(1, 0.7 * cm))

    # --- 준법 심의 결과 ---
    if report_type == "full" or grade == "🔴 위반":
        elements.append(Paragraph("준법 심의 결과", _style(13, bold=True, color=colors.HexColor("#1E3A5F"))))
        elements.append(Spacer(1, 0.3 * cm))

        review_data = [
            ["판정 등급", grade_label],
            ["위반 조항", review.get("violation_article") or "-"],
            ["문제 표현", review.get("problem_expression") or "-"],
            ["판정 근거", review.get("reason") or "-"],
            ["수정 제안", review.get("suggestion") or "-"],
        ]
        review_table = Table(review_data, colWidths=[4 * cm, 13 * cm])
        review_table.setStyle(TableStyle([
            ("FONTNAME", (0, 0), (-1, -1), FONT),
            ("FONTSIZE", (0, 0), (-1, -1), 10),
            ("BACKGROUND", (0, 0), (0, -1), colors.HexColor("#F1F5F9")),
            ("TEXTCOLOR", (0, 0), (0, -1), colors.HexColor("#1E3A5F")),
            ("TEXTCOLOR", (1, 0), (1, 0), grade_color),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#E2E8F0")),
            ("PADDING", (0, 0), (-1, -1), 6),
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ]))
        elements.append(review_table)
        elements.append(Spacer(1, 0.7 * cm))

    # --- 뉘앙스 비교 결과 ---
    has_nuance = compare.get("has_nuance_change", False)
    if report_type == "full" or has_nuance:
        elements.append(Paragraph("뉘앙스 비교 결과", _style(13, bold=True, color=colors.HexColor("#1E3A5F"))))
        elements.append(Spacer(1, 0.3 * cm))

        compare_grade = compare.get("grade", "")
        compare_label = GRADE_LABEL.get(compare_grade, compare_grade)
        compare_color = GRADE_COLOR.get(compare_grade, colors.gray)

        compare_data = [
            ["뉘앙스 변형", "있음" if has_nuance else "없음"],
            ["판정 등급", compare_label],
            ["위반 조항", compare.get("violation_article") or "-"],
            ["원문 표현", compare.get("original_expression") or "-"],
            ["번역 표현", compare.get("translated_expression") or "-"],
            ["판정 근거", compare.get("reason") or "-"],
            ["수정 제안", compare.get("suggestion") or "-"],
        ]
        compare_table = Table(compare_data, colWidths=[4 * cm, 13 * cm])
        compare_table.setStyle(TableStyle([
            ("FONTNAME", (0, 0), (-1, -1), FONT),
            ("FONTSIZE", (0, 0), (-1, -1), 10),
            ("BACKGROUND", (0, 0), (0, -1), colors.HexColor("#F1F5F9")),
            ("TEXTCOLOR", (0, 0), (0, -1), colors.HexColor("#1E3A5F")),
            ("TEXTCOLOR", (1, 1), (1, 1), compare_color),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#E2E8F0")),
            ("PADDING", (0, 0), (-1, -1), 6),
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ]))
        elements.append(compare_table)
        elements.append(Spacer(1, 0.7 * cm))

    # --- 준법 자문가 서명란 ---
    elements.append(Spacer(1, 1 * cm))
    elements.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor("#CBD5E1")))
    elements.append(Spacer(1, 0.3 * cm))
    elements.append(Paragraph("준법 자문가 서명", _style(11, bold=True)))
    elements.append(Spacer(1, 1.5 * cm))
    sign_data = [["성명:", ""], ["서명:", ""], ["날짜:", ""]]
    sign_table = Table(sign_data, colWidths=[3 * cm, 10 * cm])
    sign_table.setStyle(TableStyle([
        ("FONTNAME", (0, 0), (-1, -1), FONT),
        ("FONTSIZE", (0, 0), (-1, -1), 10),
        ("LINEBELOW", (1, 0), (1, -1), 0.5, colors.black),
        ("PADDING", (0, 0), (-1, -1), 6),
    ]))
    elements.append(sign_table)

    doc.build(elements)
    return buffer.getvalue()
