import { useRef, useState, type DragEvent } from "react";
import { CheckCircle2, FileText, UploadCloud } from "lucide-react";
import { cn } from "@/lib/utils";

interface PdfDropzoneProps {
  label: string;
  file: File | null;
  onFile: (file: File | null) => void;
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function PdfDropzone({ label, file, onFile }: PdfDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const dropped = e.dataTransfer.files?.[0];
    if (dropped && dropped.type === "application/pdf") onFile(dropped);
  };

  const openPicker = () => inputRef.current?.click();

  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-medium text-foreground">{label}</span>
      <div
        onClick={file ? undefined : openPicker}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={cn(
          "relative flex min-h-[200px] flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 text-center transition-colors",
          file
            ? "border-emerald-300 bg-emerald-50/50"
            : "cursor-pointer border-border bg-muted/30 hover:border-primary hover:bg-muted/50",
          isDragging && "border-primary bg-primary/5",
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf"
          className="hidden"
          onChange={(e) => onFile(e.target.files?.[0] ?? null)}
        />
        {file ? (
          <div className="flex w-full flex-col items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
              <CheckCircle2 className="h-7 w-7 text-emerald-600" />
            </div>
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span className="max-w-[220px] truncate">{file.name}</span>
            </div>
            <div className="text-xs text-muted-foreground">{formatSize(file.size)}</div>
            <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
              업로드 완료
            </span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                openPicker();
              }}
              className="text-xs font-medium text-primary underline-offset-2 hover:underline"
            >
              파일 교체
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 text-muted-foreground">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-background shadow-sm">
              <UploadCloud className="h-6 w-6 text-primary" />
            </div>
            <div className="text-sm">
              <span className="font-medium text-foreground">클릭하여 업로드</span>
              <span> 또는 파일을 끌어다 놓으세요</span>
            </div>
            <span className="text-xs">PDF 파일만 지원</span>
          </div>
        )}
      </div>
    </div>
  );
}
