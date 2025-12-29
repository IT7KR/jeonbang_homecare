"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { STATUS_COLORS, STATUS_LABELS } from "@/hooks/useSchedule";

interface CalendarControlsProps {
  year: number;
  month: number;
  statusFilter: string[];
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onToday: () => void;
  onToggleStatus: (status: string) => void;
  onClearStatus: () => void;
}

export function CalendarControls({
  year,
  month,
  statusFilter,
  onPrevMonth,
  onNextMonth,
  onToday,
  onToggleStatus,
  onClearStatus,
}: CalendarControlsProps) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-2">
          <button
            onClick={onPrevMonth}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <ChevronLeft size={20} className="text-gray-600" />
          </button>
          <h2 className="text-lg font-semibold min-w-[140px] text-center text-gray-900">
            {year}년 {month}월
          </h2>
          <button
            onClick={onNextMonth}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <ChevronRight size={20} className="text-gray-600" />
          </button>
          <button
            onClick={onToday}
            className="ml-2 px-4 py-2 text-sm bg-primary text-white font-medium rounded-xl hover:bg-primary-600 transition-colors shadow-sm"
          >
            오늘
          </button>
        </div>
      </div>

      {/* Status Filter */}
      <div className="flex flex-wrap items-center gap-2 pt-4 border-t border-gray-100">
        <span className="text-sm text-gray-500 mr-1">상태:</span>
        {Object.entries(STATUS_LABELS).map(([status, label]) => {
          const isActive = statusFilter.includes(status);
          const colorClass = STATUS_COLORS[status] || "bg-gray-100 text-gray-700 border-gray-200";
          return (
            <button
              key={status}
              onClick={() => onToggleStatus(status)}
              className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-all ${
                isActive
                  ? colorClass + " ring-2 ring-offset-1 ring-gray-300"
                  : statusFilter.length === 0
                  ? colorClass
                  : "bg-gray-50 text-gray-400 border-gray-200"
              }`}
            >
              {label}
            </button>
          );
        })}
        {statusFilter.length > 0 && (
          <button
            onClick={onClearStatus}
            className="px-3 py-1.5 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
          >
            초기화
          </button>
        )}
      </div>
    </div>
  );
}
