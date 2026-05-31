import json
import uuid
from datetime import datetime

from fastapi import APIRouter, File, Form, UploadFile

from approve import save_record
from pdf_parser import extract_text
from schemas import ReviewRecord

# A 파트 완성 후 아래 주석 해제
# from llm import call_llm
# from prompts import REVIEW_SYSTEM_PROMPT, COMPARE_SYSTEM_PROMPT

router = APIRouter()


def _run_review(text: str, language: str, product_type: str) -> dict:
    # TODO: A의 llm.py 완성 후 아래로 교체
    # raw = call_llm(REVIEW_SYSTEM_PROMPT, f"[언어: {language}][상품유형: {product_type}]\n\n{text}")
    # return json.loads(raw)
    return {
        "grade": "🟡 주의",
        "violation_article": None,
        "problem_expression": None,
        "reason": "LLM 연동 전 stub 응답입니다.",
        "suggestion": None,
    }


def _run_compare(original_ko: str, translated: str, language: str, product_type: str) -> dict:
    # TODO: A의 llm.py 완성 후 아래로 교체
    # raw = call_llm(COMPARE_SYSTEM_PROMPT, f"[언어: {language}][상품유형: {product_type}]\n원문:\n{original_ko}\n번역:\n{translated}")
    # return json.loads(raw)
    return {
        "has_nuance_change": False,
        "grade": "🟡 주의",
        "violation_article": None,
        "original_expression": None,
        "translated_expression": None,
        "reason": "LLM 연동 전 stub 응답입니다.",
        "suggestion": None,
    }


@router.post(
    "/api/analyze",
    summary="PDF 준법 심의 + 뉘앙스 비교 통합 분석",
    description="""
한국어 원문 PDF와 외국어 번역본 PDF를 업로드하면 두 가지 분석을 한 번에 수행합니다.

1. **준법 심의** — 외국어 번역본의 금소법 위반 여부 판정
2. **뉘앙스 비교** — 원문 대비 번역본의 의미 변형 탐지

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
    original_text = extract_text(await original_pdf.read())
    translated_text = extract_text(await translated_pdf.read())

    review_result = _run_review(translated_text, language, product_type)
    compare_result = _run_compare(original_text, translated_text, language, product_type)

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
    save_record(record.model_dump())
    return record
