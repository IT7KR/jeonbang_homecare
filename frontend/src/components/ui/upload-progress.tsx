"use client";

import { ChunkProgress } from "@/lib/utils/chunk-upload";
import { cn } from "@/lib/utils";

interface UploadProgressProps {
  /** 진행 상태 */
  progress: ChunkProgress;
  /** 추가 클래스 */
  className?: string;
}

const PHASE_LABELS: Record<ChunkProgress["phase"], string> = {
  compressing: "압축 중",
  uploading: "업로드 중",
  complete: "완료",
  error: "오류",
};

const PHASE_COLORS: Record<ChunkProgress["phase"], string> = {
  compressing: "bg-blue-500",
  uploading: "bg-green-500",
  complete: "bg-primary",
  error: "bg-destructive",
};

/**
 * 업로드 진행률 표시 컴포넌트
 *
 * @example
 * ```tsx
 * {uploadProgress && (
 *   <UploadProgress progress={uploadProgress} />
 * )}
 * ```
 */
export function UploadProgress({ progress, className }: UploadProgressProps) {
  const { phase, current, total, percent, errorMessage } = progress;

  return (
    <div className={cn("space-y-2", className)}>
      {/* 상태 텍스트 */}
      <div className="flex justify-between text-sm">
        <span className="font-medium text-foreground">
          {PHASE_LABELS[phase]}
          {phase !== "complete" && phase !== "error" && "..."}
        </span>
        <span className="text-muted-foreground">
          {current}/{total}
        </span>
      </div>

      {/* 진행률 바 */}
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div
          className={cn(
            "h-full transition-all duration-300 ease-out",
            PHASE_COLORS[phase]
          )}
          style={{ width: `${percent}%` }}
        />
      </div>

      {/* 에러 메시지 */}
      {phase === "error" && errorMessage && (
        <p className="text-sm text-destructive">{errorMessage}</p>
      )}
    </div>
  );
}

/**
 * 압축된 업로드 진행률 (인라인 버전)
 */
export function UploadProgressInline({
  progress,
  className,
}: UploadProgressProps) {
  const { phase, current, total, percent } = progress;

  return (
    <div
      className={cn(
        "flex items-center gap-2 text-sm text-muted-foreground",
        className
      )}
    >
      {phase !== "complete" && phase !== "error" && (
        <div className="animate-spin h-3 w-3 border-2 border-primary border-t-transparent rounded-full" />
      )}
      <span>
        {PHASE_LABELS[phase]} ({current}/{total})
      </span>
      <span className="text-xs">{percent}%</span>
    </div>
  );
}
