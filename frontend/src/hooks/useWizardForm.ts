"use client";

import { useState, useCallback, useEffect } from "react";
import { useForm, UseFormReturn, FieldValues, DefaultValues, Path, Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

/**
 * 마법사 스텝 설정 인터페이스
 */
export interface WizardStepConfig {
  /** 스텝 고유 ID */
  id: string;
  /** 스텝 라벨 (표시용) */
  label: string;
  /** 스텝 설명 (선택) */
  description?: string;
  /** 해당 스텝에서 검증할 필드 목록 */
  fields: string[];
}

/**
 * useWizardForm 훅 옵션
 */
export interface UseWizardFormOptions<T extends FieldValues> {
  /** 마법사 스텝 설정 배열 */
  steps: WizardStepConfig[];
  /** 전체 폼 Zod 스키마 */
  schema: z.ZodSchema<T>;
  /** 폼 기본값 */
  defaultValues: DefaultValues<T>;
  /** 폼 제출 핸들러 */
  onSubmit: (data: T) => Promise<void>;
  /** 스텝 변경 콜백 (선택) */
  onStepChange?: (step: number, direction: "next" | "prev" | "jump") => void;
}

/**
 * useWizardForm 훅 반환 타입
 */
export interface UseWizardFormReturn<T extends FieldValues> {
  /** React Hook Form 메서드 */
  form: UseFormReturn<T>;
  /** 현재 스텝 (1부터 시작) */
  currentStep: number;
  /** 총 스텝 수 */
  totalSteps: number;
  /** 현재 스텝 설정 정보 */
  currentStepConfig: WizardStepConfig;
  /** 첫 번째 스텝인지 */
  isFirstStep: boolean;
  /** 마지막 스텝인지 */
  isLastStep: boolean;
  /** 완료된 스텝 목록 (1부터 시작) */
  completedSteps: number[];
  /** 진행률 (0-100) */
  progress: number;
  /** 다음 스텝으로 이동 (검증 후) */
  goNext: () => Promise<boolean>;
  /** 이전 스텝으로 이동 */
  goPrev: () => void;
  /** 특정 스텝으로 이동 (완료된 스텝만 가능) */
  goToStep: (step: number) => void;
  /** 현재 스텝 검증 */
  validateCurrentStep: () => Promise<boolean>;
  /** 현재 스텝 유효성 상태 */
  isCurrentStepValid: boolean;
  /** 제출 중 상태 */
  isSubmitting: boolean;
  /** 제출 완료 상태 */
  isSubmitted: boolean;
  /** 제출 에러 */
  submitError: string | null;
  /** 폼 제출 핸들러 */
  handleSubmit: () => Promise<void>;
  /** 제출 상태 리셋 */
  resetSubmitState: () => void;
}

/**
 * 마법사 폼 관리를 위한 커스텀 훅
 *
 * @example
 * ```tsx
 * const wizard = useWizardForm({
 *   steps: [
 *     { id: 'step1', label: '서비스 선택', fields: ['selectedServices'] },
 *     { id: 'step2', label: '정보 입력', fields: ['name', 'phone'] },
 *   ],
 *   schema: formSchema,
 *   defaultValues: { selectedServices: [], name: '', phone: '' },
 *   onSubmit: async (data) => { await submitForm(data); },
 * });
 * ```
 */
export function useWizardForm<T extends FieldValues>({
  steps,
  schema,
  defaultValues,
  onSubmit,
  onStepChange,
}: UseWizardFormOptions<T>): UseWizardFormReturn<T> {
  // 현재 스텝 (1부터 시작)
  const [currentStep, setCurrentStep] = useState(1);
  // 완료된 스텝 목록
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  // 현재 스텝 유효성
  const [isCurrentStepValid, setIsCurrentStepValid] = useState(false);
  // 제출 상태
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // React Hook Form 설정
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const form = useForm<T>({
    resolver: zodResolver(schema as any) as Resolver<T>,
    defaultValues,
    mode: "onBlur", // 필드 벗어날 때 검증
  });

  const totalSteps = steps.length;
  const isFirstStep = currentStep === 1;
  const isLastStep = currentStep === totalSteps;
  const currentStepConfig = steps[currentStep - 1];
  const progress = Math.round(((currentStep - 1) / totalSteps) * 100);

  /**
   * 현재 스텝의 필드만 검증
   */
  const validateCurrentStep = useCallback(async (): Promise<boolean> => {
    const currentFields = currentStepConfig.fields as Path<T>[];

    // 현재 스텝의 필드만 검증
    const isValid = await form.trigger(currentFields);
    setIsCurrentStepValid(isValid);
    return isValid;
  }, [form, currentStepConfig.fields]);

  /**
   * 폼 값 변경 시 현재 스텝 유효성 재검증
   */
  useEffect(() => {
    const subscription = form.watch(() => {
      // 값이 변경될 때마다 현재 스텝 유효성 확인 (디바운스 적용)
      const timeoutId = setTimeout(() => {
        validateCurrentStep();
      }, 300);
      return () => clearTimeout(timeoutId);
    });
    return () => subscription.unsubscribe();
  }, [form, validateCurrentStep]);

  /**
   * 다음 스텝으로 이동
   */
  const goNext = useCallback(async (): Promise<boolean> => {
    // 현재 스텝 검증
    const isValid = await validateCurrentStep();

    if (!isValid) {
      return false;
    }

    // 현재 스텝을 완료 목록에 추가
    setCompletedSteps((prev) => {
      if (!prev.includes(currentStep)) {
        return [...prev, currentStep];
      }
      return prev;
    });

    // 마지막 스텝이 아니면 다음으로 이동
    if (!isLastStep) {
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      onStepChange?.(nextStep, "next");

      // 스크롤 최상단으로
      window.scrollTo({ top: 0, behavior: "smooth" });
    }

    return true;
  }, [currentStep, isLastStep, validateCurrentStep, onStepChange]);

  /**
   * 이전 스텝으로 이동
   */
  const goPrev = useCallback(() => {
    if (!isFirstStep) {
      const prevStep = currentStep - 1;
      setCurrentStep(prevStep);
      onStepChange?.(prevStep, "prev");

      // 스크롤 최상단으로
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [currentStep, isFirstStep, onStepChange]);

  /**
   * 특정 스텝으로 이동 (완료된 스텝 또는 현재/이전 스텝만)
   */
  const goToStep = useCallback(
    (targetStep: number) => {
      // 유효한 스텝 범위 확인
      if (targetStep < 1 || targetStep > totalSteps) {
        return;
      }

      // 이전 스텝이거나 현재 스텝이거나 완료된 스텝만 이동 가능
      const canNavigate =
        targetStep <= currentStep || completedSteps.includes(targetStep);

      if (canNavigate) {
        setCurrentStep(targetStep);
        onStepChange?.(targetStep, "jump");

        // 스크롤 최상단으로
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    },
    [currentStep, completedSteps, totalSteps, onStepChange]
  );

  /**
   * 폼 제출
   */
  const handleSubmit = useCallback(async () => {
    // 마지막 스텝 검증
    const isValid = await validateCurrentStep();

    if (!isValid) {
      return;
    }

    // 전체 폼 검증
    const formValid = await form.trigger();
    if (!formValid) {
      // 에러가 있는 첫 번째 스텝으로 이동
      const errors = form.formState.errors;
      for (let i = 0; i < steps.length; i++) {
        const stepFields = steps[i].fields;
        const hasError = stepFields.some((field) => errors[field as keyof T]);
        if (hasError) {
          setCurrentStep(i + 1);
          break;
        }
      }
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const data = form.getValues();
      await onSubmit(data as T);

      // 마지막 스텝도 완료 목록에 추가
      setCompletedSteps((prev) => {
        if (!prev.includes(currentStep)) {
          return [...prev, currentStep];
        }
        return prev;
      });

      setIsSubmitted(true);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "제출 중 오류가 발생했습니다.";
      setSubmitError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  }, [form, onSubmit, validateCurrentStep, currentStep, steps]);

  /**
   * 제출 상태 리셋
   */
  const resetSubmitState = useCallback(() => {
    setIsSubmitted(false);
    setSubmitError(null);
  }, []);

  return {
    form,
    currentStep,
    totalSteps,
    currentStepConfig,
    isFirstStep,
    isLastStep,
    completedSteps,
    progress,
    goNext,
    goPrev,
    goToStep,
    validateCurrentStep,
    isCurrentStepValid,
    isSubmitting,
    isSubmitted,
    submitError,
    handleSubmit,
    resetSubmitState,
  };
}

export default useWizardForm;
