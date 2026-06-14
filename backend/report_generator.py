import io
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
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


def _section_title(text: str) -> list:
    return [
        Paragraph(text, _style(13, bold=True, color=colors.HexColor("#1E3A5F"))),
        Spacer(1, 0.3 * cm),
    ]


def _kv_table(rows: list[tuple], col_widths=(4 * cm, 13 * cm)) -> Table:
    """키-값 2열 테이블 생성"""
    data = [[Paragraph(str(k), _style(10)), Paragraph(str(v), _style(10))] for k, v in rows]
    table = Table(data, colWidths=list(col_widths))
    table.setStyle(TableStyle([
        ("FONTNAME", (0, 0), (-1, -1), FONT),
        ("FONTSIZE", (0, 0), (-1, -1), 10),
        ("BACKGROUND", (0, 0), (0, -1), colors.HexColor("#F1F5F9")),
        ("TEXTCOLOR", (0, 0), (0, -1), colors.HexColor("#1E3A5F")),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#E2E8F0")),
        ("PADDING", (0, 0), (-1, -1), 6),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
    ]))
    return table


def _render_review_items(items: list[dict], report_type: str) -> list:
    """준법 심의 문구별 결과 렌더링"""
    elements = []

    filtered = items if report_type == "full" else [i for i in items if i.get("grade") == "🔴 위반"]
    if not filtered:
        elements.append(Paragraph("해당 항목 없음", _style(10, color=colors.gray)))
        return elements

    for item in filtered:
        grade = item.get("grade", "")
        grade_label = GRADE_LABEL.get(grade, grade)
        grade_color = GRADE_COLOR.get(grade, colors.gray)

        # 문구 번호 + 제목
        elements.append(Paragraph(
            f"[{item.get('index', '-')}] {item.get('title', '')}",
            _style(10, bold=True),
        ))
        elements.append(Spacer(1, 0.15 * cm))

        rows = [
            ("판정 등급", f'<font color="#{grade_color.hexval()[2:]}">{grade_label}</font>'),
            ("위반 조항", item.get("violation_article") or "-"),
            ("문제 표현", item.get("problem_expression") or "-"),
            ("판정 근거", item.get("reason") or "-"),
            ("수정 제안", item.get("suggestion") or "-"),
        ]
        elements.append(_kv_table(rows))
        elements.append(Spacer(1, 0.5 * cm))

    return elements


def _render_compare_items(items: list[dict], report_type: str) -> list:
    """뉘앙스 비교 문구별 결과 렌더링"""
    elements = []

    filtered = items if report_type == "full" else [i for i in items if i.get("grade") == "🔴 위반"]
    if not filtered:
        elements.append(Paragraph("해당 항목 없음", _style(10, color=colors.gray)))
        return elements

    for item in filtered:
        grade = item.get("grade", "")
        grade_label = GRADE_LABEL.get(grade, grade)
        grade_color = GRADE_COLOR.get(grade, colors.gray)
        has_nuance = item.get("has_nuance_change", False)

        elements.append(Paragraph(
            f"[{item.get('index', '-')}] {item.get('title', '')}",
            _style(10, bold=True),
        ))
        elements.append(Spacer(1, 0.15 * cm))

        rows = [
            ("뉘앙스 변형", "있음" if has_nuance else "없음"),
            ("판정 등급", f'<font color="#{grade_color.hexval()[2:]}">{grade_label}</font>'),
            ("위반 조항", item.get("violation_article") or "-"),
            ("원문 표현", item.get("original_expression") or "-"),
            ("번역 표현", item.get("translated_expression") or "-"),
            ("판정 근거", item.get("reason") or "-"),
            ("수정 제안", item.get("suggestion") or "-"),
        ]
        elements.append(_kv_table(rows))
        elements.append(Spacer(1, 0.5 * cm))

    return elements


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

    overall_grade = review.get("overall_grade", "")
    grade_label = GRADE_LABEL.get(overall_grade, overall_grade)
    grade_color = GRADE_COLOR.get(overall_grade, colors.gray)

    elements = []

    # --- 헤더 ---
    elements.append(Paragraph("금융 준법 심의 리포트", _style(18, bold=True)))
    elements.append(Spacer(1, 0.3 * cm))
    elements.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#1E3A5F")))
    elements.append(Spacer(1, 0.5 * cm))

    # --- 심의 개요 ---
    elements += _section_title("심의 개요")
    overview_rows = [
        ("상품명", record.get("content_name", "-")),
        ("언어", record.get("language", "-")),
        ("상품 유형", record.get("input", {}).get("product_type", "-")),
        ("심의일", record.get("created_at", "")[:10]),
        ("최종 등급", f'<font color="#{grade_color.hexval()[2:]}">{grade_label}</font>'),
        ("전체 문구 수", str(review.get("total_count", "-"))),
        ("위반", str(review.get("violation_count", 0))),
        ("주의", str(review.get("warning_count", 0))),
        ("통과", str(review.get("compliant_count", 0))),
    ]
    elements.append(_kv_table(overview_rows))
    elements.append(Spacer(1, 0.7 * cm))

    # --- 준법 심의 결과 ---
    elements += _section_title(
        "준법 심의 결과" if report_type == "full" else "준법 심의 결과 (위반 항목)"
    )
    elements += _render_review_items(review.get("items", []), report_type)
    elements.append(Spacer(1, 0.3 * cm))

    # --- 뉘앙스 비교 결과 ---
    elements += _section_title(
        "뉘앙스 비교 결과" if report_type == "full" else "뉘앙스 비교 결과 (위반 항목)"
    )
    elements += _render_compare_items(compare.get("items", []), report_type)

    # 전체 요약 (summary 있을 때)
    summary = compare.get("summary")
    if summary:
        elements.append(Spacer(1, 0.3 * cm))
        elements += _section_title("종합 의견")
        summary_rows = [
            ("전체 판정 근거", summary.get("overall_reason") or "-"),
            ("주요 리스크", summary.get("risk_summary") or "-"),
            ("권장 조치", summary.get("recommended_action") or "-"),
            ("담당자 메모", summary.get("manager_note") or "-"),
        ]
        elements.append(_kv_table(summary_rows))

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
