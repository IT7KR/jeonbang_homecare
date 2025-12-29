"use client";

import { Loader2, Lock } from "lucide-react";

interface PasswordTabContentProps {
  currentPassword: string;
  setCurrentPassword: (value: string) => void;
  newPassword: string;
  setNewPassword: (value: string) => void;
  confirmPassword: string;
  setConfirmPassword: (value: string) => void;
  isSaving: boolean;
  onSubmit: (e: React.FormEvent) => void;
}

export function PasswordTabContent({
  currentPassword,
  setCurrentPassword,
  newPassword,
  setNewPassword,
  confirmPassword,
  setConfirmPassword,
  isSaving,
  onSubmit,
}: PasswordTabContentProps) {
  return (
    <form onSubmit={onSubmit} className="max-w-md space-y-5">
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
        disabled={isSaving}
        className="px-5 py-2.5 bg-primary text-white rounded-xl hover:bg-primary-600 disabled:opacity-50 inline-flex items-center font-medium text-sm transition-colors shadow-sm"
      >
        {isSaving ? (
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
  );
}
