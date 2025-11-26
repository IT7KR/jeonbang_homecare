"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { parse, format } from "date-fns";
import {
  ArrowLeft,
  Phone,
  MapPin,
  Calendar as CalendarIcon,
  Clock,
  FileText,
  User,
  Save,
  Loader2,
  Image as ImageIcon,
  MessageSquare,
  Building2,
  CheckCircle,
  AlertCircle,
  Wrench,
} from "lucide-react";
import { useAuthStore } from "@/lib/stores/auth";
import {
  getApplication,
  updateApplication,
  getPartners,
  ApplicationDetail,
  PartnerListItem,
} from "@/lib/api/admin";
import { DatePicker } from "@/components/ui/date-picker";
import { getServiceName } from "@/lib/utils/service";

const STATUS_OPTIONS = [
  { value: "new", label: "신규", color: "bg-blue-50 text-blue-700 border-blue-200" },
  { value: "consulting", label: "상담중", color: "bg-yellow-50 text-yellow-700 border-yellow-200" },
  { value: "assigned", label: "배정완료", color: "bg-purple-50 text-purple-700 border-purple-200" },
  { value: "scheduled", label: "일정확정", color: "bg-primary-50 text-primary-700 border-primary-200" },
  { value: "completed", label: "완료", color: "bg-gray-100 text-gray-700 border-gray-200" },
  { value: "cancelled", label: "취소", color: "bg-red-50 text-red-600 border-red-200" },
];

const TIME_OPTIONS = [
  { value: "", label: "시간 선택" },
  { value: "09:00", label: "오전 9시" },
  { value: "10:00", label: "오전 10시" },
  { value: "11:00", label: "오전 11시" },
  { value: "13:00", label: "오후 1시" },
  { value: "14:00", label: "오후 2시" },
  { value: "15:00", label: "오후 3시" },
  { value: "16:00", label: "오후 4시" },
  { value: "오전", label: "오전 (시간 미정)" },
  { value: "오후", label: "오후 (시간 미정)" },
  { value: "종일", label: "종일" },
];

export default function ApplicationDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = Number(params.id);
  const { getValidToken } = useAuthStore();

  const [application, setApplication] = useState<ApplicationDetail | null>(null);
  const [partners, setPartners] = useState<PartnerListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form state
  const [status, setStatus] = useState("");
  const [assignedPartnerId, setAssignedPartnerId] = useState<number | "">("");
  const [scheduledDate, setScheduledDate] = useState<Date | undefined>(undefined);
  const [scheduledTime, setScheduledTime] = useState("");
  const [estimatedCost, setEstimatedCost] = useState<number | "">("");
  const [finalCost, setFinalCost] = useState<number | "">("");
  const [adminMemo, setAdminMemo] = useState("");
  const [sendSms, setSendSms] = useState(true);

  // 원본 값 저장 (변경 감지용)
  const [originalValues, setOriginalValues] = useState({
    status: "",
    assignedPartnerId: "" as number | "",
    scheduledDate: undefined as Date | undefined,
    scheduledTime: "",
  });

  // 선택한 협력사 정보
  const selectedPartner = useMemo(() => {
    if (!assignedPartnerId) return null;
    return partners.find((p) => p.id === assignedPartnerId);
  }, [assignedPartnerId, partners]);

  // 변경 사항 감지
  const hasPartnerChanged = assignedPartnerId !== originalValues.assignedPartnerId;
  const hasScheduleChanged =
    (scheduledDate?.toISOString() !== originalValues.scheduledDate?.toISOString()) ||
    (scheduledTime !== originalValues.scheduledTime);
  const hasChanges = hasPartnerChanged || hasScheduleChanged ||
    status !== originalValues.status;

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const token = await getValidToken();
      if (!token) {
        router.push("/admin/login");
        return;
      }

      const [appData, partnersData] = await Promise.all([
        getApplication(token, id),
        getPartners(token, { status: "approved", page_size: 100 }),
      ]);

      setApplication(appData);
      setPartners(partnersData.items);

      // Initialize form
      const parsedDate = appData.scheduled_date
        ? parse(appData.scheduled_date, "yyyy-MM-dd", new Date())
        : undefined;

      setStatus(appData.status);
      setAssignedPartnerId(appData.assigned_partner_id || "");
      setScheduledDate(parsedDate);
      setScheduledTime(appData.scheduled_time || "");
      setEstimatedCost(appData.estimated_cost || "");
      setFinalCost(appData.final_cost || "");
      setAdminMemo(appData.admin_memo || "");

      // 원본 값 저장
      setOriginalValues({
        status: appData.status,
        assignedPartnerId: appData.assigned_partner_id || "",
        scheduledDate: parsedDate,
        scheduledTime: appData.scheduled_time || "",
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "데이터를 불러올 수 없습니다");
    } finally {
      setIsLoading(false);
    }
  };

  // 협력사 배정 시 자동 상태 변경
  const handlePartnerChange = (partnerId: number | "") => {
    setAssignedPartnerId(partnerId);
    // 협력사가 선택되고 현재 상태가 new/consulting이면 assigned로 변경
    if (partnerId && (status === "new" || status === "consulting")) {
      setStatus("assigned");
    }
    // 협력사가 해제되고 상태가 assigned면 consulting으로 변경
    if (!partnerId && status === "assigned") {
      setStatus("consulting");
    }
  };

  // 일정 설정 시 자동 상태 변경
  const handleScheduleChange = (date: Date | undefined, time?: string) => {
    if (date !== undefined) {
      setScheduledDate(date);
    }
    if (time !== undefined) {
      setScheduledTime(time);
    }

    // 일정이 설정되고 협력사가 배정되어 있으면 scheduled로 변경
    const newDate = date !== undefined ? date : scheduledDate;
    const newTime = time !== undefined ? time : scheduledTime;

    if (newDate && assignedPartnerId && (status === "assigned" || status === "consulting")) {
      setStatus("scheduled");
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      setError(null);
      setSuccessMessage(null);

      const token = await getValidToken();
      if (!token) {
        router.push("/admin/login");
        return;
      }

      const updateData = {
        status,
        assigned_partner_id: assignedPartnerId || undefined,
        scheduled_date: scheduledDate ? format(scheduledDate, "yyyy-MM-dd") : undefined,
        scheduled_time: scheduledTime || undefined,
        estimated_cost: estimatedCost || undefined,
        final_cost: finalCost || undefined,
        admin_memo: adminMemo || undefined,
        send_sms: sendSms && (hasPartnerChanged || hasScheduleChanged),
      };

      const updated = await updateApplication(token, id, updateData);
      setApplication(updated);

      // 원본 값 업데이트
      setOriginalValues({
        status: updated.status,
        assignedPartnerId: updated.assigned_partner_id || "",
        scheduledDate: updated.scheduled_date
          ? parse(updated.scheduled_date, "yyyy-MM-dd", new Date())
          : undefined,
        scheduledTime: updated.scheduled_time || "",
      });

      const smsNote = sendSms && (hasPartnerChanged || hasScheduleChanged)
        ? " (SMS 알림 발송됨)"
        : "";
      setSuccessMessage(`저장되었습니다${smsNote}`);

      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "저장에 실패했습니다");
    } finally {
      setIsSaving(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatPhone = (phone: string) => {
    const cleaned = phone.replace(/\D/g, "");
    if (cleaned.length === 11) {
      return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 7)}-${cleaned.slice(7)}`;
    }
    return phone;
  };

  const getStatusInfo = (statusValue: string) => {
    return STATUS_OPTIONS.find((s) => s.value === statusValue) || STATUS_OPTIONS[0];
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="animate-spin text-primary" size={32} />
          <p className="text-sm text-gray-500">데이터를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error && !application) {
    return (
      <div className="space-y-4">
        <Link
          href="/admin/applications"
          className="inline-flex items-center text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft size={20} className="mr-2" />
          목록으로
        </Link>
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-red-600 flex items-center gap-3">
          <AlertCircle size={20} />
          {error}
        </div>
      </div>
    );
  }

  if (!application) return null;

  const statusInfo = getStatusInfo(application.status);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/applications"
            className="p-2.5 rounded-xl hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft size={20} className="text-gray-600" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {application.application_number}
            </h1>
            <p className="text-gray-500 text-sm">
              신청일: {formatDate(application.created_at)}
            </p>
          </div>
        </div>
        <span
          className={`inline-flex px-3 py-1.5 text-sm font-semibold rounded-full border ${statusInfo.color}`}
        >
          {statusInfo.label}
        </span>
      </div>

      {/* Messages */}
      {error && (
        <div className="bg-red-50 border border-red-100 rounded-2xl p-4 text-red-600 flex items-center gap-3">
          <AlertCircle size={20} />
          <p className="text-sm">{error}</p>
        </div>
      )}
      {successMessage && (
        <div className="bg-primary-50 border border-primary-100 rounded-2xl p-4 text-primary-700 flex items-center gap-3">
          <CheckCircle size={20} />
          <p className="text-sm">{successMessage}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Customer & Service Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer Info */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <User size={20} className="text-primary" />
              고객 정보
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                <User size={18} className="text-gray-400 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">고객명</p>
                  <p className="font-medium text-gray-900">{application.customer_name}</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                <Phone size={18} className="text-gray-400 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">연락처</p>
                  <a
                    href={`tel:${application.customer_phone}`}
                    className="font-medium text-primary hover:underline"
                  >
                    {formatPhone(application.customer_phone)}
                  </a>
                </div>
              </div>
              <div className="sm:col-span-2 flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                <MapPin size={18} className="text-gray-400 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">주소</p>
                  <p className="font-medium text-gray-900">{application.address}</p>
                  {application.address_detail && (
                    <p className="text-gray-600 text-sm">{application.address_detail}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Service Info */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Wrench size={20} className="text-primary" />
              서비스 정보
            </h2>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500 mb-2">선택한 서비스</p>
                <div className="flex flex-wrap gap-2">
                  {application.selected_services.map((service, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1.5 bg-primary-50 text-primary-700 text-sm font-medium rounded-full"
                    >
                      {getServiceName(service)}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-2">상세 요청 내용</p>
                <p className="text-gray-700 whitespace-pre-wrap bg-gray-50 p-4 rounded-xl text-sm leading-relaxed">
                  {application.description}
                </p>
              </div>
            </div>
          </div>

          {/* Photos */}
          {application.photos && application.photos.length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <ImageIcon size={20} className="text-primary" />
                첨부 사진 ({application.photos.length})
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {application.photos.map((photo, idx) => (
                  <a
                    key={idx}
                    href={photo}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="aspect-square bg-gray-100 rounded-xl overflow-hidden hover:opacity-80 transition-opacity"
                  >
                    <img
                      src={photo}
                      alt={`첨부 사진 ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column - Management */}
        <div className="space-y-6">
          {/* Status Management */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">상태 관리</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  상태
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                >
                  {STATUS_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  담당 협력사
                </label>
                <select
                  value={assignedPartnerId}
                  onChange={(e) =>
                    handlePartnerChange(e.target.value ? Number(e.target.value) : "")
                  }
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                >
                  <option value="">협력사 선택</option>
                  {partners.map((partner) => (
                    <option key={partner.id} value={partner.id}>
                      {partner.company_name}
                    </option>
                  ))}
                </select>
              </div>

              {/* 선택된 협력사 정보 */}
              {selectedPartner && (
                <div className="p-3 bg-purple-50 rounded-xl border border-purple-100">
                  <div className="flex items-center gap-2 mb-2">
                    <Building2 size={16} className="text-purple-600" />
                    <span className="font-medium text-purple-900 text-sm">
                      {selectedPartner.company_name}
                    </span>
                  </div>
                  <div className="space-y-1 text-xs text-purple-700">
                    <p className="flex items-center gap-1.5">
                      <Phone size={12} />
                      {formatPhone(selectedPartner.contact_phone)}
                    </p>
                    <p className="flex items-center gap-1.5">
                      <Wrench size={12} />
                      {selectedPartner.service_areas.slice(0, 3).map(getServiceName).join(", ")}
                      {selectedPartner.service_areas.length > 3 &&
                        ` 외 ${selectedPartner.service_areas.length - 3}개`}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Schedule */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <CalendarIcon size={20} className="text-primary" />
              일정
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  예정일
                </label>
                <DatePicker
                  date={scheduledDate}
                  onDateChange={(date) => handleScheduleChange(date)}
                  placeholder="날짜 선택"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  예정시간
                </label>
                <select
                  value={scheduledTime}
                  onChange={(e) => handleScheduleChange(undefined, e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                >
                  {TIME_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Cost */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">비용</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  견적 금액
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={estimatedCost}
                    onChange={(e) =>
                      setEstimatedCost(e.target.value ? Number(e.target.value) : "")
                    }
                    placeholder="0"
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 pr-12 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                    원
                  </span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  최종 금액
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={finalCost}
                    onChange={(e) =>
                      setFinalCost(e.target.value ? Number(e.target.value) : "")
                    }
                    placeholder="0"
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 pr-12 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                    원
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Admin Memo */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FileText size={20} className="text-primary" />
              관리자 메모
            </h2>
            <textarea
              value={adminMemo}
              onChange={(e) => setAdminMemo(e.target.value)}
              rows={4}
              placeholder="내부 메모를 입력하세요"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors resize-none text-sm"
            />
          </div>

          {/* SMS Option & Save Button */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
            {/* SMS 알림 옵션 */}
            {(hasPartnerChanged || hasScheduleChanged) && (
              <label className="flex items-start gap-3 p-3 bg-secondary-50 rounded-xl cursor-pointer hover:bg-secondary-100 transition-colors">
                <input
                  type="checkbox"
                  checked={sendSms}
                  onChange={(e) => setSendSms(e.target.checked)}
                  className="w-5 h-5 text-primary border-gray-300 rounded focus:ring-primary mt-0.5"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <MessageSquare size={16} className="text-secondary" />
                    <span className="font-medium text-secondary-800 text-sm">
                      SMS 알림 발송
                    </span>
                  </div>
                  <p className="text-xs text-secondary-600 mt-1">
                    {hasPartnerChanged && hasScheduleChanged
                      ? "고객과 협력사에게 배정 및 일정 알림을 발송합니다"
                      : hasPartnerChanged
                      ? "고객에게 협력사 배정 알림을 발송합니다"
                      : "고객과 협력사에게 일정 확정 알림을 발송합니다"}
                  </p>
                </div>
              </label>
            )}

            {/* Save Button */}
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="w-full py-3 bg-primary text-white font-medium rounded-xl hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-colors shadow-sm"
            >
              {isSaving ? (
                <>
                  <Loader2 className="animate-spin mr-2" size={20} />
                  저장 중...
                </>
              ) : (
                <>
                  <Save size={20} className="mr-2" />
                  저장하기
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
