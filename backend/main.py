from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from review import router as review_router
from compare import router as compare_router
from approve import router as approve_router

app = FastAPI(
    title="BravoGuard API",
    description="""
## 전북은행 다국어 마케팅 콘텐츠 준법 심의 AI 에이전트

### 기능
| 기능 | 엔드포인트 | 설명 |
|------|-----------|------|
| 기능 1 | `POST /api/review` | 외국어 텍스트 준법 심의 |
| 기능 2 | `POST /api/compare` | 한국어 원문 vs 번역본 뉘앙스 비교 |
| 기능 3 | `POST /api/approve/{id}` | 준법 관리자 승인 / 반려 |

### 판정 등급
- 🔴 **위반** — 금소법 위반, 즉시 수정 필요
- 🟡 **주의** — 경계 표현, 검토 필요
- 🟢 **통과** — 문제 없음
    """,
    version="0.1.0",
    contact={"name": "BravoGuard 백엔드팀"},
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(review_router, tags=["기능 1 — 준법 심의"])
app.include_router(compare_router, tags=["기능 2 — 뉘앙스 비교"])
app.include_router(approve_router, tags=["기능 3 — 승인/반려 & 이력"])


@app.get("/health", tags=["상태 확인"])
def health():
    """서버 정상 동작 여부를 확인합니다."""
    return {"status": "ok"}
