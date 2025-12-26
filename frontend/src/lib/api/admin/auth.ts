/**
 * Admin Auth API
 * 인증 관련 API (로그인, 토큰 갱신, 비밀번호 변경)
 */

import { fetchApi, fetchWithToken } from "../client";
import type {
  Admin,
  LoginRequest,
  LoginResponse,
  RefreshResponse,
} from "./types";

/**
 * 관리자 로그인
 */
export async function adminLogin(data: LoginRequest): Promise<LoginResponse> {
  return fetchApi<LoginResponse>("/admin/auth/login", {
    method: "POST",
    body: data,
  });
}

/**
 * 토큰 갱신
 */
export async function refreshAccessToken(
  refreshToken: string
): Promise<RefreshResponse> {
  return fetchApi<RefreshResponse>("/admin/auth/refresh", {
    method: "POST",
    body: { refresh_token: refreshToken },
  });
}

/**
 * 현재 관리자 정보 조회
 */
export async function getMe(token: string): Promise<Admin> {
  return fetchWithToken<Admin>("/admin/auth/me", token);
}

/**
 * 비밀번호 변경
 */
export async function changePassword(
  token: string,
  currentPassword: string,
  newPassword: string
): Promise<void> {
  return fetchWithToken<void>("/admin/auth/password", token, {
    method: "PUT",
    body: {
      current_password: currentPassword,
      new_password: newPassword,
    },
  });
}
