"use client";

import { Loader2 } from "lucide-react";
import { useSchedule } from "@/hooks/useSchedule";
import {
  ScheduleStatsCards,
  CalendarControls,
  CalendarGrid,
  ScheduleDetailPanel,
} from "@/components/features/admin/schedule";

export default function SchedulePage() {
  const hook = useSchedule();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">일정 관리</h1>
          <p className="text-gray-500 mt-1">
            {hook.stats && (
              <>
                이번 달 예정{" "}
                <span className="font-semibold text-primary">{hook.stats.total_scheduled}</span>건,
                완료 <span className="font-semibold text-primary">{hook.stats.completed}</span>건
              </>
            )}
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      {hook.stats && <ScheduleStatsCards stats={hook.stats} />}

      {/* Calendar Controls */}
      <CalendarControls
        year={hook.year}
        month={hook.month}
        statusFilter={hook.statusFilter}
        onPrevMonth={hook.handlePrevMonth}
        onNextMonth={hook.handleNextMonth}
        onToday={hook.handleToday}
        onToggleStatus={hook.toggleStatusFilter}
        onClearStatus={hook.clearStatusFilter}
      />

      {/* Error */}
      {hook.error && (
        <div className="bg-red-50 border border-red-100 rounded-2xl p-4 text-red-600 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
            <span className="text-red-500">!</span>
          </div>
          <p className="text-sm">{hook.error}</p>
        </div>
      )}

      {/* Loading */}
      {hook.isLoading ? (
        <div className="flex items-center justify-center py-16">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="animate-spin text-primary" size={32} />
            <p className="text-sm text-gray-500">데이터를 불러오는 중...</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendar Grid */}
          <CalendarGrid
            calendarDays={hook.calendarDays}
            schedulesByDate={hook.schedulesByDate}
            selectedDate={hook.selectedDate}
            onSelectDate={hook.handleSelectDate}
          />

          {/* Schedule Detail Panel */}
          <ScheduleDetailPanel
            selectedDate={hook.selectedDate}
            selectedSchedules={hook.selectedSchedules}
          />
        </div>
      )}
    </div>
  );
}
