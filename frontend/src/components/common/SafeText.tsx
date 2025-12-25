"use client";

/**
 * SafeText - XSS 방지용 안전한 텍스트 렌더링 컴포넌트
 *
 * 사용자 입력 데이터를 화면에 표시할 때 사용합니다.
 * DOMPurify를 사용하여 모든 HTML 태그를 제거하고 순수 텍스트만 렌더링합니다.
 */

import { useMemo } from "react";
import DOMPurify from "dompurify";

interface SafeTextProps {
  /** 렌더링할 텍스트 */
  text: string | null | undefined;
  /** CSS 클래스명 */
  className?: string;
  /** 줄바꿈 유지 여부 (기본: true) */
  preserveNewlines?: boolean;
  /** HTML 태그로 렌더링 (span, p, div 등) */
  as?: "span" | "p" | "div";
}

/**
 * HTML 특수문자를 이스케이프합니다.
 * DOMPurify의 ALLOWED_TAGS: [] 설정으로 모든 태그를 제거한 후
 * 추가적인 안전성을 위해 HTML 엔티티로 변환합니다.
 */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * 안전한 텍스트 렌더링 컴포넌트
 *
 * @example
 * ```tsx
 * // 기본 사용법
 * <SafeText text={userInput} />
 *
 * // 클래스 지정
 * <SafeText text={userInput} className="text-gray-700" />
 *
 * // div로 렌더링
 * <SafeText text={description} as="div" preserveNewlines />
 * ```
 */
export function SafeText({
  text,
  className,
  preserveNewlines = true,
  as: Component = "span",
}: SafeTextProps) {
  const sanitizedText = useMemo(() => {
    if (!text) return "";

    // DOMPurify로 모든 HTML 태그 제거
    const cleaned = DOMPurify.sanitize(text, {
      ALLOWED_TAGS: [], // 모든 HTML 태그 제거
      ALLOWED_ATTR: [], // 모든 속성 제거
    });

    // 추가 이스케이프 (이중 보안)
    return escapeHtml(cleaned);
  }, [text]);

  if (!text) return null;

  // 줄바꿈 유지가 필요한 경우 whitespace-pre-wrap 클래스 추가
  const finalClassName = preserveNewlines
    ? `whitespace-pre-wrap ${className || ""}`
    : className;

  return <Component className={finalClassName}>{sanitizedText}</Component>;
}

/**
 * SafeText의 간소화 버전 - 인라인 텍스트용
 * 줄바꿈을 유지하지 않습니다.
 */
export function SafeInlineText({
  text,
  className,
}: {
  text: string | null | undefined;
  className?: string;
}) {
  return (
    <SafeText text={text} className={className} preserveNewlines={false} />
  );
}

/**
 * SafeText의 블록 버전 - 여러 줄 텍스트용
 * div로 렌더링하고 줄바꿈을 유지합니다.
 */
export function SafeBlockText({
  text,
  className,
}: {
  text: string | null | undefined;
  className?: string;
}) {
  return (
    <SafeText text={text} className={className} as="div" preserveNewlines />
  );
}

export default SafeText;
