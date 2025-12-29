"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/stores/auth";
import { useConfirm } from "@/hooks";
import {
  getPartner,
  changePartnerStatus,
  getPartnerNotes,
  createPartnerNote,
  deletePartnerNote,
  getEntityAuditLogs,
  getSimilarPartners,
  PartnerDetail,
  PartnerNote,
  PartnerStatusChange,
  AuditLog,
  SimilarPartnersResponse,
} from "@/lib/api/admin";
import type { NoteItem, AuditItem } from "@/components/admin";

export function usePartnerDetail(id: number) {
  const router = useRouter();
  const { getValidToken } = useAuthStore();
  const { confirm } = useConfirm();

  // 데이터 상태
  const [partner, setPartner] = useState<PartnerDetail | null>(null);
  const [notes, setNotes] = useState<PartnerNote[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [similarPartners, setSimilarPartners] =
    useState<SimilarPartnersResponse | null>(null);

  // 로딩/에러 상태
  const [isLoading, setIsLoading] = useState(true);
  const [isChangingStatus, setIsChangingStatus] = useState(false);
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [isDeletingNote, setIsDeletingNote] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // UI 상태
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [statusChangeReason, setStatusChangeReason] = useState("");
  const [showStatusReasonModal, setShowStatusReasonModal] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<
    PartnerStatusChange["new_status"] | null
  >(null);
  const [showMMSSheet, setShowMMSSheet] = useState(false);

  // 데이터 로드
  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const token = await getValidToken();
      if (!token) {
        router.push("/admin/login");
        return;
      }

      const [partnerData, notesData, auditLogsData, similarPartnersData] =
        await Promise.all([
          getPartner(token, id),
          getPartnerNotes(token, id),
          getEntityAuditLogs(token, "partner", id, { page_size: 20 }),
          getSimilarPartners(token, id).catch(() => null),
        ]);

      setPartner(partnerData);
      setNotes(notesData.items);
      setAuditLogs(auditLogsData.items);
      setSimilarPartners(similarPartnersData);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "데이터를 불러올 수 없습니다"
      );
    } finally {
      setIsLoading(false);
    }
  }, [id, getValidToken, router]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // 상태 변경 실행
  const executeStatusChange = useCallback(
    async (
      newStatus: PartnerStatusChange["new_status"],
      reason?: string
    ) => {
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

        // 노트 및 변경 이력 새로고침
        const [notesData, auditLogsData] = await Promise.all([
          getPartnerNotes(token, id),
          getEntityAuditLogs(token, "partner", id, { page_size: 20 }),
        ]);
        setNotes(notesData.items);
        setAuditLogs(auditLogsData.items);

        setSuccessMessage("상태가 변경되었습니다");
        setTimeout(() => setSuccessMessage(null), 3000);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "상태 변경에 실패했습니다"
        );
      } finally {
        setIsChangingStatus(false);
        setShowStatusDropdown(false);
        setShowStatusReasonModal(false);
        setStatusChangeReason("");
        setPendingStatus(null);
      }
    },
    [id, getValidToken, router]
  );

  // 상태 변경 핸들러
  const handleStatusChange = useCallback(
    async (newStatus: PartnerStatusChange["new_status"]) => {
      if (!partner) return;

      // 같은 상태면 무시
      if (partner.status === newStatus) {
        setShowStatusDropdown(false);
        return;
      }

      // 거절 또는 비활성인 경우 사유 입력 모달
      if (newStatus === "rejected" || newStatus === "inactive") {
        setPendingStatus(newStatus);
        setShowStatusReasonModal(true);
        setShowStatusDropdown(false);
        return;
      }

      await executeStatusChange(newStatus);
    },
    [partner, executeStatusChange]
  );

  // 메모 추가
  const handleAddNote = useCallback(
    async (content: string) => {
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
        setError(
          err instanceof Error ? err.message : "메모 추가에 실패했습니다"
        );
      } finally {
        setIsAddingNote(false);
      }
    },
    [id, getValidToken, router]
  );

  // 메모 삭제
  const handleDeleteNote = useCallback(
    async (noteId: number) => {
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
        setError(
          err instanceof Error ? err.message : "메모 삭제에 실패했습니다"
        );
      } finally {
        setIsDeletingNote(false);
      }
    },
    [id, confirm, getValidToken, router]
  );

  // 상태 변경 모달 취소
  const handleCancelStatusChange = useCallback(() => {
    setShowStatusReasonModal(false);
    setStatusChangeReason("");
    setPendingStatus(null);
  }, []);

  // 상태 변경 모달 확인
  const handleConfirmStatusChange = useCallback(() => {
    if (pendingStatus) {
      executeStatusChange(pendingStatus, statusChangeReason);
    }
  }, [pendingStatus, statusChangeReason, executeStatusChange]);

  // ActivityTimeline용 노트 변환
  const timelineNotes = useMemo<NoteItem[]>(() => {
    return notes.map((note) => ({
      id: note.id,
      content: note.content,
      admin_name: note.admin_name,
      created_at: note.created_at,
      note_type: note.note_type as
        | "memo"
        | "manual"
        | "status_change"
        | "system"
        | undefined,
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

  return {
    // 데이터
    partner,
    notes,
    auditLogs,
    similarPartners,
    timelineNotes,
    timelineAuditLogs,

    // 상태
    isLoading,
    isChangingStatus,
    isAddingNote,
    isDeletingNote,
    error,
    successMessage,

    // UI 상태
    showStatusDropdown,
    setShowStatusDropdown,
    statusChangeReason,
    setStatusChangeReason,
    showStatusReasonModal,
    setShowStatusReasonModal,
    pendingStatus,
    setPendingStatus,
    showMMSSheet,
    setShowMMSSheet,

    // 핸들러
    handleStatusChange,
    executeStatusChange,
    handleAddNote,
    handleDeleteNote,
    handleCancelStatusChange,
    handleConfirmStatusChange,
  };
}
