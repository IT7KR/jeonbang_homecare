"use client";

import { UseFormReturn } from "react-hook-form";
import { CheckCircle2, Phone, MapPin, FileText, Briefcase, Image as ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ApplicationFormData } from "@/lib/validations/application";
import type { CategoryItem } from "@/components/services";
import { StepHeader } from "@/components/wizard";
import { ConfirmationStep, AgreementCheckbox } from "@/components/forms/senior";
import type { ConfirmationSection } from "@/components/forms/senior/types";

interface ApplyStep3ConfirmProps {
  form: UseFormReturn<ApplicationFormData>;
  categories: CategoryItem[];
  onEditStep: (stepNumber: number) => void;
}

/**
 * 서비스 신청 마법사 - Step 3: 확인 및 동의
 */
export function ApplyStep3Confirm({
  form,
  categories,
  onEditStep,
}: ApplyStep3ConfirmProps) {
  const { watch, setValue, formState } = form;
  const errors = formState.errors;

  const values = watch();

  // 선택된 서비스 이름 가져오기
  const getSelectedServiceNames = (): string[] => {
    const names: string[] = [];
    categories.forEach((cat) => {
      cat.services.forEach((service) => {
        if (values.selectedServices?.includes(service.code)) {
          names.push(service.name);
        }
      });
    });
    return names;
  };

  // 확인 섹션 데이터 구성
  const confirmationSections: ConfirmationSection[] = [
    {
      title: "선택한 서비스",
      items: [
        {
          label: "서비스 목록",
          value: getSelectedServiceNames(),
          icon: <Briefcase className="w-5 h-5" />,
        },
      ],
    },
    {
      title: "고객 정보",
      items: [
        {
          label: "이름",
          value: values.customerName || "",
          icon: <Phone className="w-5 h-5" />,
        },
        {
          label: "연락처",
          value: values.customerPhone || "",
          icon: <Phone className="w-5 h-5" />,
        },
      ],
    },
    {
      title: "현장 주소",
      items: [
        {
          label: "주소",
          value: values.address || "",
          icon: <MapPin className="w-5 h-5" />,
        },
        {
          label: "상세 주소",
          value: values.addressDetail || "",
        },
      ],
    },
    {
      title: "요청 내용",
      items: [
        {
          label: "요청 사항",
          value: values.description || "",
          icon: <FileText className="w-5 h-5" />,
        },
        {
          label: "첨부 사진",
          value:
            values.photos && values.photos.length > 0
              ? `${values.photos.length}장 첨부됨`
              : "없음",
          icon: <ImageIcon className="w-5 h-5" />,
        },
      ],
    },
  ];

  // 스텝 이동 핸들러 (섹션 인덱스 → 스텝 번호)
  const handleEdit = (sectionIndex: number) => {
    // 섹션 0 (서비스) → 스텝 1
    // 섹션 1, 2, 3 (정보) → 스텝 2
    if (sectionIndex === 0) {
      onEditStep(1);
    } else {
      onEditStep(2);
    }
  };

  return (
    <div className="wizard-step-content">
      <StepHeader
        stepNumber={3}
        totalSteps={3}
        title="신청 내용을 확인해 주세요"
        description="아래 내용이 맞는지 확인하시고, 동의 후 제출해 주세요."
        icon={<CheckCircle2 className="w-full h-full" />}
        variant="primary"
      />

      <div className="space-y-8">
        {/* 확인 섹션 */}
        <ConfirmationStep
          sections={confirmationSections}
          onEdit={handleEdit}
          variant="primary"
        />

        {/* 첨부 이미지 미리보기 (있는 경우) */}
        {values.photos && values.photos.length > 0 && (
          <div className="rounded-2xl border-2 border-gray-200 overflow-hidden bg-white">
            <div className="px-5 py-4 bg-gray-50 border-b border-gray-200">
              <h3 className="text-[18px] font-bold text-gray-900">첨부 사진</h3>
            </div>
            <div className="p-5">
              <div className="flex flex-wrap gap-3">
                {values.photos.map((file, index) => (
                  <img
                    key={index}
                    src={URL.createObjectURL(file)}
                    alt={`첨부 이미지 ${index + 1}`}
                    className="w-20 h-20 object-cover rounded-lg border border-gray-200"
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 개인정보 동의 */}
        <AgreementCheckbox
          id="agreePrivacy"
          name="agreePrivacy"
          label="개인정보 수집 및 이용에 동의합니다"
          description="서비스 제공을 위해 이름, 연락처, 주소를 수집하며, 서비스 완료 후 3년간 보관됩니다."
          checked={values.agreePrivacy || false}
          onChange={(checked) =>
            setValue("agreePrivacy", checked, { shouldValidate: true })
          }
          required
          error={errors.agreePrivacy?.message}
          variant="primary"
        />

        {/* 안내 문구 */}
        <div className="rounded-xl bg-gray-50 p-5 text-center">
          <p className="text-[16px] text-gray-600">
            제출 후{" "}
            <span className="font-bold text-primary">빠른 시일 내에</span>{" "}
            담당자가 연락드리겠습니다.
          </p>
        </div>
      </div>
    </div>
  );
}

export default ApplyStep3Confirm;
