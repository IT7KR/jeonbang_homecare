"use client";

import { useState, useEffect } from "react";
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

const STATUS_OPTIONS = [
  { value: "new", label: "신규" },
  { value: "consulting", label: "상담중" },
  { value: "assigned", label: "배정완료" },
  { value: "scheduled", label: "일정확정" },
  { value: "completed", label: "완료" },
  { value: "cancelled", label: "취소" },
];

const STATUS_COLORS: Record<string, string> = {
  new: "bg-blue-100 text-blue-800",
  consulting: "bg-yellow-100 text-yellow-800",
  assigned: "bg-purple-100 text-purple-800",
  scheduled: "bg-green-100 text-green-800",
  completed: "bg-gray-100 text-gray-800",
  cancelled: "bg-red-100 text-red-800",
};

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

      // Load application and partners in parallel
      const [appData, partnersData] = await Promise.all([
        getApplication(token, id),
        getPartners(token, { status: "approved", page_size: 100 }),
      ]);

      setApplication(appData);
      setPartners(partnersData.items);

      // Initialize form
      setStatus(appData.status);
      setAssignedPartnerId(appData.assigned_partner_id || "");
      setScheduledDate(appData.scheduled_date ? parse(appData.scheduled_date, "yyyy-MM-dd", new Date()) : undefined);
      setScheduledTime(appData.scheduled_time || "");
      setEstimatedCost(appData.estimated_cost || "");
      setFinalCost(appData.final_cost || "");
      setAdminMemo(appData.admin_memo || "");
    } catch (err) {
      setError(err instanceof Error ? err.message : "데이터를 불러올 수 없습니다");
    } finally {
      setIsLoading(false);
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
      };

      const updated = await updateApplication(token, id, updateData);
      setApplication(updated);
      setSuccessMessage("저장되었습니다");

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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="animate-spin text-blue-600" size={32} />
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
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-600">
          {error}
        </div>
      </div>
    );
  }

  if (!application) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/applications"
            className="p-2 rounded-md hover:bg-gray-100"
          >
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {application.application_number}
            </h1>
            <p className="text-gray-600">
              신청일: {formatDate(application.created_at)}
            </p>
          </div>
        </div>
        <span
          className={`px-3 py-1.5 text-sm font-medium rounded-full ${
            STATUS_COLORS[application.status] || "bg-gray-100 text-gray-800"
          }`}
        >
          {STATUS_OPTIONS.find((s) => s.value === application.status)?.label ||
            application.status}
        </span>
      </div>

      {/* Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-600">
          {error}
        </div>
      )}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-green-600">
          {successMessage}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Customer Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer Info */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <User size={20} className="mr-2" />
              고객 정보
            </h2>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <User size={18} className="text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500">고객명</p>
                  <p className="font-medium">{application.customer_name}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Phone size={18} className="text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500">연락처</p>
                  <a
                    href={`tel:${application.customer_phone}`}
                    className="font-medium text-blue-600 hover:underline"
                  >
                    {formatPhone(application.customer_phone)}
                  </a>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MapPin size={18} className="text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500">주소</p>
                  <p className="font-medium">{application.address}</p>
                  {application.address_detail && (
                    <p className="text-gray-600">{application.address_detail}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Service Info */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <FileText size={20} className="mr-2" />
              서비스 정보
            </h2>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500 mb-2">선택한 서비스</p>
                <div className="flex flex-wrap gap-2">
                  {application.selected_services.map((service, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                    >
                      {service}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-2">상세 요청 내용</p>
                <p className="text-gray-700 whitespace-pre-wrap bg-gray-50 p-4 rounded-lg">
                  {application.description}
                </p>
              </div>
            </div>
          </div>

          {/* Photos */}
          {application.photos && application.photos.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <ImageIcon size={20} className="mr-2" />
                첨부 사진 ({application.photos.length})
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {application.photos.map((photo, idx) => (
                  <a
                    key={idx}
                    href={photo}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="aspect-square bg-gray-100 rounded-lg overflow-hidden hover:opacity-80 transition-opacity"
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
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              상태 관리
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  상태
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {STATUS_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  담당 파트너
                </label>
                <select
                  value={assignedPartnerId}
                  onChange={(e) =>
                    setAssignedPartnerId(e.target.value ? Number(e.target.value) : "")
                  }
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">선택 안함</option>
                  {partners.map((partner) => (
                    <option key={partner.id} value={partner.id}>
                      {partner.company_name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Schedule */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <CalendarIcon size={20} className="mr-2" />
              일정
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  예정일
                </label>
                <DatePicker
                  date={scheduledDate}
                  onDateChange={setScheduledDate}
                  placeholder="날짜 선택"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  예정시간
                </label>
                <select
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">선택</option>
                  <option value="오전">오전</option>
                  <option value="오후">오후</option>
                  <option value="종일">종일</option>
                </select>
              </div>
            </div>
          </div>

          {/* Cost */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">비용</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  견적 금액
                </label>
                <input
                  type="number"
                  value={estimatedCost}
                  onChange={(e) =>
                    setEstimatedCost(e.target.value ? Number(e.target.value) : "")
                  }
                  placeholder="0"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  최종 금액
                </label>
                <input
                  type="number"
                  value={finalCost}
                  onChange={(e) =>
                    setFinalCost(e.target.value ? Number(e.target.value) : "")
                  }
                  placeholder="0"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Admin Memo */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              관리자 메모
            </h2>
            <textarea
              value={adminMemo}
              onChange={(e) => setAdminMemo(e.target.value)}
              rows={4}
              placeholder="메모를 입력하세요"
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          {/* Save Button */}
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="w-full py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
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
  );
}
