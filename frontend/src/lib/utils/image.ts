/**
 * Image compression utilities
 * 클라이언트 측 이미지 압축 유틸리티
 */

import imageCompression from "browser-image-compression";

// 압축 옵션
const COMPRESSION_OPTIONS = {
  maxSizeMB: 0.5, // 최대 500KB
  maxWidthOrHeight: 1920, // 최대 1920px
  useWebWorker: true, // Web Worker 사용 (성능 향상)
  fileType: "image/jpeg", // JPEG로 변환
  initialQuality: 0.85, // 초기 품질 85%
};

/**
 * 단일 이미지 압축
 * @param file 원본 파일
 * @returns 압축된 파일
 */
export async function compressImage(file: File): Promise<File> {
  // 이미지가 아니면 그대로 반환
  if (!file.type.startsWith("image/")) {
    return file;
  }

  // 이미 작은 파일이면 압축 스킵 (500KB 이하)
  if (file.size <= 500 * 1024) {
    return file;
  }

  try {
    const compressedFile = await imageCompression(file, COMPRESSION_OPTIONS);

    // 파일명 유지 (확장자만 변경)
    const newFileName = file.name.replace(/\.[^.]+$/, ".jpg");
    return new File([compressedFile], newFileName, {
      type: "image/jpeg",
      lastModified: Date.now(),
    });
  } catch (error) {
    console.error("Image compression failed:", error);
    // 압축 실패 시 원본 반환
    return file;
  }
}

/**
 * 여러 이미지 압축
 * @param files 원본 파일 배열
 * @returns 압축된 파일 배열
 */
export async function compressImages(files: File[]): Promise<File[]> {
  const compressedFiles = await Promise.all(
    files.map((file) => compressImage(file))
  );
  return compressedFiles;
}

/**
 * 파일 크기를 사람이 읽기 쉬운 형태로 변환
 * @param bytes 바이트 단위 크기
 * @returns 포맷된 문자열 (예: "1.5 MB")
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}
