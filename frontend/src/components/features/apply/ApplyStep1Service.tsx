"use client";

import { UseFormReturn } from "react-hook-form";
import type { ApplicationFormData } from "@/lib/validations/application";
import { ServiceSelector, type CategoryItem } from "@/components/services";
import { FieldError } from "@/components/forms/senior";

interface ApplyStep1ServiceProps {
  form: UseFormReturn<ApplicationFormData>;
  categories: CategoryItem[];
  isLoading: boolean;
  error?: string;
}

/**
 * 서비스 신청 마법사 - Step 1: 서비스 선택
 */
export function ApplyStep1Service({
  form,
  categories,
  isLoading,
  error,
}: ApplyStep1ServiceProps) {
  const selectedServices = form.watch("selectedServices") || [];
  const formError = form.formState.errors.selectedServices?.message;

  const handleServiceToggle = (code: string) => {
    const current = selectedServices;
    const updated = current.includes(code)
      ? current.filter((s) => s !== code)
      : [...current, code];
    form.setValue("selectedServices", updated, { shouldValidate: true });
  };

  return (
    <div className="space-y-4">
      <ServiceSelector
        categories={categories}
        selectedServices={selectedServices}
        onServiceToggle={handleServiceToggle}
        isLoading={isLoading}
        error={error}
        variant="primary"
        showInstructions={false}
        seniorMode={false}
        compactMode={true}
        enableGroupTabs={true}
        enableSearch={false}
        enableDesktopLayout={false}
        enableQuickNav={false}
      />

      {/* 폼 유효성 에러 */}
      {formError && <FieldError message={formError} variant="primary" />}
    </div>
  );
}

export default ApplyStep1Service;
