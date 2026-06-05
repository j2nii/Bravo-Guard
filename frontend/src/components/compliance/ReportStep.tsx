import {
  CheckCircle2,
  Download,
  FileText,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { downloadReport } from "@/lib/api";

interface ReportStepProps {
  meta: {
    productName: string;
    language: string;
    productType: string;
  };
  reviewId: string | null;
  onRestart: () => void;
}

const REPORT_SECTIONS = [
  "심의 개요",
  "종합 결과 요약",
  "문구별 상세 분석",
  "적용 법령 근거",
  "준법 자문가 서명란",
];

export function ReportStep({ meta, reviewId, onRestart }: ReportStepProps) {
  const [loading, setLoading] = useState<string | null>(null);

  const today = new Date().toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  async function handleDownload(type: "full" | "summary" | "original_pdf") {
    if (!reviewId) return;
    setLoading(type);
    try {
      await downloadReport(reviewId, type);
    } catch {
      alert("다운로드 중 오류가 발생했습니다.");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Preview card */}
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">
                {meta.productName || "금융 광고 심의 리포트"}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {meta.productType} · {meta.language} · {today}
              </p>
            </div>
          </div>
          <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
            AI 분석 완료
          </span>
        </div>

        <div className="mt-6">
          <h3 className="text-sm font-semibold text-foreground">리포트 구성</h3>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {REPORT_SECTIONS.map((s) => (
              <li
                key={s}
                className="flex items-center gap-2 rounded-md border border-border bg-muted/30 px-3 py-2 text-sm text-foreground"
              >
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                {s}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Footer */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card p-4 shadow-sm">
        <Button variant="outline" onClick={onRestart} className="gap-2">
          <RefreshCw className="h-4 w-4" />새 심의 시작
        </Button>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            className="gap-2"
            disabled={!reviewId || !!loading}
            onClick={() => handleDownload("summary")}
          >
            {loading === "summary" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            요약 리포트
          </Button>
          <Button
            variant="outline"
            className="gap-2"
            disabled={!reviewId || !!loading}
            onClick={() => handleDownload("original_pdf")}
          >
            {loading === "original_pdf" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            원문 PDF
          </Button>
          <Button
            className="gap-2"
            disabled={!reviewId || !!loading}
            onClick={() => handleDownload("full")}
          >
            {loading === "full" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            전체 리포트 PDF
          </Button>
        </div>
      </div>
    </div>
  );
}
