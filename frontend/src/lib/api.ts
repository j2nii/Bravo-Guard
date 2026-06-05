const BASE_URL = "http://localhost:8000";

// --- 분석 ---

export async function analyzeDocuments(params: {
  contentName: string;
  language: string;
  productType: string;
  originalPdf: File;
  translatedPdf: File;
}) {
  const formData = new FormData();
  formData.append("content_name", params.contentName);
  formData.append("language", params.language);
  formData.append("product_type", params.productType);
  formData.append("original_pdf", params.originalPdf);
  formData.append("translated_pdf", params.translatedPdf);

  const res = await fetch(`${BASE_URL}/api/analyze`, {
    method: "POST",
    body: formData,
  });
  if (!res.ok) throw new Error(`분석 실패: ${res.status}`);
  return res.json();
}

// --- 심의 이력 ---

export async function getReviews(status?: string) {
  const url = status
    ? `${BASE_URL}/api/reviews?status=${encodeURIComponent(status)}`
    : `${BASE_URL}/api/reviews`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("이력 조회 실패");
  return res.json();
}

export async function getReview(reviewId: string) {
  const res = await fetch(`${BASE_URL}/api/reviews/${reviewId}`);
  if (!res.ok) throw new Error("심의 이력 조회 실패");
  return res.json();
}

// --- 통계 ---

export async function getStats() {
  const res = await fetch(`${BASE_URL}/api/stats`);
  if (!res.ok) throw new Error("통계 조회 실패");
  return res.json();
}

// --- 승인 / 반려 / 수정 요청 ---

export async function approveReview(
  reviewId: string,
  action: "approved" | "rejected" | "revision_requested",
  comment: string = "",
) {
  const res = await fetch(`${BASE_URL}/api/approve/${reviewId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, comment }),
  });
  if (!res.ok) throw new Error("승인 처리 실패");
  return res.json();
}

// --- 리포트 다운로드 ---

export async function downloadReport(
  reviewId: string,
  type: "full" | "summary" | "original_pdf" = "full",
) {
  const res = await fetch(
    `${BASE_URL}/api/reports/${reviewId}/download?type=${type}`,
  );
  if (!res.ok) throw new Error("다운로드 실패");

  const blob = await res.blob();
  const disposition = res.headers.get("Content-Disposition") ?? "";
  const match = disposition.match(/filename\*=UTF-8''(.+)/);
  const filename = match
    ? decodeURIComponent(match[1])
    : `report_${reviewId}_${type}.pdf`;

  // 브라우저 다운로드 트리거
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
