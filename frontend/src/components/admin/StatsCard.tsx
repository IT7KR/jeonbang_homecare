"use client";

import { ReactNode } from "react";

export interface StatsCardItem {
  /** 상태 값 (필터링에 사용) */
  status: string;
  /** 표시 라벨 */
  label: string;
  /** 카운트 숫자 */
  count: number;
  /** 처리 필요 여부 (배지 표시) */
  needsAction?: boolean;
  /** 좌측 라인 색상 (bg-blue-500 형식) */
  color: string;
  /** 활성화 시 배경색 (bg-blue-50 형식) */
  bgColor: string;
  /** 숫자 텍스트 색상 (text-blue-700 형식) */
  textColor: string;
}

export interface StatsCardsProps {
  /** 통계 카드 항목 배열 */
  cards: StatsCardItem[];
  /** 현재 활성화된 상태 필터 */
  activeStatus?: string;
  /** 카드 클릭 핸들러 */
  onCardClick?: (status: string) => void;
  /** 추가 클래스명 */
  className?: string;
}

/**
 * 목록 페이지 상단에 표시되는 상태별 통계 카드
 * - 클릭하면 해당 상태로 필터링
 * - 같은 카드를 다시 클릭하면 필터 해제
 */
export function StatsCards({
  cards,
  activeStatus,
  onCardClick,
  className = "",
}: StatsCardsProps) {
  return (
    <div className={`grid grid-cols-2 md:grid-cols-4 gap-2 ${className}`}>
      {cards.map((card) => {
        const isActive = activeStatus === card.status;

        return (
          <button
            key={card.status}
            onClick={() => onCardClick?.(card.status)}
            className={`
              relative px-3 py-2 rounded-xl border-2 transition-all text-left
              ${
                isActive
                  ? `${card.bgColor} border-current`
                  : "border-gray-100 bg-white hover:border-gray-200"
              }
            `}
            style={
              isActive
                ? {
                    borderColor: card.color.replace("bg-", "").includes("primary")
                      ? "var(--primary)"
                      : undefined,
                  }
                : undefined
            }
          >
            {/* 좌측 색상 표시 바 */}
            <div
              className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-xl ${card.color}`}
            />

            <div className="pl-2 flex items-center gap-2">
              {/* 카운트 숫자 */}
              <div className={`text-xl font-bold ${card.textColor}`}>
                {card.count}
              </div>

              {/* 라벨 */}
              <div className="text-sm text-gray-600">{card.label}</div>

              {/* 처리필요 배지 */}
              {card.needsAction && (
                <span className="px-1.5 py-0.5 text-[10px] font-medium bg-amber-100 text-amber-700 rounded-full">
                  처리필요
                </span>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}

export default StatsCards;
