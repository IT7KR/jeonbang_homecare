"use client";

import { ReactNode } from "react";

export interface SummaryCardItem {
  /** 아이콘 컴포넌트 */
  icon: ReactNode;
  /** 아이콘 배경색 (bg-blue-100 형식) */
  iconBgColor: string;
  /** 아이콘 색상 (text-blue-600 형식) */
  iconColor: string;
  /** 라벨 */
  label: string;
  /** 표시할 값 (문자열 또는 ReactNode) */
  value: string | ReactNode;
  /** 클릭 시 이동할 링크 (tel:, mailto: 등 포함 가능) */
  href?: string;
}

export interface SummaryCardsProps {
  /** 요약 항목 배열 */
  items: SummaryCardItem[];
  /** 추가 클래스명 */
  className?: string;
}

/**
 * 상세 페이지 헤더 하단에 표시되는 요약 정보 카드
 * - 4개 항목을 2x2 또는 1x4 그리드로 표시
 * - 각 항목에 아이콘 + 라벨 + 값 포함
 * - 값에 링크 적용 가능 (전화번호, 이메일 등)
 */
export function SummaryCards({ items, className = "" }: SummaryCardsProps) {
  return (
    <div className={`bg-white rounded-2xl shadow-sm border border-gray-100 p-6 ${className}`}>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {items.map((item, index) => (
          <div key={index} className="flex items-center gap-3">
            {/* 아이콘 */}
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${item.iconBgColor}`}
            >
              <span className={item.iconColor}>{item.icon}</span>
            </div>

            {/* 라벨 + 값 */}
            <div className="min-w-0">
              <p className="text-xs text-gray-500">{item.label}</p>
              {item.href ? (
                <a
                  href={item.href}
                  className="font-medium text-primary hover:underline truncate block"
                >
                  {item.value}
                </a>
              ) : (
                <p className="font-medium text-gray-900 truncate">{item.value}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default SummaryCards;
