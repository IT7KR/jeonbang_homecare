"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import {
  FileText,
  Users,
  TrendingUp,
  Clock,
  ArrowRight,
  Loader2,
  Sparkles,
  CheckCircle2,
} from "lucide-react";
import { useAuthStore } from "@/lib/stores/auth";
import { getDashboard, DashboardResponse } from "@/lib/api/admin";

// 신청 상태 라벨 - 테마 색상 사용
const statusLabels: Record<string, { label: string; color: string }> = {
  new: { label: "신규", color: "bg-primary-50 text-primary-700" },
  consulting: { label: "상담중", color: "bg-secondary-50 text-secondary-700" },
  assigned: { label: "배정됨", color: "bg-purple-50 text-purple-700" },
  scheduled: { label: "일정확정", color: "bg-blue-50 text-blue-700" },
  completed: { label: "완료", color: "bg-gray-100 text-gray-600" },
  cancelled: { label: "취소", color: "bg-red-50 text-red-600" },
};

// 파트너 상태 라벨 - 테마 색상 사용
const partnerStatusLabels: Record<string, { label: string; color: string }> = {
  pending: { label: "대기중", color: "bg-secondary-50 text-secondary-700" },
  approved: { label: "승인", color: "bg-primary-50 text-primary-700" },
  rejected: { label: "거절", color: "bg-red-50 text-red-600" },
  inactive: { label: "비활성", color: "bg-gray-100 text-gray-600" },
};

export default function AdminDashboardPage() {
  const { getValidToken } = useAuthStore();
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = await getValidToken();
        if (!token) {
          setError("인증이 필요합니다");
          return;
        }

        const response = await getDashboard(token);
        setData(response);
      } catch (err) {
        setError(err instanceof Error ? err.message : "데이터를 불러올 수 없습니다");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [getValidToken]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
          <p className="text-sm text-gray-500">데이터를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-100 rounded-2xl p-6 text-red-600 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
          <span className="text-red-500 text-lg">!</span>
        </div>
        <div>
          <p className="font-medium">오류가 발생했습니다</p>
          <p className="text-sm text-red-500">{error}</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const { stats, recent_applications, recent_partners } = data;

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-primary to-primary-600 rounded-2xl p-6 text-white">
        <div className="flex items-center gap-3 mb-2">
          <Sparkles className="w-5 h-5" />
          <span className="text-sm font-medium text-white/80">오늘의 현황</span>
        </div>
        <h2 className="text-2xl font-bold mb-1">전방홈케어 관리자 대시보드</h2>
        <p className="text-white/70 text-sm">
          {format(new Date(), "yyyy년 M월 d일 EEEE", { locale: ko })}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 신규 신청 */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">신규 신청</p>
              <p className="text-3xl font-bold text-primary mt-1">{stats.applications_new}</p>
            </div>
            <div className="w-11 h-11 bg-primary-50 rounded-xl flex items-center justify-center">
              <FileText className="w-5 h-5 text-primary" />
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-gray-50">
            <p className="text-xs text-gray-400">
              오늘 <span className="text-gray-600 font-medium">{stats.applications_today}</span>건 ·
              이번 주 <span className="text-gray-600 font-medium">{stats.applications_this_week}</span>건
            </p>
          </div>
        </div>

        {/* 진행 중 */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">진행 중</p>
              <p className="text-3xl font-bold text-secondary mt-1">
                {stats.applications_consulting + stats.applications_assigned + stats.applications_scheduled}
              </p>
            </div>
            <div className="w-11 h-11 bg-secondary-50 rounded-xl flex items-center justify-center">
              <Clock className="w-5 h-5 text-secondary" />
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-gray-50">
            <p className="text-xs text-gray-400">
              상담 <span className="text-gray-600 font-medium">{stats.applications_consulting}</span> ·
              배정 <span className="text-gray-600 font-medium">{stats.applications_assigned}</span> ·
              확정 <span className="text-gray-600 font-medium">{stats.applications_scheduled}</span>
            </p>
          </div>
        </div>

        {/* 완료 */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">완료</p>
              <p className="text-3xl font-bold text-primary-600 mt-1">{stats.applications_completed}</p>
            </div>
            <div className="w-11 h-11 bg-primary-50 rounded-xl flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-primary-600" />
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-gray-50">
            <p className="text-xs text-gray-400">
              전체 <span className="text-gray-600 font-medium">{stats.applications_total}</span>건 중
            </p>
          </div>
        </div>

        {/* 파트너 */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">파트너</p>
              <p className="text-3xl font-bold text-purple-600 mt-1">{stats.partners_approved}</p>
            </div>
            <div className="w-11 h-11 bg-purple-50 rounded-xl flex items-center justify-center">
              <Users className="w-5 h-5 text-purple-600" />
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-gray-50">
            <p className="text-xs text-gray-400">
              대기 <span className="text-secondary font-medium">{stats.partners_pending}</span>건 ·
              이번 달 <span className="text-gray-600 font-medium">{stats.partners_this_month}</span>건
            </p>
          </div>
        </div>
      </div>

      {/* Recent Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 최근 신청 */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">최근 신청</h2>
            <Link
              href="/admin/applications"
              className="text-sm text-primary hover:text-primary-600 flex items-center gap-1 font-medium transition-colors"
            >
              전체 보기 <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
            {recent_applications.length === 0 ? (
              <div className="px-5 py-12 text-center">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <FileText className="w-5 h-5 text-gray-400" />
                </div>
                <p className="text-gray-500 text-sm">신청 내역이 없습니다</p>
              </div>
            ) : (
              recent_applications.map((app) => (
                <Link
                  key={app.id}
                  href={`/admin/applications/${app.id}`}
                  className="px-5 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <div>
                    <p className="font-medium text-gray-900">{app.application_number}</p>
                    <p className="text-sm text-gray-500 mt-0.5">
                      {format(new Date(app.created_at), "M월 d일 HH:mm", { locale: ko })}
                    </p>
                  </div>
                  <span
                    className={`px-2.5 py-1 text-xs font-medium rounded-full ${
                      statusLabels[app.status]?.color || "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {statusLabels[app.status]?.label || app.status}
                  </span>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* 최근 파트너 */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">최근 파트너</h2>
            <Link
              href="/admin/partners"
              className="text-sm text-primary hover:text-primary-600 flex items-center gap-1 font-medium transition-colors"
            >
              전체 보기 <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
            {recent_partners.length === 0 ? (
              <div className="px-5 py-12 text-center">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Users className="w-5 h-5 text-gray-400" />
                </div>
                <p className="text-gray-500 text-sm">파트너 내역이 없습니다</p>
              </div>
            ) : (
              recent_partners.map((partner) => (
                <Link
                  key={partner.id}
                  href={`/admin/partners/${partner.id}`}
                  className="px-5 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <div>
                    <p className="font-medium text-gray-900">{partner.company_name}</p>
                    <p className="text-sm text-gray-500 mt-0.5">
                      {format(new Date(partner.created_at), "M월 d일 HH:mm", { locale: ko })}
                    </p>
                  </div>
                  <span
                    className={`px-2.5 py-1 text-xs font-medium rounded-full ${
                      partnerStatusLabels[partner.status]?.color || "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {partnerStatusLabels[partner.status]?.label || partner.status}
                  </span>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
