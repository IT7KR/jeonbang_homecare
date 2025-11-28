/**
 * Toast 알림 유틸리티 훅
 *
 * Sonner 라이브러리 래퍼로, API 호출 결과를 자동으로 토스트로 표시
 */

import { toast as sonnerToast } from "sonner";

interface ToastOptions {
  description?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

/**
 * 토스트 알림 유틸리티
 *
 * @example
 * import { toast } from "@/hooks/useToast";
 *
 * // 성공 메시지
 * toast.success("저장되었습니다");
 *
 * // 에러 메시지
 * toast.error("오류가 발생했습니다");
 *
 * // Promise 처리 (자동 로딩/성공/에러 상태)
 * toast.promise(saveData(), {
 *   loading: "저장 중...",
 *   success: "저장되었습니다",
 *   error: "저장에 실패했습니다",
 * });
 *
 * // API 호출 래퍼
 * const result = await toast.api(updateProfile(data), {
 *   loading: "프로필 수정 중...",
 *   success: "프로필이 수정되었습니다",
 * });
 */
export const toast = {
  /**
   * 성공 메시지
   */
  success: (message: string, options?: ToastOptions) => {
    sonnerToast.success(message, {
      description: options?.description,
      duration: options?.duration ?? 3000,
      action: options?.action,
    });
  },

  /**
   * 에러 메시지
   */
  error: (message: string, options?: ToastOptions) => {
    sonnerToast.error(message, {
      description: options?.description,
      duration: options?.duration ?? 5000,
      action: options?.action,
    });
  },

  /**
   * 경고 메시지
   */
  warning: (message: string, options?: ToastOptions) => {
    sonnerToast.warning(message, {
      description: options?.description,
      duration: options?.duration ?? 4000,
      action: options?.action,
    });
  },

  /**
   * 정보 메시지
   */
  info: (message: string, options?: ToastOptions) => {
    sonnerToast.info(message, {
      description: options?.description,
      duration: options?.duration ?? 3000,
      action: options?.action,
    });
  },

  /**
   * Promise 처리 (로딩 → 성공/에러 자동 전환)
   */
  promise: <T>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string | ((data: T) => string);
      error?: string | ((error: unknown) => string);
    }
  ) => {
    return sonnerToast.promise(promise, {
      loading: messages.loading,
      success: messages.success,
      error: messages.error ?? "오류가 발생했습니다",
    });
  },

  /**
   * API 호출 래퍼 (에러 자동 처리)
   * Promise가 성공하면 결과를 반환하고 성공 토스트 표시
   * 실패하면 에러 토스트 표시 후 null 반환
   */
  api: async <T>(
    promise: Promise<T>,
    messages: {
      loading?: string;
      success?: string;
      error?: string;
    } = {}
  ): Promise<T | null> => {
    const toastId = messages.loading
      ? sonnerToast.loading(messages.loading)
      : undefined;

    try {
      const result = await promise;
      if (toastId) {
        sonnerToast.dismiss(toastId);
      }
      if (messages.success) {
        sonnerToast.success(messages.success);
      }
      return result;
    } catch (error) {
      if (toastId) {
        sonnerToast.dismiss(toastId);
      }
      const errorMessage =
        messages.error ||
        (error instanceof Error ? error.message : "오류가 발생했습니다");
      sonnerToast.error(errorMessage);
      return null;
    }
  },

  /**
   * 토스트 닫기
   */
  dismiss: (toastId?: string | number) => {
    sonnerToast.dismiss(toastId);
  },
};

export default toast;
