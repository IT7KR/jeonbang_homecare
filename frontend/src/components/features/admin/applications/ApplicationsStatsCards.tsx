"use client";

import type { StatusCard } from "@/hooks/useApplications";

interface ApplicationsStatsCardsProps {
  cards: StatusCard[];
  activeStatus: string;
  onCardClick: (status: string) => void;
}

export function ApplicationsStatsCards({
  cards,
  activeStatus,
  onCardClick,
}: ApplicationsStatsCardsProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
      {cards.map((card) => (
        <button
          key={card.status}
          onClick={() => onCardClick(card.status)}
          className={`
            relative px-3 py-2 rounded-xl border-2 transition-all text-left
            ${
              activeStatus === card.status
                ? `border-${card.status === "scheduled" ? "primary" : card.color.replace("bg-", "")} ${card.bgColor}`
                : "border-gray-100 bg-white hover:border-gray-200"
            }
          `}
        >
          {/* 색상 표시 바 */}
          <div
            className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-xl ${card.color}`}
          />
          <div className="pl-2 flex items-center gap-2">
            <div className={`text-xl font-bold ${card.textColor}`}>
              {card.count}
            </div>
            <div className="text-sm text-gray-600">{card.label}</div>
            {card.needsAction && (
              <span className="px-1.5 py-0.5 text-[10px] font-medium bg-amber-100 text-amber-700 rounded-full">
                처리필요
              </span>
            )}
          </div>
        </button>
      ))}
    </div>
  );
}
