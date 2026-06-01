import { Fragment, useState } from "react";
import {
  CheckCircle2,
  Clock,
  Download,
  FileCheck2,
  ShieldAlert,
  Files,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Status = "pending" | "approved" | "rejected" | "violation";

interface Row {
  id: string;
  name: string;
  language: string;
  total: number;
  violations: number;
  date: string;
  status: Status;
  summary: string;
  reasoning: string;
}

const STATUS_LABEL: Record<Status, string> = {
  pending: "대기중",
  approved: "승인",
  rejected: "반려",
  violation: "위반 포함",
};

const STATUS_STYLES: Record<Status, string> = {
  pending: "bg-slate-100 text-slate-700 border-slate-200",
  approved: "bg-emerald-100 text-emerald-700 border-emerald-200",
  rejected: "bg-red-100 text-red-700 border-red-200",
  violation: "bg-orange-100 text-orange-700 border-orange-200",
};

const MOCK_ROWS: Row[] = [
  {
    id: "R-2025-018",
    name: "신한 우대 적금 베트남어 광고",
    language: "베트남어",
    total: 5,
    violations: 1,
    date: "2025-05-30",
    status: "violation",
    summary:
      "총 5개 문구 중 1개 위반 가능, 2개 주의 필요. 원금 보장 관련 과장 표현이 발견되었습니다.",
    reasoning:
      "자본시장법 §57 위반 가능성. '100% 원금 보장' 표현은 예금자보호 한도(5천만원) 누락으로 소비자 오인 우려.",
  },
  {
    id: "R-2025-017",
    name: "KB 주택담보대출 중국어 간체 광고",
    language: "중국어 간체",
    total: 7,
    violations: 0,
    date: "2025-05-28",
    status: "approved",
    summary: "전 문구 적합. 금리 표시, 가입 조건 모두 원문과 일치.",
    reasoning: "—",
  },
  {
    id: "R-2025-016",
    name: "하나 종합보험 베트남어 안내",
    language: "베트남어",
    total: 9,
    violations: 0,
    date: "2025-05-27",
    status: "pending",
    summary: "AI 분석 완료, 준법 자문가 최종 검토 대기 중.",
    reasoning: "—",
  },
  {
    id: "R-2025-015",
    name: "우리 체크카드 중국어 번체 광고",
    language: "중국어 번체",
    total: 4,
    violations: 2,
    date: "2025-05-25",
    status: "rejected",
    summary: "캐시백 비율 및 연회비 면제 조건 누락. 재작성 필요.",
    reasoning: "금융소비자보호법 §22 위반. 부가 혜택 조건이 번역본에서 누락됨.",
  },
  {
    id: "R-2025-014",
    name: "IBK 청년 펀드 베트남어 광고",
    language: "베트남어",
    total: 6,
    violations: 0,
    date: "2025-05-22",
    status: "approved",
    summary: "리스크 고지 문구 정확히 번역, 적합 판정.",
    reasoning: "—",
  },
];

type Filter = "all" | Status;

export function ApprovalManagement() {
  const [filter, setFilter] = useState<Filter>("all");
  const [expanded, setExpanded] = useState<string | null>(null);

  const counts = {
    total: MOCK_ROWS.length,
    pending: MOCK_ROWS.filter((r) => r.status === "pending").length,
    violation: MOCK_ROWS.filter((r) => r.status === "violation").length,
    approved: MOCK_ROWS.filter((r) => r.status === "approved").length,
  };

  const filtered =
    filter === "all" ? MOCK_ROWS : MOCK_ROWS.filter((r) => r.status === filter);

  return (
    <div className="flex flex-col gap-6">
      {/* Summary */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={<Files className="h-5 w-5" />} label="전체 심의 건" value={counts.total} tone="neutral" />
        <StatCard icon={<Clock className="h-5 w-5" />} label="검토 대기" value={counts.pending} tone="neutral" />
        <StatCard icon={<ShieldAlert className="h-5 w-5" />} label="위반 포함" value={counts.violation} tone="orange" />
        <StatCard icon={<FileCheck2 className="h-5 w-5" />} label="최종 승인" value={counts.approved} tone="green" />
      </div>

      {/* Filter */}
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-base font-semibold text-foreground">심의 건 목록</h3>
          <div className="inline-flex flex-wrap rounded-lg border border-border bg-muted/40 p-1">
            {(
              [
                { key: "all" as const, label: "전체" },
                { key: "pending" as const, label: "대기중" },
                { key: "approved" as const, label: "승인" },
                { key: "rejected" as const, label: "반려" },
                { key: "violation" as const, label: "위반 포함" },
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

        {/* Table */}
        <div className="overflow-hidden rounded-lg border border-border">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">광고명</th>
                  <th className="px-4 py-3 font-medium">언어</th>
                  <th className="px-4 py-3 text-right font-medium">총 문구</th>
                  <th className="px-4 py-3 text-right font-medium">위반</th>
                  <th className="px-4 py-3 font-medium">심의일</th>
                  <th className="px-4 py-3 font-medium">상태</th>
                  <th className="px-4 py-3 text-right font-medium">다운로드</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => {
                  const isOpen = expanded === r.id;
                  return (
                    <Fragment key={r.id}>
                      <tr
                        key={r.id}
                        onClick={() => setExpanded(isOpen ? null : r.id)}
                        className={cn(
                          "cursor-pointer border-t border-border transition-colors hover:bg-muted/30",
                          isOpen && "bg-muted/30",
                        )}
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <ChevronDown
                              className={cn(
                                "h-4 w-4 text-muted-foreground transition-transform",
                                isOpen && "rotate-180",
                              )}
                            />
                            <div className="flex flex-col">
                              <span className="font-medium text-foreground">{r.name}</span>
                              <span className="text-xs text-muted-foreground">{r.id}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{r.language}</td>
                        <td className="px-4 py-3 text-right tabular-nums">{r.total}</td>
                        <td
                          className={cn(
                            "px-4 py-3 text-right tabular-nums",
                            r.violations > 0 ? "font-semibold text-red-600" : "text-muted-foreground",
                          )}
                        >
                          {r.violations}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{r.date}</td>
                        <td className="px-4 py-3">
                          <span
                            className={cn(
                              "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
                              STATUS_STYLES[r.status],
                            )}
                          >
                            {STATUS_LABEL[r.status]}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              // mock download
                            }}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                            aria-label="리포트 다운로드"
                          >
                            <Download className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                      {isOpen && (
                        <tr className="border-t border-border bg-muted/20">
                          <td colSpan={7} className="px-4 py-5">
                            <div className="flex flex-col gap-4">
                              <div className="grid gap-3 md:grid-cols-2">
                                <div className="rounded-md border border-border bg-background p-3">
                                  <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                    AI 판단 요약
                                  </div>
                                  <p className="text-sm leading-relaxed text-foreground">
                                    {r.summary}
                                  </p>
                                </div>
                                <div className="rounded-md border border-border bg-background p-3">
                                  <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                    위반 근거
                                  </div>
                                  <p className="text-sm leading-relaxed text-foreground">
                                    {r.reasoning}
                                  </p>
                                </div>
                              </div>
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <div className="flex flex-wrap gap-2">
                                  <Button
                                    size="sm"
                                    className="gap-2 bg-emerald-600 hover:bg-emerald-700"
                                  >
                                    <CheckCircle2 className="h-4 w-4" />
                                    승인
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="border-red-200 text-red-700 hover:bg-red-50"
                                  >
                                    반려
                                  </Button>
                                  <Button size="sm" variant="outline">
                                    수정 요청
                                  </Button>
                                </div>
                                <Button size="sm" variant="outline" className="gap-2">
                                  <Download className="h-4 w-4" />
                                  리포트 다운로드
                                </Button>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  tone: "neutral" | "orange" | "green";
}) {
  const toneStyles = {
    neutral: "bg-muted text-foreground",
    orange: "bg-orange-100 text-orange-700",
    green: "bg-emerald-100 text-emerald-700",
  } as const;
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{label}</span>
        <span className={cn("flex h-8 w-8 items-center justify-center rounded-lg", toneStyles[tone])}>
          {icon}
        </span>
      </div>
      <div className="mt-3 text-3xl font-semibold text-foreground">{value}</div>
    </div>
  );
}
