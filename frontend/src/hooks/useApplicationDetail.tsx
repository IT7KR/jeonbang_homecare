"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { format, parse } from "date-fns";
import { User, Phone, Calendar as CalendarIcon, Wrench } from "lucide-react";
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
  ApplicationDetail,
  PartnerListItem,
  AuditLog,
  ApplicationNote,
  AssignmentSummary,
  AssignmentCreate,
  AssignmentUpdate,
  CustomerHistoryResponse,
} from "@/lib/api/admin";
import { willSendSmsForStatusChange } from "@/lib/constants/application";
import { getServiceName } from "@/lib/utils/service";
import type { SummaryCardItem, NoteItem, AuditItem } from "@/components/admin";

// 파일 URL 기본 경로
export const FILE_BASE_URL = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1"
).replace("/api/v1", "");

// 서비스 매칭 정보가 추가된 협력사 타입
export type PartnerWithMatch = PartnerListItem & {
  matchCount: number;
  matchedServices: string[];
  isMatched: boolean;
};

// 배정 폼 타입
export interface AssignmentFormData {
  partner_id: number | "";
  assigned_services: string[];
  scheduled_date: Date | undefined;
  scheduled_time: string;
  estimated_cost: number | "";
  final_cost: number | "";
  estimate_note: string;
  note: string;
  send_sms: boolean;
}

// 초기 배정 폼 상태
const initialAssignmentForm: AssignmentFormData = {
  partner_id: "",
  assigned_services: [],
  scheduled_date: undefined,
  scheduled_time: "",
  estimated_cost: "",
  final_cost: "",
  estimate_note: "",
  note: "",
  send_sms: true,
};

// 헬퍼 함수들
export const formatPhone = (phone: string) => {
  const cleaned = phone.replace(/\D/g, "");
  if (cleaned.length === 11) {
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 7)}-${cleaned.slice(7)}`;
  }
  return phone;
};

export const formatCurrency = (value: number | ""): string => {
  if (value === "" || value === 0) return "";
  return value.toLocaleString("ko-KR");
};

export const parseCurrency = (value: string): number | "" => {
  const numericValue = value.replace(/[^\d]/g, "");
  if (numericValue === "") return "";
  return Number(numericValue);
};

export const formatRelativeTime = (dateString: string) => {
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

export function useApplicationDetail(id: number) {
  const router = useRouter();
  const { getValidToken } = useAuthStore();
  const { confirm } = useConfirm();

  // 기본 데이터 상태
  const [application, setApplication] = useState<ApplicationDetail | null>(null);
  const [partners, setPartners] = useState<PartnerListItem[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [notes, setNotes] = useState<ApplicationNote[]>([]);
  const [customerHistory, setCustomerHistory] = useState<CustomerHistoryResponse | null>(null);

  // 로딩/에러 상태
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // 메모 상태
  const [isAddingNote, setIsAddingNote] = useState(false);

  // 취소 모달 상태
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReasonSelect, setCancelReasonSelect] = useState("");
  const [cancelReasonCustom, setCancelReasonCustom] = useState("");
  const [sendCancelSms, setSendCancelSms] = useState(true);
  const [isCancelling, setIsCancelling] = useState(false);

  // 상태 변경 관련
  const [status, setStatus] = useState("");
  const [originalStatus, setOriginalStatus] = useState("");
  const [sendSms, setSendSms] = useState(true);
  const [showStatusHeaderDropdown, setShowStatusHeaderDropdown] = useState(false);

  // 라이트박스 상태
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  // 다운로드 상태
  const [isDownloadingAll, setIsDownloadingAll] = useState(false);
  const [downloadingPhoto, setDownloadingPhoto] = useState<number | null>(null);

  // MMS 시트 상태
  const [showMMSSheet, setShowMMSSheet] = useState(false);

  // 섹션 접기/펼치기
  const [expandedSections, setExpandedSections] = useState({
    service: true,
    assignments: true,
    management: true,
    activity: true,
  });

  // 배정 관련 상태
  const [isAssignmentModalOpen, setIsAssignmentModalOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<AssignmentSummary | null>(null);
  const [isAssignmentSaving, setIsAssignmentSaving] = useState(false);
  const [isDeletingAssignment, setIsDeletingAssignment] = useState<number | null>(null);
  const [assignmentForm, setAssignmentForm] = useState<AssignmentFormData>(initialAssignmentForm);
  const [isPartnerDropdownOpen, setIsPartnerDropdownOpen] = useState(false);
  const [partnerSearchQuery, setPartnerSearchQuery] = useState("");

  // 모달 상태들
  const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false);
  const [quoteAssignmentId, setQuoteAssignmentId] = useState<number | null>(null);
  const [isUrlModalOpen, setIsUrlModalOpen] = useState(false);
  const [urlAssignmentId, setUrlAssignmentId] = useState<number | null>(null);
  const [isPhotosModalOpen, setIsPhotosModalOpen] = useState(false);
  const [photosAssignmentId, setPhotosAssignmentId] = useState<number | null>(null);
  const [isCustomerUrlModalOpen, setIsCustomerUrlModalOpen] = useState(false);
  const [customerUrlAssignmentId, setCustomerUrlAssignmentId] = useState<number | null>(null);

  // 계산된 값들
  const finalCancelReason = cancelReasonSelect === "other" ? cancelReasonCustom : cancelReasonSelect;
  const hasStatusChanged = status !== originalStatus;

  // 서비스 매칭률로 정렬된 협력사 목록
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

    const assignedServices = new Set(
      application.assignments?.flatMap((a) => a.assigned_services) || []
    );

    const unassignedServicesSet = new Set(
      application.selected_services.filter((s) => !assignedServices.has(s))
    );

    const partnersWithMatch: PartnerWithMatch[] = partners.map((p) => {
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

    const matched = partnersWithMatch
      .filter((p) => p.isMatched)
      .sort((a, b) => b.matchCount - a.matchCount);
    const unmatched = partnersWithMatch.filter((p) => !p.isMatched);

    return { matched, unmatched };
  }, [partners, application?.selected_services, application?.assignments]);

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

  // ===== 데이터 로드 =====
  const loadData = useCallback(async () => {
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
          getCustomerHistory(token, id).catch(() => null),
        ]);

      setApplication(appData);
      setPartners(partnersData.items);
      setAuditLogs(auditLogsData.items);
      setNotes(notesData.items);
      setCustomerHistory(customerHistoryData);
      setStatus(appData.status);
      setOriginalStatus(appData.status);
    } catch (err) {
      setError(err instanceof Error ? err.message : "데이터를 불러올 수 없습니다");
    } finally {
      setIsLoading(false);
    }
  }, [id, getValidToken, router]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ===== 상태 저장 =====
  const handleSave = useCallback(async () => {
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
        send_sms: sendSms && hasStatusChanged,
      };

      const updated = await updateApplication(token, id, updateData);
      setApplication(updated);
      setOriginalStatus(updated.status);

      const updatedAuditLogs = await getEntityAuditLogs(token, "application", id, { page_size: 20 });
      setAuditLogs(updatedAuditLogs.items);

      const willSendSms =
        sendSms && hasStatusChanged && willSendSmsForStatusChange(originalStatus, status);
      const smsNote = willSendSms ? " (SMS 알림 발송됨)" : "";
      setSuccessMessage(`저장되었습니다${smsNote}`);

      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "저장에 실패했습니다");
    } finally {
      setIsSaving(false);
    }
  }, [id, status, sendSms, hasStatusChanged, originalStatus, getValidToken, router]);

  // ===== 메모 관련 =====
  const handleAddNote = useCallback(async (content: string) => {
    try {
      setIsAddingNote(true);
      const token = await getValidToken();
      if (!token) return;

      const newNote = await createApplicationNote(token, id, { content: content.trim() });
      setNotes((prev) => [newNote, ...prev]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "메모 추가에 실패했습니다");
    } finally {
      setIsAddingNote(false);
    }
  }, [id, getValidToken]);

  const handleDeleteNote = useCallback(async (noteId: number) => {
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
      setNotes((prev) => prev.filter((n) => n.id !== noteId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "메모 삭제에 실패했습니다");
    }
  }, [id, confirm, getValidToken]);

  // ===== 취소 처리 =====
  const handleCancelApplication = useCallback(async () => {
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

      const updatedAuditLogs = await getEntityAuditLogs(token, "application", id, { page_size: 20 });
      setAuditLogs(updatedAuditLogs.items);

      const smsNote = sendCancelSms ? " (SMS 알림 발송됨)" : "";
      setSuccessMessage(`신청이 취소되었습니다${smsNote}`);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "취소 처리에 실패했습니다");
    } finally {
      setIsCancelling(false);
    }
  }, [id, finalCancelReason, sendCancelSms, getValidToken, router]);

  // ===== 사진 다운로드 =====
  const handleDownloadPhoto = useCallback(async (photoUrl: string, index: number) => {
    try {
      setDownloadingPhoto(index);

      const downloadUrl = `${FILE_BASE_URL}${photoUrl}${photoUrl.includes("?") ? "&" : "?"}download=true`;
      const filename = `사진_${index + 1}.jpg`;

      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = filename;
      link.target = "_blank";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch {
      setError("사진 다운로드에 실패했습니다");
    } finally {
      setDownloadingPhoto(null);
    }
  }, []);

  const handleDownloadAllPhotos = useCallback(async () => {
    if (!application?.photos || application.photos.length === 0) return;

    try {
      setIsDownloadingAll(true);
      setError(null);

      const JSZip = (await import("jszip")).default;
      const zip = new JSZip();

      const fetchPromises = application.photos.map(async (photoUrl, index) => {
        try {
          const fullUrl = `${FILE_BASE_URL}${photoUrl}`;
          const response = await fetch(fullUrl);
          if (!response.ok) throw new Error(`Failed to fetch photo ${index + 1}`);
          const blob = await response.blob();

          const ext = photoUrl.split(".").pop()?.split("?")[0] || "jpg";
          const filename = `사진_${String(index + 1).padStart(2, "0")}.${ext}`;
          zip.file(filename, blob);
        } catch (err) {
          console.error(`Failed to download photo ${index + 1}:`, err);
        }
      });

      await Promise.all(fetchPromises);

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
    } catch {
      setError("사진 다운로드에 실패했습니다");
    } finally {
      setIsDownloadingAll(false);
    }
  }, [application]);

  // ===== 배정 관련 =====
  const resetAssignmentForm = useCallback(() => {
    setAssignmentForm(initialAssignmentForm);
    setEditingAssignment(null);
  }, []);

  const openNewAssignmentModal = useCallback(() => {
    resetAssignmentForm();
    const assignedServices = application?.assignments?.flatMap((a) => a.assigned_services) || [];
    const unassignedServicesForForm = application?.selected_services.filter(
      (s) => !assignedServices.includes(s)
    ) || [];
    setAssignmentForm((prev) => ({
      ...prev,
      assigned_services: unassignedServicesForForm,
    }));
    setIsAssignmentModalOpen(true);
  }, [application, resetAssignmentForm]);

  const openEditAssignmentModal = useCallback((assignment: AssignmentSummary) => {
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
  }, []);

  const handleSaveAssignment = useCallback(async () => {
    if (!assignmentForm.partner_id || assignmentForm.assigned_services.length === 0) {
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

        await updateApplicationAssignment(token, id, editingAssignment.id, updateData);
        setSuccessMessage("배정이 수정되었습니다");
      } else {
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

      const updatedApp = await getApplication(token, id);
      setApplication(updatedApp);

      const updatedAuditLogs = await getEntityAuditLogs(token, "application", id, { page_size: 20 });
      setAuditLogs(updatedAuditLogs.items);

      setIsAssignmentModalOpen(false);
      resetAssignmentForm();

      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "배정 저장에 실패했습니다");
    } finally {
      setIsAssignmentSaving(false);
    }
  }, [id, assignmentForm, editingAssignment, getValidToken, router, resetAssignmentForm]);

  const handleDeleteAssignment = useCallback(async (assignmentId: number) => {
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

      const updatedApp = await getApplication(token, id);
      setApplication(updatedApp);

      const updatedAuditLogs = await getEntityAuditLogs(token, "application", id, { page_size: 20 });
      setAuditLogs(updatedAuditLogs.items);

      setSuccessMessage("배정이 삭제되었습니다");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "배정 삭제에 실패했습니다");
    } finally {
      setIsDeletingAssignment(null);
    }
  }, [id, confirm, getValidToken, router]);

  // 섹션 토글
  const toggleSection = useCallback((section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  }, []);

  return {
    // 기본 데이터
    application,
    setApplication,
    partners,
    auditLogs,
    notes,
    customerHistory,

    // 로딩/에러/성공 상태
    isLoading,
    isSaving,
    error,
    setError,
    successMessage,
    setSuccessMessage,

    // 상태 관련
    status,
    setStatus,
    originalStatus,
    hasStatusChanged,
    sendSms,
    setSendSms,
    showStatusHeaderDropdown,
    setShowStatusHeaderDropdown,

    // 취소 모달 상태
    showCancelModal,
    setShowCancelModal,
    cancelReasonSelect,
    setCancelReasonSelect,
    cancelReasonCustom,
    setCancelReasonCustom,
    sendCancelSms,
    setSendCancelSms,
    isCancelling,
    finalCancelReason,

    // 메모 상태
    isAddingNote,

    // 라이트박스 상태
    lightboxOpen,
    setLightboxOpen,
    lightboxIndex,
    setLightboxIndex,

    // 다운로드 상태
    isDownloadingAll,
    downloadingPhoto,

    // MMS 시트 상태
    showMMSSheet,
    setShowMMSSheet,

    // 섹션 상태
    expandedSections,
    toggleSection,

    // 배정 관련 상태
    isAssignmentModalOpen,
    setIsAssignmentModalOpen,
    editingAssignment,
    isAssignmentSaving,
    isDeletingAssignment,
    assignmentForm,
    setAssignmentForm,
    isPartnerDropdownOpen,
    setIsPartnerDropdownOpen,
    partnerSearchQuery,
    setPartnerSearchQuery,

    // 모달 상태들
    isQuoteModalOpen,
    setIsQuoteModalOpen,
    quoteAssignmentId,
    setQuoteAssignmentId,
    isUrlModalOpen,
    setIsUrlModalOpen,
    urlAssignmentId,
    setUrlAssignmentId,
    isPhotosModalOpen,
    setIsPhotosModalOpen,
    photosAssignmentId,
    setPhotosAssignmentId,
    isCustomerUrlModalOpen,
    setIsCustomerUrlModalOpen,
    customerUrlAssignmentId,
    setCustomerUrlAssignmentId,

    // 계산된 값들
    sortedPartners,
    unassignedServices,
    filteredPartners,
    selectedPartner,
    timelineNotes,
    timelineAuditLogs,
    summaryCards: summaryItems,

    // 핸들러들
    loadData,
    handleSave,
    handleAddNote,
    handleDeleteNote,
    handleCancelApplication,
    handleDownloadPhoto,
    handleDownloadAllPhotos,
    resetAssignmentForm,
    openNewAssignmentModal,
    openEditAssignmentModal,
    handleSaveAssignment,
    handleDeleteAssignment,
  };
}
