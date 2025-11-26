"use client";

import { UseFormReturn } from "react-hook-form";
import { User, MapPin, Mail } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PartnerFormData } from "@/lib/validations/partner";
import type { SelectedRegion } from "@/lib/constants/regions";
import { StepHeader } from "@/components/wizard";
import { SeniorInput, SeniorLabel, FieldError } from "@/components/forms/senior";
import { PhoneInput } from "@/components/forms/PhoneInput";
import { DaumPostcode } from "@/components/forms/DaumPostcode";
import { RegionSelector } from "@/components/forms/RegionSelector";

interface PartnerStep3ContactProps {
  form: UseFormReturn<PartnerFormData>;
}

/**
 * 협력사 등록 마법사 - Step 3: 연락처 및 활동 지역
 */
export function PartnerStep3Contact({ form }: PartnerStep3ContactProps) {
  const { register, watch, setValue, formState } = form;
  const errors = formState.errors;
  const workRegions = watch("workRegions") || [];

  const handleRegionChange = (regions: SelectedRegion[]) => {
    setValue("workRegions", regions, { shouldValidate: true });
  };

  return (
    <div className="wizard-step-content">
      <StepHeader
        stepNumber={3}
        totalSteps={4}
        title="연락처와 활동 지역을 알려주세요"
        description="고객이 연락할 수 있는 정보와 서비스 가능 지역을 입력해 주세요."
        icon={<User className="w-full h-full" />}
        variant="secondary"
      />

      <div className="space-y-8">
        {/* 연락처 섹션 */}
        <section className="space-y-5">
          <div className="flex items-center gap-3 pb-3 border-b-2 border-gray-100">
            <User className="w-6 h-6 text-secondary" />
            <h3 className="text-[20px] font-bold text-gray-900">연락처 정보</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <SeniorLabel htmlFor="contactPhone" required variant="secondary">
                연락처
              </SeniorLabel>
              <PhoneInput
                id="contactPhone"
                placeholder="010-1234-5678"
                className="input-senior w-full"
                value={watch("contactPhone") || ""}
                onChange={(value) =>
                  setValue("contactPhone", value, { shouldValidate: true })
                }
              />
              <FieldError
                message={errors.contactPhone?.message}
                fieldId="contactPhone"
                variant="secondary"
              />
            </div>

            <div>
              <SeniorLabel htmlFor="contactEmail" optional variant="secondary">
                이메일
              </SeniorLabel>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  id="contactEmail"
                  type="email"
                  placeholder="example@email.com"
                  className={cn(
                    "input-senior w-full pl-12",
                    errors.contactEmail && "border-red-300 bg-red-50"
                  )}
                  {...register("contactEmail")}
                />
              </div>
              <FieldError
                message={errors.contactEmail?.message}
                fieldId="contactEmail"
                variant="secondary"
              />
            </div>
          </div>
        </section>

        {/* 사업장 주소 섹션 */}
        <section className="space-y-5">
          <div className="flex items-center gap-3 pb-3 border-b-2 border-gray-100">
            <MapPin className="w-6 h-6 text-secondary" />
            <h3 className="text-[20px] font-bold text-gray-900">사업장 주소</h3>
          </div>

          <div>
            <SeniorLabel required variant="secondary">
              주소
            </SeniorLabel>
            <DaumPostcode
              value={watch("address") || ""}
              onChange={(address) =>
                setValue("address", address, { shouldValidate: true })
              }
              placeholder="클릭하여 주소 검색"
              className="input-senior w-full mt-2"
              error={errors.address?.message}
            />
          </div>

          <SeniorInput
            id="addressDetail"
            label="상세 주소"
            placeholder="동, 호수, 건물명 등"
            optional
            variant="secondary"
            {...register("addressDetail")}
          />
        </section>

        {/* 활동 지역 섹션 */}
        <section className="space-y-5">
          <div className="flex items-center gap-3 pb-3 border-b-2 border-gray-100">
            <MapPin className="w-6 h-6 text-secondary" />
            <h3 className="text-[20px] font-bold text-gray-900">활동 지역</h3>
          </div>

          <div className="rounded-xl bg-secondary/5 p-4 border border-secondary/20 mb-4">
            <p className="text-[16px] text-gray-700">
              <span className="font-bold text-secondary">안내:</span>{" "}
              서비스 제공이 가능한 지역을 선택해 주세요. 복수 선택이 가능합니다.
            </p>
          </div>

          <RegionSelector
            value={workRegions as SelectedRegion[]}
            onChange={handleRegionChange}
            placeholder="활동 지역을 선택하세요"
            error={errors.workRegions?.message}
          />
        </section>
      </div>
    </div>
  );
}

export default PartnerStep3Contact;
