"use client";

import { UseFormReturn } from "react-hook-form";
import { FileText, Star } from "lucide-react";
import type { PartnerFormData } from "@/lib/validations/partner";
import { SeniorTextarea } from "@/components/forms/senior";

interface PartnerStep4AdditionalProps {
  form: UseFormReturn<PartnerFormData>;
}

/**
 * 협력사 등록 마법사 - Step 4: 추가 정보
 *
 * 회사 소개, 경력, 비고 등 선택적 정보를 입력받습니다.
 * 사용자가 입력하도록 유도하되 필수가 아닌 선택 사항입니다.
 */
export function PartnerStep4Additional({ form }: PartnerStep4AdditionalProps) {
  const { register, formState } = form;
  const errors = formState.errors;

  return (
    <div className="space-y-6">
      {/* 안내 메시지 */}
      <div className="rounded-xl bg-secondary/10 p-5 border border-secondary/20">
        <div className="flex gap-3">
          <Star className="w-6 h-6 text-secondary flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-[16px] font-bold text-gray-900 mb-1">
              회사를 더 잘 소개해 주세요!
            </p>
            <p className="text-[14px] text-gray-600">
              아래 정보를 입력하시면 고객에게 더 신뢰감을 줄 수 있습니다.
              선택사항이지만 작성을 권장드립니다.
            </p>
          </div>
        </div>
      </div>

      {/* 추가 정보 입력 폼 */}
      <section className="space-y-5">
        <div className="flex items-center gap-3 pb-3 border-b-2 border-gray-100">
          <FileText className="w-6 h-6 text-secondary" />
          <h3 className="text-[20px] font-bold text-gray-900">추가 정보</h3>
        </div>

        <SeniorTextarea
          id="introduction"
          label="회사/본인 소개"
          placeholder="예: 10년 이상 조경 관리 경험을 보유한 전문 업체입니다. 양평, 가평 지역에서 다양한 프로젝트를 성공적으로 수행해 왔습니다."
          optional
          rows={4}
          variant="secondary"
          hint="회사나 본인에 대해 간략히 소개해 주세요."
          error={errors.introduction?.message}
          {...register("introduction")}
        />

        <SeniorTextarea
          id="experience"
          label="경력 및 자격"
          placeholder="예: 조경기능사 자격증 보유, 주택 정원 관리 5년 경력, 상업시설 조경 3년 경력"
          optional
          rows={4}
          variant="secondary"
          hint="보유하신 자격증이나 관련 경력을 입력해 주세요."
          error={errors.experience?.message}
          {...register("experience")}
        />

        <SeniorTextarea
          id="remarks"
          label="비고"
          placeholder="예: 주말 작업 가능, 대형 장비 보유, 긴급 출동 가능"
          optional
          rows={3}
          variant="secondary"
          hint="고객에게 알리고 싶은 특이사항이 있다면 입력해 주세요."
          error={errors.remarks?.message}
          {...register("remarks")}
        />
      </section>

      {/* 건너뛰기 안내 */}
      <div className="rounded-xl bg-gray-50 p-4 text-center">
        <p className="text-[14px] text-gray-500">
          나중에 작성하고 싶으시면 비워두고 다음으로 넘어가셔도 됩니다.
        </p>
      </div>
    </div>
  );
}

export default PartnerStep4Additional;
