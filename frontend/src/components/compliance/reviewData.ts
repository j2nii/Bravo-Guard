export type Severity = "violation" | "warning" | "compliant";

export interface ClauseHighlight {
  text: string;
  highlight?: boolean;
}

export interface ReviewClause {
  id: number;
  title: string;
  severity: Severity;
  law?: string;
  original: ClauseHighlight[];
  translation: ClauseHighlight[];
  reasoning?: string;
  suggestion?: string;
}

export const MOCK_CLAUSES: ReviewClause[] = [
  {
    id: 1,
    title: "원금 보장 표현 관련",
    severity: "violation",
    law: "자본시장법 §57 (부당권유 금지)",
    original: [
      { text: "본 상품은 " },
      { text: "예금자보호법에 따라 5천만원까지 보호", highlight: true },
      { text: "되는 적금 상품입니다." },
    ],
    translation: [
      { text: "Sản phẩm này " },
      { text: "đảm bảo hoàn toàn 100% vốn gốc không rủi ro", highlight: true },
      { text: "." },
    ],
    reasoning:
      "원문은 예금자보호 한도(5천만원)를 명시하고 있으나, 번역본은 '100% 원금 보장, 무위험'으로 과장 표현되어 있어 소비자 오인 가능성이 높습니다.",
    suggestion:
      "Sản phẩm tiết kiệm này được bảo vệ tối đa 50 triệu KRW theo Luật Bảo vệ Người gửi tiền.",
  },
  {
    id: 2,
    title: "수익률 표시 방식",
    severity: "warning",
    law: "금융소비자보호법 §22",
    original: [
      { text: "최고 연 " },
      { text: "5.0% 우대금리 적용 (조건 충족 시)", highlight: true },
    ],
    translation: [
      { text: "Lãi suất " },
      { text: "lên đến 5.0%/năm", highlight: true },
      { text: "." },
    ],
    reasoning:
      "'조건 충족 시'라는 단서가 번역본에서 누락되어 우대금리 적용 조건이 불명확합니다. 소비자가 모든 가입자에게 5% 금리가 적용된다고 오인할 수 있습니다.",
    suggestion:
      "Lãi suất tối đa 5.0%/năm (áp dụng khi đáp ứng điều kiện ưu đãi).",
  },
  {
    id: 3,
    title: "상품 가입 자격",
    severity: "compliant",
    law: "—",
    original: [{ text: "만 19세 이상 내국인 및 외국인 거주자 가입 가능" }],
    translation: [
      { text: "Người Việt Nam cư trú tại Hàn Quốc từ 19 tuổi trở lên có thể đăng ký." },
    ],
  },
  {
    id: 4,
    title: "중도 해지 조건",
    severity: "warning",
    law: "은행법 §52-2",
    original: [
      { text: "중도해지 시 " },
      { text: "약정금리의 30~70%만 적용", highlight: true },
      { text: "됩니다." },
    ],
    translation: [
      { text: "Khi rút trước hạn, " },
      { text: "lãi suất sẽ thấp hơn", highlight: true },
      { text: "." },
    ],
    reasoning:
      "구체적인 감액 비율(30~70%)이 번역본에 누락되어 있습니다. 소비자가 실제 수령액을 예측하기 어렵습니다.",
    suggestion:
      "Khi rút trước hạn, chỉ áp dụng 30~70% lãi suất đã cam kết.",
  },
  {
    id: 5,
    title: "가입 기간 안내",
    severity: "compliant",
    law: "—",
    original: [{ text: "가입 기간: 12개월 / 24개월 / 36개월 중 선택" }],
    translation: [
      { text: "Kỳ hạn gửi: chọn 12 tháng / 24 tháng / 36 tháng." },
    ],
  },
];
