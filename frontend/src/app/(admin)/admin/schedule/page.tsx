"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  User,
  Eye,
} from "lucide-react";
import { useAuthStore } from "@/lib/stores/auth";
import {
  getSchedule,
  getMonthlyStats,
  ScheduleItem,
  MonthlyStats,
} from "@/lib/api/admin";
import { getServiceName } from "@/lib/utils/service";

const STATUS_COLORS: Record<string, string> = {
  scheduled: "bg-blue-50 text-blue-700 border-blue-200",
  assigned: "bg-purple-50 text-purple-700 border-purple-200",
  completed: "bg-primary-50 text-primary-700 border-primary-200",
};

const STATUS_LABELS: Record<string, string> = {
  scheduled: "일정확정",
  assigned: "배정완료",
  completed: "완료",
};

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

export default function SchedulePage() {
  const router = useRouter();
  const { getValidToken } = useAuthStore();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
  const [stats, setStats] = useState<MonthlyStats | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1;

  // 해당 월의 일 배열 생성
  const calendarDays = useMemo(() => {
    const firstDay = new Date(year, month - 1, 1);
    const lastDay = new Date(year, month, 0);
    const firstDayOfWeek = firstDay.getDay();
    const totalDays = lastDay.getDate();

    const days: Array<{ date: Date | null; day: number | null; isCurrentMonth: boolean }> = [];

    // 이전 달의 날짜들 (빈 칸)
    for (let i = 0; i < firstDayOfWeek; i++) {
      days.push({ date: null, day: null, isCurrentMonth: false });
    }

    // 현재 달의 날짜들
    for (let day = 1; day <= totalDays; day++) {
      days.push({
        date: new Date(year, month - 1, day),
        day,
        isCurrentMonth: true,
      });
    }

    // 다음 달의 날짜들 (빈 칸으로 6주 맞추기)
    const remainingDays = 42 - days.length;
    for (let i = 0; i < remainingDays; i++) {
      days.push({ date: null, day: null, isCurrentMonth: false });
    }

    return days;
  }, [year, month]);

  // 날짜별 일정 그룹화
  const schedulesByDate = useMemo(() => {
    const grouped: Record<string, ScheduleItem[]> = {};
    schedules.forEach((schedule) => {
      if (!grouped[schedule.scheduled_date]) {
        grouped[schedule.scheduled_date] = [];
      }
      grouped[schedule.scheduled_date].push(schedule);
    });
    return grouped;
  }, [schedules]);

  // 선택된 날짜의 일정
  const selectedSchedules = useMemo(() => {
    if (!selectedDate) return [];
    return schedulesByDate[selectedDate] || [];
  }, [selectedDate, schedulesByDate]);

  const loadSchedules = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const token = await getValidToken();
      if (!token) {
        router.push("/admin/login");
        return;
      }

      // 해당 월의 시작일과 종료일
      const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
      const lastDay = new Date(year, month, 0).getDate();
      const endDate = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;

      const [scheduleData, statsData] = await Promise.all([
        getSchedule(token, {
          start_date: startDate,
          end_date: endDate,
        }),
        getMonthlyStats(token, year, month),
      ]);

      setSchedules(scheduleData.items);
      setStats(statsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "데이터를 불러올 수 없습니다");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSchedules();
  }, [year, month]);

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 2, 1));
    setSelectedDate(null);
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month, 1));
    setSelectedDate(null);
  };

  const handleToday = () => {
    setCurrentDate(new Date());
    setSelectedDate(null);
  };

  const formatPhone = (phone: string) => {
    const cleaned = phone.replace(/\D/g, "");
    if (cleaned.length === 11) {
      return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 7)}-${cleaned.slice(7)}`;
    }
    return phone;
  };

  const formatDateString = (dateStr: string) => {
    return `${dateStr.slice(5, 7)}월 ${dateStr.slice(8, 10)}일`;
  };

  const isToday = (date: Date | null) => {
    if (!date) return false;
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const getDateString = (date: Date) => {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">일정 관리</h1>
          <p className="text-gray-500 mt-1">
            {stats && (
              <>
                이번 달 예정 <span className="font-semibold text-primary">{stats.total_scheduled}</span>건,
                완료 <span className="font-semibold text-primary">{stats.completed}</span>건
              </>
            )}
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
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
      )}

      {/* Calendar Controls */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrevMonth}
              className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
            >
              <ChevronLeft size={20} className="text-gray-600" />
            </button>
            <h2 className="text-lg font-semibold min-w-[140px] text-center text-gray-900">
              {year}년 {month}월
            </h2>
            <button
              onClick={handleNextMonth}
              className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
            >
              <ChevronRight size={20} className="text-gray-600" />
            </button>
            <button
              onClick={handleToday}
              className="ml-2 px-4 py-2 text-sm bg-primary text-white font-medium rounded-xl hover:bg-primary-600 transition-colors shadow-sm"
            >
              오늘
            </button>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-100 rounded-2xl p-4 text-red-600 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
            <span className="text-red-500">!</span>
          </div>
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Loading */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="animate-spin text-primary" size={32} />
            <p className="text-sm text-gray-500">데이터를 불러오는 중...</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendar */}
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
                        setSelectedDate(isSelected ? null : dateStr);
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

          {/* Schedule Detail Panel */}
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
                          className="text-primary hover:text-primary-700 p-1 hover:bg-primary-50 rounded-lg transition-colors"
                        >
                          <Eye size={16} />
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
        </div>
      )}
    </div>
  );
}
