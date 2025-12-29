"use client";

import type { ScheduleItem } from "@/lib/api/admin";
import {
  WEEKDAYS,
  STATUS_COLORS,
  CalendarDay,
  getDateString,
  isToday,
} from "@/hooks/useSchedule";

interface CalendarGridProps {
  calendarDays: CalendarDay[];
  schedulesByDate: Record<string, ScheduleItem[]>;
  selectedDate: string | null;
  onSelectDate: (dateStr: string | null) => void;
}

export function CalendarGrid({
  calendarDays,
  schedulesByDate,
  selectedDate,
  onSelectDate,
}: CalendarGridProps) {
  return (
    <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Weekday Headers */}
      <div className="grid grid-cols-7 bg-gray-50/80 border-b border-gray-100">
        {WEEKDAYS.map((day, idx) => (
          <div
            key={day}
            className={`py-3 text-center text-sm font-semibold ${
              idx === 0 ? "text-red-500" : idx === 6 ? "text-blue-500" : "text-gray-600"
            }`}
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Days */}
      <div className="grid grid-cols-7">
        {calendarDays.map((dayInfo, idx) => {
          const dateStr = dayInfo.date ? getDateString(dayInfo.date) : null;
          const daySchedules = dateStr ? schedulesByDate[dateStr] || [] : [];
          const hasSchedules = daySchedules.length > 0;
          const isSelected = dateStr === selectedDate;
          const isTodayDate = isToday(dayInfo.date);
          const dayOfWeek = idx % 7;

          return (
            <div
              key={idx}
              onClick={() => {
                if (dateStr && dayInfo.isCurrentMonth) {
                  onSelectDate(isSelected ? null : dateStr);
                }
              }}
              className={`min-h-[80px] p-2 border-b border-r border-gray-100 cursor-pointer transition-colors ${
                !dayInfo.isCurrentMonth
                  ? "bg-gray-50/50"
                  : isSelected
                  ? "bg-primary-50"
                  : "hover:bg-gray-50"
              }`}
            >
              {dayInfo.day && (
                <>
                  <div
                    className={`text-sm font-medium mb-1 ${
                      isTodayDate
                        ? "w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center"
                        : dayOfWeek === 0
                        ? "text-red-500"
                        : dayOfWeek === 6
                        ? "text-blue-500"
                        : "text-gray-900"
                    }`}
                  >
                    {dayInfo.day}
                  </div>
                  {hasSchedules && (
                    <div className="space-y-1">
                      {daySchedules.slice(0, 2).map((schedule) => (
                        <div
                          key={schedule.id}
                          className={`text-xs px-1.5 py-0.5 rounded-md truncate border ${
                            STATUS_COLORS[schedule.status] || "bg-gray-100 text-gray-700 border-gray-200"
                          }`}
                        >
                          {schedule.scheduled_time?.slice(0, 5) || ""} {schedule.customer_name}
                        </div>
                      ))}
                      {daySchedules.length > 2 && (
                        <div className="text-xs text-primary font-medium px-1.5">
                          +{daySchedules.length - 2}건
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
