"use client";

import { Calendar as CalendarIcon, Clock } from "lucide-react";
import type { MonthlyStats } from "@/lib/api/admin";

interface ScheduleStatsCardsProps {
  stats: MonthlyStats;
}

export function ScheduleStatsCards({ stats }: ScheduleStatsCardsProps) {
  return (
    <div className="grid grid-cols-3 gap-4">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-blue-50 rounded-xl flex items-center justify-center">
            <CalendarIcon className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">예정</p>
            <p className="text-2xl font-bold text-blue-600">{stats.pending}</p>
          </div>
        </div>
      </div>
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-primary-50 rounded-xl flex items-center justify-center">
            <Clock className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-sm text-gray-500">완료</p>
            <p className="text-2xl font-bold text-primary">{stats.completed}</p>
          </div>
        </div>
      </div>
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-gray-100 rounded-xl flex items-center justify-center">
            <CalendarIcon className="w-5 h-5 text-gray-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">총계</p>
            <p className="text-2xl font-bold text-gray-900">{stats.total_scheduled}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
