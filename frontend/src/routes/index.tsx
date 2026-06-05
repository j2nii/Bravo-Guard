import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Loader2, Sparkles, ShieldCheck } from "lucide-react";
import { Stepper } from "@/components/compliance/Stepper";
import { PdfDropzone } from "@/components/compliance/PdfDropzone";
import { ReviewStep } from "@/components/compliance/ReviewStep";
import { ReportStep } from "@/components/compliance/ReportStep";
import { ApprovalManagement } from "@/components/compliance/ApprovalManagement";
import { cn } from "@/lib/utils";
import { analyzeDocuments } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "금융 준법 심의 시스템" },
      {
        name: "description",
        content: "금융 광고 한국어 원문과 외국어 번역본을 AI로 대조 분석하는 준법 심의 시스템",
      },
      { property: "og:title", content: "금융 준법 심의 시스템" },
      {
        property: "og:description",
        content: "AI 기반 다국어 금융 광고 준법 심의 및 승인 관리 플랫폼",
      },
    ],
  }),
  component: Index,
});

type TabKey = "review" | "approval";

const STEPS = [
  { id: 1, label: "PDF 업로드" },
  { id: 2, label: "분석 결과 검토" },
  { id: 3, label: "리포트 다운로드" },
];

const LANGUAGE_LABEL: Record<string, string> = {
  vi: "베트남어",
  "zh-CN": "중국어 간체",
  "zh-TW": "중국어 번체",
};

const PRODUCT_TYPE_LABEL: Record<string, string> = {
  loan: "대출",
  deposit: "예금·적금",
  insurance: "보험",
  card: "카드",
  fund: "펀드·투자",
};

function Index() {
  const [tab, setTab] = useState<TabKey>("review");
  const [step, setStep] = useState<number>(1);
  const [productName, setProductName] = useState("");
  const [language, setLanguage] = useState<string>("");
  const [productType, setProductType] = useState<string>("");
  const [koreanFile, setKoreanFile] = useState<File | null>(null);
  const [foreignFile, setForeignFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [analyzeResult, setAnalyzeResult] = useState<Record<string, unknown> | null>(null);
  const [reviewId, setReviewId] = useState<string | null>(null);

  const canStart =
    !!koreanFile && !!foreignFile && !!productName && !!language && !!productType;

  async function handleAnalyze() {
    if (!koreanFile || !foreignFile) return;
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const result = await analyzeDocuments({
        contentName: productName,
        language: LANGUAGE_LABEL[language] ?? language,
        productType: PRODUCT_TYPE_LABEL[productType] ?? productType,
        originalPdf: koreanFile,
        translatedPdf: foreignFile,
      });
      setAnalyzeResult(result);
      setReviewId(result.id);
      setStep(2);
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : "분석 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#fafafa]">
      {/* Header */}
      <header className="border-b border-border bg-background">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-base font-semibold text-foreground">금융 준법 심의 시스템</span>
              <span className="text-xs text-muted-foreground">Compliance Review Platform</span>
            </div>
          </div>
        </div>
        <nav className="mx-auto flex max-w-7xl gap-1 px-6">
          {[
            { key: "review" as const, label: "준법 심의" },
            { key: "approval" as const, label: "승인 관리" },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={cn(
                "relative px-4 py-3 text-sm font-medium transition-colors",
                tab === t.key
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {t.label}
              {tab === t.key && (
                <span className="absolute inset-x-0 -bottom-px h-0.5 bg-primary" />
              )}
            </button>
          ))}
        </nav>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8">
        {tab === "review" ? (
          <div className="flex flex-col gap-8">
            {/* Stepper */}
            <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
              <Stepper steps={STEPS} current={step} />
            </div>

            {step === 1 && (
              <div className="rounded-xl border border-border bg-card p-8 shadow-sm">
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-foreground">광고 정보 입력</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  심의할 금융 광고의 기본 정보와 PDF 파일을 업로드해 주세요.
                </p>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <div className="flex flex-col gap-2 md:col-span-2">
                  <Label htmlFor="productName">금융 상품명 / 광고 제목</Label>
                  <Input
                    id="productName"
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                    placeholder="예: 신한 우대 적금 상품 광고"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <Label>외국어 종류</Label>
                  <Select value={language} onValueChange={setLanguage}>
                    <SelectTrigger>
                      <SelectValue placeholder="외국어를 선택하세요" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="vi">베트남어</SelectItem>
                      <SelectItem value="zh-CN">중국어 간체</SelectItem>
                      <SelectItem value="zh-TW">중국어 번체</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex flex-col gap-2">
                  <Label>금융 상품 유형</Label>
                  <Select value={productType} onValueChange={setProductType}>
                    <SelectTrigger>
                      <SelectValue placeholder="상품 유형을 선택하세요" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="loan">대출</SelectItem>
                      <SelectItem value="deposit">예금·적금</SelectItem>
                      <SelectItem value="insurance">보험</SelectItem>
                      <SelectItem value="card">카드</SelectItem>
                      <SelectItem value="fund">펀드·투자</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="my-8 h-px bg-border" />

              <div className="grid gap-6 md:grid-cols-2">
                <PdfDropzone
                  label="한국어 원문 PDF"
                  file={koreanFile}
                  onFile={setKoreanFile}
                />
                <PdfDropzone
                  label="외국어 번역본 PDF"
                  file={foreignFile}
                  onFile={setForeignFile}
                />
              </div>

              <div className="mt-6 flex items-center justify-between gap-4 rounded-lg bg-muted/50 px-4 py-3">
                <p className="text-sm text-muted-foreground">
                  두 PDF 모두 업로드하면 AI가 문구별로 대응 분석을 진행합니다.
                </p>
              </div>

              {errorMsg && (
                <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
                  {errorMsg}
                </p>
              )}

              <div className="mt-8 flex justify-end">
                <Button
                  size="lg"
                  disabled={!canStart || isLoading}
                  onClick={handleAnalyze}
                  className="gap-2"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      AI 분석 중...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      AI 분석 시작
                    </>
                  )}
                </Button>
              </div>
              </div>
            )}

            {step === 2 && (
              <ReviewStep
                meta={{
                  productName,
                  language: LANGUAGE_LABEL[language] ?? language,
                  productType: PRODUCT_TYPE_LABEL[productType] ?? productType,
                  koreanFileName: koreanFile?.name ?? "한국어 원문.pdf",
                  foreignFileName: foreignFile?.name ?? "번역본.pdf",
                }}
                result={analyzeResult}
                reviewId={reviewId}
                onNext={() => setStep(3)}
              />
            )}

            {step === 3 && (
              <ReportStep
                meta={{
                  productName,
                  language: LANGUAGE_LABEL[language] ?? language,
                  productType: PRODUCT_TYPE_LABEL[productType] ?? productType,
                }}
                reviewId={reviewId}
                onRestart={() => {
                  setStep(1);
                  setProductName("");
                  setLanguage("");
                  setProductType("");
                  setKoreanFile(null);
                  setForeignFile(null);
                  setAnalyzeResult(null);
                  setReviewId(null);
                }}
              />
            )}
          </div>
        ) : (
          <ApprovalManagement />
        )}
      </main>
    </div>
  );
}
