"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/stores/auth";
import {
  getSchedule,
  getMonthlyStats,
  ScheduleItem,
  MonthlyStats,
} from "@/lib/api/admin";

// 상태별 스타일
export const STATUS_COLORS: Record<string, string> = {
  new: "bg-yellow-50 text-yellow-700 border-yellow-200",
  consulting: "bg-orange-50 text-orange-700 border-orange-200",
  assigned: "bg-purple-50 text-purple-700 border-purple-200",
  scheduled: "bg-blue-50 text-blue-700 border-blue-200",
  completed: "bg-primary-50 text-primary-700 border-primary-200",
  cancelled: "bg-gray-50 text-gray-500 border-gray-200",
};

// 상태별 라벨
export const STATUS_LABELS: Record<string, string> = {
  new: "신규",
  consulting: "상담중",
  assigned: "배정완료",
  scheduled: "일정확정",
  completed: "완료",
  cancelled: "취소",
};

// 요일
export const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

// 날짜 정보 타입
export interface CalendarDay {
  date: Date | null;
  day: number | null;
  isCurrentMonth: boolean;
}

// 날짜 문자열 변환
export const getDateString = (date: Date): string => {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
};

// 전화번호 포맷
export const formatPhone = (phone: string): string => {
  const cleaned = phone.replace(/\D/g, "");
  if (cleaned.length === 11) {
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 7)}-${cleaned.slice(7)}`;
  }
  return phone;
};

// 날짜 문자열 포맷 (예: "2024-01-15" -> "01월 15일")
export const formatDateString = (dateStr: string): string => {
  return `${dateStr.slice(5, 7)}월 ${dateStr.slice(8, 10)}일`;
};

// 오늘 여부 확인
export const isToday = (date: Date | null): boolean => {
  if (!date) return false;
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
};

export function useSchedule() {
  const router = useRouter();
  const { getValidToken } = useAuthStore();

  // 상태
  const [currentDate, setCurrentDate] = useState(new Date());
  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
  const [stats, setStats] = useState<MonthlyStats | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string[]>([]);

  // 현재 연/월
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1;

  // 해당 월의 일 배열 생성
  const calendarDays = useMemo<CalendarDay[]>(() => {
    const firstDay = new Date(year, month - 1, 1);
    const lastDay = new Date(year, month, 0);
    const firstDayOfWeek = firstDay.getDay();
    const totalDays = lastDay.getDate();

    const days: CalendarDay[] = [];

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

  // 상태 필터링된 일정
  const filteredSchedules = useMemo(() => {
    if (statusFilter.length === 0) return schedules;
    return schedules.filter((schedule) => statusFilter.includes(schedule.status));
  }, [schedules, statusFilter]);

  // 날짜별 일정 그룹화
  const schedulesByDate = useMemo(() => {
    const grouped: Record<string, ScheduleItem[]> = {};
    filteredSchedules.forEach((schedule) => {
      if (!grouped[schedule.scheduled_date]) {
        grouped[schedule.scheduled_date] = [];
      }
      grouped[schedule.scheduled_date].push(schedule);
    });
    return grouped;
  }, [filteredSchedules]);

  // 선택된 날짜의 일정
  const selectedSchedules = useMemo(() => {
    if (!selectedDate) return [];
    return schedulesByDate[selectedDate] || [];
  }, [selectedDate, schedulesByDate]);

  // 상태 필터 토글 함수
  const toggleStatusFilter = useCallback((status: string) => {
    setStatusFilter((prev) =>
      prev.includes(status) ? prev.filter((s) => s !== status) : [...prev, status]
    );
  }, []);

  // 상태 필터 초기화
  const clearStatusFilter = useCallback(() => {
    setStatusFilter([]);
  }, []);

  // 데이터 로드
  const loadSchedules = useCallback(async () => {
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
  }, [getValidToken, router, year, month]);

  useEffect(() => {
    loadSchedules();
  }, [loadSchedules]);

  // 이전 달 이동
  const handlePrevMonth = useCallback(() => {
    setCurrentDate(new Date(year, month - 2, 1));
    setSelectedDate(null);
  }, [year, month]);

  // 다음 달 이동
  const handleNextMonth = useCallback(() => {
    setCurrentDate(new Date(year, month, 1));
    setSelectedDate(null);
  }, [year, month]);

  // 오늘로 이동
  const handleToday = useCallback(() => {
    setCurrentDate(new Date());
    setSelectedDate(null);
  }, []);

  // 날짜 선택
  const handleSelectDate = useCallback((dateStr: string | null) => {
    setSelectedDate((prev) => (prev === dateStr ? null : dateStr));
  }, []);

  return {
    // 상태
    currentDate,
    year,
    month,
    schedules,
    stats,
    selectedDate,
    isLoading,
    error,
    statusFilter,

    // 계산된 값
    calendarDays,
    filteredSchedules,
    schedulesByDate,
    selectedSchedules,

    // 핸들러
    handlePrevMonth,
    handleNextMonth,
    handleToday,
    handleSelectDate,
    toggleStatusFilter,
    clearStatusFilter,
    loadSchedules,
  };
}
