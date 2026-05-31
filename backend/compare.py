import uuid
from datetime import datetime

from fastapi import APIRouter
from schemas import CompareRequest, CompareResponse, ReviewRecord
from approve import save_record

# A가 완성하면 아래 주석 해제
# from llm import call_llm
# from prompts import COMPARE_SYSTEM_PROMPT

router = APIRouter()


def _run_compare(original_ko: str, translated: str, language: str) -> dict:
    # TODO: A의 llm.py 완성 후 아래로 교체
    # import json
    # raw = call_llm(COMPARE_SYSTEM_PROMPT, f"[언어: {language}]\n원문:\n{original_ko}\n번역:\n{translated}")
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
    "/api/compare",
    response_model=CompareResponse,
    summary="한국어 원문 vs 번역본 뉘앙스 비교",
    description="""
한국어 원문과 외국어 번역본을 함께 입력하면, 번역 과정에서 금융 조항의 뉘앙스가 바뀐 부분을 탐지합니다.

**탐지 유형**
- 조건부 표현 → 확정 표현으로 변형 (예: "조건 충족 시 적용" → "모든 고객 적용")
- 우대금리·중도상환수수료 수치 오역
- 원문에 없는 과장 표현 추가

**지원 언어**: 베트남어, 중국어, 우즈베크어, 캄보디아어, 영어 등
    """,
)
def compare(req: CompareRequest):
    result = _run_compare(req.original_ko, req.translated, req.language)
    record = ReviewRecord(
        id=str(uuid.uuid4()),
        type="compare",
        content_name=req.content_name,
        language=req.language,
        input={"original_ko": req.original_ko, "translated": req.translated},
        result=result,
        created_at=datetime.now().isoformat(),
    )
    save_record(record.model_dump())
    return record
