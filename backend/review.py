import uuid
from datetime import datetime

from fastapi import APIRouter
from schemas import ReviewRequest, ReviewResponse, ReviewRecord
from approve import save_record

# A가 완성하면 아래 주석 해제
# from llm import call_llm
# from prompts import REVIEW_SYSTEM_PROMPT

router = APIRouter()


def _run_review(text: str, language: str) -> dict:
    # TODO: A의 llm.py 완성 후 아래로 교체
    # import json
    # raw = call_llm(REVIEW_SYSTEM_PROMPT, f"[언어: {language}]\n\n{text}")
    # return json.loads(raw)
    return {
        "grade": "🟡 주의",
        "violation_article": None,
        "problem_expression": None,
        "reason": "LLM 연동 전 stub 응답입니다.",
        "suggestion": None,
    }


@router.post(
    "/api/review",
    response_model=ReviewResponse,
    summary="외국어 텍스트 준법 심의",
    description="""
외국어로 작성된 금융 마케팅 텍스트를 입력하면 금소법 위반 여부를 판정합니다.

**판정 등급**
- 🔴 위반: 금소법 제19조(설명의무) 또는 제22조(부당권유 금지) 위반
- 🟡 주의: 경계 표현, 준법 관리자 검토 필요
- 🟢 통과: 문제 없음

**지원 언어**: 베트남어, 중국어, 우즈베크어, 캄보디아어, 영어 등
    """,
)
def review(req: ReviewRequest):
    result = _run_review(req.text, req.language)
    record = ReviewRecord(
        id=str(uuid.uuid4()),
        type="review",
        content_name=req.content_name,
        language=req.language,
        input={"text": req.text},
        result=result,
        created_at=datetime.now().isoformat(),
    )
    save_record(record.model_dump())
    return record
