"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  User,
  Lock,
  Users,
  Plus,
  Edit2,
  Trash2,
  Loader2,
  Check,
  X,
  Shield,
  ShieldOff,
} from "lucide-react";
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
import { formatPhoneInput } from "@/lib/utils";

export default function SettingsPage() {
  const router = useRouter();
  const { getValidToken, admin: currentAdmin } = useAuthStore();
  const { confirm } = useConfirm();

  const [activeTab, setActiveTab] = useState<"profile" | "password" | "admins">("profile");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Profile state
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [profileName, setProfileName] = useState("");
  const [profilePhone, setProfilePhone] = useState("");
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Password state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  // Admin management state
  const [admins, setAdmins] = useState<AdminItem[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<AdminItem | null>(null);
  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [newAdminPassword, setNewAdminPassword] = useState("");
  const [newAdminName, setNewAdminName] = useState("");
  const [newAdminPhone, setNewAdminPhone] = useState("");
  const [isSubmittingAdmin, setIsSubmittingAdmin] = useState(false);

  const loadProfile = async () => {
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
      setError(err instanceof Error ? err.message : "프로필을 불러올 수 없습니다");
    }
  };

  const loadAdmins = async () => {
    try {
      const token = await getValidToken();
      if (!token) return;

      const data = await getAdmins(token);
      setAdmins(data);
    } catch (err) {
      console.error("관리자 목록 로드 실패:", err);
    }
  };

  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      await loadProfile();
      await loadAdmins();
      setIsLoading(false);
    };
    init();
  }, []);

  const clearMessages = () => {
    setError(null);
    setSuccess(null);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
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
      setError(err instanceof Error ? err.message : "프로필 저장에 실패했습니다");
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
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
      setError(err instanceof Error ? err.message : "비밀번호 변경에 실패했습니다");
    } finally {
      setIsSavingPassword(false);
    }
  };

  const handleCreateAdmin = async (e: React.FormEvent) => {
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
      resetCreateForm();
      loadAdmins();
    } catch (err) {
      setError(err instanceof Error ? err.message : "관리자 생성에 실패했습니다");
    } finally {
      setIsSubmittingAdmin(false);
    }
  };

  const handleUpdateAdmin = async (e: React.FormEvent) => {
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
      resetCreateForm();
      loadAdmins();
    } catch (err) {
      setError(err instanceof Error ? err.message : "관리자 수정에 실패했습니다");
    } finally {
      setIsSubmittingAdmin(false);
    }
  };

  const handleToggleActive = async (admin: AdminItem) => {
    clearMessages();

    try {
      const token = await getValidToken();
      if (!token) return;

      await updateAdmin(token, admin.id, {
        is_active: !admin.is_active,
      });

      setSuccess(admin.is_active ? "계정이 비활성화되었습니다" : "계정이 활성화되었습니다");
      loadAdmins();
    } catch (err) {
      setError(err instanceof Error ? err.message : "상태 변경에 실패했습니다");
    }
  };

  const handleDeleteAdmin = async (admin: AdminItem) => {
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
      setError(err instanceof Error ? err.message : "관리자 삭제에 실패했습니다");
    }
  };

  const resetCreateForm = () => {
    setNewAdminEmail("");
    setNewAdminPassword("");
    setNewAdminName("");
    setNewAdminPhone("");
  };

  const openEditModal = (admin: AdminItem) => {
    setEditingAdmin(admin);
    setNewAdminName(admin.name);
    setNewAdminPhone(admin.phone || "");
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">설정</h1>
        <p className="text-gray-500 mt-1">계정 정보 및 관리자 설정</p>
      </div>

      {/* Messages */}
      {error && (
        <div className="bg-red-50 border border-red-100 rounded-2xl p-4 text-red-600 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
            <X size={16} className="text-red-500" />
          </div>
          <p className="text-sm">{error}</p>
        </div>
      )}
      {success && (
        <div className="bg-primary-50 border border-primary-100 rounded-2xl p-4 text-primary-700 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
            <Check size={16} className="text-primary" />
          </div>
          <p className="text-sm">{success}</p>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="border-b border-gray-100">
          <nav className="flex -mb-px">
            <button
              onClick={() => { setActiveTab("profile"); clearMessages(); }}
              className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "profile"
                  ? "border-primary text-primary"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <User size={18} className="inline mr-2" />
              프로필
            </button>
            <button
              onClick={() => { setActiveTab("password"); clearMessages(); }}
              className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "password"
                  ? "border-primary text-primary"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <Lock size={18} className="inline mr-2" />
              비밀번호
            </button>
            <button
              onClick={() => { setActiveTab("admins"); clearMessages(); }}
              className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "admins"
                  ? "border-primary text-primary"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <Users size={18} className="inline mr-2" />
              관리자 계정
            </button>
          </nav>
        </div>

        <div className="p-6">
          {/* Profile Tab */}
          {activeTab === "profile" && profile && (
            <form onSubmit={handleSaveProfile} className="max-w-md space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  이메일
                </label>
                <input
                  type="email"
                  value={profile.email}
                  disabled
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-gray-50 text-gray-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  이름 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  연락처
                </label>
                <input
                  type="tel"
                  value={profilePhone}
                  onChange={(e) => setProfilePhone(formatPhoneInput(e.target.value))}
                  placeholder="010-1234-5678"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  권한
                </label>
                <input
                  type="text"
                  value="최고관리자"
                  disabled
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-gray-50 text-gray-500"
                />
              </div>
              <button
                type="submit"
                disabled={isSavingProfile}
                className="px-5 py-2.5 bg-primary text-white rounded-xl hover:bg-primary-600 disabled:opacity-50 inline-flex items-center font-medium text-sm transition-colors shadow-sm"
              >
                {isSavingProfile ? (
                  <>
                    <Loader2 size={18} className="mr-2 animate-spin" />
                    저장중...
                  </>
                ) : (
                  <>
                    <Check size={18} className="mr-2" />
                    저장
                  </>
                )}
              </button>
            </form>
          )}

          {/* Password Tab */}
          {activeTab === "password" && (
            <form onSubmit={handleChangePassword} className="max-w-md space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  현재 비밀번호 <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  새 비밀번호 <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={8}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                />
                <p className="text-xs text-gray-500 mt-1.5">8자 이상 입력해주세요</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  새 비밀번호 확인 <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                />
              </div>
              <button
                type="submit"
                disabled={isSavingPassword}
                className="px-5 py-2.5 bg-primary text-white rounded-xl hover:bg-primary-600 disabled:opacity-50 inline-flex items-center font-medium text-sm transition-colors shadow-sm"
              >
                {isSavingPassword ? (
                  <>
                    <Loader2 size={18} className="mr-2 animate-spin" />
                    변경중...
                  </>
                ) : (
                  <>
                    <Lock size={18} className="mr-2" />
                    비밀번호 변경
                  </>
                )}
              </button>
            </form>
          )}

          {/* Admins Tab */}
          {activeTab === "admins" && (
            <div className="space-y-4">
              <div className="flex justify-end">
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="px-5 py-2.5 bg-primary text-white rounded-xl hover:bg-primary-600 inline-flex items-center font-medium text-sm transition-colors shadow-sm"
                >
                  <Plus size={18} className="mr-2" />
                  관리자 추가
                </button>
              </div>

              <div className="overflow-x-auto rounded-xl border border-gray-100">
                <table className="min-w-full">
                  <thead>
                    <tr className="bg-gray-50/80 border-b border-gray-100">
                      <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        이름
                      </th>
                      <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                        이메일
                      </th>
                      <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                        연락처
                      </th>
                      <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        상태
                      </th>
                      <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">
                        마지막 로그인
                      </th>
                      <th className="px-5 py-3.5 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        관리
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 bg-white">
                    {admins.map((admin) => (
                      <tr key={admin.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-5 py-4 whitespace-nowrap">
                          <span className="font-medium text-gray-900">{admin.name}</span>
                          {admin.id === currentAdmin?.id && (
                            <span className="ml-2 text-xs text-primary font-medium">(나)</span>
                          )}
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap text-gray-600 hidden sm:table-cell">
                          {admin.email}
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap text-gray-600 hidden sm:table-cell">
                          {admin.phone || "-"}
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex px-2.5 py-1 text-xs font-semibold rounded-full ${
                              admin.is_active
                                ? "bg-primary-50 text-primary-700"
                                : "bg-red-50 text-red-600"
                            }`}
                          >
                            {admin.is_active ? "활성" : "비활성"}
                          </span>
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-500 hidden md:table-cell">
                          {formatDate(admin.last_login_at)}
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap text-center">
                          {admin.id !== currentAdmin?.id && (
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => openEditModal(admin)}
                                className="p-2 text-gray-600 hover:text-primary hover:bg-primary-50 rounded-lg transition-colors"
                                title="수정"
                              >
                                <Edit2 size={16} />
                              </button>
                              <button
                                onClick={() => handleToggleActive(admin)}
                                className={`p-2 rounded-lg transition-colors ${
                                  admin.is_active
                                    ? "text-secondary hover:bg-secondary-50"
                                    : "text-primary hover:bg-primary-50"
                                }`}
                                title={admin.is_active ? "비활성화" : "활성화"}
                              >
                                {admin.is_active ? <ShieldOff size={16} /> : <Shield size={16} />}
                              </button>
                              <button
                                onClick={() => handleDeleteAdmin(admin)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="삭제"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create Admin Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
              <h2 className="text-lg font-semibold text-gray-900">관리자 추가</h2>
              <button
                onClick={() => { setShowCreateModal(false); resetCreateForm(); }}
                className="p-1.5 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <X size={20} className="text-gray-500" />
              </button>
            </div>
            <form onSubmit={handleCreateAdmin} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  이메일 <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={newAdminEmail}
                  onChange={(e) => setNewAdminEmail(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  비밀번호 <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  value={newAdminPassword}
                  onChange={(e) => setNewAdminPassword(e.target.value)}
                  required
                  minLength={8}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                />
                <p className="text-xs text-gray-500 mt-1.5">8자 이상</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  이름 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newAdminName}
                  onChange={(e) => setNewAdminName(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  연락처
                </label>
                <input
                  type="tel"
                  value={newAdminPhone}
                  onChange={(e) => setNewAdminPhone(formatPhoneInput(e.target.value))}
                  placeholder="010-1234-5678"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowCreateModal(false); resetCreateForm(); }}
                  className="px-5 py-2.5 text-gray-700 border border-gray-200 rounded-xl hover:bg-gray-50 font-medium text-sm transition-colors"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingAdmin}
                  className="px-5 py-2.5 bg-primary text-white rounded-xl hover:bg-primary-600 disabled:opacity-50 inline-flex items-center font-medium text-sm transition-colors shadow-sm"
                >
                  {isSubmittingAdmin ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    "추가"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Admin Modal */}
      {editingAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
              <h2 className="text-lg font-semibold text-gray-900">관리자 수정</h2>
              <button
                onClick={() => { setEditingAdmin(null); resetCreateForm(); }}
                className="p-1.5 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <X size={20} className="text-gray-500" />
              </button>
            </div>
            <form onSubmit={handleUpdateAdmin} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  이메일
                </label>
                <input
                  type="email"
                  value={editingAdmin.email}
                  disabled
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-gray-50 text-gray-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  이름 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newAdminName}
                  onChange={(e) => setNewAdminName(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  연락처
                </label>
                <input
                  type="tel"
                  value={newAdminPhone}
                  onChange={(e) => setNewAdminPhone(formatPhoneInput(e.target.value))}
                  placeholder="010-1234-5678"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => { setEditingAdmin(null); resetCreateForm(); }}
                  className="px-5 py-2.5 text-gray-700 border border-gray-200 rounded-xl hover:bg-gray-50 font-medium text-sm transition-colors"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingAdmin}
                  className="px-5 py-2.5 bg-primary text-white rounded-xl hover:bg-primary-600 disabled:opacity-50 inline-flex items-center font-medium text-sm transition-colors shadow-sm"
                >
                  {isSubmittingAdmin ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    "저장"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
