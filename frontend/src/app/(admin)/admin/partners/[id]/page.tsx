"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Phone,
  Mail,
  MapPin,
  Building,
  User,
  FileText,
  Loader2,
  Download,
  ExternalLink,
  ChevronDown,
  Calendar,
  Briefcase,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Edit3,
  StickyNote,
  Settings,
  Globe,
} from "lucide-react";
import { useAuthStore } from "@/lib/stores/auth";
import { useConfirm } from "@/hooks";
import {
  getPartner,
  changePartnerStatus,
  getPartnerNotes,
  createPartnerNote,
  deletePartnerNote,
  PartnerDetail,
  PartnerNote,
  PartnerStatusChange,
} from "@/lib/api/admin";
import { getServiceName } from "@/lib/utils/service";
import {
  CollapsibleCard,
  ActivityTimeline,
  SummaryCards,
  type NoteItem,
  type SummaryCardItem,
} from "@/components/admin";
import { SafeText, SafeBlockText } from "@/components/common/SafeText";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
// 파일 URL 기본 경로 (API가 /api/v1/files/{token} 형태로 반환)
const FILE_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1").replace("/api/v1", "");

// 상태 설정
const STATUS_CONFIG: Record<string, { label: string; color: string; bgColor: string }> = {
  pending: { label: "대기중", color: "text-yellow-700", bgColor: "bg-yellow-100" },
  approved: { label: "승인됨", color: "text-green-700", bgColor: "bg-green-100" },
  rejected: { label: "거절됨", color: "text-red-700", bgColor: "bg-red-100" },
  active: { label: "활성", color: "text-blue-700", bgColor: "bg-blue-100" },
  inactive: { label: "비활성", color: "text-gray-700", bgColor: "bg-gray-100" },
  suspended: { label: "일시중지", color: "text-orange-700", bgColor: "bg-orange-100" },
};

// 상태 변경 옵션
const STATUS_OPTIONS: { value: PartnerStatusChange["new_status"]; label: string }[] = [
  { value: "pending", label: "대기중" },
  { value: "approved", label: "승인" },
  { value: "rejected", label: "거절" },
  { value: "active", label: "활성" },
  { value: "inactive", label: "비활성" },
  { value: "suspended", label: "일시중지" },
];

// 파일 다운로드 (백엔드 API 사용)
const downloadFile = (fileUrl: string) => {
  // ?download=true 쿼리 파라미터로 다운로드 요청
  const downloadUrl = `${fileUrl}?download=true`;
  window.location.href = downloadUrl;
};

export default function PartnerDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = Number(params.id);
  const { getValidToken } = useAuthStore();
  const { confirm } = useConfirm();

  const [partner, setPartner] = useState<PartnerDetail | null>(null);
  const [notes, setNotes] = useState<PartnerNote[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isChangingStatus, setIsChangingStatus] = useState(false);
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // UI state
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [statusChangeReason, setStatusChangeReason] = useState("");
  const [showStatusReasonModal, setShowStatusReasonModal] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<PartnerStatusChange["new_status"] | null>(null);
  const [isDeletingNote, setIsDeletingNote] = useState(false);

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

      const [partnerData, notesData] = await Promise.all([
        getPartner(token, id),
        getPartnerNotes(token, id),
      ]);

      setPartner(partnerData);
      setNotes(notesData.items);
    } catch (err) {
      setError(err instanceof Error ? err.message : "데이터를 불러올 수 없습니다");
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = async (newStatus: PartnerStatusChange["new_status"]) => {
    if (!partner) return;

    // 같은 상태면 무시
    if (partner.status === newStatus) {
      setShowStatusDropdown(false);
      return;
    }

    // 거절 또는 일시중지인 경우 사유 입력 모달
    if (newStatus === "rejected" || newStatus === "suspended" || newStatus === "inactive") {
      setPendingStatus(newStatus);
      setShowStatusReasonModal(true);
      setShowStatusDropdown(false);
      return;
    }

    await executeStatusChange(newStatus);
  };

  const executeStatusChange = async (newStatus: PartnerStatusChange["new_status"], reason?: string) => {
    try {
      setIsChangingStatus(true);
      setError(null);

      const token = await getValidToken();
      if (!token) {
        router.push("/admin/login");
        return;
      }

      const data: PartnerStatusChange = {
        new_status: newStatus,
        reason: reason || undefined,
        send_sms: newStatus === "approved" || newStatus === "rejected",
      };

      const updated = await changePartnerStatus(token, id, data);
      setPartner(updated);

      // 노트 목록 새로고침
      const notesData = await getPartnerNotes(token, id);
      setNotes(notesData.items);

      setSuccessMessage("상태가 변경되었습니다");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "상태 변경에 실패했습니다");
    } finally {
      setIsChangingStatus(false);
      setShowStatusDropdown(false);
      setShowStatusReasonModal(false);
      setStatusChangeReason("");
      setPendingStatus(null);
    }
  };

  const handleAddNote = async (content: string) => {
    try {
      setIsAddingNote(true);
      setError(null);

      const token = await getValidToken();
      if (!token) {
        router.push("/admin/login");
        return;
      }

      await createPartnerNote(token, id, { content });

      // 노트 목록 새로고침
      const notesData = await getPartnerNotes(token, id);
      setNotes(notesData.items);

      setSuccessMessage("메모가 추가되었습니다");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "메모 추가에 실패했습니다");
    } finally {
      setIsAddingNote(false);
    }
  };

  const handleDeleteNote = async (noteId: number) => {
    const confirmed = await confirm({
      title: "이 메모를 삭제하시겠습니까?",
      type: "warning",
      confirmText: "삭제",
      confirmVariant: "destructive",
    });
    if (!confirmed) return;

    try {
      setIsDeletingNote(true);
      setError(null);

      const token = await getValidToken();
      if (!token) {
        router.push("/admin/login");
        return;
      }

      await deletePartnerNote(token, id, noteId);

      // 노트 목록 새로고침
      const notesData = await getPartnerNotes(token, id);
      setNotes(notesData.items);

      setSuccessMessage("메모가 삭제되었습니다");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "메모 삭제에 실패했습니다");
    } finally {
      setIsDeletingNote(false);
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

  // 요약 카드 데이터
  const summaryItems = useMemo<SummaryCardItem[]>(() => {
    if (!partner) return [];
    return [
      {
        icon: <User size={20} />,
        iconBgColor: "bg-blue-100",
        iconColor: "text-blue-600",
        label: "대표자",
        value: partner.representative_name,
      },
      {
        icon: <Phone size={20} />,
        iconBgColor: "bg-green-100",
        iconColor: "text-green-600",
        label: "연락처",
        value: formatPhone(partner.contact_phone),
        href: `tel:${partner.contact_phone}`,
      },
      {
        icon: <Calendar size={20} />,
        iconBgColor: "bg-purple-100",
        iconColor: "text-purple-600",
        label: "등록일",
        value: new Date(partner.created_at).toLocaleDateString("ko-KR"),
      },
      {
        icon: <Briefcase size={20} />,
        iconBgColor: "bg-orange-100",
        iconColor: "text-orange-600",
        label: "서비스",
        value: `${partner.service_areas.length}개 분야`,
      },
    ];
  }, [partner]);

  // ActivityTimeline용 노트 변환
  const timelineNotes = useMemo<NoteItem[]>(() => {
    return notes.map((note) => ({
      id: note.id,
      content: note.content,
      admin_name: note.admin_name,
      created_at: note.created_at,
      note_type: note.note_type as "memo" | "manual" | "status_change" | "system" | undefined,
    }));
  }, [notes]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="animate-spin text-blue-600" size={32} />
      </div>
    );
  }

  if (error && !partner) {
    return (
      <div className="space-y-4">
        <Link
          href="/admin/partners"
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

  if (!partner) return null;

  const statusConfig = STATUS_CONFIG[partner.status] || STATUS_CONFIG.pending;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/partners"
            className="p-2 rounded-md hover:bg-gray-100"
          >
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {partner.company_name}
            </h1>
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <span>등록: {new Date(partner.created_at).toLocaleDateString("ko-KR")}</span>
              {partner.updated_at !== partner.created_at && (
                <span className="flex items-center gap-1">
                  <Edit3 size={12} />
                  수정: {new Date(partner.updated_at).toLocaleDateString("ko-KR")}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* 상태 변경 드롭다운 */}
        <div className="relative">
          <button
            onClick={() => setShowStatusDropdown(!showStatusDropdown)}
            disabled={isChangingStatus}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium ${statusConfig.bgColor} ${statusConfig.color} hover:opacity-80 transition-opacity`}
          >
            {isChangingStatus ? (
              <Loader2 className="animate-spin" size={16} />
            ) : (
              <>
                {statusConfig.label}
                <ChevronDown size={16} />
              </>
            )}
          </button>

          {showStatusDropdown && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
              {STATUS_OPTIONS.filter((opt) => opt.value !== partner.status).map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleStatusChange(option.value)}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 transition-colors"
                >
                  {option.label}
                </button>
              ))}
            </div>
          )}
        </div>
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

      {/* 요약 카드 */}
      <SummaryCards items={summaryItems} />

      {/* 3:2 좌우 분할 레이아웃 */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* 좌측 영역 (3/5) */}
        <div className="lg:col-span-3 space-y-4">
          {/* 기본 정보 */}
          <CollapsibleCard
            title="기본 정보"
            icon={<Building size={18} />}
            defaultOpen={true}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-3">회사 정보</h4>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <Building size={18} className="text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-500">회사/상호명</p>
                      <p className="font-medium">{partner.company_name}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <User size={18} className="text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-500">대표자명</p>
                      <p className="font-medium">{partner.representative_name}</p>
                    </div>
                  </div>
                  {partner.business_number && (
                    <div className="flex items-start gap-3">
                      <FileText size={18} className="text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-xs text-gray-500">사업자등록번호</p>
                        <p className="font-medium">{partner.business_number}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-3">연락처</h4>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <Phone size={18} className="text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-500">전화번호</p>
                      <a
                        href={`tel:${partner.contact_phone}`}
                        className="font-medium text-primary hover:underline"
                      >
                        {formatPhone(partner.contact_phone)}
                      </a>
                    </div>
                  </div>
                  {partner.contact_email && (
                    <div className="flex items-start gap-3">
                      <Mail size={18} className="text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-xs text-gray-500">이메일</p>
                        <a
                          href={`mailto:${partner.contact_email}`}
                          className="font-medium text-primary hover:underline"
                        >
                          {partner.contact_email}
                        </a>
                      </div>
                    </div>
                  )}
                  <div className="flex items-start gap-3">
                    <MapPin size={18} className="text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-500">주소</p>
                      <SafeText text={partner.address} className="font-medium" as="p" />
                      {partner.address_detail && (
                        <SafeText text={partner.address_detail} className="text-gray-600" as="p" />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 승인 정보 */}
            {(partner.status === "approved" || partner.status === "active" || partner.status === "rejected" || partner.rejection_reason || partner.approved_at) && (
              <div className="border-t border-gray-100 pt-4 mt-4">
                <h4 className="text-sm font-medium text-gray-500 mb-3">승인 정보</h4>
                <div className="space-y-3">
                  {partner.approved_at && (
                    <div className="flex items-start gap-3">
                      <CheckCircle size={18} className="text-green-500 mt-0.5" />
                      <div>
                        <p className="text-xs text-gray-500">승인 일시</p>
                        <p className="font-medium text-green-700">
                          {formatDate(partner.approved_at)}
                        </p>
                      </div>
                    </div>
                  )}
                  {partner.rejection_reason && (
                    <div className="flex items-start gap-3">
                      <XCircle size={18} className="text-red-500 mt-0.5" />
                      <div>
                        <p className="text-xs text-gray-500">거절 사유</p>
                        <SafeText
                          text={partner.rejection_reason}
                          className="font-medium text-red-700 bg-red-50 px-3 py-2 rounded-lg mt-1 block"
                          as="p"
                        />
                      </div>
                    </div>
                  )}
                  {(partner.status === "inactive" || partner.status === "suspended") && (
                    <div className="flex items-start gap-3">
                      <AlertTriangle size={18} className="text-orange-500 mt-0.5" />
                      <div>
                        <p className="text-xs text-gray-500">상태</p>
                        <p className="font-medium text-orange-700">
                          {partner.status === "inactive" ? "비활성 상태입니다" : "일시 중지된 상태입니다"}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </CollapsibleCard>

          {/* 서비스/지역 */}
          <CollapsibleCard
            title="서비스/지역"
            icon={<Globe size={18} />}
            badge={`서비스 ${partner.service_areas.length}개`}
            defaultOpen={true}
          >
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-2">제공 서비스</h4>
                <div className="flex flex-wrap gap-2">
                  {partner.service_areas.map((area, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1.5 bg-blue-100 text-blue-800 text-sm rounded-full font-medium"
                    >
                      {getServiceName(area)}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-2">활동 지역</h4>
                <div className="flex flex-wrap gap-2">
                  {partner.work_regions.map((region, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1.5 bg-green-100 text-green-800 text-sm rounded-full font-medium"
                    >
                      {region.provinceName}{" "}
                      {region.isAllDistricts
                        ? "전체"
                        : region.districtNames.join(", ")}
                    </span>
                  ))}
                </div>
              </div>

              {partner.introduction && (
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-2">소개</h4>
                  <SafeBlockText
                    text={partner.introduction}
                    className="text-gray-700 bg-gray-50 p-3 rounded-lg text-sm"
                  />
                </div>
              )}

              {partner.experience && (
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-2">경력 및 자격</h4>
                  <SafeBlockText
                    text={partner.experience}
                    className="text-gray-700 bg-gray-50 p-3 rounded-lg text-sm"
                  />
                </div>
              )}

              {partner.remarks && (
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-2">비고</h4>
                  <SafeBlockText
                    text={partner.remarks}
                    className="text-gray-700 bg-gray-50 p-3 rounded-lg text-sm"
                  />
                </div>
              )}
            </div>
          </CollapsibleCard>

          {/* 사업자등록증 */}
          <CollapsibleCard
            title="사업자등록증"
            icon={<FileText size={18} />}
            defaultOpen={partner.business_registration_file ? true : false}
          >
            {partner.business_registration_file ? (
              <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex-shrink-0 w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center border border-blue-200">
                  <FileText size={24} className="text-blue-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">
                    사업자등록증
                  </p>
                  <p className="text-sm text-gray-500">첨부 파일</p>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={`${FILE_BASE_URL}${partner.business_registration_file}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                  >
                    <ExternalLink size={14} />
                    열기
                  </a>
                  <button
                    onClick={() => downloadFile(`${FILE_BASE_URL}${partner.business_registration_file}`)}
                    className="flex items-center gap-2 px-3 py-1.5 bg-primary text-white rounded-lg hover:bg-primary-600 transition-colors text-sm"
                  >
                    <Download size={14} />
                    다운로드
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200 text-gray-500">
                <FileText size={20} />
                <span className="text-sm">업로드된 파일이 없습니다</span>
              </div>
            )}
          </CollapsibleCard>
        </div>

        {/* 우측 영역 (2/5) */}
        <div className="lg:col-span-2 space-y-4">
          {/* 상태 관리 */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
            <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2 mb-4">
              <Settings size={18} className="text-primary" />
              상태 관리
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">현재 상태</span>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusConfig.bgColor} ${statusConfig.color}`}>
                  {statusConfig.label}
                </span>
              </div>
              {(pendingStatus === "rejected" || pendingStatus === "suspended" || pendingStatus === "inactive") && showStatusReasonModal && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    {pendingStatus === "rejected" ? "거절" : pendingStatus === "suspended" ? "일시중지" : "비활성화"} 사유
                  </label>
                  <textarea
                    value={statusChangeReason}
                    onChange={(e) => setStatusChangeReason(e.target.value)}
                    placeholder="사유를 입력하세요"
                    rows={2}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setShowStatusReasonModal(false);
                        setStatusChangeReason("");
                        setPendingStatus(null);
                      }}
                      className="flex-1 px-3 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                    >
                      취소
                    </button>
                    <button
                      onClick={() => executeStatusChange(pendingStatus, statusChangeReason)}
                      disabled={isChangingStatus}
                      className="flex-1 px-3 py-2 text-sm bg-primary text-white rounded-lg hover:bg-primary-600 disabled:opacity-50"
                    >
                      {isChangingStatus ? <Loader2 className="animate-spin mx-auto" size={16} /> : "확인"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 활동 이력 */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
            <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2 mb-4">
              <StickyNote size={18} className="text-primary" />
              활동 이력
              {notes.length > 0 && (
                <span className="text-sm font-normal text-gray-500">({notes.length})</span>
              )}
            </h3>

            {/* 기존 관리자 메모 (레거시) */}
            {partner.admin_memo && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
                <div className="flex items-start gap-2">
                  <StickyNote size={14} className="text-amber-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-amber-700 font-medium mb-1">기존 관리자 메모</p>
                    <SafeBlockText
                      text={partner.admin_memo}
                      className="text-sm text-amber-900"
                    />
                  </div>
                </div>
              </div>
            )}

            <ActivityTimeline
              notes={timelineNotes}
              showInput={true}
              isAddingNote={isAddingNote}
              onAddNote={handleAddNote}
              onDeleteNote={handleDeleteNote}
              emptyMessage="아직 활동 이력이 없습니다"
            />
          </div>
        </div>
      </div>

      {/* 드롭다운 외부 클릭 시 닫기 */}
      {showStatusDropdown && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setShowStatusDropdown(false)}
        />
      )}
    </div>
  );
}
