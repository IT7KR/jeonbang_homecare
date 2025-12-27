"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { format, parse } from "date-fns";
import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";
import {
  ArrowLeft,
  Phone,
  MapPin,
  Calendar as CalendarIcon,
  Save,
  Loader2,
  Image as ImageIcon,
  MessageSquare,
  Building2,
  CheckCircle,
  AlertCircle,
  Wrench,
  History,
  Trash2,
  ZoomIn,
  ChevronDown,
  ChevronUp,
  User,
  Clock,
  FileText,
  XCircle,
  Plus,
  Users,
  Pencil,
  X,
  Download,
  Zap,
  Check,
  Search,
  Star,
  Link2,
  Copy,
  RefreshCw,
  Camera,
} from "lucide-react";
import { useAuthStore } from "@/lib/stores/auth";
import { useConfirm } from "@/hooks";
import {
  getApplication,
  updateApplication,
  getPartners,
  getEntityAuditLogs,
  getApplicationNotes,
  createApplicationNote,
  deleteApplicationNote,
  createApplicationAssignment,
  updateApplicationAssignment,
  deleteApplicationAssignment,
  getCustomerHistory,
  getAssignmentURL,
  generateAssignmentURL,
  renewAssignmentURL,
  revokeAssignmentURL,
  extendAssignmentURL,
  ApplicationDetail,
  PartnerListItem,
  AuditLog,
  ApplicationNote,
  AssignmentSummary,
  AssignmentCreate,
  AssignmentUpdate,
  CustomerHistoryResponse,
  URLInfo,
} from "@/lib/api/admin";
import { startOfDay } from "date-fns";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { getServiceName } from "@/lib/utils/service";
import { numberToKoreanCurrency } from "@/lib/utils/formatters";
import {
  type SummaryCardItem,
  ActivityTimeline,
  type NoteItem,
  type AuditItem,
} from "@/components/admin";
import { SafeText, SafeBlockText } from "@/components/common/SafeText";
import { QuoteItemTable } from "@/components/features/admin/quotes";
import { MMSSheet } from "@/components/features/admin/sms";
import { WorkPhotoUpload, CustomerUrlManager } from "@/components/features/admin/photos";

// 파일 URL 기본 경로 (API가 /api/v1/files/{token} 형태로 반환)
const FILE_BASE_URL = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1"
).replace("/api/v1", "");

const STATUS_OPTIONS = [
  {
    value: "new",
    label: "신규",
    color: "bg-blue-50 text-blue-700 border-blue-200",
  },
  {
    value: "consulting",
    label: "상담중",
    color: "bg-yellow-50 text-yellow-700 border-yellow-200",
  },
  {
    value: "assigned",
    label: "배정완료",
    color: "bg-purple-50 text-purple-700 border-purple-200",
  },
  {
    value: "scheduled",
    label: "일정확정",
    color: "bg-primary-50 text-primary-700 border-primary-200",
  },
  {
    value: "completed",
    label: "완료",
    color: "bg-gray-100 text-gray-700 border-gray-200",
  },
  {
    value: "cancelled",
    label: "취소",
    color: "bg-red-50 text-red-600 border-red-200",
  },
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

/**
 * 상태 변경 시 SMS가 실제로 발송되는지 확인하는 함수
 * 백엔드 로직과 동기화되어야 함
 */
const willSendSmsForStatusChange = (
  prevStatus: string,
  newStatus: string
): boolean => {
  // scheduled 상태로 변경 (일정 확정 알림)
  if (newStatus === "scheduled" && prevStatus !== "scheduled") {
    return true;
  }

  // completed 상태로 변경 (완료 알림)
  if (newStatus === "completed" && prevStatus !== "completed") {
    return true;
  }

  // cancelled 상태는 별도 취소 모달에서 처리
  // consulting, assigned 상태 변경은 SMS 발송 로직 없음
  return false;
};

export default function ApplicationDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = Number(params.id);
  const { getValidToken } = useAuthStore();
  const { confirm } = useConfirm();

  const [application, setApplication] = useState<ApplicationDetail | null>(
    null
  );
  const [partners, setPartners] = useState<PartnerListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [isDownloadingAll, setIsDownloadingAll] = useState(false);
  const [downloadingPhoto, setDownloadingPhoto] = useState<number | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [customerHistory, setCustomerHistory] = useState<CustomerHistoryResponse | null>(null);

  // 메모 히스토리
  const [notes, setNotes] = useState<ApplicationNote[]>([]);
  const [isAddingNote, setIsAddingNote] = useState(false);

  // 취소 모달
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReasonSelect, setCancelReasonSelect] = useState("");
  const [cancelReasonCustom, setCancelReasonCustom] = useState("");
  const [sendCancelSms, setSendCancelSms] = useState(true);
  const [isCancelling, setIsCancelling] = useState(false);

  // 취소 사유 옵션
  const CANCEL_REASONS = [
    { value: "", label: "사유 선택" },
    { value: "고객 요청", label: "고객 요청" },
    { value: "일정 조율 불가", label: "일정 조율 불가" },
    { value: "서비스 범위 초과", label: "서비스 범위 초과" },
    { value: "협력사 배정 불가", label: "협력사 배정 불가" },
    { value: "중복 신청", label: "중복 신청" },
    { value: "other", label: "기타 (직접 입력)" },
  ];

  // 최종 취소 사유 계산
  const finalCancelReason = cancelReasonSelect === "other"
    ? cancelReasonCustom
    : cancelReasonSelect;

  // 헤더 상태 드롭다운
  const [showStatusHeaderDropdown, setShowStatusHeaderDropdown] =
    useState(false);

  // MMS 발송 시트
  const [showMMSSheet, setShowMMSSheet] = useState(false);

  // 섹션 접기/펼치기
  const [expandedSections, setExpandedSections] = useState({
    service: true,
    assignments: false, // 기본 닫힘 (좌측 높이 축소)
    management: true,
    activity: true,
  });

  // 배정 관리 상태
  const [isAssignmentModalOpen, setIsAssignmentModalOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] =
    useState<AssignmentSummary | null>(null);
  const [isAssignmentSaving, setIsAssignmentSaving] = useState(false);
  const [isDeletingAssignment, setIsDeletingAssignment] = useState<
    number | null
  >(null);

  // 배정 폼 상태
  const [assignmentForm, setAssignmentForm] = useState<{
    partner_id: number | "";
    assigned_services: string[];
    scheduled_date: Date | undefined;
    scheduled_time: string;
    estimated_cost: number | "";
    final_cost: number | "";
    estimate_note: string;
    note: string;
    send_sms: boolean;
  }>({
    partner_id: "",
    assigned_services: [],
    scheduled_date: undefined,
    scheduled_time: "",
    estimated_cost: "",
    final_cost: "",
    estimate_note: "",
    note: "",
    send_sms: true,
  });

  // 협력사 선택 드롭다운 상태
  const [isPartnerDropdownOpen, setIsPartnerDropdownOpen] = useState(false);
  const [partnerSearchQuery, setPartnerSearchQuery] = useState("");

  // 견적 상세 모달 상태
  const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false);
  const [quoteAssignmentId, setQuoteAssignmentId] = useState<number | null>(null);

  // URL 관리 모달 상태 (협력사 포털)
  const [isUrlModalOpen, setIsUrlModalOpen] = useState(false);
  const [urlAssignmentId, setUrlAssignmentId] = useState<number | null>(null);
  const [urlInfo, setUrlInfo] = useState<URLInfo | null>(null);
  const [isLoadingUrl, setIsLoadingUrl] = useState(false);

  // 시공 사진 모달 상태
  const [isPhotosModalOpen, setIsPhotosModalOpen] = useState(false);
  const [photosAssignmentId, setPhotosAssignmentId] = useState<number | null>(null);

  // 고객 URL 관리 모달 상태
  const [isCustomerUrlModalOpen, setIsCustomerUrlModalOpen] = useState(false);
  const [customerUrlAssignmentId, setCustomerUrlAssignmentId] = useState<number | null>(null);

  // Form state
  const [status, setStatus] = useState("");
  const [sendSms, setSendSms] = useState(true);

  // 원본 상태값 저장 (변경 감지용)
  const [originalStatus, setOriginalStatus] = useState("");

  // 서비스 매칭 정보가 추가된 협력사 타입
  type PartnerWithMatch = PartnerListItem & {
    matchCount: number;
    matchedServices: string[];
    isMatched: boolean;
  };

  // 서비스 매칭률로 정렬된 협력사 목록 (미배정 서비스 기준으로 매칭)
  const sortedPartners = useMemo((): {
    matched: PartnerWithMatch[];
    unmatched: PartnerWithMatch[];
  } => {
    if (!application?.selected_services || partners.length === 0) {
      const emptyPartners: PartnerWithMatch[] = partners.map((p) => ({
        ...p,
        matchCount: 0,
        matchedServices: [],
        isMatched: false,
      }));
      return { matched: emptyPartners, unmatched: [] };
    }

    // 이미 배정된 서비스 계산
    const assignedServices = new Set(
      application.assignments?.flatMap((a) => a.assigned_services) || []
    );

    // 미배정 서비스만 필터링 (스마트 매칭 대상)
    const unassignedServicesSet = new Set(
      application.selected_services.filter((s) => !assignedServices.has(s))
    );

    const partnersWithMatch: PartnerWithMatch[] = partners.map((p) => {
      // 미배정 서비스 기준으로 매칭 계산
      const matchedServices = p.service_areas.filter((s) =>
        unassignedServicesSet.has(s)
      );
      return {
        ...p,
        matchCount: matchedServices.length,
        matchedServices,
        isMatched: matchedServices.length > 0,
      };
    });

    // 매칭되는 협력사와 안 되는 협력사 분리
    const matched = partnersWithMatch
      .filter((p) => p.isMatched)
      .sort((a, b) => b.matchCount - a.matchCount);
    const unmatched = partnersWithMatch.filter((p) => !p.isMatched);

    return { matched, unmatched };
  }, [partners, application?.selected_services, application?.assignments]);

  // 상태 변경 감지
  const hasStatusChanged = status !== originalStatus;

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // URL 관리 함수들
  const loadAssignmentUrl = async (assignmentId: number) => {
    try {
      setIsLoadingUrl(true);
      const token = await getValidToken();
      if (!token) return;

      const urlData = await getAssignmentURL(token, id, assignmentId);
      setUrlInfo(urlData);
    } catch (err) {
      console.error("Failed to load URL:", err);
      setUrlInfo(null);
    } finally {
      setIsLoadingUrl(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setSuccessMessage("URL이 클립보드에 복사되었습니다");
      setTimeout(() => setSuccessMessage(null), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const handleRenewUrl = async () => {
    if (!urlAssignmentId) return;
    try {
      setIsLoadingUrl(true);
      const token = await getValidToken();
      if (!token) return;

      const newUrlInfo = await renewAssignmentURL(token, id, urlAssignmentId, {
        expires_in_days: 7,
      });
      setUrlInfo(newUrlInfo);
      setSuccessMessage("URL이 재발급되었습니다");
    } catch (err) {
      console.error("Failed to renew URL:", err);
    } finally {
      setIsLoadingUrl(false);
    }
  };

  const handleExtendUrl = async (days: number) => {
    if (!urlAssignmentId) return;
    try {
      setIsLoadingUrl(true);
      const token = await getValidToken();
      if (!token) return;

      const newUrlInfo = await extendAssignmentURL(token, id, urlAssignmentId, {
        expires_in_days: days,
      });
      setUrlInfo(newUrlInfo);
      setSuccessMessage(`URL이 ${days}일 연장되었습니다`);
    } catch (err) {
      console.error("Failed to extend URL:", err);
    } finally {
      setIsLoadingUrl(false);
    }
  };

  const handleRevokeUrl = async () => {
    if (!urlAssignmentId) return;
    const confirmed = await confirm({
      title: "URL 만료 처리",
      description: "이 URL을 만료 처리하시겠습니까?",
      type: "warning",
      confirmText: "만료 처리",
      confirmVariant: "destructive",
    });
    if (!confirmed) return;

    try {
      setIsLoadingUrl(true);
      const token = await getValidToken();
      if (!token) return;

      await revokeAssignmentURL(token, id, urlAssignmentId);
      setIsUrlModalOpen(false);
      setUrlAssignmentId(null);
      setUrlInfo(null);
      setSuccessMessage("URL이 만료 처리되었습니다");
    } catch (err) {
      console.error("Failed to revoke URL:", err);
    } finally {
      setIsLoadingUrl(false);
    }
  };

  const handleGenerateUrl = async (days: number = 7) => {
    if (!urlAssignmentId) return;
    try {
      setIsLoadingUrl(true);
      const token = await getValidToken();
      if (!token) return;

      const newUrlInfo = await generateAssignmentURL(token, id, urlAssignmentId, {
        expires_in_days: days,
      });
      setUrlInfo(newUrlInfo);
      setSuccessMessage("URL이 발급되었습니다");
    } catch (err) {
      console.error("Failed to generate URL:", err);
    } finally {
      setIsLoadingUrl(false);
    }
  };

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const token = await getValidToken();
      if (!token) {
        router.push("/admin/login");
        return;
      }

      const [appData, partnersData, auditLogsData, notesData, customerHistoryData] =
        await Promise.all([
          getApplication(token, id),
          getPartners(token, { status: "approved", page_size: 100 }),
          getEntityAuditLogs(token, "application", id, { page_size: 20 }),
          getApplicationNotes(token, id, { page_size: 50 }),
          getCustomerHistory(token, id).catch(() => null), // 실패해도 무시
        ]);

      setApplication(appData);
      setPartners(partnersData.items);
      setAuditLogs(auditLogsData.items);
      setNotes(notesData.items);
      setCustomerHistory(customerHistoryData);

      // Initialize form (상태만 관리)
      setStatus(appData.status);
      setOriginalStatus(appData.status);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "데이터를 불러올 수 없습니다"
      );
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

      // 상태 변경만 처리 (협력사/일정/비용은 배정에서 관리)
      const updateData = {
        status,
        send_sms: sendSms && hasStatusChanged,
      };

      const updated = await updateApplication(token, id, updateData);
      setApplication(updated);

      // 원본 상태 업데이트
      setOriginalStatus(updated.status);

      const updatedAuditLogs = await getEntityAuditLogs(
        token,
        "application",
        id,
        {
          page_size: 20,
        }
      );
      setAuditLogs(updatedAuditLogs.items);

      const willSendSms =
        sendSms &&
        hasStatusChanged &&
        willSendSmsForStatusChange(originalStatus, status);
      const smsNote = willSendSms ? " (SMS 알림 발송됨)" : "";
      setSuccessMessage(`저장되었습니다${smsNote}`);

      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "저장에 실패했습니다");
    } finally {
      setIsSaving(false);
    }
  };

  // 메모 추가 (ActivityTimeline 컴포넌트용)
  const handleAddNote = async (content: string) => {
    try {
      setIsAddingNote(true);
      const token = await getValidToken();
      if (!token) return;

      const newNote = await createApplicationNote(token, id, {
        content: content.trim(),
      });
      setNotes([newNote, ...notes]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "메모 추가에 실패했습니다");
    } finally {
      setIsAddingNote(false);
    }
  };

  // 메모 삭제
  const handleDeleteNote = async (noteId: number) => {
    const confirmed = await confirm({
      title: "이 메모를 삭제하시겠습니까?",
      type: "warning",
      confirmText: "삭제",
      confirmVariant: "destructive",
    });
    if (!confirmed) return;

    try {
      const token = await getValidToken();
      if (!token) return;

      await deleteApplicationNote(token, id, noteId);
      setNotes(notes.filter((n) => n.id !== noteId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "메모 삭제에 실패했습니다");
    }
  };

  // 신청 취소 처리
  const handleCancelApplication = async () => {
    try {
      setIsCancelling(true);
      setError(null);

      const token = await getValidToken();
      if (!token) {
        router.push("/admin/login");
        return;
      }

      const updateData = {
        status: "cancelled",
        admin_memo: finalCancelReason || undefined,
        send_sms: sendCancelSms,
      };

      const updated = await updateApplication(token, id, updateData);
      setApplication(updated);
      setStatus("cancelled");
      setShowCancelModal(false);
      setCancelReasonSelect("");
      setCancelReasonCustom("");
      setSendCancelSms(true);

      // Audit Log 갱신
      const updatedAuditLogs = await getEntityAuditLogs(
        token,
        "application",
        id,
        {
          page_size: 20,
        }
      );
      setAuditLogs(updatedAuditLogs.items);

      const smsNote = sendCancelSms ? " (SMS 알림 발송됨)" : "";
      setSuccessMessage(`신청이 취소되었습니다${smsNote}`);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "취소 처리에 실패했습니다");
    } finally {
      setIsCancelling(false);
    }
  };

  // ===== 사진 다운로드 핸들러 =====

  // 개별 사진 다운로드
  const handleDownloadPhoto = async (photoUrl: string, index: number) => {
    try {
      setDownloadingPhoto(index);

      // 파일 URL에 download=true 쿼리 파라미터 추가
      const downloadUrl = `${FILE_BASE_URL}${photoUrl}${
        photoUrl.includes("?") ? "&" : "?"
      }download=true`;

      // 파일명 추출 (URL에서)
      const filename = `사진_${index + 1}.jpg`;

      // 다운로드 링크 생성 및 클릭
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = filename;
      link.target = "_blank";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      setError("사진 다운로드에 실패했습니다");
    } finally {
      setDownloadingPhoto(null);
    }
  };

  // 전체 사진 다운로드 (ZIP)
  const handleDownloadAllPhotos = async () => {
    if (!application?.photos || application.photos.length === 0) return;

    try {
      setIsDownloadingAll(true);
      setError(null);

      // 동적 import로 JSZip 로드
      const JSZip = (await import("jszip")).default;
      const zip = new JSZip();

      // 모든 사진을 fetch하여 ZIP에 추가
      const fetchPromises = application.photos.map(async (photoUrl, index) => {
        try {
          const fullUrl = `${FILE_BASE_URL}${photoUrl}`;
          const response = await fetch(fullUrl);
          if (!response.ok)
            throw new Error(`Failed to fetch photo ${index + 1}`);
          const blob = await response.blob();

          // 파일 확장자 추출
          const ext = photoUrl.split(".").pop()?.split("?")[0] || "jpg";
          const filename = `사진_${String(index + 1).padStart(2, "0")}.${ext}`;
          zip.file(filename, blob);
        } catch (err) {
          console.error(`Failed to download photo ${index + 1}:`, err);
        }
      });

      await Promise.all(fetchPromises);

      // ZIP 파일 생성 및 다운로드
      const zipBlob = await zip.generateAsync({ type: "blob" });
      const zipUrl = URL.createObjectURL(zipBlob);

      const link = document.createElement("a");
      link.href = zipUrl;
      link.download = `${application.application_number}_사진.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      URL.revokeObjectURL(zipUrl);
      setSuccessMessage("사진을 다운로드했습니다");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError("사진 다운로드에 실패했습니다");
    } finally {
      setIsDownloadingAll(false);
    }
  };

  // ===== 배정 관련 핸들러 =====

  // 배정 폼 초기화
  const resetAssignmentForm = () => {
    setAssignmentForm({
      partner_id: "",
      assigned_services: [],
      scheduled_date: undefined,
      scheduled_time: "",
      estimated_cost: "",
      final_cost: "",
      estimate_note: "",
      note: "",
      send_sms: true,
    });
    setEditingAssignment(null);
  };

  // 새 배정 추가 모달 열기
  const openNewAssignmentModal = () => {
    resetAssignmentForm();
    // 아직 배정되지 않은 서비스만 기본 선택
    const assignedServices =
      application?.assignments?.flatMap((a) => a.assigned_services) || [];
    const unassignedServices =
      application?.selected_services.filter(
        (s) => !assignedServices.includes(s)
      ) || [];
    setAssignmentForm((prev) => ({
      ...prev,
      assigned_services: unassignedServices,
    }));
    setIsAssignmentModalOpen(true);
  };

  // 배정 수정 모달 열기
  const openEditAssignmentModal = (assignment: AssignmentSummary) => {
    setEditingAssignment(assignment);
    setAssignmentForm({
      partner_id: assignment.partner_id,
      assigned_services: assignment.assigned_services,
      scheduled_date: assignment.scheduled_date
        ? parse(assignment.scheduled_date, "yyyy-MM-dd", new Date())
        : undefined,
      scheduled_time: assignment.scheduled_time || "",
      estimated_cost: assignment.estimated_cost || "",
      final_cost: assignment.final_cost || "",
      estimate_note: assignment.estimate_note || "",
      note: assignment.note || "",
      send_sms: true,
    });
    setIsAssignmentModalOpen(true);
  };

  // 배정 저장 (생성/수정)
  const handleSaveAssignment = async () => {
    if (
      !assignmentForm.partner_id ||
      assignmentForm.assigned_services.length === 0
    ) {
      setError("협력사와 담당 서비스를 선택해주세요");
      return;
    }

    try {
      setIsAssignmentSaving(true);
      setError(null);

      const token = await getValidToken();
      if (!token) {
        router.push("/admin/login");
        return;
      }

      if (editingAssignment) {
        // 수정
        const updateData: AssignmentUpdate = {
          assigned_services: assignmentForm.assigned_services,
          scheduled_date: assignmentForm.scheduled_date
            ? format(assignmentForm.scheduled_date, "yyyy-MM-dd")
            : undefined,
          scheduled_time: assignmentForm.scheduled_time || undefined,
          estimated_cost: assignmentForm.estimated_cost || undefined,
          final_cost: assignmentForm.final_cost || undefined,
          estimate_note: assignmentForm.estimate_note || undefined,
          note: assignmentForm.note || undefined,
          send_sms: assignmentForm.send_sms,
        };

        await updateApplicationAssignment(
          token,
          id,
          editingAssignment.id,
          updateData
        );
        setSuccessMessage("배정이 수정되었습니다");
      } else {
        // 생성
        const createData: AssignmentCreate = {
          partner_id: assignmentForm.partner_id as number,
          assigned_services: assignmentForm.assigned_services,
          scheduled_date: assignmentForm.scheduled_date
            ? format(assignmentForm.scheduled_date, "yyyy-MM-dd")
            : undefined,
          scheduled_time: assignmentForm.scheduled_time || undefined,
          estimated_cost: assignmentForm.estimated_cost || undefined,
          estimate_note: assignmentForm.estimate_note || undefined,
          note: assignmentForm.note || undefined,
          send_sms: assignmentForm.send_sms,
        };

        await createApplicationAssignment(token, id, createData);
        setSuccessMessage("새 배정이 추가되었습니다");
      }

      // 신청 데이터 새로고침
      const updatedApp = await getApplication(token, id);
      setApplication(updatedApp);

      // Audit Log 갱신
      const updatedAuditLogs = await getEntityAuditLogs(
        token,
        "application",
        id,
        {
          page_size: 20,
        }
      );
      setAuditLogs(updatedAuditLogs.items);

      setIsAssignmentModalOpen(false);
      resetAssignmentForm();

      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "배정 저장에 실패했습니다");
    } finally {
      setIsAssignmentSaving(false);
    }
  };

  // 배정 삭제
  const handleDeleteAssignment = async (assignmentId: number) => {
    const confirmed = await confirm({
      title: "이 배정을 삭제하시겠습니까?",
      description: "삭제된 배정은 복구할 수 없습니다.",
      type: "warning",
      confirmText: "삭제",
      confirmVariant: "destructive",
    });
    if (!confirmed) return;

    try {
      setIsDeletingAssignment(assignmentId);
      setError(null);

      const token = await getValidToken();
      if (!token) {
        router.push("/admin/login");
        return;
      }

      await deleteApplicationAssignment(token, id, assignmentId);

      // 신청 데이터 새로고침
      const updatedApp = await getApplication(token, id);
      setApplication(updatedApp);

      // Audit Log 갱신
      const updatedAuditLogs = await getEntityAuditLogs(
        token,
        "application",
        id,
        {
          page_size: 20,
        }
      );
      setAuditLogs(updatedAuditLogs.items);

      setSuccessMessage("배정이 삭제되었습니다");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "배정 삭제에 실패했습니다");
    } finally {
      setIsDeletingAssignment(null);
    }
  };

  // 배정 상태별 배지 색상
  const getAssignmentStatusInfo = (statusValue: string) => {
    const statusMap: Record<string, { label: string; color: string }> = {
      pending: { label: "대기", color: "bg-gray-100 text-gray-700" },
      notified: { label: "알림발송", color: "bg-blue-50 text-blue-700" },
      accepted: { label: "수락", color: "bg-green-50 text-green-700" },
      rejected: { label: "거절", color: "bg-red-50 text-red-600" },
      scheduled: { label: "일정확정", color: "bg-purple-50 text-purple-700" },
      in_progress: { label: "진행중", color: "bg-yellow-50 text-yellow-700" },
      completed: { label: "완료", color: "bg-primary-50 text-primary-700" },
      cancelled: { label: "취소", color: "bg-red-50 text-red-600" },
    };
    return (
      statusMap[statusValue] || {
        label: statusValue,
        color: "bg-gray-100 text-gray-700",
      }
    );
  };

  // 배정되지 않은 서비스 계산
  const unassignedServices = useMemo(() => {
    if (!application) return [];
    const assignedServices =
      application.assignments?.flatMap((a) => a.assigned_services) || [];
    return application.selected_services.filter(
      (s) => !assignedServices.includes(s)
    );
  }, [application]);

  // 검색 필터링된 협력사 목록
  const filteredPartners = useMemo(() => {
    const query = partnerSearchQuery.toLowerCase().trim();
    if (!query) return sortedPartners;

    const filterFn = (p: PartnerWithMatch) =>
      p.company_name.toLowerCase().includes(query) ||
      p.representative_name?.toLowerCase().includes(query) ||
      p.service_areas.some((s) =>
        getServiceName(s).toLowerCase().includes(query)
      );

    return {
      matched: sortedPartners.matched.filter(filterFn),
      unmatched: sortedPartners.unmatched.filter(filterFn),
    };
  }, [sortedPartners, partnerSearchQuery]);

  // 선택된 협력사 정보
  const selectedPartner = useMemo(() => {
    if (!assignmentForm.partner_id) return null;
    return (
      sortedPartners.matched.find((p) => p.id === assignmentForm.partner_id) ||
      sortedPartners.unmatched.find((p) => p.id === assignmentForm.partner_id)
    );
  }, [sortedPartners, assignmentForm.partner_id]);

  // ActivityTimeline용 노트 변환
  const timelineNotes = useMemo<NoteItem[]>(() => {
    return notes.map((note) => ({
      id: note.id,
      content: note.content,
      admin_name: note.admin_name,
      created_at: note.created_at,
    }));
  }, [notes]);

  // ActivityTimeline용 변경 이력 변환
  const timelineAuditLogs = useMemo<AuditItem[]>(() => {
    return auditLogs.map((log) => ({
      id: log.id,
      summary: log.summary || "",
      admin_name: log.admin_name || undefined,
      created_at: log.created_at,
    }));
  }, [auditLogs]);

  // 헬퍼 함수들 (useMemo보다 먼저 정의)
  const formatPhone = (phone: string) => {
    const cleaned = phone.replace(/\D/g, "");
    if (cleaned.length === 11) {
      return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 7)}-${cleaned.slice(
        7
      )}`;
    }
    return phone;
  };

  // 금액 천단위 콤마 포맷팅
  const formatCurrency = (value: number | ""): string => {
    if (value === "" || value === 0) return "";
    return value.toLocaleString("ko-KR");
  };

  // 콤마가 포함된 문자열에서 숫자만 추출
  const parseCurrency = (value: string): number | "" => {
    const numericValue = value.replace(/[^\d]/g, "");
    if (numericValue === "") return "";
    return Number(numericValue);
  };

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "방금 전";
    if (diffMins < 60) return `${diffMins}분 전`;
    if (diffHours < 24) return `${diffHours}시간 전`;
    if (diffDays < 7) return `${diffDays}일 전`;

    return date.toLocaleDateString("ko-KR", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusInfo = (statusValue: string) => {
    return (
      STATUS_OPTIONS.find((s) => s.value === statusValue) || STATUS_OPTIONS[0]
    );
  };

  // 요약 카드 데이터
  const summaryItems = useMemo<SummaryCardItem[]>(() => {
    if (!application) return [];
    return [
      {
        icon: <User size={20} />,
        iconBgColor: "bg-blue-100",
        iconColor: "text-blue-600",
        label: "고객명",
        value: application.customer_name,
      },
      {
        icon: <Phone size={20} />,
        iconBgColor: "bg-green-100",
        iconColor: "text-green-600",
        label: "연락처",
        value: formatPhone(application.customer_phone),
      },
      {
        icon: <CalendarIcon size={20} />,
        iconBgColor: "bg-purple-100",
        iconColor: "text-purple-600",
        label: "신청일",
        value: new Date(application.created_at).toLocaleDateString("ko-KR"),
      },
      {
        icon: <Wrench size={20} />,
        iconBgColor: "bg-orange-100",
        iconColor: "text-orange-600",
        label: "서비스",
        value: `${application.selected_services.length}개 선택`,
      },
    ];
  }, [application]);

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
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
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* ===== 통합 헤더: 신청 요약 ===== */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
        {/* 상단: 제목 + 상태 */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div className="flex items-start gap-3">
            <Link
              href="/admin/applications"
              className="p-2 rounded-xl hover:bg-gray-100 transition-colors"
            >
              <ArrowLeft size={20} className="text-gray-600" />
            </Link>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-lg font-bold text-gray-900">
                  {application.application_number}
                </h1>
                <span
                  className={`inline-flex px-2.5 py-0.5 text-sm font-semibold rounded-full border ${statusInfo.color}`}
                >
                  {statusInfo.label}
                </span>
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
                <span>
                  등록:{" "}
                  {new Date(application.created_at).toLocaleDateString("ko-KR")}
                </span>
                {application.updated_at !== application.created_at && (
                  <span>
                    · 수정:{" "}
                    {new Date(application.updated_at).toLocaleDateString(
                      "ko-KR"
                    )}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* 헤더 액션 버튼들 */}
          <div className="flex items-center gap-2">
            {/* 문자 발송 버튼 */}
            <button
              onClick={() => setShowMMSSheet(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <MessageSquare size={14} />
              문자 발송
            </button>

            {/* 상태 변경 드롭다운 */}
            <div className="relative">
              <button
                onClick={() =>
                  setShowStatusHeaderDropdown(!showStatusHeaderDropdown)
                }
                disabled={isSaving}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium border ${statusInfo.color} hover:opacity-80 transition-opacity`}
              >
                {isSaving ? (
                  <Loader2 className="animate-spin" size={14} />
                ) : (
                  <>
                    {statusInfo.label}
                    <ChevronDown size={14} />
                  </>
                )}
              </button>

            {showStatusHeaderDropdown && (
              <div className="absolute right-0 mt-2 w-44 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
                {STATUS_OPTIONS.filter((opt) => opt.value !== status).map(
                  (option) => (
                    <button
                      key={option.value}
                      onClick={() => {
                        if (option.value === "cancelled") {
                          setShowCancelModal(true);
                        } else {
                          setStatus(option.value);
                        }
                        setShowStatusHeaderDropdown(false);
                      }}
                      className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 transition-colors"
                    >
                      {option.label}
                    </button>
                  )
                )}
              </div>
            )}
            </div>
          </div>
        </div>

        {/* 하단: 요약 정보 */}
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {summaryItems.map((item, index) => (
              <div key={index} className="flex items-center gap-2.5">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${item.iconBgColor}`}
                >
                  <span className={item.iconColor}>{item.icon}</span>
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-gray-500">{item.label}</p>
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {item.value}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 드롭다운 외부 클릭 시 닫기 */}
      {showStatusHeaderDropdown && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setShowStatusHeaderDropdown(false)}
        />
      )}

      {/* Messages */}
      {error && (
        <div className="bg-red-50 border border-red-100 rounded-xl p-4 text-red-600 flex items-center gap-3">
          <AlertCircle size={20} />
          <p className="text-sm">{error}</p>
        </div>
      )}
      {successMessage && (
        <div className="bg-primary-50 border border-primary-100 rounded-xl p-4 text-primary-700 flex items-center gap-3">
          <CheckCircle size={20} />
          <p className="text-sm">{successMessage}</p>
        </div>
      )}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* ===== Left Column: 서비스 상세 (3/5) ===== */}
        <div className="lg:col-span-3 space-y-6">
          {/* 서비스 정보 */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <button
              onClick={() => toggleSection("service")}
              className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
            >
              <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                <Wrench size={18} className="text-primary" />
                서비스 상세
              </h2>
              {expandedSections.service ? (
                <ChevronUp size={18} />
              ) : (
                <ChevronDown size={18} />
              )}
            </button>

            {expandedSections.service && (
              <div className="px-4 pb-4 space-y-4">
                {/* 선택한 서비스 */}
                <div>
                  <p className="text-xs text-gray-500 mb-2">선택 서비스</p>
                  <div className="flex flex-wrap gap-1.5">
                    {application.selected_services.map((service, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 bg-primary-50 text-primary-700 text-sm font-medium rounded-full"
                      >
                        {getServiceName(service)}
                      </span>
                    ))}
                  </div>
                </div>

                {/* 주소 */}
                <div className="flex items-start gap-2 p-3 bg-gray-50 rounded-xl">
                  <MapPin
                    size={16}
                    className="text-gray-400 mt-0.5 flex-shrink-0"
                  />
                  <div className="text-sm">
                    <SafeText
                      text={application.address}
                      className="font-medium text-gray-900"
                      as="p"
                    />
                    {application.address_detail && (
                      <SafeText
                        text={application.address_detail}
                        className="text-gray-600"
                        as="p"
                      />
                    )}
                  </div>
                </div>

                {/* 전달사항 */}
                <div>
                  <p className="text-xs text-gray-500 mb-2">전달사항</p>
                  <SafeBlockText
                    text={application.description}
                    className="text-sm text-gray-700 bg-gray-50 p-3 rounded-xl leading-relaxed"
                  />
                </div>

                {/* 희망 일정 */}
                {(application.preferred_consultation_date ||
                  application.preferred_work_date) && (
                  <div className="grid grid-cols-2 gap-3">
                    {application.preferred_consultation_date && (
                      <div className="flex items-center gap-2 p-2.5 bg-yellow-50 rounded-lg border border-yellow-100">
                        <CalendarIcon size={14} className="text-yellow-600" />
                        <div className="text-xs">
                          <p className="text-yellow-700">희망 상담일</p>
                          <p className="font-medium text-yellow-900">
                            {application.preferred_consultation_date}
                          </p>
                        </div>
                      </div>
                    )}
                    {application.preferred_work_date && (
                      <div className="flex items-center gap-2 p-2.5 bg-orange-50 rounded-lg border border-orange-100">
                        <CalendarIcon size={14} className="text-orange-600" />
                        <div className="text-xs">
                          <p className="text-orange-700">희망 작업일</p>
                          <p className="font-medium text-orange-900">
                            {application.preferred_work_date}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* 첨부 사진 - Compact Grid */}
                {application.photos && application.photos.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs text-gray-500 flex items-center gap-1.5">
                        <ImageIcon size={12} />
                        첨부 사진 ({application.photos.length}장)
                      </p>
                      <button
                        onClick={handleDownloadAllPhotos}
                        disabled={isDownloadingAll}
                        className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-primary hover:bg-primary-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title="전체 다운로드 (ZIP)"
                      >
                        {isDownloadingAll ? (
                          <>
                            <Loader2 size={12} className="animate-spin" />
                            <span>다운로드 중...</span>
                          </>
                        ) : (
                          <>
                            <Download size={12} />
                            <span>전체 다운로드</span>
                          </>
                        )}
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {application.photos.slice(0, 6).map((photo, idx) => (
                        <div
                          key={idx}
                          className="relative w-24 h-24 bg-gray-100 rounded-xl overflow-hidden group"
                        >
                          <button
                            type="button"
                            onClick={() => {
                              setLightboxIndex(idx);
                              setLightboxOpen(true);
                            }}
                            className="w-full h-full hover:ring-2 hover:ring-primary transition-all"
                          >
                            <img
                              src={`${FILE_BASE_URL}${photo}`}
                              alt={`첨부 사진 ${idx + 1}`}
                              className="w-full h-full object-cover"
                            />
                          </button>
                          {/* 호버 시 버튼 표시 */}
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-2 pointer-events-none">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setLightboxIndex(idx);
                                setLightboxOpen(true);
                              }}
                              className="p-2.5 rounded-full bg-white/90 text-gray-700 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-auto hover:bg-white shadow-sm"
                              title="확대"
                            >
                              <ZoomIn size={20} />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDownloadPhoto(photo, idx);
                              }}
                              disabled={downloadingPhoto === idx}
                              className="p-2.5 rounded-full bg-white/90 text-gray-700 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-auto hover:bg-white shadow-sm disabled:opacity-50"
                              title="다운로드"
                            >
                              {downloadingPhoto === idx ? (
                                <Loader2 size={20} className="animate-spin" />
                              ) : (
                                <Download size={20} />
                              )}
                            </button>
                          </div>
                        </div>
                      ))}
                      {application.photos.length > 6 && (
                        <button
                          type="button"
                          onClick={() => {
                            setLightboxIndex(6);
                            setLightboxOpen(true);
                          }}
                          className="w-24 h-24 bg-gray-200 rounded-xl flex items-center justify-center text-lg font-medium text-gray-600 hover:bg-gray-300 transition-colors"
                        >
                          +{application.photos.length - 6}
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ===== 협력사 배정 (1:N) ===== */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <button
              onClick={() => toggleSection("assignments")}
              className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
            >
              <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                <Users size={18} className="text-primary" />
                협력사 배정
                {application.assignments &&
                  application.assignments.length > 0 && (
                    <span className="text-xs font-normal text-gray-500 ml-1">
                      ({application.assignments.length}개)
                    </span>
                  )}
              </h2>
              {expandedSections.assignments ? (
                <ChevronUp size={18} />
              ) : (
                <ChevronDown size={18} />
              )}
            </button>

            {expandedSections.assignments && (
              <div className="px-4 pb-4 space-y-4">
                {/* 미배정 서비스 알림 */}
                {unassignedServices.length > 0 && (
                  <div className="p-3 bg-amber-50 border border-amber-100 rounded-lg">
                    <div className="flex items-start gap-2">
                      <AlertCircle
                        size={16}
                        className="text-amber-600 flex-shrink-0 mt-0.5"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-amber-800 mb-1">
                          미배정 서비스 ({unassignedServices.length}개)
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {unassignedServices.map((s, i) => (
                            <span
                              key={i}
                              className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs rounded-full"
                            >
                              {getServiceName(s)}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 배정 목록 */}
                {application.assignments &&
                application.assignments.length > 0 ? (
                  <div className="space-y-3">
                    {application.assignments.map((assignment) => {
                      const statusInfo = getAssignmentStatusInfo(
                        assignment.status
                      );
                      const partner = partners.find(
                        (p) => p.id === assignment.partner_id
                      );

                      return (
                        <div
                          key={assignment.id}
                          className="border border-gray-200 rounded-xl p-4 hover:border-primary/30 transition-colors"
                        >
                          <div className="flex items-start justify-between gap-3 mb-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <Building2 size={14} className="text-primary" />
                                <span className="font-semibold text-gray-900">
                                  {assignment.partner_name ||
                                    assignment.partner_company ||
                                    "알 수 없음"}
                                </span>
                                <span
                                  className={`px-2 py-0.5 text-xs font-medium rounded-full ${statusInfo.color}`}
                                >
                                  {statusInfo.label}
                                </span>
                              </div>
                              {partner && (
                                <a
                                  href={`tel:${partner.contact_phone}`}
                                  className="text-xs text-gray-500 hover:text-primary flex items-center gap-1"
                                >
                                  <Phone size={10} />
                                  {formatPhone(partner.contact_phone)}
                                </a>
                              )}
                            </div>
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => {
                                  setQuoteAssignmentId(assignment.id);
                                  setIsQuoteModalOpen(true);
                                }}
                                className="flex items-center gap-1 px-2 py-1 text-xs text-gray-600 hover:text-green-700 hover:bg-green-50 rounded-lg transition-colors border border-gray-200 hover:border-green-200"
                              >
                                <FileText size={12} />
                                <span>견적</span>
                              </button>
                              <button
                                onClick={() => {
                                  setPhotosAssignmentId(assignment.id);
                                  setIsPhotosModalOpen(true);
                                }}
                                className="flex items-center gap-1 px-2 py-1 text-xs text-gray-600 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition-colors border border-gray-200 hover:border-purple-200"
                              >
                                <Camera size={12} />
                                <span>사진</span>
                              </button>
                              <button
                                onClick={() => {
                                  setUrlAssignmentId(assignment.id);
                                  loadAssignmentUrl(assignment.id);
                                  setIsUrlModalOpen(true);
                                }}
                                className="flex items-center gap-1 px-2 py-1 text-xs text-gray-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors border border-gray-200 hover:border-blue-200"
                                title="협력사 포털 URL"
                              >
                                <Link2 size={12} />
                                <span>협력사</span>
                              </button>
                              <button
                                onClick={() => {
                                  setCustomerUrlAssignmentId(assignment.id);
                                  setIsCustomerUrlModalOpen(true);
                                }}
                                className="flex items-center gap-1 px-2 py-1 text-xs text-gray-600 hover:text-cyan-700 hover:bg-cyan-50 rounded-lg transition-colors border border-gray-200 hover:border-cyan-200"
                                title="고객 열람 URL"
                              >
                                <Link2 size={12} />
                                <span>고객</span>
                              </button>
                              <button
                                onClick={() =>
                                  openEditAssignmentModal(assignment)
                                }
                                className="flex items-center gap-1 px-2 py-1 text-xs text-gray-600 hover:text-primary hover:bg-primary-50 rounded-lg transition-colors border border-gray-200 hover:border-primary-200"
                              >
                                <Pencil size={12} />
                                <span>수정</span>
                              </button>
                              <button
                                onClick={() =>
                                  handleDeleteAssignment(assignment.id)
                                }
                                disabled={
                                  isDeletingAssignment === assignment.id
                                }
                                className="flex items-center gap-1 px-2 py-1 text-xs text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-gray-200 hover:border-red-200 disabled:opacity-50"
                              >
                                {isDeletingAssignment === assignment.id ? (
                                  <Loader2 size={12} className="animate-spin" />
                                ) : (
                                  <Trash2 size={12} />
                                )}
                                <span>삭제</span>
                              </button>
                            </div>
                          </div>

                          {/* 담당 서비스 */}
                          <div className="flex flex-wrap gap-1 mb-3">
                            {assignment.assigned_services.map((s, i) => (
                              <span
                                key={i}
                                className="px-2 py-0.5 bg-primary-50 text-primary-700 text-xs font-medium rounded-full"
                              >
                                {getServiceName(s)}
                              </span>
                            ))}
                          </div>

                          {/* 일정 & 비용 */}
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            {(assignment.scheduled_date ||
                              assignment.scheduled_time) && (
                              <div className="flex items-center gap-1.5 text-gray-600">
                                <CalendarIcon
                                  size={12}
                                  className="text-gray-400"
                                />
                                <span>
                                  {assignment.scheduled_date || "미정"}
                                  {assignment.scheduled_time &&
                                    ` ${assignment.scheduled_time}`}
                                </span>
                              </div>
                            )}
                            {(assignment.estimated_cost ||
                              assignment.final_cost) && (
                              <div className="flex items-center gap-1.5 text-gray-600">
                                <span className="text-gray-400">₩</span>
                                <span>
                                  {assignment.final_cost
                                    ? `${assignment.final_cost.toLocaleString()}원 (최종)`
                                    : assignment.estimated_cost
                                    ? `${assignment.estimated_cost.toLocaleString()}원 (견적)`
                                    : ""}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Users size={32} className="mx-auto mb-2 text-gray-300" />
                    <p className="text-sm">배정된 협력사가 없습니다</p>
                    <p className="text-xs text-gray-400 mt-1">
                      아래 버튼을 클릭하여 협력사를 배정하세요
                    </p>
                  </div>
                )}

                {/* 배정 추가 버튼 */}
                <button
                  onClick={openNewAssignmentModal}
                  className="w-full py-2.5 border-2 border-dashed border-gray-200 text-gray-600 font-medium rounded-xl hover:border-primary hover:text-primary hover:bg-primary-50/50 flex items-center justify-center gap-2 transition-colors"
                >
                  <Plus size={18} />
                  협력사 배정 추가
                </button>
              </div>
            )}
          </div>

          {/* ===== 활동 & 메모 히스토리 ===== */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <button
              onClick={() => toggleSection("activity")}
              className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
            >
              <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                <History size={18} className="text-primary" />
                활동 이력
                <span className="text-xs font-normal text-gray-500 ml-1">
                  (메모 {notes.length}개, 변경 {auditLogs.length}개)
                </span>
              </h2>
              {expandedSections.activity ? (
                <ChevronUp size={18} />
              ) : (
                <ChevronDown size={18} />
              )}
            </button>

            {expandedSections.activity && (
              <div className="px-4 pb-4">
                <ActivityTimeline
                  notes={timelineNotes}
                  auditLogs={timelineAuditLogs}
                  showInput={true}
                  isAddingNote={isAddingNote}
                  onAddNote={handleAddNote}
                  onDeleteNote={handleDeleteNote}
                  emptyMessage="활동 이력이 없습니다"
                />
              </div>
            )}
          </div>
        </div>

        {/* ===== Right Column: 처리 관리 (2/5) ===== */}
        <div className="lg:col-span-2">
          <div className="lg:sticky lg:top-6 space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <button
              onClick={() => toggleSection("management")}
              className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
            >
              <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                <FileText size={18} className="text-primary" />
                처리 관리
              </h2>
              {expandedSections.management ? (
                <ChevronUp size={18} />
              ) : (
                <ChevronDown size={18} />
              )}
            </button>

            {expandedSections.management && (
              <div className="px-4 pb-4 space-y-4">
                {/* 상태 */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">
                    상태
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  >
                    {STATUS_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 안내 메시지 */}
                <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg">
                  <p className="text-xs text-blue-700">
                    협력사 배정, 일정, 비용은 아래 &quot;협력사 배정&quot; 섹션에서 관리합니다.
                  </p>
                </div>

                {/* SMS 알림 & 저장 */}
                <div className="pt-3 border-t border-gray-100 space-y-3">
                  {hasStatusChanged &&
                    willSendSmsForStatusChange(originalStatus, status) && (
                      <label className="flex items-start gap-2.5 p-2.5 bg-secondary-50 rounded-lg cursor-pointer hover:bg-secondary-100 transition-colors">
                        <input
                          type="checkbox"
                          checked={sendSms}
                          onChange={(e) => setSendSms(e.target.checked)}
                          className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary mt-0.5"
                        />
                        <div>
                          <div className="flex items-center gap-1.5">
                            <MessageSquare
                              size={14}
                              className="text-secondary"
                            />
                            <span className="font-medium text-secondary-800 text-sm">
                              SMS 알림 발송
                            </span>
                          </div>
                          <p className="text-xs text-secondary-600 mt-0.5">
                            고객에게 상태 변경 알림
                          </p>
                        </div>
                      </label>
                    )}

                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="w-full py-2.5 bg-primary text-white font-medium rounded-lg hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="animate-spin mr-2" size={18} />
                        저장 중...
                      </>
                    ) : (
                      <>
                        <Save size={18} className="mr-2" />
                        저장하기
                      </>
                    )}
                  </button>

                  {/* 취소 버튼 (이미 취소된 상태가 아닐 때만 표시) */}
                  {application.status !== "cancelled" && (
                    <button
                      onClick={() => setShowCancelModal(true)}
                      className="w-full py-2.5 border border-red-200 text-red-600 font-medium rounded-lg hover:bg-red-50 flex items-center justify-center transition-colors"
                    >
                      <XCircle size={18} className="mr-2" />
                      신청 취소
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

            {/* 빠른 정보 */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Zap size={16} className="text-amber-500" />
                빠른 정보
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">배정 협력사</span>
                  <span className="font-medium">
                    {application.assignments?.length || 0}개
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">선택 서비스</span>
                  <span className="font-medium">
                    {application.selected_services.length}개
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">미배정 서비스</span>
                  <span
                    className={`font-medium ${
                      unassignedServices.length > 0
                        ? "text-amber-600"
                        : "text-green-600"
                    }`}
                  >
                    {unassignedServices.length}개
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">메모</span>
                  <span className="font-medium">{notes.length}개</span>
                </div>
              </div>
            </div>

            {/* 고객 이력 */}
            {customerHistory && customerHistory.total_applications > 1 && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
                <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <User size={16} className="text-blue-500" />
                  고객 이력
                  <span className="text-xs font-normal text-gray-500 ml-auto">
                    총 {customerHistory.total_applications}건
                  </span>
                </h3>
                <p className="text-xs text-gray-500 mb-3">
                  {customerHistory.customer_phone_masked}
                </p>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {customerHistory.applications
                    .filter((app) => app.id !== id) // 현재 신청 제외
                    .map((app) => (
                      <Link
                        key={app.id}
                        href={`/admin/applications/${app.id}`}
                        className="block p-2.5 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className="text-sm font-medium text-gray-900">
                            {app.application_number}
                          </span>
                          <span
                            className={`px-1.5 py-0.5 text-xs font-medium rounded ${
                              getStatusInfo(app.status).color
                            }`}
                          >
                            {app.status_label}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <span>
                            {new Date(app.created_at).toLocaleDateString("ko-KR")}
                          </span>
                          <span>·</span>
                          <span>
                            {app.selected_services.slice(0, 2).map(getServiceName).join(", ")}
                            {app.selected_services.length > 2 && ` 외 ${app.selected_services.length - 2}개`}
                          </span>
                        </div>
                      </Link>
                    ))}
                </div>
                {customerHistory.total_applications > 5 && (
                  <p className="text-xs text-gray-400 text-center mt-2">
                    최근 {Math.min(customerHistory.applications.length, 10)}건 표시
                  </p>
                )}
              </div>
            )}

          </div>
        </div>
      </div>

      {/* Lightbox for photos */}
      {application.photos && application.photos.length > 0 && (
        <Lightbox
          open={lightboxOpen}
          close={() => setLightboxOpen(false)}
          index={lightboxIndex}
          slides={application.photos.map((photo) => ({
            src: `${FILE_BASE_URL}${photo}`,
          }))}
        />
      )}

      {/* 취소 확인 모달 */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <AlertCircle size={20} className="text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  신청 취소
                </h3>
                <p className="text-sm text-gray-500">
                  이 작업은 되돌릴 수 없습니다
                </p>
              </div>
            </div>

            <div className="mb-4 space-y-3">
              <p className="text-sm text-gray-700">
                <span className="font-medium">
                  {application.application_number}
                </span>{" "}
                신청을 취소하시겠습니까?
              </p>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-600">
                  취소 사유 (선택)
                </label>
                <select
                  value={cancelReasonSelect}
                  onChange={(e) => setCancelReasonSelect(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 bg-white"
                >
                  {CANCEL_REASONS.map((reason) => (
                    <option key={reason.value} value={reason.value}>
                      {reason.label}
                    </option>
                  ))}
                </select>

                {cancelReasonSelect === "other" && (
                  <textarea
                    value={cancelReasonCustom}
                    onChange={(e) => setCancelReasonCustom(e.target.value)}
                    placeholder="취소 사유를 직접 입력하세요..."
                    rows={2}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                  />
                )}
              </div>

              {/* SMS 발송 선택 */}
              <label className="flex items-center gap-2.5 p-2.5 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                <input
                  type="checkbox"
                  checked={sendCancelSms}
                  onChange={(e) => setSendCancelSms(e.target.checked)}
                  className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-1.5">
                    <MessageSquare size={14} className="text-gray-600" />
                    <span className="font-medium text-gray-800 text-sm">
                      고객에게 취소 알림 SMS 발송
                    </span>
                  </div>
                </div>
              </label>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowCancelModal(false);
                  setCancelReasonSelect("");
                  setCancelReasonCustom("");
                }}
                disabled={isCancelling}
                className="flex-1 py-2.5 border border-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                닫기
              </button>
              <button
                onClick={handleCancelApplication}
                disabled={isCancelling}
                className="flex-1 py-2.5 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
              >
                {isCancelling ? (
                  <>
                    <Loader2 className="animate-spin mr-2" size={16} />
                    처리 중...
                  </>
                ) : (
                  "취소 확인"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 배정 생성/수정 모달 */}
      {isAssignmentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
            {/* 헤더 */}
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingAssignment ? "배정 수정" : "새 협력사 배정"}
              </h3>
              <button
                onClick={() => {
                  setIsAssignmentModalOpen(false);
                  resetAssignmentForm();
                }}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* 본문 (스크롤) */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* 협력사 선택 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  담당 협력사 <span className="text-red-500">*</span>
                </label>

                {/* 수정 모드일 때는 읽기 전용으로 표시 */}
                {editingAssignment ? (
                  <div className="w-full border border-gray-200 bg-gray-50 rounded-lg px-3 py-2.5 text-sm text-gray-700">
                    {selectedPartner?.company_name || "협력사 정보 없음"}
                  </div>
                ) : (
                  <Popover
                    open={isPartnerDropdownOpen}
                    onOpenChange={setIsPartnerDropdownOpen}
                  >
                    <PopoverTrigger asChild>
                      <button
                        type="button"
                        className={`w-full flex items-center justify-between border rounded-lg px-3 py-2.5 text-sm text-left transition-colors ${
                          isPartnerDropdownOpen
                            ? "border-primary ring-2 ring-primary/20"
                            : "border-gray-200 hover:border-gray-300"
                        } ${
                          selectedPartner
                            ? "text-gray-900"
                            : "text-gray-500"
                        }`}
                      >
                        <span className="truncate">
                          {selectedPartner
                            ? selectedPartner.company_name
                            : "협력사를 선택하세요"}
                        </span>
                        <ChevronDown
                          size={16}
                          className={`flex-shrink-0 ml-2 transition-transform ${
                            isPartnerDropdownOpen ? "rotate-180" : ""
                          }`}
                        />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent
                      className="w-[var(--radix-popover-trigger-width)] p-0"
                      align="start"
                      sideOffset={4}
                    >
                      {/* 검색 입력 */}
                      <div className="p-2 border-b border-gray-100">
                        <div className="relative">
                          <Search
                            size={14}
                            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400"
                          />
                          <input
                            type="text"
                            value={partnerSearchQuery}
                            onChange={(e) =>
                              setPartnerSearchQuery(e.target.value)
                            }
                            placeholder="협력사명, 담당자, 서비스로 검색..."
                            className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                            autoFocus
                          />
                        </div>
                      </div>

                      {/* 협력사 목록 */}
                      <div className="max-h-64 overflow-y-auto">
                        {/* 추천 협력사 */}
                        {filteredPartners.matched.length > 0 && (
                          <div>
                            <div className="px-3 py-1.5 text-xs font-semibold text-primary-700 bg-primary-50 flex items-center gap-1.5 sticky top-0">
                              <Star size={12} className="fill-current" />
                              추천 협력사 (서비스 매칭)
                            </div>
                            {filteredPartners.matched.map((partner) => (
                              <button
                                key={partner.id}
                                type="button"
                                onClick={() => {
                                  setAssignmentForm((prev) => ({
                                    ...prev,
                                    partner_id: partner.id,
                                  }));
                                  setIsPartnerDropdownOpen(false);
                                  setPartnerSearchQuery("");
                                }}
                                className={`w-full text-left px-3 py-2.5 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-b-0 ${
                                  assignmentForm.partner_id === partner.id
                                    ? "bg-primary-50"
                                    : ""
                                }`}
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                      <span className="font-medium text-gray-900 text-sm">
                                        {partner.company_name}
                                      </span>
                                      <span className="px-1.5 py-0.5 text-xs font-medium bg-green-100 text-green-700 rounded">
                                        {partner.matchCount}개 매칭
                                      </span>
                                    </div>
                                    {partner.representative_name && (
                                      <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                                        <User size={10} />
                                        {partner.representative_name}
                                        {partner.contact_phone && (
                                          <>
                                            <span className="mx-1">·</span>
                                            <Phone size={10} />
                                            {formatPhone(partner.contact_phone)}
                                          </>
                                        )}
                                      </p>
                                    )}
                                    {/* 매칭된 서비스 태그 */}
                                    <div className="flex flex-wrap gap-1 mt-1.5">
                                      {partner.matchedServices
                                        .slice(0, 3)
                                        .map((s, i) => (
                                          <span
                                            key={i}
                                            className="px-1.5 py-0.5 text-xs bg-primary-100 text-primary-700 rounded"
                                          >
                                            {getServiceName(s)}
                                          </span>
                                        ))}
                                      {partner.matchedServices.length > 3 && (
                                        <span className="px-1.5 py-0.5 text-xs bg-gray-100 text-gray-600 rounded">
                                          +{partner.matchedServices.length - 3}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  {assignmentForm.partner_id === partner.id && (
                                    <Check
                                      size={16}
                                      className="text-primary flex-shrink-0 mt-0.5"
                                    />
                                  )}
                                </div>
                              </button>
                            ))}
                          </div>
                        )}

                        {/* 기타 협력사 */}
                        {filteredPartners.unmatched.length > 0 && (
                          <div>
                            <div className="px-3 py-1.5 text-xs font-semibold text-gray-600 bg-gray-100 sticky top-0">
                              기타 협력사
                            </div>
                            {filteredPartners.unmatched.map((partner) => (
                              <button
                                key={partner.id}
                                type="button"
                                onClick={() => {
                                  setAssignmentForm((prev) => ({
                                    ...prev,
                                    partner_id: partner.id,
                                  }));
                                  setIsPartnerDropdownOpen(false);
                                  setPartnerSearchQuery("");
                                }}
                                className={`w-full text-left px-3 py-2.5 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-b-0 ${
                                  assignmentForm.partner_id === partner.id
                                    ? "bg-primary-50"
                                    : ""
                                }`}
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex-1 min-w-0">
                                    <span className="font-medium text-gray-900 text-sm">
                                      {partner.company_name}
                                    </span>
                                    {partner.representative_name && (
                                      <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                                        <User size={10} />
                                        {partner.representative_name}
                                        {partner.contact_phone && (
                                          <>
                                            <span className="mx-1">·</span>
                                            <Phone size={10} />
                                            {formatPhone(partner.contact_phone)}
                                          </>
                                        )}
                                      </p>
                                    )}
                                  </div>
                                  {assignmentForm.partner_id === partner.id && (
                                    <Check
                                      size={16}
                                      className="text-primary flex-shrink-0 mt-0.5"
                                    />
                                  )}
                                </div>
                              </button>
                            ))}
                          </div>
                        )}

                        {/* 검색 결과 없음 */}
                        {filteredPartners.matched.length === 0 &&
                          filteredPartners.unmatched.length === 0 && (
                            <div className="px-3 py-6 text-center text-gray-500">
                              <Building2
                                size={24}
                                className="mx-auto mb-2 text-gray-300"
                              />
                              <p className="text-sm">
                                {partnerSearchQuery
                                  ? "검색 결과가 없습니다"
                                  : "등록된 협력사가 없습니다"}
                              </p>
                            </div>
                          )}
                      </div>
                    </PopoverContent>
                  </Popover>
                )}

                {/* 선택된 협력사 미리보기 카드 */}
                {selectedPartner && !editingAssignment && (
                  <div className="mt-2 p-3 bg-primary-50/50 border border-primary-100 rounded-lg">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Building2 size={14} className="text-primary" />
                          <span className="font-semibold text-gray-900 text-sm">
                            {selectedPartner.company_name}
                          </span>
                          {selectedPartner.isMatched && (
                            <span className="px-1.5 py-0.5 text-xs font-medium bg-green-100 text-green-700 rounded">
                              {selectedPartner.matchCount}개 매칭
                            </span>
                          )}
                        </div>
                        {selectedPartner.representative_name && (
                          <p className="text-xs text-gray-600 flex items-center gap-1.5">
                            <User size={10} />
                            {selectedPartner.representative_name}
                          </p>
                        )}
                        {selectedPartner.contact_phone && (
                          <p className="text-xs text-gray-600 flex items-center gap-1.5 mt-0.5">
                            <Phone size={10} />
                            {formatPhone(selectedPartner.contact_phone)}
                          </p>
                        )}
                        {/* 매칭 서비스 */}
                        {selectedPartner.isMatched && (
                          <div className="mt-2">
                            <p className="text-xs text-gray-500 mb-1">
                              매칭 서비스:
                            </p>
                            <div className="flex flex-wrap gap-1">
                              {selectedPartner.matchedServices.map((s, i) => (
                                <span
                                  key={i}
                                  className="px-1.5 py-0.5 text-xs bg-primary-100 text-primary-700 rounded"
                                >
                                  {getServiceName(s)}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          setAssignmentForm((prev) => ({
                            ...prev,
                            partner_id: "",
                          }))
                        }
                        className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                        title="선택 해제"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* 담당 서비스 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  담당 서비스 <span className="text-red-500">*</span>
                </label>
                <div className="border border-gray-200 rounded-lg p-3 space-y-2 max-h-40 overflow-y-auto">
                  {application?.selected_services.map((service) => {
                    const isChecked =
                      assignmentForm.assigned_services.includes(service);
                    // 다른 배정에 이미 할당된 서비스인지 확인 (현재 편집 중인 배정 제외)
                    const isAssignedToOther = application?.assignments?.some(
                      (a) =>
                        a.id !== editingAssignment?.id &&
                        a.assigned_services.includes(service)
                    );

                    return (
                      <label
                        key={service}
                        className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors ${
                          isAssignedToOther
                            ? "bg-gray-50 opacity-50"
                            : isChecked
                            ? "bg-primary-50"
                            : "hover:bg-gray-50"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          disabled={isAssignedToOther}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setAssignmentForm((prev) => ({
                                ...prev,
                                assigned_services: [
                                  ...prev.assigned_services,
                                  service,
                                ],
                              }));
                            } else {
                              setAssignmentForm((prev) => ({
                                ...prev,
                                assigned_services:
                                  prev.assigned_services.filter(
                                    (s) => s !== service
                                  ),
                              }));
                            }
                          }}
                          className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                        />
                        <span
                          className={`text-sm ${
                            isAssignedToOther
                              ? "text-gray-400 line-through"
                              : isChecked
                              ? "text-primary-700 font-medium"
                              : "text-gray-700"
                          }`}
                        >
                          {getServiceName(service)}
                        </span>
                        {isAssignedToOther && (
                          <span className="ml-auto text-xs text-gray-400">
                            (다른 배정)
                          </span>
                        )}
                      </label>
                    );
                  })}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  선택됨: {assignmentForm.assigned_services.length}개
                </p>
              </div>

              {/* 일정 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  예정 일정
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <DatePicker
                    date={assignmentForm.scheduled_date}
                    onDateChange={(date) =>
                      setAssignmentForm((prev) => ({
                        ...prev,
                        scheduled_date: date,
                      }))
                    }
                    placeholder="날짜"
                    fromDate={startOfDay(new Date())}
                  />
                  <select
                    value={assignmentForm.scheduled_time}
                    onChange={(e) =>
                      setAssignmentForm((prev) => ({
                        ...prev,
                        scheduled_time: e.target.value,
                      }))
                    }
                    className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  >
                    {TIME_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* 견적 비용 */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    견적 비용
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      inputMode="numeric"
                      value={formatCurrency(assignmentForm.estimated_cost)}
                      onChange={(e) =>
                        setAssignmentForm((prev) => ({
                          ...prev,
                          estimated_cost: parseCurrency(e.target.value),
                        }))
                      }
                      placeholder="0"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">
                      원
                    </span>
                  </div>
                  {assignmentForm.estimated_cost !== "" &&
                    assignmentForm.estimated_cost > 0 && (
                      <p className="text-xs text-blue-600 mt-1">
                        {numberToKoreanCurrency(assignmentForm.estimated_cost)}
                      </p>
                    )}
                </div>

                {/* 최종 비용 (수정 시에만 표시) */}
                {editingAssignment && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      최종 비용
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        inputMode="numeric"
                        value={formatCurrency(assignmentForm.final_cost)}
                        onChange={(e) =>
                          setAssignmentForm((prev) => ({
                            ...prev,
                            final_cost: parseCurrency(e.target.value),
                          }))
                        }
                        placeholder="0"
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">
                        원
                      </span>
                    </div>
                    {assignmentForm.final_cost !== "" &&
                      assignmentForm.final_cost > 0 && (
                        <p className="text-xs text-blue-600 mt-1">
                          {numberToKoreanCurrency(assignmentForm.final_cost)}
                        </p>
                      )}
                  </div>
                )}
              </div>

              {/* 견적 메모 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  견적 메모
                </label>
                <textarea
                  value={assignmentForm.estimate_note}
                  onChange={(e) =>
                    setAssignmentForm((prev) => ({
                      ...prev,
                      estimate_note: e.target.value,
                    }))
                  }
                  placeholder="견적에 대한 설명을 입력하세요 (예: 작업 범위, 추가 비용 안내 등)"
                  rows={2}
                  maxLength={1000}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
                />
                <p className="text-xs text-gray-400 mt-1 text-right">
                  {assignmentForm.estimate_note.length}/1000
                </p>
              </div>

              {/* 메모 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  메모
                </label>
                <textarea
                  value={assignmentForm.note}
                  onChange={(e) =>
                    setAssignmentForm((prev) => ({
                      ...prev,
                      note: e.target.value,
                    }))
                  }
                  placeholder="배정 관련 메모를 입력하세요..."
                  rows={2}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
                />
              </div>

              {/* SMS 알림 */}
              <label className="flex items-center gap-2.5 p-3 bg-secondary-50 rounded-lg cursor-pointer hover:bg-secondary-100 transition-colors">
                <input
                  type="checkbox"
                  checked={assignmentForm.send_sms}
                  onChange={(e) =>
                    setAssignmentForm((prev) => ({
                      ...prev,
                      send_sms: e.target.checked,
                    }))
                  }
                  className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-1.5">
                    <MessageSquare size={14} className="text-secondary" />
                    <span className="font-medium text-secondary-800 text-sm">
                      SMS 알림 발송
                    </span>
                  </div>
                  <p className="text-xs text-secondary-600 mt-0.5">
                    협력사에게 배정 알림 SMS를 발송합니다
                  </p>
                </div>
              </label>
            </div>

            {/* 푸터 */}
            <div className="flex gap-3 p-4 border-t border-gray-100">
              <button
                onClick={() => {
                  setIsAssignmentModalOpen(false);
                  resetAssignmentForm();
                }}
                disabled={isAssignmentSaving}
                className="flex-1 py-2.5 border border-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                취소
              </button>
              <button
                onClick={handleSaveAssignment}
                disabled={
                  isAssignmentSaving ||
                  !assignmentForm.partner_id ||
                  assignmentForm.assigned_services.length === 0
                }
                className="flex-1 py-2.5 bg-primary text-white font-medium rounded-lg hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
              >
                {isAssignmentSaving ? (
                  <>
                    <Loader2 className="animate-spin mr-2" size={16} />
                    저장 중...
                  </>
                ) : editingAssignment ? (
                  "수정"
                ) : (
                  "배정 추가"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 견적 상세 모달 */}
      {isQuoteModalOpen && quoteAssignmentId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* 헤더 */}
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <FileText size={20} className="text-primary" />
                견적 상세
              </h3>
              <button
                onClick={() => {
                  setIsQuoteModalOpen(false);
                  setQuoteAssignmentId(null);
                }}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* 본문 */}
            <div className="flex-1 overflow-y-auto p-4">
              <QuoteItemTable
                assignmentId={quoteAssignmentId}
                onTotalChange={(total) => {
                  // 견적 금액이 변경되면 로컬 상태만 업데이트 (전체 새로고침 불필요)
                  if (quoteAssignmentId && application?.assignments) {
                    setApplication((prev) => {
                      if (!prev || !prev.assignments) return prev;
                      return {
                        ...prev,
                        assignments: prev.assignments.map((a) =>
                          a.id === quoteAssignmentId
                            ? { ...a, estimated_cost: total }
                            : a
                        ),
                      };
                    });
                  }
                }}
              />
            </div>

            {/* 푸터 */}
            <div className="flex justify-end p-4 border-t border-gray-100">
              <button
                onClick={() => {
                  setIsQuoteModalOpen(false);
                  setQuoteAssignmentId(null);
                }}
                className="px-6 py-2.5 bg-primary text-white font-medium rounded-lg hover:bg-primary-600 transition-colors"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* URL 관리 모달 */}
      {isUrlModalOpen && urlAssignmentId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Link2 size={18} className="text-primary" />
                협력사 포털 URL 관리
              </h3>
              <button
                onClick={() => {
                  setIsUrlModalOpen(false);
                  setUrlAssignmentId(null);
                  setUrlInfo(null);
                }}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-4 space-y-4">
              {isLoadingUrl ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                </div>
              ) : urlInfo && !urlInfo.is_issued ? (
                /* URL 미발급 상태 - 발급 버튼 표시 */
                <div className="text-center py-6 space-y-4">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-2">
                    <Link2 size={28} className="text-gray-400" />
                  </div>
                  <div>
                    <p className="text-gray-700 font-medium mb-1">URL이 발급되지 않았습니다</p>
                    <p className="text-sm text-gray-500">협력사에게 공유할 URL을 발급하세요</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs text-gray-500">유효 기간 선택</p>
                    <div className="grid grid-cols-5 gap-2">
                      {[1, 3, 7, 14, 30].map((days) => (
                        <button
                          key={days}
                          onClick={() => handleGenerateUrl(days)}
                          disabled={isLoadingUrl}
                          className="flex items-center justify-center px-2 py-2 bg-primary text-white rounded-lg hover:bg-primary-600 transition-colors text-sm font-medium disabled:opacity-50"
                        >
                          {days}일
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : urlInfo && urlInfo.is_issued && urlInfo.is_expired ? (
                /* URL 만료 상태 - 재발급 안내 */
                <div className="text-center py-6 space-y-4">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-2">
                    <XCircle size={28} className="text-red-500" />
                  </div>
                  <div>
                    <p className="text-gray-700 font-medium mb-1">URL이 만료되었습니다</p>
                    <p className="text-sm text-gray-500">
                      만료일: {urlInfo.expires_at ? new Date(urlInfo.expires_at).toLocaleString("ko-KR") : "-"}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs text-gray-500">새 URL 발급 (유효 기간 선택)</p>
                    <div className="grid grid-cols-5 gap-2">
                      {[1, 3, 7, 14, 30].map((days) => (
                        <button
                          key={days}
                          onClick={() => handleRenewUrl()}
                          disabled={isLoadingUrl}
                          className="flex items-center justify-center px-2 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium disabled:opacity-50"
                        >
                          {days}일
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : urlInfo && urlInfo.is_issued && urlInfo.view_url ? (
                /* URL 활성 상태 - URL 관리 UI */
                <>
                  {/* URL 표시 및 복사 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      포털 URL
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        readOnly
                        value={urlInfo.view_url}
                        className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 text-gray-600"
                      />
                      <button
                        onClick={() => copyToClipboard(urlInfo.view_url!)}
                        className="p-2 bg-primary text-white rounded-lg hover:bg-primary-600 transition-colors"
                        title="URL 복사"
                      >
                        <Copy size={16} />
                      </button>
                    </div>
                  </div>

                  {/* 만료 시간 표시 */}
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Clock size={14} />
                    <span>
                      만료: {urlInfo.expires_at ? new Date(urlInfo.expires_at).toLocaleString("ko-KR") : "-"}
                    </span>
                  </div>

                  {/* 액션 버튼들 */}
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={handleRenewUrl}
                        disabled={isLoadingUrl}
                        className="flex items-center justify-center gap-1.5 px-3 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium disabled:opacity-50"
                      >
                        <RefreshCw size={14} />
                        재발급
                      </button>
                      <button
                        onClick={handleRevokeUrl}
                        disabled={isLoadingUrl}
                        className="flex items-center justify-center gap-1.5 px-3 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors text-sm font-medium disabled:opacity-50"
                      >
                        <XCircle size={14} />
                        만료
                      </button>
                    </div>
                    <div className="border-t pt-3">
                      <p className="text-xs text-gray-500 mb-2">기간 연장</p>
                      <div className="grid grid-cols-5 gap-1.5">
                        {[1, 3, 7, 14, 30].map((days) => (
                          <button
                            key={days}
                            onClick={() => handleExtendUrl(days)}
                            disabled={isLoadingUrl}
                            className="flex items-center justify-center px-2 py-1.5 bg-green-50 text-green-700 rounded hover:bg-green-100 transition-colors text-xs font-medium disabled:opacity-50"
                          >
                            {days}일
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  URL 정보를 불러올 수 없습니다
                </div>
              )}
            </div>

            <div className="flex justify-end p-4 border-t border-gray-100">
              <button
                onClick={() => {
                  setIsUrlModalOpen(false);
                  setUrlAssignmentId(null);
                  setUrlInfo(null);
                }}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 시공 사진 모달 */}
      {isPhotosModalOpen && photosAssignmentId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Camera size={18} className="text-primary" />
                시공 사진 관리
              </h3>
              <button
                onClick={() => {
                  setIsPhotosModalOpen(false);
                  setPhotosAssignmentId(null);
                }}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-4 overflow-y-auto flex-1">
              <WorkPhotoUpload
                applicationId={id}
                assignmentId={photosAssignmentId}
              />
            </div>
            <div className="flex justify-end p-4 border-t border-gray-100">
              <button
                onClick={() => {
                  setIsPhotosModalOpen(false);
                  setPhotosAssignmentId(null);
                }}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 고객 열람 URL 모달 */}
      {isCustomerUrlModalOpen && customerUrlAssignmentId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Link2 size={18} className="text-primary" />
                고객 열람 URL 관리
              </h3>
              <button
                onClick={() => {
                  setIsCustomerUrlModalOpen(false);
                  setCustomerUrlAssignmentId(null);
                }}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-4">
              <CustomerUrlManager
                applicationId={id}
                assignmentId={customerUrlAssignmentId}
              />
            </div>
            <div className="flex justify-end p-4 border-t border-gray-100">
              <button
                onClick={() => {
                  setIsCustomerUrlModalOpen(false);
                  setCustomerUrlAssignmentId(null);
                }}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MMS 발송 시트 */}
      {application && (
        <MMSSheet
          open={showMMSSheet}
          onOpenChange={setShowMMSSheet}
          recipientName={application.customer_name}
          recipientPhone={application.customer_phone}
          smsType="application"
          onComplete={() => {
            setSuccessMessage("문자가 성공적으로 발송되었습니다");
            setTimeout(() => setSuccessMessage(null), 3000);
          }}
        />
      )}
    </div>
  );
}
