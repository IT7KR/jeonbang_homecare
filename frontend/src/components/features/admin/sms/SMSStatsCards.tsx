"use client";

import { CheckCircle, XCircle, MessageSquare } from "lucide-react";
import type { SMSStats } from "@/lib/api/admin";

interface SMSStatsCardsProps {
  stats: SMSStats;
}

export function SMSStatsCards({ stats }: SMSStatsCardsProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 hover:shadow-md transition-shadow">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-primary-50 rounded-xl">
            <CheckCircle className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-sm text-gray-500">오늘 발송</p>
            <p className="text-xl font-bold text-gray-900">{stats.today_sent}</p>
          </div>
        </div>
      </div>
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 hover:shadow-md transition-shadow">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-red-50 rounded-xl">
            <XCircle className="w-5 h-5 text-red-500" />
          </div>
          <div>
            <p className="text-sm text-gray-500">오늘 실패</p>
            <p className="text-xl font-bold text-gray-900">{stats.today_failed}</p>
          </div>
        </div>
      </div>
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 hover:shadow-md transition-shadow">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-secondary-50 rounded-xl">
            <MessageSquare className="w-5 h-5 text-secondary" />
          </div>
          <div>
            <p className="text-sm text-gray-500">이번달 발송</p>
            <p className="text-xl font-bold text-gray-900">{stats.this_month_sent}</p>
          </div>
        </div>
      </div>
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 hover:shadow-md transition-shadow">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gray-100 rounded-xl">
            <MessageSquare className="w-5 h-5 text-gray-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">전체 발송</p>
            <p className="text-xl font-bold text-gray-900">{stats.total_sent}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
