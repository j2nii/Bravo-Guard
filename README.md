# BravoGuard

> 브라보 코리아의 17개국 다국어 광고를 원문 그대로 금소법 기준으로 심의하고, 한국어 원문과의 번역 뉘앙스 변형까지 탐지하는 AI 준법 감시 에이전트

JB금융그룹 Fin:AI Challenge 출품작

<br/>

# 0. Getting Started (시작하기)

```bash
# backend/.env 파일 생성 후 API 키 입력
UPSTAGE_API_KEY=발급받은_키_입력

# Docker로 실행
docker-compose up --build
```

| 서비스 | 주소 |
|--------|------|
| 서비스 화면 | http://localhost:8080 |
| 백엔드 API 문서 | http://localhost:8000/docs |

<br/>
<br/>

# 1. Project Overview (프로젝트 개요)
- **프로젝트 이름:** BravoGuard
- **프로젝트 설명:** 금융 준법 자문가의 심의 업무를 AI로 혁신하는 서비스. 브라보 코리아의 17개국 다국어 마케팅 광고를 Upstage Solar LLM 기반으로 금소법 기준에 따라 문구별 자동 심의하고, 한국어 원문과 외국어 번역본 간의 뉘앙스 변형까지 탐지합니다.

<br/>
<br/>

# 2. Team Members (팀원 및 팀 소개)

| 이지원 | 김지은 | 신윤서 | 한연주 | 정유진 | 
|:------:|:------:|:------:|:------:|:------:|
| <img src="https://github.com/jwlee0348.png" alt="이지원" width="150"> | <img src="https://github.com/j2nii.png" alt="김지은" width="150">| <img src="https://github.com/yummsseo.png" alt="신윤서" width="150"> | <img src="https://github.com/alskso.png" alt="한연주" width="150"> | <img src="https://github.com/정유진_깃허브_아이디.png" alt="정유진" width="150"> |
| FE | BE | BE | BE | 서비스 기획 |
| [GitHub](https://github.com/jwlee0348) | [GitHub](https://github.com/j2nii)| [GitHub](https://github.com/yummsseo) | [GitHub](https://github.com/alskso) | [GitHub](https://github.com/정유진_깃허브_아이디) |

<br/>
<br/>

# 3. Key Features (주요 기능)

| 기능명 | 기능 설명 | 입력 (Input) | 출력 (Output) | 사용 기술 / 스택 | 
| :--- | :--- | :--- | :--- | :--- | 
| **🌐 외국어 콘텐츠<br>준법 심의** | 외국어로 작성된 금융 마케팅 광고 문구를 금소법 17~23조 기준으로 위반 여부 자동 판정 및 수정 제안 제공 | - 원문 PDF<br>- 외국어 번역본 PDF<br>- 상품명, 언어 종류, 상품 유형 | - 문구별 판정 등급<br>- 위반 조항, 문제 표현<br>- 판정 근거, 수정 제안 | `LLM`, `Prompt Engineering`, `금소법 규칙 기반 판단`, `PDF 텍스트 추출/전처리` | 
| **🔍 원문·번역본<br>뉘앙스 비교** | 한국어 원문과 외국어 번역본 문구를 1:1 매칭하여 번역 과정에서의 의미 변형, 조건 누락, 과장 표현, 위험 고지 악화 여부 비교 판정 및 종합 요약 | - 한국어 원문 PDF<br>- 외국어 번역본 PDF<br>- 언어, 상품 유형 | - 뉘앙스 변형 여부, 판정 등급<br>- 위반 조항, 원문/번역 표현<br>- 판정 근거, 올바른 번역 제안<br>- 종합 요약 | `PDF 텍스트 추출`, `Prompt Engineering`, `LLM (1, 2차 호출)`, `비교 체크리스트 기반 추론` |
| **⚖️ 준법 관리자<br>승인·반려 처리** | 준법 관리자의 AI 분석 결과 검토 후 승인/반려/수정 요청 액션 및 코멘트 처리 (심의 이력 즉시 반영) | - 심의 ID<br>- 처리 액션 (승인/반려/수정 요청)<br>- 관리자 코멘트 | - 상태 및 코멘트가 갱신된 심의 레코드 | `FastAPI`, `파일 기반 데이터 저장` | 
| **📊 심의 이력 조회<br>및 통계** | 저장된 전체 심의 이력을 상태별로 필터링하여 조회하고 전체, 대기, 위반 포함, 승인 건수 통계 확인 | - 상태 필터<br>(검토 대기/반려/수정요청/위반 포함) | - 심의 목록<br>- 상태별 통계 수치 | `FastAPI`, `JSON 파일 기반 데이터 저장` |
| **📄 심의 리포트 생성<br>및 다운로드** | 심의 완료 건에 대해 개요, 문구별 결과, 뉘앙스 비교, 종합 의견, 서명란이 포함된 전체/요약 리포트 PDF 다운로드 제공 | - 심의 ID<br>- 리포트 유형 | - PDF 파일 다운로드 | `FastAPI`, `reportlab (PDF 생성)` | 
| **🚫 다크패턴<br>가이드라인 탐지** | 금소법 위반은 아니나 소비자 오인을 유도하는 광고물 내 시각적, 구조적 다크패턴을 별도 기준으로 탐지 및 안내 | - 광고 이미지 또는 PDF | - 다크 패턴 탐지 항목, 위치, 개선 제안 | `OCR`, `금융 광고 모범 규준`, `표시광고법 기반 규칙` | **X** |
| **🖼️ JPG 입력 지원<br>(이미지 기반 처리)** | OCR 기능을 활용하여 JPG 형식의 이미지형 광고물을 분석하고 처리 가능하도록 지원 | - 광고 이미지 (JPG) | - 이미지 콘텐츠 심의 결과 | `OCR` | 

<br/>
<br/>

# 4. Tasks & Responsibilities (작업 및 역할 분담)

| 이름 | 프로필 | 담당 업무 |
| :--- | :---: | :--- |
| **이지원** (FE) |<img src="https://github.com/jwlee0348.png" alt="이지원" width="100"> | <ul><li>**프론트엔드 UI/UX 개발**</li><li>사용자 시나리오 기반 화면 설계</li><li>준법 심의 요청 및 결과 시각화 컴포넌트 구현</li><li>공통 컴포넌트 및 커스텀 훅 개발</li></ul>
| **김지은** (BE) | <img src="https://github.com/j2nii.png" alt="김지은" width="100"> |<ul><li>**데이터/통합 담당**</li><li>금소법 핵심 조항 텍스트 정리 (19조, 22조 등)</li><li>AI 프롬프트에 조항 데이터 공급</li><li>테스트용 샘플 콘텐츠 준비 (베트남어 대출 광고 예시 등)</li><li>전체 기능 통합 테스트</li><li>버그 리포트 + 수정 지원</li></ul> |
| **신윤서** (BE) | <img src="https://github.com/yummsseo.png" alt="신윤서" width="100"> | <ul><li>**AI/프롬프트 담당**</li><li>Claude/GPT API 연결</li><li>기능 1 프롬프트 설계 (다국어 준법 심의)</li><li>기능 2 프롬프트 설계 (원문 vs 번역본 비교)</li><li>언어별 테스트 (베트남어, 중국어, 영어 등)</li><li>프롬프트 고도화 (결과 품질 개선)</li></ul> |
| **한연주** (BE) | <img src="https://github.com/alskso.png" alt="한연주" width="100"> | <ul><li>**API 서버 담당**</li><li>FastAPI 서버 세팅</li><li>엔드포인트 3개 개발 (<code>POST /api/review</code>, <code>POST /api/compare</code>, <code>POST /api/approve</code>)</li><li>AI 프롬프트 로직 연결</li><li>심의 이력 저장 (JSON or SQLite)</li><li>프론트엔드 연동</li></ul> |
| **정유진** (서비스 기획) |  <img src="https://github.com/정유진_깃허브_아이디.png" alt="정유진" width="100"> | <ul><li>**서비스 기획 및 총괄**</li><li>전반적인 서비스 의도 정의 및 요구사항 도출</li><li>서비스 시나리오 및 핵심 플로우 설계</li></ul> |

<br/>
<br/>

# 5. Technology Stack (기술 스택)

## 5.1 AI
|  |  |
|-----------------|-----------------|
| Upstage Solar LLM | ![Upstage](https://img.shields.io/badge/Upstage_Solar_LLM-6C47FF?style=for-the-badge&logoColor=white) |

<br/>

## 5.2 Backend
|  |  |  |
|-----------------|-----------------|-----------------|
| Python | ![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white) | 3.11 |
| FastAPI | ![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white) | |
| uvicorn | ![uvicorn](https://img.shields.io/badge/uvicorn-499848?style=for-the-badge&logoColor=white) | |
<br/>

## 5.3 Frontend
|  |  |  |
|-----------------|-----------------|-----------------|
| React | ![React](https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=react&logoColor=black) | |
| TypeScript | ![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white) | |
| Vite | ![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white) | |

<br/>

## 5.4 Infra
|  |  |  
|-----------------|-----------------|
| Docker | ![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white) | 가상화 환경 구축 |
| Docker Compose | ![Docker Compose](https://img.shields.io/badge/Docker_Compose-2496ED?style=for-the-badge&logo=docker&logoColor=white) |

<br/>

## 5.5 Cooperation
|  |  | 
|-----------------|-----------------|
| Git | ![Git](https://img.shields.io/badge/Git-F05032?style=for-the-badge&logo=git&logoColor=white) |
| GitHub | ![GitHub](https://img.shields.io/badge/GitHub-181717?style=for-the-badge&logo=github&logoColor=white) |
| Notion | ![Notion](https://img.shields.io/badge/Notion-000000?style=for-the-badge&logo=notion&logoColor=white) |

<br/>
<br/>

# 6. Project Structure (프로젝트 구조)

```plaintext
bravo-guard/
├── backend/
│   ├── data/
│   │   ├── pdfs/            # 생성된 심의 리포트 PDF
│   │   ├── prompts/         # 프롬프트 문서
│   │   ├── references/      # 금소법 참조 데이터
│   │   └── reviews.json     # 심의 이력 저장소
│   ├── analyze.py           # AI 준법 심의 분석 로직
│   ├── approve.py           # 승인/반려 처리 및 이력 관리
│   ├── llm.py               # Upstage Solar LLM 호출
│   ├── main.py              # FastAPI 앱 진입점
│   ├── pdf_parser.py        # PDF 텍스트 추출
│   ├── prompts.py           # 시스템 프롬프트 정의
│   ├── report_generator.py  # PDF 리포트 생성
│   ├── schemas.py           # Pydantic 데이터 모델
│   ├── requirements.txt     # Python 패키지 목록
│   └── Dockerfile
├── frontend/
│   └── src/
│       ├── components/
│       │   ├── compliance/  # 핵심 심의 UI 컴포넌트
│       │   └── ui/          # 공통 UI 컴포넌트 (shadcn)
│       ├── lib/
│       │   ├── api.ts       # 백엔드 API 호출 함수
│       │   └── utils.ts     # 유틸리티 함수
│       ├── routes/          # 페이지 라우팅
│       └── hooks/           # 커스텀 훅
│   ├── package.json
│   ├── vite.config.ts
│   └── Dockerfile
├── docker-compose.yml
└── README.md
```

<br/>
<br/>

