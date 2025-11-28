/**
 * Admin Settings API
 * 설정 관리 API (프로필, 비밀번호, 관리자 계정)
 */

import { fetchWithToken } from "../client";
import type {
  ProfileData,
  ProfileUpdate,
  PasswordChange,
  AdminListItem,
  AdminCreate,
  AdminUpdateData,
} from "./types";

/**
 * 프로필 조회
 */
export async function getProfile(token: string): Promise<ProfileData> {
  return fetchWithToken<ProfileData>("/admin/settings/profile", token);
}

/**
 * 프로필 수정
 */
export async function updateProfile(
  token: string,
  data: ProfileUpdate
): Promise<ProfileData> {
  return fetchWithToken<ProfileData>("/admin/settings/profile", token, {
    method: "PUT",
    body: data,
  });
}

/**
 * 비밀번호 변경 (설정 페이지용)
 */
export async function changePasswordSettings(
  token: string,
  data: PasswordChange
): Promise<void> {
  return fetchWithToken<void>("/admin/settings/password", token, {
    method: "PUT",
    body: data,
  });
}

/**
 * 관리자 목록 조회
 */
export async function getAdmins(token: string): Promise<AdminListItem[]> {
  return fetchWithToken<AdminListItem[]>("/admin/settings/admins", token);
}

/**
 * 관리자 생성
 */
export async function createAdmin(
  token: string,
  data: AdminCreate
): Promise<AdminListItem> {
  return fetchWithToken<AdminListItem>("/admin/settings/admins", token, {
    method: "POST",
    body: data,
  });
}

/**
 * 관리자 수정
 */
export async function updateAdmin(
  token: string,
  adminId: number,
  data: AdminUpdateData
): Promise<AdminListItem> {
  return fetchWithToken<AdminListItem>(
    `/admin/settings/admins/${adminId}`,
    token,
    {
      method: "PUT",
      body: data,
    }
  );
}

/**
 * 관리자 삭제
 */
export async function deleteAdmin(
  token: string,
  adminId: number
): Promise<void> {
  return fetchWithToken<void>(`/admin/settings/admins/${adminId}`, token, {
    method: "DELETE",
  });
}
