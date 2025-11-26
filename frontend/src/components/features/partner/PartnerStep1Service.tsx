"use client";

import { Briefcase } from "lucide-react";
import { UseFormReturn } from "react-hook-form";
import type { PartnerFormData } from "@/lib/validations/partner";
import { SERVICE_CATEGORIES } from "@/lib/constants";
import { StepHeader } from "@/components/wizard";
import { ServiceSelector } from "@/components/services";
import { FieldError } from "@/components/forms/senior";

interface PartnerStep1ServiceProps {
  form: UseFormReturn<PartnerFormData>;
}

/**
 * 협력사 등록 마법사 - Step 1: 서비스 분야 선택
 */
export function PartnerStep1Service({ form }: PartnerStep1ServiceProps) {
  const serviceAreas = form.watch("serviceAreas") || [];
  const formError = form.formState.errors.serviceAreas?.message;

  const handleServiceToggle = (service: string) => {
    const current = serviceAreas;
    const updated = current.includes(service)
      ? current.filter((s) => s !== service)
      : [...current, service];
    form.setValue("serviceAreas", updated, { shouldValidate: true });
  };

  return (
    <div className="wizard-step-content">
      <StepHeader
        stepNumber={1}
        totalSteps={4}
        title="어떤 서비스를 제공하시나요?"
        description="제공 가능한 서비스 분야를 선택해 주세요. 여러 개 선택 가능합니다."
        icon={<Briefcase className="w-full h-full" />}
        variant="secondary"
      />

      <div className="space-y-6">
        <ServiceSelector
          constantCategories={SERVICE_CATEGORIES}
          selectedServices={serviceAreas}
          onServiceToggle={handleServiceToggle}
          variant="secondary"
          showInstructions={true}
          instructionTitle="제공 가능한 서비스를 선택해 주세요"
          instructionDescription="고객에게 제공할 수 있는 서비스를 모두 선택해 주세요."
          enableGroupTabs={true}
          enableSearch={true}
          enableDesktopLayout={true}
        />

        {/* 폼 유효성 에러 */}
        {formError && <FieldError message={formError} variant="secondary" />}
      </div>
    </div>
  );
}

export default PartnerStep1Service;
