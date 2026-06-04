import json
import os

from fastapi import APIRouter, HTTPException
from schemas import ApproveRequest, ReviewRecord

router = APIRouter()

DATA_PATH = os.path.join(os.path.dirname(__file__), "data", "reviews.json")


# --- 데이터 레이어 ---

def _load() -> list:
    if not os.path.exists(DATA_PATH):
        return []
    with open(DATA_PATH, "r", encoding="utf-8") as f:
        return json.load(f)


def _save(records: list) -> None:
    with open(DATA_PATH, "w", encoding="utf-8") as f:
        json.dump(records, f, ensure_ascii=False, indent=2)


def save_record(record: dict) -> None:
    records = _load()
    records.append(record)
    _save(records)


# --- 엔드포인트 ---

@router.get(
    "/api/stats",
    summary="승인 관리 통계 조회",
    description="""
승인 관리 화면 상단 통계 카드 4개에 필요한 카운트를 반환합니다.

| 항목 | 기준 |
|------|------|
| 전체 심의 건 | 전체 records 수 |
| 검토 대기 | status == pending |
| 위반 포함 | result.review.grade == 🔴 위반 |
| 최종 승인 | status == approved |
    """,
)
def get_stats():
    records = _load()
    return {
        "total": len(records),
        "pending": sum(1 for r in records if r["status"] == "pending"),
        "violation": sum(1 for r in records if r.get("result", {}).get("review", {}).get("grade") == "🔴 위반"),
        "approved": sum(1 for r in records if r["status"] == "approved"),
    }


@router.get(
    "/api/reviews",
    summary="전체 심의 이력 조회",
    description="저장된 모든 심의 이력을 최신순으로 반환합니다. 준법 관리자 대시보드에서 사용합니다.",
)
def list_reviews():
    return sorted(_load(), key=lambda r: r["created_at"], reverse=True)


@router.get(
    "/api/reviews/{review_id}",
    summary="심의 이력 단건 조회",
    description="특정 심의 ID의 상세 내역을 반환합니다.",
)
def get_review(review_id: str):
    record = next((r for r in _load() if r["id"] == review_id), None)
    if not record:
        raise HTTPException(status_code=404, detail="심의 이력을 찾을 수 없습니다.")
    return record


@router.post(
    "/api/approve/{review_id}",
    summary="심의 승인 / 반려 / 수정 요청",
    description="""
준법 관리자가 AI 심의 결과를 검토한 후 최종 판단을 내립니다.

**action 값**
- `approved`: 승인 (콘텐츠 배포 가능)
- `rejected`: 반려 (배포 불가, 재작성 필요)
- `revision_requested`: 수정 요청 (부분 수정 후 재심의)
    """,
)
def approve(review_id: str, req: ApproveRequest):
    records = _load()
    for r in records:
        if r["id"] == review_id:
            r["status"] = req.action
            r["manager_comment"] = req.comment
            _save(records)
            return r
    raise HTTPException(status_code=404, detail="심의 이력을 찾을 수 없습니다.")
