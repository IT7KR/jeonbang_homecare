"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
} from "react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { AlertTriangle, Info, CheckCircle, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ButtonProps } from "@/components/ui/button";

type AlertType = "warning" | "info" | "success" | "error";

const alertIcons: Record<AlertType, React.ComponentType<{ className?: string }>> = {
  warning: AlertTriangle,
  info: Info,
  success: CheckCircle,
  error: XCircle,
};

const alertColors: Record<AlertType, string> = {
  warning: "text-yellow-500 bg-yellow-50",
  info: "text-blue-500 bg-blue-50",
  success: "text-primary bg-primary-50",
  error: "text-red-500 bg-red-50",
};

export interface ConfirmOptions {
  title: string;
  description?: string;
  type?: AlertType;
  confirmText?: string;
  cancelText?: string;
  confirmVariant?: ButtonProps["variant"];
}

interface ConfirmState extends ConfirmOptions {
  isOpen: boolean;
}

interface ConfirmContextValue {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const ConfirmContext = createContext<ConfirmContextValue | null>(null);

/**
 * Confirm Provider
 *
 * @example
 * // layout.tsx
 * <ConfirmProvider>
 *   {children}
 * </ConfirmProvider>
 */
export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<ConfirmState>({
    isOpen: false,
    title: "",
    description: "",
    type: "warning",
    confirmText: "확인",
    cancelText: "취소",
    confirmVariant: "default",
  });

  const resolveRef = useRef<((value: boolean) => void) | null>(null);

  const confirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      resolveRef.current = resolve;
      setState({
        isOpen: true,
        title: options.title,
        description: options.description,
        type: options.type ?? "warning",
        confirmText: options.confirmText ?? "확인",
        cancelText: options.cancelText ?? "취소",
        confirmVariant: options.confirmVariant ?? "default",
      });
    });
  }, []);

  const handleClose = useCallback((confirmed: boolean) => {
    setState((prev) => ({ ...prev, isOpen: false }));
    resolveRef.current?.(confirmed);
    resolveRef.current = null;
  }, []);

  const Icon = alertIcons[state.type ?? "warning"];

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      <AlertDialog
        open={state.isOpen}
        onOpenChange={(open) => {
          if (!open) handleClose(false);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex items-start gap-4">
              <div className={cn("p-2.5 rounded-xl", alertColors[state.type ?? "warning"])}>
                <Icon className="w-5 h-5" />
              </div>
              <div className="flex-1 text-left">
                <AlertDialogTitle>{state.title}</AlertDialogTitle>
                {state.description && (
                  <AlertDialogDescription className="mt-1">
                    {state.description}
                  </AlertDialogDescription>
                )}
              </div>
            </div>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => handleClose(false)}>
              {state.cancelText}
            </AlertDialogCancel>
            <AlertDialogAction
              variant={state.confirmVariant}
              onClick={() => handleClose(true)}
              autoFocus
            >
              {state.confirmText}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ConfirmContext.Provider>
  );
}

/**
 * Confirm 훅
 *
 * Promise 기반의 확인 다이얼로그를 제공합니다.
 *
 * @example
 * const { confirm } = useConfirm();
 *
 * const handleDelete = async () => {
 *   const confirmed = await confirm({
 *     title: "정말 삭제하시겠습니까?",
 *     description: "이 작업은 되돌릴 수 없습니다.",
 *     type: "warning",
 *     confirmText: "삭제",
 *     confirmVariant: "destructive",
 *   });
 *
 *   if (confirmed) {
 *     // 삭제 로직
 *   }
 * };
 */
export function useConfirm(): ConfirmContextValue {
  const context = useContext(ConfirmContext);
  if (!context) {
    throw new Error("useConfirm must be used within a ConfirmProvider");
  }
  return context;
}

export default useConfirm;
