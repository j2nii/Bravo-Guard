import { Fragment, useEffect, useState } from "react";
import {
  CheckCircle2,
  Clock,
  Download,
  FileCheck2,
  ShieldAlert,
  Files,
  ChevronDown,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getStats, getReviews, approveReview, downloadReport } from "@/lib/api";

type Status = "pending" | "approved" | "rejected" | "revision_requested" | "violation";

interface Row {
  id: string;
  content_name: string;
  language: string;
  status: string;
  created_at: string;
  result: {
    review?: {
      overall_grade?: string;
      total_count?: number;
      violation_count?: number;
    };
    compare?: {
      summary?: {
        overall_reason?: string;
        risk_summary?: string;
      };
    };
  };
}

const STATUS_LABEL: Record<string, string> = {
  pending: "대기중",
  approved: "승인",
  rejected: "반려",
  revision_requested: "수정 요청",
  violation: "위반 포함",
};

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-slate-100 text-slate-700 border-slate-200",
  approved: "bg-emerald-100 text-emerald-700 border-emerald-200",
  rejected: "bg-red-100 text-red-700 border-red-200",
  revision_requested: "bg-blue-100 text-blue-700 border-blue-200",
  violation: "bg-orange-100 text-orange-700 border-orange-200",
};

type Filter = "all" | Status;

export function ApprovalManagement() {
  const [filter, setFilter] = useState<Filter>("all");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [rows, setRows] = useState<Row[]>([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, violation: 0, approved: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [dlLoading, setDlLoading] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setIsLoading(true);
      try {
        const [statsData, reviewsData] = await Promise.all([getStats(), getReviews()]);
        setStats(statsData);
        setRows(reviewsData);
      } catch {
        // 서버 미실행 등 오류 시 빈 상태 유지
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  async function handleApprove(
    id: string,
    action: "approved" | "rejected" | "revision_requested",
  ) {
    setActionLoading(`${id}-${action}`);
    try {
      await approveReview(id, action);
      const updated = await getReviews();
      setRows(updated);
      const updatedStats = await getStats();
      setStats(updatedStats);
    } catch {
      alert("처리 중 오류가 발생했습니다.");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleDownload(id: string, type: "full" | "summary" | "original_pdf") {
    setDlLoading(`${id}-${type}`);
    try {
      await downloadReport(id, type);
    } catch {
      alert("다운로드 중 오류가 발생했습니다.");
    } finally {
      setDlLoading(null);
    }
  }

  const filtered =
    filter === "all"
      ? rows
      : filter === "violation"
        ? rows.filter((r) => r.result?.review?.overall_grade === "🔴 위반")
        : rows.filter((r) => r.status === filter);

  return (
    <div className="flex flex-col gap-6">
      {/* 통계 카드 */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={<Files className="h-5 w-5" />} label="전체 심의 건" value={stats.total} tone="neutral" />
        <StatCard icon={<Clock className="h-5 w-5" />} label="검토 대기" value={stats.pending} tone="neutral" />
        <StatCard icon={<ShieldAlert className="h-5 w-5" />} label="위반 포함" value={stats.violation} tone="orange" />
        <StatCard icon={<FileCheck2 className="h-5 w-5" />} label="최종 승인" value={stats.approved} tone="green" />
      </div>

      {/* 목록 */}
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

        {isLoading ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            불러오는 중...
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-sm text-muted-foreground">
            심의 이력이 없습니다.
          </div>
        ) : (
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
                    const displayStatus =
                      r.result?.review?.overall_grade === "🔴 위반" && r.status === "pending"
                        ? "violation"
                        : r.status;

                    return (
                      <Fragment key={r.id}>
                        <tr
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
                                <span className="font-medium text-foreground">{r.content_name}</span>
                                <span className="text-xs text-muted-foreground">{r.id.slice(0, 8)}...</span>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">{r.language}</td>
                          <td className="px-4 py-3 text-right tabular-nums">
                            {r.result?.review?.total_count ?? "-"}
                          </td>
                          <td
                            className={cn(
                              "px-4 py-3 text-right tabular-nums",
                              (r.result?.review?.violation_count ?? 0) > 0
                                ? "font-semibold text-red-600"
                                : "text-muted-foreground",
                            )}
                          >
                            {r.result?.review?.violation_count ?? 0}
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">
                            {r.created_at.slice(0, 10)}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={cn(
                                "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
                                STATUS_STYLES[displayStatus] ?? STATUS_STYLES.pending,
                              )}
                            >
                              {STATUS_LABEL[displayStatus] ?? displayStatus}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDownload(r.id, "full");
                              }}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                              aria-label="전체 리포트 다운로드"
                            >
                              {dlLoading === `${r.id}-full` ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Download className="h-4 w-4" />
                              )}
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
                                      전체 판정 근거
                                    </div>
                                    <p className="text-sm leading-relaxed text-foreground">
                                      {r.result?.compare?.summary?.overall_reason ?? "-"}
                                    </p>
                                  </div>
                                  <div className="rounded-md border border-border bg-background p-3">
                                    <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                      주요 리스크
                                    </div>
                                    <p className="text-sm leading-relaxed text-foreground">
                                      {r.result?.compare?.summary?.risk_summary ?? "-"}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                  <div className="flex flex-wrap gap-2">
                                    <Button
                                      size="sm"
                                      className="gap-2 bg-emerald-600 hover:bg-emerald-700"
                                      disabled={r.status !== "pending" || !!actionLoading}
                                      onClick={() => handleApprove(r.id, "approved")}
                                    >
                                      <CheckCircle2 className="h-4 w-4" />
                                      승인
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="border-red-200 text-red-700 hover:bg-red-50"
                                      disabled={r.status !== "pending" || !!actionLoading}
                                      onClick={() => handleApprove(r.id, "rejected")}
                                    >
                                      반려
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      disabled={r.status !== "pending" || !!actionLoading}
                                      onClick={() => handleApprove(r.id, "revision_requested")}
                                    >
                                      수정 요청
                                    </Button>
                                  </div>
                                  <div className="flex gap-2">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="gap-2"
                                      onClick={() => handleDownload(r.id, "summary")}
                                      disabled={!!dlLoading}
                                    >
                                      <Download className="h-4 w-4" />
                                      요약 리포트
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="gap-2"
                                      onClick={() => handleDownload(r.id, "original_pdf")}
                                      disabled={!!dlLoading}
                                    >
                                      <Download className="h-4 w-4" />
                                      원문 PDF
                                    </Button>
                                  </div>
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
        )}
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
