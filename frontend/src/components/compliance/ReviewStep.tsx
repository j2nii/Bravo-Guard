import { useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  FileText,
  ShieldAlert,
  ListChecks,
  ArrowRight,
} from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { approveReview } from "@/lib/api";
import type { ReviewClause, Severity } from "./reviewData";

// API 응답의 compare.items 항목을 ReviewClause 형태로 변환
function toHighlightParts(
  text: string,
  expression: string | null,
): ReviewClause["original"] {
  if (!expression || !text.includes(expression)) {
    return [{ text }];
  }
  const idx = text.indexOf(expression);
  const parts: ReviewClause["original"] = [];
  if (idx > 0) parts.push({ text: text.slice(0, idx) });
  parts.push({ text: expression, highlight: true });
  if (idx + expression.length < text.length)
    parts.push({ text: text.slice(idx + expression.length) });
  return parts;
}

function mapApiResultToClauses(result: Record<string, unknown>): ReviewClause[] {
  const compare = result.result as Record<string, unknown> | undefined;
  const items = (compare?.compare as Record<string, unknown>)?.items as Record<string, unknown>[] | undefined;
  if (!items) return [];

  return items.map((item) => ({
    id: item.index as number,
    title: (item.title as string) ?? "",
    severity: (item.severity as Severity) ?? "compliant",
    law: (item.violation_article as string) ?? undefined,
    original: toHighlightParts(
      (item.original as string) ?? "",
      (item.original_expression as string) ?? null,
    ),
    translation: toHighlightParts(
      (item.translated as string) ?? "",
      (item.translated_expression as string) ?? null,
    ),
    reasoning: (item.reason as string) ?? undefined,
    suggestion: (item.suggestion as string) ?? undefined,
  }));
}

interface ReviewStepProps {
  meta: {
    productName: string;
    language: string;
    productType: string;
    koreanFileName: string;
    foreignFileName: string;
  };
  result: Record<string, unknown> | null;
  reviewId: string | null;
  onNext: () => void;
}

const SEVERITY_LABEL: Record<Severity, string> = {
  violation: "위반 가능",
  warning: "주의 필요",
  compliant: "적합",
};

const SEVERITY_STYLES: Record<Severity, string> = {
  violation: "bg-red-100 text-red-700 border-red-200",
  warning: "bg-orange-100 text-orange-700 border-orange-200",
  compliant: "bg-emerald-100 text-emerald-700 border-emerald-200",
};

const SEVERITY_BAR: Record<Severity, string> = {
  violation: "bg-red-500",
  warning: "bg-orange-500",
  compliant: "bg-emerald-500",
};

type Filter = "all" | Severity;

function Pill({ label, value }: { label: string; value: string }) {
  return (
    <div className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1.5 text-xs">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-foreground">{value}</span>
    </div>
  );
}

function HighlightedText({
  parts,
  color,
}: {
  parts: ReviewClause["original"];
  color: "green" | "red";
}) {
  return (
    <p className="text-sm leading-relaxed text-foreground">
      {parts.map((p, i) =>
        p.highlight ? (
          <mark
            key={i}
            className={cn(
              "rounded px-1 py-0.5",
              color === "green" && "bg-emerald-100 text-emerald-900",
              color === "red" && "bg-red-100 text-red-900",
            )}
          >
            {p.text}
          </mark>
        ) : (
          <span key={i}>{p.text}</span>
        ),
      )}
    </p>
  );
}

export function ReviewStep({ meta, result, reviewId, onNext }: ReviewStepProps) {
  const [filter, setFilter] = useState<Filter>("all");
  const [approveStatus, setApproveStatus] = useState<string | null>(null);

  const clauses = useMemo(
    () => (result ? mapApiResultToClauses(result) : []),
    [result],
  );

  const counts = useMemo(() => {
    const total = clauses.length;
    const violation = clauses.filter((c) => c.severity === "violation").length;
    const warning = clauses.filter((c) => c.severity === "warning").length;
    const compliant = clauses.filter((c) => c.severity === "compliant").length;
    return { total, violation, warning, compliant };
  }, [clauses]);

  const filtered =
    filter === "all" ? clauses : clauses.filter((c) => c.severity === filter);

  async function handleApprove(action: "approved" | "rejected" | "revision_requested") {
    if (!reviewId) return;
    try {
      await approveReview(reviewId, action);
      setApproveStatus(action);
    } catch {
      alert("처리 중 오류가 발생했습니다.");
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Meta pills */}
      <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <Pill label="상품명" value={meta.productName || "—"} />
          <Pill label="언어" value={meta.language || "—"} />
          <Pill label="상품유형" value={meta.productType || "—"} />
          <div className="mx-1 h-4 w-px bg-border" />
          <div className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1.5 text-xs">
            <FileText className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="font-medium text-foreground">{meta.koreanFileName}</span>
          </div>
          <div className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1.5 text-xs">
            <FileText className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="font-medium text-foreground">{meta.foreignFileName}</span>
          </div>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard
          icon={<ListChecks className="h-5 w-5" />}
          label="총 검토 문구"
          value={counts.total}
          tone="neutral"
        />
        <SummaryCard
          icon={<ShieldAlert className="h-5 w-5" />}
          label="위반 가능"
          value={counts.violation}
          tone="red"
        />
        <SummaryCard
          icon={<AlertTriangle className="h-5 w-5" />}
          label="주의 필요"
          value={counts.warning}
          tone="orange"
        />
        <SummaryCard
          icon={<CheckCircle2 className="h-5 w-5" />}
          label="적합"
          value={counts.compliant}
          tone="green"
        />
      </div>

      {/* Ratio bar */}
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">심의 결과 비율</h3>
          <span className="text-xs text-muted-foreground">총 {counts.total}건 기준</span>
        </div>
        <div className="flex h-3 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="bg-red-500"
            style={{ width: `${(counts.violation / counts.total) * 100}%` }}
          />
          <div
            className="bg-orange-500"
            style={{ width: `${(counts.warning / counts.total) * 100}%` }}
          />
          <div
            className="bg-emerald-500"
            style={{ width: `${(counts.compliant / counts.total) * 100}%` }}
          />
        </div>
        <div className="mt-3 flex flex-wrap gap-4 text-xs">
          <LegendDot color="bg-red-500" label={`위반 ${counts.violation}건`} />
          <LegendDot color="bg-orange-500" label={`주의 ${counts.warning}건`} />
          <LegendDot color="bg-emerald-500" label={`적합 ${counts.compliant}건`} />
        </div>
      </div>

      {/* Clause list */}
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-base font-semibold text-foreground">문구별 심의 결과</h3>
          <div className="inline-flex rounded-lg border border-border bg-muted/40 p-1">
            {(
              [
                { key: "all" as const, label: `전체 ${counts.total}` },
                { key: "violation" as const, label: `위반 ${counts.violation}` },
                { key: "warning" as const, label: `주의 ${counts.warning}` },
                { key: "compliant" as const, label: `적합 ${counts.compliant}` },
              ]
            ).map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={cn(
                  "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                  filter === f.key
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <Accordion type="multiple" className="flex flex-col gap-2">
          {filtered.map((clause) => (
            <AccordionItem
              key={clause.id}
              value={`c-${clause.id}`}
              className="overflow-hidden rounded-lg border border-border bg-background"
            >
              <AccordionTrigger className="px-4 py-3 hover:no-underline">
                <div className="flex flex-1 flex-wrap items-center gap-3 text-left">
                  <span
                    className={cn(
                      "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
                      SEVERITY_STYLES[clause.severity],
                    )}
                  >
                    {SEVERITY_LABEL[clause.severity]}
                  </span>
                  <span className="text-sm font-medium text-foreground">
                    문구 #{clause.id} · {clause.title}
                  </span>
                  {clause.law && clause.law !== "—" && (
                    <span className="text-xs text-muted-foreground">
                      관련 법조항: {clause.law}
                    </span>
                  )}
                </div>
              </AccordionTrigger>
              <AccordionContent className="border-t border-border bg-muted/20 px-4 py-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-md border border-border bg-background p-3">
                    <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      한국어 원문
                    </div>
                    <HighlightedText parts={clause.original} color="green" />
                  </div>
                  <div className="rounded-md border border-border bg-background p-3">
                    <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      외국어 번역본
                    </div>
                    <HighlightedText
                      parts={clause.translation}
                      color={clause.severity === "compliant" ? "green" : "red"}
                    />
                  </div>
                </div>

                {clause.severity !== "compliant" && (
                  <div className="mt-4 flex flex-col gap-3">
                    {clause.reasoning && (
                      <div className="rounded-md bg-background p-3">
                        <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          {clause.severity === "violation" ? "위반 근거" : "검토 의견"}
                        </div>
                        <p className="text-sm leading-relaxed text-foreground">
                          {clause.reasoning}
                        </p>
                      </div>
                    )}
                    {clause.suggestion && (
                      <div className="rounded-md border-l-4 border-emerald-500 bg-emerald-50/60 p-3">
                        <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-emerald-700">
                          대안 문구
                        </div>
                        <p className="text-sm leading-relaxed text-foreground">
                          {clause.suggestion}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>

      {/* Footer actions */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="default"
            className="bg-emerald-600 hover:bg-emerald-700"
            disabled={false}
            onClick={() => handleApprove("approved")}
          >
            승인
          </Button>
          <Button
            variant="outline"
            className="border-red-200 text-red-700 hover:bg-red-50"
            disabled={false}
            onClick={() => handleApprove("rejected")}
          >
            반려
          </Button>
          <Button
            variant="outline"
            disabled={false}
            onClick={() => handleApprove("revision_requested")}
          >
            수정 요청
          </Button>
          {approveStatus && (
            <span className="text-sm text-muted-foreground">
              {{
                approved: "✅ 승인 완료",
                rejected: "❌ 반려 완료",
                revision_requested: "🔄 수정 요청 완료",
              }[approveStatus]}
            </span>
          )}
        </div>
        <Button onClick={onNext} className="gap-2">
          리포트 생성
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className={cn("h-2.5 w-2.5 rounded-full", color)} />
      <span className="text-muted-foreground">{label}</span>
    </div>
  );
}

function SummaryCard({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  tone: "neutral" | "red" | "orange" | "green";
}) {
  const toneStyles = {
    neutral: "bg-muted text-foreground",
    red: "bg-red-100 text-red-700",
    orange: "bg-orange-100 text-orange-700",
    green: "bg-emerald-100 text-emerald-700",
  } as const;
  const valueStyles = {
    neutral: "text-foreground",
    red: "text-red-600",
    orange: "text-orange-600",
    green: "text-emerald-600",
  } as const;
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{label}</span>
        <span className={cn("flex h-8 w-8 items-center justify-center rounded-lg", toneStyles[tone])}>
          {icon}
        </span>
      </div>
      <div className={cn("mt-3 text-3xl font-semibold", valueStyles[tone])}>{value}</div>
    </div>
  );
}
