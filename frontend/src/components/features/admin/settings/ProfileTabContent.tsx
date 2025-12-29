"use client";

import { Loader2, Check } from "lucide-react";
import type { ProfileData } from "@/lib/api/admin";
import { formatPhoneInput } from "@/lib/utils";

interface ProfileTabContentProps {
  profile: ProfileData;
  profileName: string;
  setProfileName: (value: string) => void;
  profilePhone: string;
  setProfilePhone: (value: string) => void;
  isSaving: boolean;
  onSubmit: (e: React.FormEvent) => void;
}

export function ProfileTabContent({
  profile,
  profileName,
  setProfileName,
  profilePhone,
  setProfilePhone,
  isSaving,
  onSubmit,
}: ProfileTabContentProps) {
  return (
    <form onSubmit={onSubmit} className="max-w-md space-y-5">
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
        disabled={isSaving}
        className="px-5 py-2.5 bg-primary text-white rounded-xl hover:bg-primary-600 disabled:opacity-50 inline-flex items-center font-medium text-sm transition-colors shadow-sm"
      >
        {isSaving ? (
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
  );
}
