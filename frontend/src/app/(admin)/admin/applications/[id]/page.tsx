"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { parse, format } from "date-fns";
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
  Send,
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
} from "lucide-react";
import { useAuthStore } from "@/lib/stores/auth";
import { useConfirm } from "@/hooks";
import {
  getApplication,
  updateApplication,
  getPartners,
  getSchedule,
  getEntityAuditLogs,
  getApplicationNotes,
  createApplicationNote,
  deleteApplicationNote,
  createApplicationAssignment,
  updateApplicationAssignment,
  deleteApplicationAssignment,
  ApplicationDetail,
  PartnerListItem,
  ScheduleConflict,
  AuditLog,
  ApplicationNote,
  AssignmentSummary,
  AssignmentCreate,
  AssignmentUpdate,
} from "@/lib/api/admin";
import { addDays, startOfDay } from "date-fns";
import { DatePicker } from "@/components/ui/date-picker";
import { getServiceName } from "@/lib/utils/service";
import { SummaryCards, type SummaryCardItem } from "@/components/admin";
import { SafeText, SafeBlockText } from "@/components/common/SafeText";

// 파일 URL 기본 경로 (API가 /api/v1/files/{token} 형태로 반환)
const FILE_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1").replace("/api/v1", "");

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
  const { confirm } = useConfirm();

  const [application, setApplication] = useState<ApplicationDetail | null>(null);
  const [partners, setPartners] = useState<PartnerListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [scheduleConflicts, setScheduleConflicts] = useState<ScheduleConflict[]>([]);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [suggestedDateMessage, setSuggestedDateMessage] = useState<string | null>(null);
  const [isDownloadingAll, setIsDownloadingAll] = useState(false);
  const [downloadingPhoto, setDownloadingPhoto] = useState<number | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  // 메모 히스토리
  const [notes, setNotes] = useState<ApplicationNote[]>([]);
  const [newNoteContent, setNewNoteContent] = useState("");
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [showAllNotes, setShowAllNotes] = useState(false);

  // 취소 모달
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [sendCancelSms, setSendCancelSms] = useState(true);
  const [isCancelling, setIsCancelling] = useState(false);

  // 헤더 상태 드롭다운
  const [showStatusHeaderDropdown, setShowStatusHeaderDropdown] = useState(false);

  // 섹션 접기/펼치기
  const [expandedSections, setExpandedSections] = useState({
    service: true,
    assignments: true,
    management: true,
    activity: true,
  });

  // 배정 관리 상태
  const [isAssignmentModalOpen, setIsAssignmentModalOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<AssignmentSummary | null>(null);
  const [isAssignmentSaving, setIsAssignmentSaving] = useState(false);
  const [isDeletingAssignment, setIsDeletingAssignment] = useState<number | null>(null);

  // 배정 폼 상태
  const [assignmentForm, setAssignmentForm] = useState<{
    partner_id: number | "";
    assigned_services: string[];
    scheduled_date: Date | undefined;
    scheduled_time: string;
    estimated_cost: number | "";
    note: string;
    send_sms: boolean;
  }>({
    partner_id: "",
    assigned_services: [],
    scheduled_date: undefined,
    scheduled_time: "",
    estimated_cost: "",
    note: "",
    send_sms: true,
  });

  // Form state
  const [status, setStatus] = useState("");
  const [assignedPartnerId, setAssignedPartnerId] = useState<number | "">("");
  const [scheduledDate, setScheduledDate] = useState<Date | undefined>(undefined);
  const [scheduledTime, setScheduledTime] = useState("");
  const [estimatedCost, setEstimatedCost] = useState<number | "">("");
  const [finalCost, setFinalCost] = useState<number | "">("");
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

  // 협력사 드롭다운 상태
  const [isPartnerDropdownOpen, setIsPartnerDropdownOpen] = useState(false);

  // 드롭다운 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest("[data-partner-dropdown]")) {
        setIsPartnerDropdownOpen(false);
      }
    };

    if (isPartnerDropdownOpen) {
      document.addEventListener("click", handleClickOutside);
    }

    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, [isPartnerDropdownOpen]);

  // 서비스 매칭 정보가 추가된 협력사 타입
  type PartnerWithMatch = PartnerListItem & {
    matchCount: number;
    matchedServices: string[];
    isMatched: boolean;
  };

  // 서비스 매칭률로 정렬된 협력사 목록
  const sortedPartners = useMemo((): { matched: PartnerWithMatch[]; unmatched: PartnerWithMatch[] } => {
    if (!application?.selected_services || partners.length === 0) {
      const emptyPartners: PartnerWithMatch[] = partners.map((p) => ({
        ...p,
        matchCount: 0,
        matchedServices: [],
        isMatched: false,
      }));
      return { matched: emptyPartners, unmatched: [] };
    }

    const appServices = new Set(application.selected_services);

    const partnersWithMatch: PartnerWithMatch[] = partners.map((p) => {
      const matchedServices = p.service_areas.filter((s) => appServices.has(s));
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
  }, [partners, application?.selected_services]);

  // 협력사의 다음 가용 일정 제안
  const suggestNextAvailableDate = async (partnerId: number) => {
    try {
      const token = await getValidToken();
      if (!token) return null;

      const today = startOfDay(new Date());
      const startDate = format(today, "yyyy-MM-dd");
      const endDate = format(addDays(today, 14), "yyyy-MM-dd");

      const schedule = await getSchedule(token, {
        start_date: startDate,
        end_date: endDate,
        partner_id: partnerId,
      });

      const bookedDates = schedule.items
        .filter((item) => item.status === "assigned" || item.status === "scheduled")
        .map((item) => item.scheduled_date);

      for (let i = 1; i <= 14; i++) {
        const candidateDate = addDays(today, i);
        const candidateDateStr = format(candidateDate, "yyyy-MM-dd");

        if (!bookedDates.includes(candidateDateStr)) {
          return candidateDate;
        }
      }

      return null;
    } catch (error) {
      console.error("Failed to suggest date:", error);
      return null;
    }
  };

  // 변경 사항 감지
  const hasPartnerChanged = assignedPartnerId !== originalValues.assignedPartnerId;
  const hasScheduleChanged =
    scheduledDate?.toISOString() !== originalValues.scheduledDate?.toISOString() ||
    scheduledTime !== originalValues.scheduledTime;

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

      const [appData, partnersData, auditLogsData, notesData] = await Promise.all([
        getApplication(token, id),
        getPartners(token, { status: "approved", page_size: 100 }),
        getEntityAuditLogs(token, "application", id, { page_size: 20 }),
        getApplicationNotes(token, id, { page_size: 50 }),
      ]);

      setApplication(appData);
      setPartners(partnersData.items);
      setAuditLogs(auditLogsData.items);
      setNotes(notesData.items);

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

  // 협력사 배정 시 자동 상태 변경 및 일정 제안
  const handlePartnerChange = async (partnerId: number | "") => {
    setAssignedPartnerId(partnerId);
    setSuggestedDateMessage(null);

    if (partnerId && (status === "new" || status === "consulting")) {
      setStatus("assigned");
    }
    if (!partnerId && status === "assigned") {
      setStatus("consulting");
    }

    if (partnerId && !scheduledDate) {
      const suggestedDate = await suggestNextAvailableDate(partnerId as number);
      if (suggestedDate) {
        setScheduledDate(suggestedDate);
        const formattedDate = format(suggestedDate, "M월 d일");
        setSuggestedDateMessage(`${formattedDate}이(가) 가장 빠른 가용 일정으로 자동 설정되었습니다`);

        if (status === "assigned" || status === "consulting") {
          setStatus("scheduled");
        }

        setTimeout(() => setSuggestedDateMessage(null), 5000);
      }
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

    const newDate = date !== undefined ? date : scheduledDate;

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
        send_sms: sendSms && (hasPartnerChanged || hasScheduleChanged),
      };

      const updated = await updateApplication(token, id, updateData);
      setApplication(updated);

      if (updated.schedule_conflicts && updated.schedule_conflicts.length > 0) {
        setScheduleConflicts(updated.schedule_conflicts);
      } else {
        setScheduleConflicts([]);
      }

      setOriginalValues({
        status: updated.status,
        assignedPartnerId: updated.assigned_partner_id || "",
        scheduledDate: updated.scheduled_date
          ? parse(updated.scheduled_date, "yyyy-MM-dd", new Date())
          : undefined,
        scheduledTime: updated.scheduled_time || "",
      });

      const updatedAuditLogs = await getEntityAuditLogs(token, "application", id, {
        page_size: 20,
      });
      setAuditLogs(updatedAuditLogs.items);

      const smsNote =
        sendSms && (hasPartnerChanged || hasScheduleChanged) ? " (SMS 알림 발송됨)" : "";
      setSuccessMessage(`저장되었습니다${smsNote}`);

      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "저장에 실패했습니다");
    } finally {
      setIsSaving(false);
    }
  };

  // 메모 추가
  const handleAddNote = async () => {
    if (!newNoteContent.trim()) return;

    try {
      setIsAddingNote(true);
      const token = await getValidToken();
      if (!token) return;

      const newNote = await createApplicationNote(token, id, { content: newNoteContent.trim() });
      setNotes([newNote, ...notes]);
      setNewNoteContent("");
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
        admin_memo: cancelReason || undefined,
        send_sms: sendCancelSms,
      };

      const updated = await updateApplication(token, id, updateData);
      setApplication(updated);
      setStatus("cancelled");
      setShowCancelModal(false);
      setCancelReason("");
      setSendCancelSms(true);

      // Audit Log 갱신
      const updatedAuditLogs = await getEntityAuditLogs(token, "application", id, {
        page_size: 20,
      });
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
      const downloadUrl = `${FILE_BASE_URL}${photoUrl}${photoUrl.includes("?") ? "&" : "?"}download=true`;

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
          if (!response.ok) throw new Error(`Failed to fetch photo ${index + 1}`);
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
      note: "",
      send_sms: true,
    });
    setEditingAssignment(null);
  };

  // 새 배정 추가 모달 열기
  const openNewAssignmentModal = () => {
    resetAssignmentForm();
    // 아직 배정되지 않은 서비스만 기본 선택
    const assignedServices = application?.assignments?.flatMap((a) => a.assigned_services) || [];
    const unassignedServices =
      application?.selected_services.filter((s) => !assignedServices.includes(s)) || [];
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
      note: "",
      send_sms: true,
    });
    setIsAssignmentModalOpen(true);
  };

  // 배정 저장 (생성/수정)
  const handleSaveAssignment = async () => {
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
        // 수정
        const updateData: AssignmentUpdate = {
          assigned_services: assignmentForm.assigned_services,
          scheduled_date: assignmentForm.scheduled_date
            ? format(assignmentForm.scheduled_date, "yyyy-MM-dd")
            : undefined,
          scheduled_time: assignmentForm.scheduled_time || undefined,
          estimated_cost: assignmentForm.estimated_cost || undefined,
          note: assignmentForm.note || undefined,
          send_sms: assignmentForm.send_sms,
        };

        await updateApplicationAssignment(token, id, editingAssignment.id, updateData);
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
      const updatedAuditLogs = await getEntityAuditLogs(token, "application", id, {
        page_size: 20,
      });
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
      const updatedAuditLogs = await getEntityAuditLogs(token, "application", id, {
        page_size: 20,
      });
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
    return statusMap[statusValue] || { label: statusValue, color: "bg-gray-100 text-gray-700" };
  };

  // 배정되지 않은 서비스 계산
  const unassignedServices = useMemo(() => {
    if (!application) return [];
    const assignedServices = application.assignments?.flatMap((a) => a.assigned_services) || [];
    return application.selected_services.filter((s) => !assignedServices.includes(s));
  }, [application]);

  // 헬퍼 함수들 (useMemo보다 먼저 정의)
  const formatPhone = (phone: string) => {
    const cleaned = phone.replace(/\D/g, "");
    if (cleaned.length === 11) {
      return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 7)}-${cleaned.slice(7)}`;
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
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
    return STATUS_OPTIONS.find((s) => s.value === statusValue) || STATUS_OPTIONS[0];
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
        href: `tel:${application.customer_phone}`,
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

  // 활동 이력: 메모 + 변경 이력 통합 (최신순)
  type ActivityItem =
    | { type: "note"; data: ApplicationNote }
    | { type: "audit"; data: AuditLog };

  const activityItems: ActivityItem[] = [
    ...notes.map((n) => ({ type: "note" as const, data: n })),
    ...auditLogs.map((a) => ({ type: "audit" as const, data: a })),
  ].sort((a, b) => {
    const dateA = new Date(a.data.created_at).getTime();
    const dateB = new Date(b.data.created_at).getTime();
    return dateB - dateA;
  });

  const displayedActivities = showAllNotes ? activityItems : activityItems.slice(0, 5);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* ===== Header: 신청 요약 ===== */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex items-start gap-4">
            <Link
              href="/admin/applications"
              className="p-2 rounded-xl hover:bg-gray-100 transition-colors mt-1"
            >
              <ArrowLeft size={20} className="text-gray-600" />
            </Link>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-xl font-bold text-gray-900">{application.application_number}</h1>
                <span
                  className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full border ${statusInfo.color}`}
                >
                  {statusInfo.label}
                </span>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-600">
                <span>등록: {new Date(application.created_at).toLocaleDateString("ko-KR")}</span>
                {application.updated_at !== application.created_at && (
                  <span className="flex items-center gap-1">
                    수정: {new Date(application.updated_at).toLocaleDateString("ko-KR")}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* 상태 변경 드롭다운 */}
          <div className="relative">
            <button
              onClick={() => setShowStatusHeaderDropdown(!showStatusHeaderDropdown)}
              disabled={isSaving}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium border ${statusInfo.color} hover:opacity-80 transition-opacity`}
            >
              {isSaving ? (
                <Loader2 className="animate-spin" size={16} />
              ) : (
                <>
                  {statusInfo.label}
                  <ChevronDown size={16} />
                </>
              )}
            </button>

            {showStatusHeaderDropdown && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
                {STATUS_OPTIONS.filter((opt) => opt.value !== status).map((option) => (
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
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 요약 카드 */}
      <SummaryCards items={summaryItems} />

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
      {scheduleConflicts.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <AlertCircle size={20} className="text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-amber-800 mb-2">
                일정 충돌: 같은 날짜에 다른 신청이 있습니다
              </p>
              <div className="space-y-1">
                {scheduleConflicts.map((conflict) => (
                  <div
                    key={conflict.application_id}
                    className="flex items-center gap-2 text-sm text-amber-700"
                  >
                    <span className="font-mono bg-amber-100 px-1.5 py-0.5 rounded text-xs">
                      {conflict.application_number}
                    </span>
                    <span>{conflict.customer_name}</span>
                    {conflict.scheduled_time && (
                      <span className="text-amber-600">({conflict.scheduled_time})</span>
                    )}
                    <Link
                      href={`/admin/applications/${conflict.application_id}`}
                      className="text-amber-800 underline hover:text-amber-900 ml-auto text-xs"
                    >
                      확인
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          </div>
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
              {expandedSections.service ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
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
                  <MapPin size={16} className="text-gray-400 mt-0.5 flex-shrink-0" />
                  <div className="text-sm">
                    <SafeText text={application.address} className="font-medium text-gray-900" as="p" />
                    {application.address_detail && (
                      <SafeText text={application.address_detail} className="text-gray-600" as="p" />
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
                {(application.preferred_consultation_date || application.preferred_work_date) && (
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
                          className="relative w-16 h-16 bg-gray-100 rounded-lg overflow-hidden group"
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
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-1 pointer-events-none">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setLightboxIndex(idx);
                                setLightboxOpen(true);
                              }}
                              className="p-1 rounded-full bg-white/90 text-gray-700 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-auto hover:bg-white"
                              title="확대"
                            >
                              <ZoomIn size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDownloadPhoto(photo, idx);
                              }}
                              disabled={downloadingPhoto === idx}
                              className="p-1 rounded-full bg-white/90 text-gray-700 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-auto hover:bg-white disabled:opacity-50"
                              title="다운로드"
                            >
                              {downloadingPhoto === idx ? (
                                <Loader2 size={14} className="animate-spin" />
                              ) : (
                                <Download size={14} />
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
                          className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center text-sm font-medium text-gray-600 hover:bg-gray-300 transition-colors"
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
                {application.assignments && application.assignments.length > 0 && (
                  <span className="text-xs font-normal text-gray-500 ml-1">
                    ({application.assignments.length}개)
                  </span>
                )}
              </h2>
              {expandedSections.assignments ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </button>

            {expandedSections.assignments && (
              <div className="px-4 pb-4 space-y-4">
                {/* 미배정 서비스 알림 */}
                {unassignedServices.length > 0 && (
                  <div className="p-3 bg-amber-50 border border-amber-100 rounded-lg">
                    <div className="flex items-start gap-2">
                      <AlertCircle size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
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
                {application.assignments && application.assignments.length > 0 ? (
                  <div className="space-y-3">
                    {application.assignments.map((assignment) => {
                      const statusInfo = getAssignmentStatusInfo(assignment.status);
                      const partner = partners.find((p) => p.id === assignment.partner_id);

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
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => openEditAssignmentModal(assignment)}
                                className="p-1.5 text-gray-400 hover:text-primary hover:bg-primary-50 rounded-lg transition-colors"
                                title="수정"
                              >
                                <Pencil size={14} />
                              </button>
                              <button
                                onClick={() => handleDeleteAssignment(assignment.id)}
                                disabled={isDeletingAssignment === assignment.id}
                                className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                                title="삭제"
                              >
                                {isDeletingAssignment === assignment.id ? (
                                  <Loader2 size={14} className="animate-spin" />
                                ) : (
                                  <Trash2 size={14} />
                                )}
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
                            {(assignment.scheduled_date || assignment.scheduled_time) && (
                              <div className="flex items-center gap-1.5 text-gray-600">
                                <CalendarIcon size={12} className="text-gray-400" />
                                <span>
                                  {assignment.scheduled_date || "미정"}
                                  {assignment.scheduled_time && ` ${assignment.scheduled_time}`}
                                </span>
                              </div>
                            )}
                            {(assignment.estimated_cost || assignment.final_cost) && (
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
              {expandedSections.activity ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </button>

            {expandedSections.activity && (
              <div className="px-4 pb-4 space-y-4">
                {/* 메모 입력 */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newNoteContent}
                    onChange={(e) => setNewNoteContent(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && !isAddingNote && handleAddNote()}
                    placeholder="메모를 입력하세요..."
                    className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                  <button
                    onClick={handleAddNote}
                    disabled={isAddingNote || !newNoteContent.trim()}
                    className="px-3 py-2 bg-primary text-white rounded-lg hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isAddingNote ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Send size={16} />
                    )}
                  </button>
                </div>

                {/* 타임라인 */}
                <div className="space-y-3">
                  {displayedActivities.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-4">활동 이력이 없습니다</p>
                  ) : (
                    displayedActivities.map((item, idx) => (
                      <div
                        key={`${item.type}-${item.data.id}`}
                        className={`relative pl-5 ${
                          idx !== displayedActivities.length - 1
                            ? "pb-3 border-l-2 border-gray-200"
                            : ""
                        }`}
                      >
                        <div
                          className={`absolute -left-1.5 top-1 w-3 h-3 rounded-full border-2 border-white ${
                            item.type === "note" ? "bg-primary" : "bg-gray-400"
                          }`}
                        />
                        <div className="bg-gray-50 rounded-lg p-3">
                          {item.type === "note" ? (
                            <>
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                  <SafeText text={item.data.content} className="text-sm text-gray-900" as="p" />
                                  <p className="text-xs text-gray-500 mt-1">
                                    <span className="font-medium">{item.data.admin_name}</span>
                                    {" · "}
                                    {formatRelativeTime(item.data.created_at)}
                                  </p>
                                </div>
                                <button
                                  onClick={() => handleDeleteNote(item.data.id)}
                                  className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                                  title="삭제"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </>
                          ) : (
                            <>
                              <p className="text-sm text-gray-700">{item.data.summary}</p>
                              <p className="text-xs text-gray-500 mt-1">
                                <span className="font-medium">
                                  {item.data.admin_name || "시스템"}
                                </span>
                                {" · "}
                                {formatRelativeTime(item.data.created_at)}
                              </p>
                            </>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* 더보기/접기 */}
                {activityItems.length > 5 && (
                  <button
                    onClick={() => setShowAllNotes(!showAllNotes)}
                    className="w-full text-sm text-primary hover:underline py-2"
                  >
                    {showAllNotes
                      ? "접기"
                      : `더보기 (${activityItems.length - 5}개 더)`}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ===== Right Column: 처리 관리 (2/5) ===== */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <button
              onClick={() => toggleSection("management")}
              className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
            >
              <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                <FileText size={18} className="text-primary" />
                처리 관리
              </h2>
              {expandedSections.management ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </button>

            {expandedSections.management && (
              <div className="px-4 pb-4 space-y-4">
                {/* 상태 */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">상태</label>
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

                {/* 담당 협력사 - Smart Matching UI */}
                <div className="relative" data-partner-dropdown>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">
                    담당 협력사
                    {sortedPartners.matched.length > 0 && (
                      <span className="ml-2 text-primary font-normal">
                        (추천 {sortedPartners.matched.length}개)
                      </span>
                    )}
                  </label>

                  {/* 커스텀 드롭다운 */}
                  <button
                    type="button"
                    onClick={() => setIsPartnerDropdownOpen(!isPartnerDropdownOpen)}
                    className="w-full flex items-center justify-between border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white text-left"
                  >
                    <span className={selectedPartner ? "text-gray-900" : "text-gray-400"}>
                      {selectedPartner ? selectedPartner.company_name : "협력사 선택"}
                    </span>
                    <ChevronDown
                      size={16}
                      className={`text-gray-400 transition-transform ${isPartnerDropdownOpen ? "rotate-180" : ""}`}
                    />
                  </button>

                  {/* 드롭다운 목록 */}
                  {isPartnerDropdownOpen && (
                    <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-y-auto">
                      {/* 선택 해제 옵션 */}
                      <button
                        type="button"
                        onClick={() => {
                          handlePartnerChange("");
                          setIsPartnerDropdownOpen(false);
                        }}
                        className="w-full px-3 py-2 text-left text-sm text-gray-400 hover:bg-gray-50"
                      >
                        선택 안함
                      </button>

                      {/* 추천 협력사 (서비스 매칭) */}
                      {sortedPartners.matched.length > 0 && (
                        <>
                          <div className="px-3 py-1.5 bg-primary-50 text-xs font-semibold text-primary-700 flex items-center gap-1.5">
                            <CheckCircle size={12} />
                            추천 (서비스 매칭)
                          </div>
                          {sortedPartners.matched.map((partner) => (
                            <button
                              key={partner.id}
                              type="button"
                              onClick={() => {
                                handlePartnerChange(partner.id);
                                setIsPartnerDropdownOpen(false);
                              }}
                              className={`w-full px-3 py-2.5 text-left hover:bg-primary-50 ${
                                assignedPartnerId === partner.id ? "bg-primary-50" : ""
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-medium text-sm text-gray-900">
                                  {partner.company_name}
                                </span>
                                <span className="text-xs text-primary-600 bg-primary-100 px-1.5 py-0.5 rounded">
                                  {partner.matchCount}개 매칭
                                </span>
                              </div>
                              <div className="text-xs text-gray-500 mt-0.5 flex flex-wrap gap-1">
                                {partner.matchedServices.slice(0, 3).map((s: string, i: number) => (
                                  <span
                                    key={i}
                                    className="bg-primary-50 text-primary-700 px-1.5 py-0.5 rounded"
                                  >
                                    {getServiceName(s)}
                                  </span>
                                ))}
                                {partner.matchedServices.length > 3 && (
                                  <span className="text-gray-400">
                                    +{partner.matchedServices.length - 3}
                                  </span>
                                )}
                              </div>
                            </button>
                          ))}
                        </>
                      )}

                      {/* 기타 협력사 */}
                      {sortedPartners.unmatched.length > 0 && (
                        <>
                          <div className="px-3 py-1.5 bg-gray-100 text-xs font-semibold text-gray-500 flex items-center gap-1.5">
                            <AlertCircle size={12} />
                            기타 협력사 ({sortedPartners.unmatched.length})
                          </div>
                          {sortedPartners.unmatched.map((partner) => (
                            <button
                              key={partner.id}
                              type="button"
                              onClick={() => {
                                handlePartnerChange(partner.id);
                                setIsPartnerDropdownOpen(false);
                              }}
                              className={`w-full px-3 py-2.5 text-left hover:bg-gray-50 ${
                                assignedPartnerId === partner.id ? "bg-gray-50" : ""
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-medium text-sm text-gray-700">
                                  {partner.company_name}
                                </span>
                              </div>
                              <div className="text-xs text-gray-400 mt-0.5">
                                {partner.service_areas.slice(0, 2).map(getServiceName).join(", ")}
                                {partner.service_areas.length > 2 &&
                                  ` 외 ${partner.service_areas.length - 2}개`}
                              </div>
                              <div className="text-xs text-amber-600 mt-0.5">
                                ⚠️ 요청 서비스와 매칭되지 않음
                              </div>
                            </button>
                          ))}
                        </>
                      )}

                      {partners.length === 0 && (
                        <div className="px-3 py-4 text-center text-sm text-gray-500">
                          등록된 협력사가 없습니다
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* 선택된 협력사 정보 */}
                {selectedPartner && (
                  <div className="p-2.5 bg-purple-50 rounded-lg border border-purple-100">
                    <div className="flex items-center gap-2 mb-1.5">
                      <Building2 size={14} className="text-purple-600" />
                      <span className="font-medium text-purple-900 text-sm">
                        {selectedPartner.company_name}
                      </span>
                    </div>
                    <div className="space-y-0.5 text-xs text-purple-700">
                      <p className="flex items-center gap-1">
                        <Phone size={10} />
                        {formatPhone(selectedPartner.contact_phone)}
                      </p>
                      <p className="flex items-center gap-1">
                        <Wrench size={10} />
                        {selectedPartner.service_areas.slice(0, 2).map(getServiceName).join(", ")}
                        {selectedPartner.service_areas.length > 2 &&
                          ` 외 ${selectedPartner.service_areas.length - 2}개`}
                      </p>
                    </div>
                  </div>
                )}

                {/* 일정 */}
                <div className="pt-2 border-t border-gray-100">
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">
                    예정 일정
                  </label>
                  {suggestedDateMessage && (
                    <div className="mb-2 p-2 bg-blue-50 border border-blue-100 rounded-lg">
                      <p className="text-xs text-blue-700 flex items-center gap-1">
                        <CalendarIcon size={12} />
                        {suggestedDateMessage}
                      </p>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-2">
                    <DatePicker
                      date={scheduledDate}
                      onDateChange={(date) => handleScheduleChange(date)}
                      placeholder="날짜"
                      fromDate={startOfDay(new Date())}
                    />
                    <select
                      value={scheduledTime}
                      onChange={(e) => handleScheduleChange(undefined, e.target.value)}
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

                {/* 비용 */}
                <div className="pt-2 border-t border-gray-100">
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">비용</label>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="relative">
                      <input
                        type="text"
                        inputMode="numeric"
                        value={formatCurrency(estimatedCost)}
                        onChange={(e) => setEstimatedCost(parseCurrency(e.target.value))}
                        placeholder="견적"
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                        원
                      </span>
                    </div>
                    <div className="relative">
                      <input
                        type="text"
                        inputMode="numeric"
                        value={formatCurrency(finalCost)}
                        onChange={(e) => setFinalCost(parseCurrency(e.target.value))}
                        placeholder="최종"
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                        원
                      </span>
                    </div>
                  </div>
                </div>

                {/* SMS 알림 & 저장 */}
                <div className="pt-3 border-t border-gray-100 space-y-3">
                  {(hasPartnerChanged || hasScheduleChanged) && (
                    <label className="flex items-start gap-2.5 p-2.5 bg-secondary-50 rounded-lg cursor-pointer hover:bg-secondary-100 transition-colors">
                      <input
                        type="checkbox"
                        checked={sendSms}
                        onChange={(e) => setSendSms(e.target.checked)}
                        className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary mt-0.5"
                      />
                      <div>
                        <div className="flex items-center gap-1.5">
                          <MessageSquare size={14} className="text-secondary" />
                          <span className="font-medium text-secondary-800 text-sm">
                            SMS 알림 발송
                          </span>
                        </div>
                        <p className="text-xs text-secondary-600 mt-0.5">
                          {hasPartnerChanged && hasScheduleChanged
                            ? "고객/협력사에게 배정 및 일정 알림"
                            : hasPartnerChanged
                            ? "고객에게 협력사 배정 알림"
                            : "고객/협력사에게 일정 확정 알림"}
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
        </div>
      </div>

      {/* Lightbox for photos */}
      {application.photos && application.photos.length > 0 && (
        <Lightbox
          open={lightboxOpen}
          close={() => setLightboxOpen(false)}
          index={lightboxIndex}
          slides={application.photos.map((photo) => ({ src: `${FILE_BASE_URL}${photo}` }))}
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
                <h3 className="text-lg font-semibold text-gray-900">신청 취소</h3>
                <p className="text-sm text-gray-500">이 작업은 되돌릴 수 없습니다</p>
              </div>
            </div>

            <div className="mb-4 space-y-3">
              <p className="text-sm text-gray-700">
                <span className="font-medium">{application.application_number}</span> 신청을 취소하시겠습니까?
              </p>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1.5">
                  취소 사유 (선택)
                </label>
                <textarea
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="취소 사유를 입력하세요..."
                  rows={2}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                />
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
                  setCancelReason("");
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
                <select
                  value={assignmentForm.partner_id}
                  onChange={(e) =>
                    setAssignmentForm((prev) => ({
                      ...prev,
                      partner_id: e.target.value ? Number(e.target.value) : "",
                    }))
                  }
                  disabled={!!editingAssignment}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary disabled:bg-gray-100"
                >
                  <option value="">협력사 선택</option>
                  {/* 추천 협력사 */}
                  {sortedPartners.matched.length > 0 && (
                    <optgroup label="🎯 추천 (서비스 매칭)">
                      {sortedPartners.matched.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.company_name} ({p.matchCount}개 매칭)
                        </option>
                      ))}
                    </optgroup>
                  )}
                  {/* 기타 협력사 */}
                  {sortedPartners.unmatched.length > 0 && (
                    <optgroup label="기타 협력사">
                      {sortedPartners.unmatched.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.company_name}
                        </option>
                      ))}
                    </optgroup>
                  )}
                </select>
              </div>

              {/* 담당 서비스 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  담당 서비스 <span className="text-red-500">*</span>
                </label>
                <div className="border border-gray-200 rounded-lg p-3 space-y-2 max-h-40 overflow-y-auto">
                  {application?.selected_services.map((service) => {
                    const isChecked = assignmentForm.assigned_services.includes(service);
                    // 다른 배정에 이미 할당된 서비스인지 확인 (현재 편집 중인 배정 제외)
                    const isAssignedToOther = application?.assignments?.some(
                      (a) =>
                        a.id !== editingAssignment?.id && a.assigned_services.includes(service)
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
                                assigned_services: [...prev.assigned_services, service],
                              }));
                            } else {
                              setAssignmentForm((prev) => ({
                                ...prev,
                                assigned_services: prev.assigned_services.filter(
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
                          <span className="ml-auto text-xs text-gray-400">(다른 배정)</span>
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
                <label className="block text-sm font-medium text-gray-700 mb-1.5">예정 일정</label>
                <div className="grid grid-cols-2 gap-2">
                  <DatePicker
                    date={assignmentForm.scheduled_date}
                    onDateChange={(date) =>
                      setAssignmentForm((prev) => ({ ...prev, scheduled_date: date }))
                    }
                    placeholder="날짜"
                    fromDate={startOfDay(new Date())}
                  />
                  <select
                    value={assignmentForm.scheduled_time}
                    onChange={(e) =>
                      setAssignmentForm((prev) => ({ ...prev, scheduled_time: e.target.value }))
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
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">견적 비용</label>
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
              </div>

              {/* 메모 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">메모</label>
                <textarea
                  value={assignmentForm.note}
                  onChange={(e) =>
                    setAssignmentForm((prev) => ({ ...prev, note: e.target.value }))
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
                    setAssignmentForm((prev) => ({ ...prev, send_sms: e.target.checked }))
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
    </div>
  );
}
