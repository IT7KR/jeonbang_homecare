"use client";

import { Toaster as SonnerToaster } from "sonner";

type ToasterProps = React.ComponentProps<typeof SonnerToaster>;

/**
 * Toast 알림 컴포넌트
 * Sonner 라이브러리 래퍼
 *
 * @example
 * // layout.tsx에 추가
 * <Toaster />
 *
 * // 사용법
 * import { toast } from "sonner";
 * toast.success("저장되었습니다");
 * toast.error("오류가 발생했습니다");
 */
export function Toaster({ ...props }: ToasterProps) {
  return (
    <SonnerToaster
      position="top-center"
      expand={false}
      richColors
      closeButton
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-white group-[.toaster]:text-gray-900 group-[.toaster]:border-gray-200 group-[.toaster]:shadow-lg group-[.toaster]:rounded-xl",
          title: "group-[.toast]:font-semibold",
          description: "group-[.toast]:text-gray-500",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-white",
          cancelButton:
            "group-[.toast]:bg-gray-100 group-[.toast]:text-gray-500",
          closeButton:
            "group-[.toast]:bg-white group-[.toast]:border-gray-200",
          success:
            "group-[.toaster]:bg-primary-50 group-[.toaster]:text-primary-900 group-[.toaster]:border-primary-200",
          error:
            "group-[.toaster]:bg-red-50 group-[.toaster]:text-red-900 group-[.toaster]:border-red-200",
          warning:
            "group-[.toaster]:bg-yellow-50 group-[.toaster]:text-yellow-900 group-[.toaster]:border-yellow-200",
          info: "group-[.toaster]:bg-blue-50 group-[.toaster]:text-blue-900 group-[.toaster]:border-blue-200",
        },
      }}
      {...props}
    />
  );
}

export { toast } from "sonner";
