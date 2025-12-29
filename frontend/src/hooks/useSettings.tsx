"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/stores/auth";
import { useConfirm } from "@/hooks";
import {
  getProfile,
  updateProfile,
  changePasswordSettings,
  getAdmins,
  createAdmin,
  updateAdmin,
  deleteAdmin,
  ProfileData,
  AdminListItem as AdminItem,
} from "@/lib/api/admin";

export type SettingsTab = "profile" | "password" | "admins";

export function useSettings() {
  const router = useRouter();
  const { getValidToken, admin: currentAdmin } = useAuthStore();
  const { confirm } = useConfirm();

  // 탭 상태
  const [activeTab, setActiveTab] = useState<SettingsTab>("profile");

  // 공통 상태
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // 프로필 상태
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [profileName, setProfileName] = useState("");
  const [profilePhone, setProfilePhone] = useState("");
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // 비밀번호 상태
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  // 관리자 관리 상태
  const [admins, setAdmins] = useState<AdminItem[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<AdminItem | null>(null);
  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [newAdminPassword, setNewAdminPassword] = useState("");
  const [newAdminName, setNewAdminName] = useState("");
  const [newAdminPhone, setNewAdminPhone] = useState("");
  const [isSubmittingAdmin, setIsSubmittingAdmin] = useState(false);

  // 메시지 초기화
  const clearMessages = useCallback(() => {
    setError(null);
    setSuccess(null);
  }, []);

  // 프로필 로드
  const loadProfile = useCallback(async () => {
    try {
      const token = await getValidToken();
      if (!token) {
        router.push("/admin/login");
        return;
      }

      const data = await getProfile(token);
      setProfile(data);
      setProfileName(data.name);
      setProfilePhone(data.phone || "");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "프로필을 불러올 수 없습니다"
      );
    }
  }, [getValidToken, router]);

  // 관리자 목록 로드
  const loadAdmins = useCallback(async () => {
    try {
      const token = await getValidToken();
      if (!token) return;

      const data = await getAdmins(token);
      setAdmins(data);
    } catch (err) {
      console.error("관리자 목록 로드 실패:", err);
    }
  }, [getValidToken]);

  // 초기 로드
  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      await loadProfile();
      await loadAdmins();
      setIsLoading(false);
    };
    init();
  }, [loadProfile, loadAdmins]);

  // 프로필 저장
  const handleSaveProfile = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      clearMessages();

      try {
        setIsSavingProfile(true);
        const token = await getValidToken();
        if (!token) return;

        await updateProfile(token, {
          name: profileName,
          phone: profilePhone || undefined,
        });

        setSuccess("프로필이 저장되었습니다");
        loadProfile();
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "프로필 저장에 실패했습니다"
        );
      } finally {
        setIsSavingProfile(false);
      }
    },
    [clearMessages, getValidToken, profileName, profilePhone, loadProfile]
  );

  // 비밀번호 변경
  const handleChangePassword = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      clearMessages();

      if (newPassword !== confirmPassword) {
        setError("새 비밀번호가 일치하지 않습니다");
        return;
      }

      if (newPassword.length < 8) {
        setError("비밀번호는 8자 이상이어야 합니다");
        return;
      }

      try {
        setIsSavingPassword(true);
        const token = await getValidToken();
        if (!token) return;

        await changePasswordSettings(token, {
          current_password: currentPassword,
          new_password: newPassword,
        });

        setSuccess("비밀번호가 변경되었습니다");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "비밀번호 변경에 실패했습니다"
        );
      } finally {
        setIsSavingPassword(false);
      }
    },
    [
      clearMessages,
      getValidToken,
      currentPassword,
      newPassword,
      confirmPassword,
    ]
  );

  // 관리자 폼 초기화
  const resetAdminForm = useCallback(() => {
    setNewAdminEmail("");
    setNewAdminPassword("");
    setNewAdminName("");
    setNewAdminPhone("");
  }, []);

  // 관리자 생성
  const handleCreateAdmin = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      clearMessages();

      if (newAdminPassword.length < 8) {
        setError("비밀번호는 8자 이상이어야 합니다");
        return;
      }

      try {
        setIsSubmittingAdmin(true);
        const token = await getValidToken();
        if (!token) return;

        await createAdmin(token, {
          email: newAdminEmail,
          password: newAdminPassword,
          name: newAdminName,
          phone: newAdminPhone || undefined,
        });

        setSuccess("관리자가 생성되었습니다");
        setShowCreateModal(false);
        resetAdminForm();
        loadAdmins();
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "관리자 생성에 실패했습니다"
        );
      } finally {
        setIsSubmittingAdmin(false);
      }
    },
    [
      clearMessages,
      getValidToken,
      newAdminEmail,
      newAdminPassword,
      newAdminName,
      newAdminPhone,
      resetAdminForm,
      loadAdmins,
    ]
  );

  // 관리자 수정
  const handleUpdateAdmin = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!editingAdmin) return;
      clearMessages();

      try {
        setIsSubmittingAdmin(true);
        const token = await getValidToken();
        if (!token) return;

        await updateAdmin(token, editingAdmin.id, {
          name: newAdminName,
          phone: newAdminPhone || undefined,
          is_active: editingAdmin.is_active,
        });

        setSuccess("관리자 정보가 수정되었습니다");
        setEditingAdmin(null);
        resetAdminForm();
        loadAdmins();
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "관리자 수정에 실패했습니다"
        );
      } finally {
        setIsSubmittingAdmin(false);
      }
    },
    [
      clearMessages,
      getValidToken,
      editingAdmin,
      newAdminName,
      newAdminPhone,
      resetAdminForm,
      loadAdmins,
    ]
  );

  // 관리자 활성/비활성 토글
  const handleToggleActive = useCallback(
    async (admin: AdminItem) => {
      clearMessages();

      try {
        const token = await getValidToken();
        if (!token) return;

        await updateAdmin(token, admin.id, {
          is_active: !admin.is_active,
        });

        setSuccess(
          admin.is_active
            ? "계정이 비활성화되었습니다"
            : "계정이 활성화되었습니다"
        );
        loadAdmins();
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "상태 변경에 실패했습니다"
        );
      }
    },
    [clearMessages, getValidToken, loadAdmins]
  );

  // 관리자 삭제
  const handleDeleteAdmin = useCallback(
    async (admin: AdminItem) => {
      const confirmed = await confirm({
        title: `${admin.name} 관리자를 삭제하시겠습니까?`,
        description: "삭제된 관리자 계정은 복구할 수 없습니다.",
        type: "warning",
        confirmText: "삭제",
        confirmVariant: "destructive",
      });
      if (!confirmed) return;
      clearMessages();

      try {
        const token = await getValidToken();
        if (!token) return;

        await deleteAdmin(token, admin.id);
        setSuccess("관리자가 삭제되었습니다");
        loadAdmins();
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "관리자 삭제에 실패했습니다"
        );
      }
    },
    [confirm, clearMessages, getValidToken, loadAdmins]
  );

  // 관리자 수정 모달 열기
  const openEditModal = useCallback((admin: AdminItem) => {
    setEditingAdmin(admin);
    setNewAdminName(admin.name);
    setNewAdminPhone(admin.phone || "");
  }, []);

  // 탭 변경 핸들러
  const handleTabChange = useCallback(
    (tab: SettingsTab) => {
      setActiveTab(tab);
      clearMessages();
    },
    [clearMessages]
  );

  return {
    // 탭
    activeTab,
    setActiveTab: handleTabChange,

    // 공통
    isLoading,
    error,
    success,
    clearMessages,
    currentAdmin,

    // 프로필
    profile,
    profileName,
    setProfileName,
    profilePhone,
    setProfilePhone,
    isSavingProfile,
    handleSaveProfile,

    // 비밀번호
    currentPassword,
    setCurrentPassword,
    newPassword,
    setNewPassword,
    confirmPassword,
    setConfirmPassword,
    isSavingPassword,
    handleChangePassword,

    // 관리자 관리
    admins,
    showCreateModal,
    setShowCreateModal,
    editingAdmin,
    setEditingAdmin,
    newAdminEmail,
    setNewAdminEmail,
    newAdminPassword,
    setNewAdminPassword,
    newAdminName,
    setNewAdminName,
    newAdminPhone,
    setNewAdminPhone,
    isSubmittingAdmin,
    handleCreateAdmin,
    handleUpdateAdmin,
    handleToggleActive,
    handleDeleteAdmin,
    resetAdminForm,
    openEditModal,
  };
}
