"use client";

import Link from "next/link";
import {
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  User,
  ExternalLink,
} from "lucide-react";
import type { ScheduleItem } from "@/lib/api/admin";
import { getServiceName } from "@/lib/utils/service";
import {
  STATUS_COLORS,
  STATUS_LABELS,
  formatPhone,
  formatDateString,
} from "@/hooks/useSchedule";

interface ScheduleDetailPanelProps {
  selectedDate: string | null;
  selectedSchedules: ScheduleItem[];
}

export function ScheduleDetailPanel({
  selectedDate,
  selectedSchedules,
}: ScheduleDetailPanelProps) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50">
        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
          {selectedDate ? (
            <>
              <CalendarIcon size={18} className="text-primary" />
              {formatDateString(selectedDate)} 일정
            </>
          ) : (
            "날짜를 선택하세요"
          )}
        </h3>
      </div>
      <div className="p-5">
        {!selectedDate ? (
          <div className="text-center py-12">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <CalendarIcon className="w-5 h-5 text-gray-400" />
            </div>
            <p className="text-gray-500 text-sm">
              캘린더에서 날짜를 클릭하면
              <br />
              해당 일정이 표시됩니다.
            </p>
          </div>
        ) : selectedSchedules.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <CalendarIcon className="w-5 h-5 text-gray-400" />
            </div>
            <p className="text-gray-500 text-sm">해당 날짜에 일정이 없습니다.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {selectedSchedules.map((schedule) => (
              <div
                key={schedule.id}
                className="border border-gray-100 rounded-xl p-4 hover:border-primary/30 hover:shadow-sm transition-all"
              >
                <div className="flex items-start justify-between mb-3">
                  <span
                    className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                      STATUS_COLORS[schedule.status] || "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {STATUS_LABELS[schedule.status] || schedule.status}
                  </span>
                  <Link
                    href={`/admin/applications/${schedule.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:text-primary-700 p-1 hover:bg-primary-50 rounded-lg transition-colors"
                  >
                    <ExternalLink size={16} />
                  </Link>
                </div>
                <p className="font-semibold text-gray-900 mb-2">
                  {schedule.application_number}
                </p>
                <div className="space-y-1.5 text-sm text-gray-600">
                  <p className="flex items-center gap-2">
                    <User size={14} className="text-gray-400" />
                    {schedule.customer_name} ({formatPhone(schedule.customer_phone)})
                  </p>
                  {schedule.scheduled_time && (
                    <p className="flex items-center gap-2">
                      <Clock size={14} className="text-gray-400" />
                      {schedule.scheduled_time.slice(0, 5)}
                    </p>
                  )}
                  <p className="flex items-center gap-2">
                    <MapPin size={14} className="text-gray-400" />
                    <span className="truncate">{schedule.address}</span>
                  </p>
                  {schedule.assigned_partner_name && (
                    <p className="text-purple-600 font-medium">
                      담당: {schedule.assigned_partner_name}
                    </p>
                  )}
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {schedule.selected_services.slice(0, 3).map((service, idx) => (
                    <span
                      key={idx}
                      className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded-lg font-medium"
                    >
                      {getServiceName(service)}
                    </span>
                  ))}
                  {schedule.selected_services.length > 3 && (
                    <span className="text-xs px-2 py-1 bg-primary-50 text-primary-700 rounded-lg font-medium">
                      +{schedule.selected_services.length - 3}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
