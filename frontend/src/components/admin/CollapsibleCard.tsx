"use client";

import { useState, ReactNode } from "react";
import { ChevronUp, ChevronDown } from "lucide-react";

export interface CollapsibleCardProps {
  /** 섹션 제목 */
  title: string;
  /** 제목 왼쪽 아이콘 */
  icon?: ReactNode;
  /** 제목 오른쪽 배지 (예: "(3개)") */
  badge?: ReactNode;
  /** 기본 열림 상태 */
  defaultOpen?: boolean;
  /** 외부에서 열림 상태 제어 */
  isOpen?: boolean;
  /** 열림 상태 변경 핸들러 */
  onToggle?: (isOpen: boolean) => void;
  /** 카드 내용 */
  children: ReactNode;
  /** 추가 클래스명 */
  className?: string;
  /** 헤더 추가 클래스명 */
  headerClassName?: string;
  /** 콘텐츠 영역 추가 클래스명 */
  contentClassName?: string;
}

/**
 * 접기/펼치기가 가능한 섹션 카드
 * - 클릭하면 내용 토글
 * - 아이콘 + 제목 + 배지 조합 지원
 * - 내부 상태 또는 외부 제어 가능
 */
export function CollapsibleCard({
  title,
  icon,
  badge,
  defaultOpen = true,
  isOpen: controlledIsOpen,
  onToggle,
  children,
  className = "",
  headerClassName = "",
  contentClassName = "",
}: CollapsibleCardProps) {
  // 내부 상태 (외부 제어가 없을 때 사용)
  const [internalOpen, setInternalOpen] = useState(defaultOpen);

  // 외부 제어 여부 확인
  const isControlled = controlledIsOpen !== undefined;
  const isOpen = isControlled ? controlledIsOpen : internalOpen;

  const handleToggle = () => {
    const newState = !isOpen;
    if (isControlled) {
      onToggle?.(newState);
    } else {
      setInternalOpen(newState);
      onToggle?.(newState);
    }
  };

  return (
    <div
      className={`bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden ${className}`}
    >
      {/* 헤더 */}
      <button
        onClick={handleToggle}
        className={`w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors ${headerClassName}`}
      >
        <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
          {icon && <span className="text-primary">{icon}</span>}
          {title}
          {badge && (
            <span className="text-sm font-normal text-gray-500">{badge}</span>
          )}
        </h2>
        {isOpen ? (
          <ChevronUp size={18} className="text-gray-400" />
        ) : (
          <ChevronDown size={18} className="text-gray-400" />
        )}
      </button>

      {/* 콘텐츠 */}
      {isOpen && (
        <div className={`px-4 pb-4 ${contentClassName}`}>{children}</div>
      )}
    </div>
  );
}

export default CollapsibleCard;
