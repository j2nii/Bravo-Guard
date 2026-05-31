from pydantic import BaseModel, Field
from typing import Literal


# --- 기능 1: 준법 심의 ---

class ReviewRequest(BaseModel):
    content_name: str = Field(
        description="콘텐츠 식별명",
        examples=["베트남어_대출안내_카드뉴스_v1"],
    )
    language: str = Field(
        description="심의 대상 언어",
        examples=["베트남어"],
    )
    text: str = Field(
        description="심의할 외국어 텍스트 원문",
        examples=["Lãi suất vay chỉ từ 2.5%/năm, đảm bảo không thay đổi trong suốt thời hạn vay."],
    )


class ReviewResult(BaseModel):
    grade: str = Field(description="판정 등급: 🔴 위반 | 🟡 주의 | 🟢 통과")
    violation_article: str | None = Field(description="위반 조항 (예: 금소법 제22조)", examples=["금소법 제22조"])
    problem_expression: str | None = Field(description="문제가 되는 원문 표현")
    reason: str = Field(description="판정 근거 설명")
    suggestion: str | None = Field(description="수정 제안 표현")


class ReviewResponse(BaseModel):
    id: str = Field(description="심의 고유 ID")
    type: str = Field(examples=["review"])
    content_name: str
    language: str
    input: dict
    result: ReviewResult
    status: str = Field(description="심의 상태: pending | approved | rejected | revision_requested")
    manager_comment: str
    created_at: str


# --- 기능 2: 원문 vs 번역본 비교 ---

class CompareRequest(BaseModel):
    content_name: str = Field(
        description="콘텐츠 식별명",
        examples=["베트남어_우대금리_안내장_v2"],
    )
    language: str = Field(
        description="번역본 언어",
        examples=["베트남어"],
    )
    original_ko: str = Field(
        description="한국어 원문",
        examples=["고용허가제 근로자 대상 대출 상품으로, 우대금리는 조건 충족 시 적용됩니다."],
    )
    translated: str = Field(
        description="외국어 번역본",
        examples=["Sản phẩm vay dành cho lao động E-9, lãi suất ưu đãi được áp dụng cho tất cả khách hàng."],
    )


class CompareResult(BaseModel):
    has_nuance_change: bool = Field(description="뉘앙스 변형 여부")
    grade: str = Field(description="판정 등급: 🔴 위반 | 🟡 주의 | 🟢 통과")
    violation_article: str | None
    original_expression: str | None = Field(description="원문의 문제 표현")
    translated_expression: str | None = Field(description="번역본의 변형 표현")
    reason: str
    suggestion: str | None = Field(description="올바른 번역 제안")


class CompareResponse(BaseModel):
    id: str
    type: str = Field(examples=["compare"])
    content_name: str
    language: str
    input: dict
    result: CompareResult
    status: str
    manager_comment: str
    created_at: str


# --- 기능 3: 승인/반려 ---

class ApproveRequest(BaseModel):
    action: Literal["approved", "rejected", "revision_requested"] = Field(
        description="승인: approved / 반려: rejected / 수정 요청: revision_requested",
        examples=["approved"],
    )
    comment: str = Field(
        default="",
        description="준법 관리자 코멘트",
        examples=["금소법 제22조 위반 소지 있음. 우대금리 조건 명시 후 재심의 요청."],
    )


# --- 내부 공통 레코드 ---

class ReviewRecord(BaseModel):
    id: str
    type: Literal["review", "compare"]
    content_name: str
    language: str
    input: dict
    result: dict
    status: Literal["pending", "approved", "rejected", "revision_requested"] = "pending"
    manager_comment: str = ""
    created_at: str
