"use client";

import { UseFormReturn } from "react-hook-form";
import { User, MapPin } from "lucide-react";
import type { ApplicationFormData } from "@/lib/validations/application";
import { SeniorInput, SeniorLabel, FieldError } from "@/components/forms/senior";
import { PhoneInput } from "@/components/forms/PhoneInput";
import { DaumPostcode } from "@/components/forms/DaumPostcode";

interface ApplyStep2BasicProps {
  form: UseFormReturn<ApplicationFormData>;
}

/**
 * 서비스 신청 마법사 - Step 2: 기본 정보
 *
 * 고객 정보(이름, 연락처)와 현장 주소를 입력받습니다.
 */
export function ApplyStep2Basic({ form }: ApplyStep2BasicProps) {
  const { register, watch, setValue, formState } = form;
  const errors = formState.errors;

  return (
    <div className="space-y-6">
        {/* 고객 정보 섹션 */}
        <section className="space-y-5">
          <div className="flex items-center gap-3 pb-3 border-b-2 border-gray-100">
            <User className="w-6 h-6 text-primary" />
            <h3 className="text-[20px] font-bold text-gray-900">고객 정보</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <SeniorInput
              id="customerName"
              label="이름"
              placeholder="홍길동"
              required
              variant="primary"
              error={errors.customerName?.message}
              {...register("customerName")}
            />

            <div>
              <SeniorLabel htmlFor="customerPhone" required variant="primary">
                연락처
              </SeniorLabel>
              <PhoneInput
                id="customerPhone"
                placeholder="010-1234-5678"
                className="input-senior w-full"
                value={watch("customerPhone") || ""}
                onChange={(value) =>
                  setValue("customerPhone", value, { shouldValidate: true })
                }
              />
              <FieldError
                message={errors.customerPhone?.message}
                fieldId="customerPhone"
                variant="primary"
              />
            </div>
          </div>
        </section>

        {/* 주소 정보 섹션 */}
        <section className="space-y-5">
          <div className="flex items-center gap-3 pb-3 border-b-2 border-gray-100">
            <MapPin className="w-6 h-6 text-primary" />
            <h3 className="text-[20px] font-bold text-gray-900">현장 주소</h3>
          </div>

          <div>
            <SeniorLabel required variant="primary">
              주소
            </SeniorLabel>
            <DaumPostcode
              value={watch("address") || ""}
              onChange={(address) =>
                setValue("address", address, { shouldValidate: true })
              }
              placeholder="클릭하여 주소 검색"
              className="w-full"
              triggerClassName="input-senior text-left justify-start font-normal text-gray-400"
              error={errors.address?.message}
            />
          </div>

          <SeniorInput
            id="addressDetail"
            label="상세 주소"
            placeholder="동, 호수, 건물명 등"
            optional
            variant="primary"
            {...register("addressDetail")}
          />
        </section>
      </div>
  );
}

export default ApplyStep2Basic;
