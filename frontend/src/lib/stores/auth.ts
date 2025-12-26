/**
 * Auth Store
 * 관리자 인증 상태 관리 (Access Token + Refresh Token)
 */

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import {
  Admin,
  adminLogin,
  getMe,
  refreshAccessToken,
  LoginRequest,
} from "@/lib/api/admin";

interface AuthState {
  // State
  accessToken: string | null;
  refreshToken: string | null;
  expiresAt: number | null; // Unix timestamp (ms)
  admin: Admin | null;
  isLoading: boolean;
  error: string | null;
  _hasHydrated: boolean; // Zustand hydration 완료 여부

  // Actions
  login: (data: LoginRequest) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<boolean>;
  refreshAuth: () => Promise<boolean>;
  getValidToken: () => Promise<string | null>;
  clearError: () => void;
  setHasHydrated: (state: boolean) => void;
}

// 토큰 만료 5분 전에 갱신
const TOKEN_REFRESH_MARGIN = 5 * 60 * 1000; // 5 minutes in ms

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // Initial state
      accessToken: null,
      refreshToken: null,
      expiresAt: null,
      admin: null,
      isLoading: false,
      error: null,
      _hasHydrated: false,

      // Hydration 상태 설정
      setHasHydrated: (state: boolean) => {
        set({ _hasHydrated: state });
      },

      // Login
      login: async (data: LoginRequest) => {
        set({ isLoading: true, error: null });

        try {
          const response = await adminLogin(data);
          const expiresAt = Date.now() + response.expires_in * 1000;

          set({
            accessToken: response.access_token,
            refreshToken: response.refresh_token,
            expiresAt,
            admin: response.admin,
            isLoading: false,
          });
        } catch (error) {
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : "로그인에 실패했습니다",
          });
          throw error;
        }
      },

      // Logout
      logout: () => {
        set({
          accessToken: null,
          refreshToken: null,
          expiresAt: null,
          admin: null,
          error: null,
        });
      },

      // Check auth (verify token is still valid)
      checkAuth: async () => {
        const { accessToken, refreshToken, expiresAt } = get();

        // 토큰 없음
        if (!accessToken || !refreshToken) {
          return false;
        }

        // 토큰 만료 확인
        const now = Date.now();
        if (expiresAt && now >= expiresAt - TOKEN_REFRESH_MARGIN) {
          // 만료 임박 또는 만료됨 - 갱신 시도
          return await get().refreshAuth();
        }

        // 토큰 유효성 검증
        try {
          const admin = await getMe(accessToken);
          set({ admin });
          return true;
        } catch {
          // 토큰 무효 - 갱신 시도
          return await get().refreshAuth();
        }
      },

      // Refresh token
      refreshAuth: async () => {
        const { refreshToken } = get();

        if (!refreshToken) {
          get().logout();
          return false;
        }

        try {
          const response = await refreshAccessToken(refreshToken);
          const expiresAt = Date.now() + response.expires_in * 1000;

          set({
            accessToken: response.access_token,
            expiresAt,
          });

          // 관리자 정보 갱신
          try {
            const admin = await getMe(response.access_token);
            set({ admin });
          } catch {
            // 관리자 정보 갱신 실패는 무시 (토큰은 유효)
          }

          return true;
        } catch {
          // 리프레시 토큰도 만료됨
          get().logout();
          return false;
        }
      },

      // Get valid token (자동 갱신 포함)
      getValidToken: async () => {
        const { accessToken, expiresAt } = get();

        if (!accessToken) {
          return null;
        }

        // 만료 확인 및 갱신
        const now = Date.now();
        if (expiresAt && now >= expiresAt - TOKEN_REFRESH_MARGIN) {
          const success = await get().refreshAuth();
          if (!success) {
            return null;
          }
          return get().accessToken;
        }

        return accessToken;
      },

      // Clear error
      clearError: () => {
        set({ error: null });
      },
    }),
    {
      name: "admin-auth",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        expiresAt: state.expiresAt,
        admin: state.admin,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);

// 호환성을 위한 token getter (기존 코드에서 사용)
export const getToken = () => useAuthStore.getState().accessToken;
