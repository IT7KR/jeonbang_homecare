"use client";

import { UseFormReturn } from "react-hook-form";
import {
  CheckCircle2,
  Building2,
  Phone,
  Mail,
  MapPin,
  Briefcase,
  FileText,
} from "lucide-react";
import type { PartnerFormData } from "@/lib/validations/partner";
import { SERVICE_CATEGORIES } from "@/lib/constants";
import { StepHeader } from "@/components/wizard";
import {
  ConfirmationStep,
  AgreementCheckbox,
  SeniorTextarea,
} from "@/components/forms/senior";
import type { ConfirmationSection } from "@/components/forms/senior/types";

interface PartnerStep4ConfirmProps {
  form: UseFormReturn<PartnerFormData>;
  onEditStep: (stepNumber: number) => void;
}

/**
 * 협력사 등록 마법사 - Step 4: 확인 및 동의
 */
export function PartnerStep4Confirm({
  form,
  onEditStep,
}: PartnerStep4ConfirmProps) {
  const { watch, setValue, register, formState } = form;
  const errors = formState.errors;
  const values = watch();

  // 선택된 서비스 이름 가져오기
  const getSelectedServiceNames = (): string[] => {
    const names: string[] = [];
    SERVICE_CATEGORIES.forEach((cat) => {
      cat.services.forEach((service) => {
        if (values.serviceAreas?.includes(service)) {
          names.push(service);
        }
      });
    });
    return names;
  };

  // 활동 지역 문자열로 변환
  const getWorkRegionNames = (): string[] => {
    if (!values.workRegions || values.workRegions.length === 0) return [];
    return values.workRegions.map((region) => {
      if (region.isAllDistricts) {
        return `${region.provinceName} 전체`;
      }
      return `${region.provinceName} ${region.districtNames.join(", ")}`;
    });
  };

  // 확인 섹션 데이터 구성
  const confirmationSections: ConfirmationSection[] = [
    {
      title: "서비스 분야",
      items: [
        {
          label: "제공 서비스",
          value: getSelectedServiceNames(),
          icon: <Briefcase className="w-5 h-5" />,
        },
      ],
    },
    {
      title: "기본 정보",
      items: [
        {
          label: "회사/상호명",
          value: values.companyName || "",
          icon: <Building2 className="w-5 h-5" />,
        },
        {
          label: "대표자명",
          value: values.representativeName || "",
        },
        {
          label: "사업자등록번호",
          value: values.businessNumber || "",
        },
      ],
    },
    {
      title: "연락처 정보",
      items: [
        {
          label: "연락처",
          value: values.contactPhone || "",
          icon: <Phone className="w-5 h-5" />,
        },
        {
          label: "이메일",
          value: values.contactEmail || "",
          icon: <Mail className="w-5 h-5" />,
        },
        {
          label: "사업장 주소",
          value: values.address
            ? `${values.address} ${values.addressDetail || ""}`
            : "",
          icon: <MapPin className="w-5 h-5" />,
        },
        {
          label: "활동 지역",
          value: getWorkRegionNames(),
          icon: <MapPin className="w-5 h-5" />,
        },
      ],
    },
  ];

  // 스텝 이동 핸들러
  const handleEdit = (sectionIndex: number) => {
    // 섹션 0 (서비스) → 스텝 1
    // 섹션 1 (기본정보) → 스텝 2
    // 섹션 2 (연락처) → 스텝 3
    const stepMap = [1, 2, 3];
    onEditStep(stepMap[sectionIndex] || 1);
  };

  return (
    <div className="wizard-step-content">
      <StepHeader
        stepNumber={4}
        totalSteps={4}
        title="등록 내용을 확인해 주세요"
        description="아래 내용이 맞는지 확인하시고, 동의 후 제출해 주세요."
        icon={<CheckCircle2 className="w-full h-full" />}
        variant="secondary"
      />

      <div className="space-y-8">
        {/* 확인 섹션 */}
        <ConfirmationStep
          sections={confirmationSections}
          onEdit={handleEdit}
          variant="secondary"
        />

        {/* 추가 정보 입력 (선택) */}
        <section className="space-y-5">
          <div className="flex items-center gap-3 pb-3 border-b-2 border-gray-100">
            <FileText className="w-6 h-6 text-secondary" />
            <h3 className="text-[20px] font-bold text-gray-900">
              추가 정보 (선택)
            </h3>
          </div>

          <SeniorTextarea
            id="introduction"
            label="회사/본인 소개"
            placeholder="간단한 회사 또는 본인 소개를 입력해 주세요"
            optional
            rows={3}
            variant="secondary"
            error={errors.introduction?.message}
            {...register("introduction")}
          />

          <SeniorTextarea
            id="experience"
            label="경력 및 자격"
            placeholder="보유 자격증, 경력 사항 등을 입력해 주세요"
            optional
            rows={3}
            variant="secondary"
            error={errors.experience?.message}
            {...register("experience")}
          />

          <SeniorTextarea
            id="remarks"
            label="비고"
            placeholder="기타 전달 사항이나 특이사항이 있으면 입력해 주세요"
            optional
            rows={3}
            variant="secondary"
            error={errors.remarks?.message}
            {...register("remarks")}
          />
        </section>

        {/* 동의 섹션 */}
        <section className="space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b-2 border-gray-100">
            <CheckCircle2 className="w-6 h-6 text-secondary" />
            <h3 className="text-[20px] font-bold text-gray-900">약관 동의</h3>
          </div>

          <AgreementCheckbox
            id="agreePrivacy"
            name="agreePrivacy"
            label="개인정보 수집 및 이용에 동의합니다"
            description="협력사 등록 및 관리를 위해 회사명, 대표자명, 연락처 등을 수집합니다."
            checked={values.agreePrivacy || false}
            onChange={(checked) =>
              setValue("agreePrivacy", checked, { shouldValidate: true })
            }
            required
            error={errors.agreePrivacy?.message}
            variant="secondary"
          />

          <AgreementCheckbox
            id="agreeTerms"
            name="agreeTerms"
            label="서비스 이용약관에 동의합니다"
            description="전방 홈케어 협력사 서비스 이용약관에 동의합니다."
            checked={values.agreeTerms || false}
            onChange={(checked) =>
              setValue("agreeTerms", checked, { shouldValidate: true })
            }
            required
            error={errors.agreeTerms?.message}
            variant="secondary"
          />
        </section>

        {/* 안내 문구 */}
        <div className="rounded-xl bg-gray-50 p-5 text-center">
          <p className="text-[16px] text-gray-600">
            제출 후{" "}
            <span className="font-bold text-secondary">검토를 거쳐</span>{" "}
            협력사 승인이 완료됩니다.
          </p>
        </div>
      </div>
    </div>
  );
}

export default PartnerStep4Confirm;
