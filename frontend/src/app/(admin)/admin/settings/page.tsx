"use client";

import { User, Lock, Loader2, Check, X } from "lucide-react";
import { useSettings } from "@/hooks/useSettings";
import {
  ProfileTabContent,
  PasswordTabContent,
} from "@/components/features/admin/settings";

export default function SettingsPage() {
  const hook = useSettings();

  if (hook.isLoading) {
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
      {hook.error && (
        <div className="bg-red-50 border border-red-100 rounded-2xl p-4 text-red-600 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
            <X size={16} className="text-red-500" />
          </div>
          <p className="text-sm">{hook.error}</p>
        </div>
      )}
      {hook.success && (
        <div className="bg-primary-50 border border-primary-100 rounded-2xl p-4 text-primary-700 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
            <Check size={16} className="text-primary" />
          </div>
          <p className="text-sm">{hook.success}</p>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="border-b border-gray-100">
          <nav className="flex -mb-px">
            <button
              onClick={() => hook.setActiveTab("profile")}
              className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                hook.activeTab === "profile"
                  ? "border-primary text-primary"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <User size={18} className="inline mr-2" />
              프로필
            </button>
            <button
              onClick={() => hook.setActiveTab("password")}
              className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                hook.activeTab === "password"
                  ? "border-primary text-primary"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <Lock size={18} className="inline mr-2" />
              비밀번호
            </button>
            {/* 관리자 계정 탭 - 임시 숨김
            <button
              onClick={() => hook.setActiveTab("admins")}
              className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                hook.activeTab === "admins"
                  ? "border-primary text-primary"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <Users size={18} className="inline mr-2" />
              관리자 계정
            </button>
            */}
          </nav>
        </div>

        <div className="p-6">
          {/* Profile Tab */}
          {hook.activeTab === "profile" && hook.profile && (
            <ProfileTabContent
              profile={hook.profile}
              profileName={hook.profileName}
              setProfileName={hook.setProfileName}
              profilePhone={hook.profilePhone}
              setProfilePhone={hook.setProfilePhone}
              isSaving={hook.isSavingProfile}
              onSubmit={hook.handleSaveProfile}
            />
          )}

          {/* Password Tab */}
          {hook.activeTab === "password" && (
            <PasswordTabContent
              currentPassword={hook.currentPassword}
              setCurrentPassword={hook.setCurrentPassword}
              newPassword={hook.newPassword}
              setNewPassword={hook.setNewPassword}
              confirmPassword={hook.confirmPassword}
              setConfirmPassword={hook.setConfirmPassword}
              isSaving={hook.isSavingPassword}
              onSubmit={hook.handleChangePassword}
            />
          )}

          {/* Admins Tab - 임시 숨김
          {hook.activeTab === "admins" && (
            <AdminsTabContent ... />
          )}
          */}
        </div>
      </div>

      {/* 관리자 생성/수정 모달 - 임시 숨김
      {hook.showCreateModal && (
        <CreateAdminModal ... />
      )}
      {hook.editingAdmin && (
        <EditAdminModal ... />
      )}
      */}
    </div>
  );
}
