/**
 * Chunk Upload Utility
 * 대용량 파일 업로드를 청크 단위로 처리하는 유틸리티
 */

import { compressImagesWithProgress } from "./image";

/**
 * 업로드 진행 상태
 */
export interface ChunkProgress {
  /** 현재 단계 */
  phase: "compressing" | "uploading" | "complete" | "error";
  /** 현재 처리 수 */
  current: number;
  /** 전체 수 */
  total: number;
  /** 진행률 (0-100) */
  percent: number;
  /** 에러 메시지 (phase가 error일 때) */
  errorMessage?: string;
}

/**
 * 청크 업로드 옵션
 */
export interface ChunkUploadOptions<T> {
  /** 업로드할 파일들 */
  files: File[];
  /** 청크 크기 (한 번에 업로드할 파일 수, 기본값: 5) */
  chunkSize?: number;
  /** 진행률 콜백 */
  onProgress?: (progress: ChunkProgress) => void;
  /** 청크 업로드 함수 (실제 API 호출) */
  uploadFn: (files: File[]) => Promise<T>;
  /** 이미지 압축 여부 (기본값: true) */
  compress?: boolean;
  /** 압축 배치 크기 (기본값: 3) */
  compressBatchSize?: number;
}

/**
 * 청크 업로드 결과
 */
export interface ChunkUploadResult<T> {
  /** 업로드 성공 여부 */
  success: boolean;
  /** 각 청크의 응답 */
  results: T[];
  /** 총 처리된 파일 수 */
  totalProcessed: number;
  /** 에러 메시지 (실패 시) */
  error?: string;
}

/**
 * 파일을 청크 단위로 압축 및 업로드
 *
 * @example
 * ```ts
 * const result = await uploadInChunks({
 *   files: selectedFiles,
 *   chunkSize: 5,
 *   onProgress: (progress) => {
 *     setUploadProgress(progress);
 *   },
 *   uploadFn: async (chunk) => {
 *     return await uploadWorkPhotos(appId, assignmentId, 'before', chunk);
 *   }
 * });
 * ```
 */
export async function uploadInChunks<T>(
  options: ChunkUploadOptions<T>
): Promise<ChunkUploadResult<T>> {
  const {
    files,
    chunkSize = 5,
    onProgress,
    uploadFn,
    compress = true,
    compressBatchSize = 3,
  } = options;

  const results: T[] = [];

  try {
    // 1. 압축 단계
    let processedFiles = files;

    if (compress && files.length > 0) {
      onProgress?.({
        phase: "compressing",
        current: 0,
        total: files.length,
        percent: 0,
      });

      processedFiles = await compressImagesWithProgress(
        files,
        (current, total) => {
          // 압축은 전체 진행률의 50%
          const percent = Math.round((current / total) * 50);
          onProgress?.({
            phase: "compressing",
            current,
            total,
            percent,
          });
        },
        compressBatchSize
      );
    }

    // 2. 업로드 단계
    for (let i = 0; i < processedFiles.length; i += chunkSize) {
      const chunk = processedFiles.slice(i, i + chunkSize);

      // 업로드 진행률 계산 (50% ~ 100%)
      const uploadedCount = Math.min(i + chunkSize, processedFiles.length);
      const uploadPercent =
        50 + Math.round((uploadedCount / processedFiles.length) * 50);

      onProgress?.({
        phase: "uploading",
        current: uploadedCount,
        total: processedFiles.length,
        percent: uploadPercent,
      });

      // 실제 업로드
      const result = await uploadFn(chunk);
      results.push(result);
    }

    // 3. 완료
    onProgress?.({
      phase: "complete",
      current: processedFiles.length,
      total: processedFiles.length,
      percent: 100,
    });

    return {
      success: true,
      results,
      totalProcessed: processedFiles.length,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "업로드 중 오류가 발생했습니다.";

    onProgress?.({
      phase: "error",
      current: 0,
      total: files.length,
      percent: 0,
      errorMessage,
    });

    return {
      success: false,
      results,
      totalProcessed: results.length * chunkSize,
      error: errorMessage,
    };
  }
}

/**
 * 청크 업로드 취소 가능한 버전
 * AbortController를 사용하여 업로드 중단 지원
 */
export function createChunkUploader<T>(options: ChunkUploadOptions<T>) {
  const abortController = new AbortController();

  const upload = async (): Promise<ChunkUploadResult<T>> => {
    // TODO: AbortController 통합 구현
    // 현재는 기본 uploadInChunks 사용
    return uploadInChunks(options);
  };

  const abort = () => {
    abortController.abort();
  };

  return { upload, abort };
}
