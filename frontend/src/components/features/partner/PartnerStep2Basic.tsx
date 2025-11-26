"use client";

import { UseFormReturn } from "react-hook-form";
import { Building2 } from "lucide-react";
import type { PartnerFormData } from "@/lib/validations/partner";
import { StepHeader } from "@/components/wizard";
import { SeniorInput, SeniorLabel } from "@/components/forms/senior";

interface PartnerStep2BasicProps {
  form: UseFormReturn<PartnerFormData>;
}

/**
 * 협력사 등록 마법사 - Step 2: 기본 정보
 */
export function PartnerStep2Basic({ form }: PartnerStep2BasicProps) {
  const { register, formState } = form;
  const errors = formState.errors;

  return (
    <div className="wizard-step-content">
      <StepHeader
        stepNumber={2}
        totalSteps={4}
        title="기본 정보를 입력해 주세요"
        description="회사 또는 사업자 정보를 입력해 주세요."
        icon={<Building2 className="w-full h-full" />}
        variant="secondary"
      />

      <div className="space-y-6">
        {/* 기본 정보 섹션 */}
        <section className="space-y-5">
          <div className="flex items-center gap-3 pb-3 border-b-2 border-gray-100">
            <Building2 className="w-6 h-6 text-secondary" />
            <h3 className="text-[20px] font-bold text-gray-900">사업자 정보</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <SeniorInput
              id="companyName"
              label="회사/상호명"
              placeholder="예: 양평조경"
              required
              variant="secondary"
              error={errors.companyName?.message}
              {...register("companyName")}
            />

            <SeniorInput
              id="representativeName"
              label="대표자명"
              placeholder="홍길동"
              required
              variant="secondary"
              error={errors.representativeName?.message}
              {...register("representativeName")}
            />
          </div>

          <div className="md:max-w-md">
            <SeniorInput
              id="businessNumber"
              label="사업자등록번호"
              placeholder="123-45-67890"
              optional
              variant="secondary"
              hint="사업자인 경우 입력해 주세요. 개인은 생략 가능합니다."
              error={errors.businessNumber?.message}
              {...register("businessNumber")}
            />
          </div>
        </section>

        {/* 안내 메시지 */}
        <div className="rounded-xl bg-secondary/5 p-5 border border-secondary/20">
          <p className="text-[16px] text-gray-700">
            <span className="font-bold text-secondary">Tip:</span>{" "}
            정확한 정보를 입력하시면 고객 신뢰도가 높아집니다.
          </p>
        </div>
      </div>
    </div>
  );
}

export default PartnerStep2Basic;
