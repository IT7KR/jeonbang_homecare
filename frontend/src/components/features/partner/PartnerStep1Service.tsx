"use client";

import { UseFormReturn } from "react-hook-form";
import type { PartnerFormData } from "@/lib/validations/partner";
import { ServiceSelector, type CategoryItem } from "@/components/services";
import { FieldError } from "@/components/forms/senior";

interface PartnerStep1ServiceProps {
  form: UseFormReturn<PartnerFormData>;
  categories: CategoryItem[];
  isLoading: boolean;
  error?: string;
}

/**
 * 협력사 등록 마법사 - Step 1: 서비스 분야 선택
 */
export function PartnerStep1Service({
  form,
  categories,
  isLoading,
  error,
}: PartnerStep1ServiceProps) {
  const serviceAreas = form.watch("serviceAreas") || [];
  const formError = form.formState.errors.serviceAreas?.message;

  const handleServiceToggle = (code: string) => {
    const current = serviceAreas;
    const updated = current.includes(code)
      ? current.filter((s) => s !== code)
      : [...current, code];
    form.setValue("serviceAreas", updated, { shouldValidate: true });
  };

  return (
    <div className="space-y-4">
      <ServiceSelector
        categories={categories}
        selectedServices={serviceAreas}
        onServiceToggle={handleServiceToggle}
        isLoading={isLoading}
        error={error}
        variant="secondary"
        showInstructions={false}
        seniorMode={false}
        compactMode={true}
        enableGroupTabs={true}
        enableSearch={false}
        enableDesktopLayout={false}
        enableQuickNav={false}
      />

      {/* 폼 유효성 에러 */}
      {formError && <FieldError message={formError} variant="secondary" />}
    </div>
  );
}

export default PartnerStep1Service;
