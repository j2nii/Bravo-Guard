import json
import os
import re
import uuid
from datetime import datetime

from fastapi import APIRouter, File, Form, UploadFile

from approve import save_record
from llm import call_llm
from pdf_parser import extract_text
from prompts import COMPARE_SUMMARY_SYSTEM_PROMPT, COMPARE_SYSTEM_PROMPT, REVIEW_SYSTEM_PROMPT
from schemas import ReviewRecord

PDF_DIR = os.path.join(os.path.dirname(__file__), "data", "pdfs")

router = APIRouter()


# --- LLM 응답 JSON 파싱 (마크다운 코드블록 제거 + 빈 응답 방어) ---

def _parse_llm_json(raw: str) -> dict:
    if not raw or not raw.strip():
        raise ValueError("LLM이 빈 응답을 반환했습니다.")
    # ```json ... ``` 또는 ``` ... ``` 형태 제거
    cleaned = re.sub(r"^```(?:json)?\s*", "", raw.strip())
    cleaned = re.sub(r"\s*```$", "", cleaned)
    cleaned = cleaned.strip()

    # 1차 시도: 그대로 파싱
    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        pass

    # 2차 시도: 중괄호 기준으로 JSON 블록만 추출
    match = re.search(r"\{[\s\S]*\}", cleaned)
    if match:
        try:
            return json.loads(match.group())
        except json.JSONDecodeError:
            pass

    raise ValueError(f"LLM 응답을 JSON으로 파싱할 수 없습니다: {cleaned[:200]}")


# --- 문구 분리 ---

def split_clauses(text: str) -> list[str]:
    """PDF 텍스트를 문구 단위(줄)로 분리. 빈 줄은 제거."""
    lines = [line.strip() for line in text.splitlines()]
    return [line for line in lines if line]


# --- LLM 메시지 빌더 ---

def _build_review_message(clause: str, index: int, clauses: list[str], language: str, product_type: str) -> str:
    prev = clauses[index - 1] if index > 0 else "없음"
    nxt = clauses[index + 1] if index < len(clauses) - 1 else "없음"
    return (
        f"[언어: {language}]\n"
        f"[상품유형: {product_type}]\n"
        f"[문구번호: {index + 1}]\n\n"
        f"[이전 문맥]\n{prev}\n\n"
        f"[심의 대상]\n외국어 문구: {clause}\n\n"
        f"[다음 문맥]\n{nxt}"
    )


def _build_compare_message(
    ko_clause: str, tr_clause: str, index: int,
    ko_clauses: list[str], tr_clauses: list[str],
    language: str, product_type: str,
) -> str:
    prev_ko = ko_clauses[index - 1] if index > 0 else "없음"
    prev_tr = tr_clauses[index - 1] if index > 0 else "없음"
    next_ko = ko_clauses[index + 1] if index < len(ko_clauses) - 1 else "없음"
    next_tr = tr_clauses[index + 1] if index < len(tr_clauses) - 1 else "없음"
    return (
        f"[언어: {language}]\n"
        f"[상품유형: {product_type}]\n"
        f"[문구번호: {index + 1}]\n\n"
        f"[이전 문맥]\n한국어: {prev_ko}\n번역문: {prev_tr}\n\n"
        f"[비교 대상]\n한국어 원문: {ko_clause}\n번역문: {tr_clause}\n\n"
        f"[다음 문맥]\n한국어: {next_ko}\n번역문: {next_tr}"
    )


# --- 등급 우선순위 (위반 > 주의 > 통과) ---

def _grade_order(grade: str) -> int:
    return {"🔴 위반": 0, "🟡 주의": 1, "🟢 통과": 2}.get(grade, 2)


SEVERITY_MAP = {"🔴 위반": "violation", "🟡 주의": "warning", "🟢 통과": "compliant"}


# --- 준법 심의: 문구별 반복 호출 ---

def _run_review(clauses: list[str], language: str, product_type: str) -> dict:
    items = []
    for i, clause in enumerate(clauses):
        msg = _build_review_message(clause, i, clauses, language, product_type)
        try:
            raw = call_llm(REVIEW_SYSTEM_PROMPT, msg)
            items.append(_parse_llm_json(raw))
        except Exception as e:
            # 파싱 실패 시 주의 등급으로 대체
            items.append({
                "index": i + 1,
                "title": "분석 오류",
                "grade": "🟡 주의",
                "severity": "warning",
                "violation_article": None,
                "problem_expression": None,
                "reason": f"LLM 응답 파싱 실패: {str(e)[:100]}",
                "suggestion": None,
            })

    grades = [item["grade"] for item in items]
    overall_grade = min(grades, key=_grade_order) if grades else "🟢 통과"

    return {
        "overall_grade": overall_grade,
        "overall_severity": SEVERITY_MAP.get(overall_grade, "compliant"),
        "total_count": len(items),
        "violation_count": sum(1 for item in items if item["grade"] == "🔴 위반"),
        "warning_count": sum(1 for item in items if item["grade"] == "🟡 주의"),
        "compliant_count": sum(1 for item in items if item["grade"] == "🟢 통과"),
        "items": items,
    }


# --- 뉘앙스 비교: 문구 쌍별 반복 호출 + 전체 요약 ---

def _run_compare(ko_clauses: list[str], tr_clauses: list[str], language: str, product_type: str) -> dict:
    count = min(len(ko_clauses), len(tr_clauses))
    items = []
    for i in range(count):
        msg = _build_compare_message(ko_clauses[i], tr_clauses[i], i, ko_clauses, tr_clauses, language, product_type)
        try:
            raw = call_llm(COMPARE_SYSTEM_PROMPT, msg)
            items.append(_parse_llm_json(raw))
        except Exception as e:
            items.append({
                "index": i + 1,
                "title": "분석 오류",
                "has_nuance_change": False,
                "grade": "🟡 주의",
                "severity": "warning",
                "violation_article": None,
                "original": ko_clauses[i],
                "translated": tr_clauses[i],
                "original_expression": None,
                "translated_expression": None,
                "reason": f"LLM 응답 파싱 실패: {str(e)[:100]}",
                "suggestion": None,
            })

    grades = [item["grade"] for item in items]
    overall_grade = min(grades, key=_grade_order) if grades else "🟢 통과"
    overall_severity = SEVERITY_MAP.get(overall_grade, "compliant")

    violation_count = sum(1 for item in items if item["grade"] == "🔴 위반")
    warning_count = sum(1 for item in items if item["grade"] == "🟡 주의")
    compliant_count = sum(1 for item in items if item["grade"] == "🟢 통과")

    # 전체 요약 생성
    summary_input = json.dumps({
        "overall_grade": overall_grade,
        "overall_severity": overall_severity,
        "total_count": len(items),
        "violation_count": violation_count,
        "warning_count": warning_count,
        "compliant_count": compliant_count,
        "items": items,
    }, ensure_ascii=False)
    summary_raw = call_llm(COMPARE_SUMMARY_SYSTEM_PROMPT, summary_input)
    summary = _parse_llm_json(summary_raw)

    return {
        "overall_grade": overall_grade,
        "overall_severity": overall_severity,
        "total_count": len(items),
        "violation_count": violation_count,
        "warning_count": warning_count,
        "compliant_count": compliant_count,
        "items": items,
        "summary": summary,
    }


@router.post(
    "/api/analyze",
    summary="PDF 준법 심의 + 뉘앙스 비교 통합 분석",
    description="""
한국어 원문 PDF와 외국어 번역본 PDF를 업로드하면 두 가지 분석을 한 번에 수행합니다.

1. **준법 심의** — 외국어 번역본의 금소법 위반 여부 문구별 판정
2. **뉘앙스 비교** — 원문 대비 번역본의 의미 변형 문구별 탐지

**지원 언어**: 베트남어, 중국어, 우즈베크어, 캄보디아어, 영어 등
    """,
)
async def analyze(
    content_name: str = Form(..., description="금융 상품명 / 광고 제목"),
    language: str = Form(..., description="외국어 종류 (예: 베트남어)"),
    product_type: str = Form(..., description="금융 상품 유형 (예: 대출, 적금, 카드)"),
    original_pdf: UploadFile = File(..., description="한국어 원문 PDF"),
    translated_pdf: UploadFile = File(..., description="외국어 번역본 PDF"),
):
    original_bytes = await original_pdf.read()
    translated_bytes = await translated_pdf.read()

    original_text = extract_text(original_bytes)
    translated_text = extract_text(translated_bytes)

    ko_clauses = split_clauses(original_text)
    tr_clauses = split_clauses(translated_text)

    review_result = _run_review(tr_clauses, language, product_type)
    compare_result = _run_compare(ko_clauses, tr_clauses, language, product_type)

    record = ReviewRecord(
        id=str(uuid.uuid4()),
        type="compare",
        content_name=content_name,
        language=language,
        input={
            "product_type": product_type,
            "original_text": original_text,
            "translated_text": translated_text,
        },
        result={
            "review": review_result,
            "compare": compare_result,
        },
        created_at=datetime.now().isoformat(),
    )
    # 원문 PDF 저장 (다운로드 옵션용)
    pdf_path = os.path.join(PDF_DIR, f"{record.id}_original.pdf")
    with open(pdf_path, "wb") as f:
        f.write(original_bytes)

    save_record(record.model_dump())
    return record
