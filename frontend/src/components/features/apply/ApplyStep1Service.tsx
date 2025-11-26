"use client";

import { Briefcase } from "lucide-react";
import { UseFormReturn } from "react-hook-form";
import type { ApplicationFormData } from "@/lib/validations/application";
import { StepHeader } from "@/components/wizard";
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
    <div className="wizard-step-content">
      <StepHeader
        stepNumber={1}
        totalSteps={3}
        title="어떤 서비스가 필요하신가요?"
        description="필요한 서비스를 선택해 주세요. 여러 개 선택 가능합니다."
        icon={<Briefcase className="w-full h-full" />}
        variant="primary"
      />

      <div className="space-y-6">
        <ServiceSelector
          categories={categories}
          selectedServices={selectedServices}
          onServiceToggle={handleServiceToggle}
          isLoading={isLoading}
          error={error}
          variant="primary"
          showInstructions={true}
          instructionTitle="아래에서 원하시는 서비스를 선택해 주세요"
          instructionDescription="각 카테고리를 펼쳐서 세부 서비스를 선택할 수 있습니다."
          enableGroupTabs={true}
          enableSearch={true}
          enableDesktopLayout={true}
        />

        {/* 폼 유효성 에러 */}
        {formError && <FieldError message={formError} variant="primary" />}
      </div>
    </div>
  );
}

export default ApplyStep1Service;
