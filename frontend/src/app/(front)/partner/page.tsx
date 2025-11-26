"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useWizardForm, type WizardStepConfig } from "@/hooks";
import {
  WizardContainer,
  StepIndicator,
  WizardNavigation,
} from "@/components/wizard";
import {
  PartnerStep1Service,
  PartnerStep2Basic,
  PartnerStep3Contact,
  PartnerStep4Confirm,
  PartnerSuccess,
} from "@/components/features/partner";
import {
  partnerSchema,
  partnerDefaultValues,
  type PartnerFormData,
} from "@/lib/validations/partner";
import { ROUTES } from "@/lib/constants";
import { createPartner } from "@/lib/api/partners";

// 마법사 스텝 설정
const WIZARD_STEPS: WizardStepConfig[] = [
  {
    id: "service",
    label: "서비스 분야",
    description: "제공 가능한 서비스를 선택해 주세요",
    fields: ["serviceAreas"],
  },
  {
    id: "basic",
    label: "기본 정보",
    description: "사업자 정보를 입력해 주세요",
    fields: ["companyName", "representativeName", "businessNumber"],
  },
  {
    id: "contact",
    label: "연락처/지역",
    description: "연락처와 활동 지역을 입력해 주세요",
    fields: [
      "contactPhone",
      "contactEmail",
      "address",
      "addressDetail",
      "workRegions",
    ],
  },
  {
    id: "confirm",
    label: "확인/동의",
    description: "입력 내용을 확인하고 제출해 주세요",
    fields: [
      "introduction",
      "experience",
      "remarks",
      "agreePrivacy",
      "agreeTerms",
    ],
  },
];

export default function PartnerPage() {
  // 마법사 폼 훅
  const wizard = useWizardForm<PartnerFormData>({
    steps: WIZARD_STEPS,
    schema: partnerSchema,
    defaultValues: partnerDefaultValues,
    onSubmit: async (data) => {
      const response = await createPartner({
        companyName: data.companyName,
        representativeName: data.representativeName,
        businessNumber: data.businessNumber || undefined,
        contactPhone: data.contactPhone,
        contactEmail: data.contactEmail || undefined,
        address: data.address,
        addressDetail: data.addressDetail || undefined,
        serviceAreas: data.serviceAreas,
        workRegions: data.workRegions,
        introduction: data.introduction || undefined,
        experience: data.experience || undefined,
        remarks: data.remarks || undefined,
      });

      if (!response.success) {
        throw new Error(response.message);
      }
    },
  });

  // 제출 완료 시 성공 화면 표시
  if (wizard.isSubmitted) {
    return <PartnerSuccess />;
  }

  // 스텝별 컴포넌트 렌더링
  const renderStep = () => {
    switch (wizard.currentStep) {
      case 1:
        return <PartnerStep1Service form={wizard.form} />;
      case 2:
        return <PartnerStep2Basic form={wizard.form} />;
      case 3:
        return <PartnerStep3Contact form={wizard.form} />;
      case 4:
        return (
          <PartnerStep4Confirm
            form={wizard.form}
            onEditStep={wizard.goToStep}
          />
        );
      default:
        return null;
    }
  };

  return (
    <WizardContainer variant="secondary">
      {/* 헤더 */}
      <div className="mb-6">
        <Link
          href={ROUTES.HOME}
          className="inline-flex items-center text-gray-600 hover:text-secondary transition-colors text-[16px] touch-target"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          홈으로
        </Link>

        <h1 className="text-senior-title mt-4">협력사 요청하기</h1>
        <p className="text-senior-body text-gray-600 mt-2">
          전방 홈케어의 협력사로 등록해 주세요
        </p>
      </div>

      {/* 스텝 인디케이터 */}
      <StepIndicator
        steps={WIZARD_STEPS.map((s) => ({
          label: s.label,
          description: s.description,
        }))}
        currentStep={wizard.currentStep}
        completedSteps={wizard.completedSteps}
        variant="secondary"
        onStepClick={wizard.goToStep}
      />

      {/* 현재 스텝 컨텐츠 */}
      <form onSubmit={(e) => e.preventDefault()}>{renderStep()}</form>

      {/* 하단 네비게이션 */}
      <WizardNavigation
        currentStep={wizard.currentStep}
        totalSteps={wizard.totalSteps}
        onPrev={wizard.goPrev}
        onNext={wizard.goNext}
        onSubmit={wizard.handleSubmit}
        isFirstStep={wizard.isFirstStep}
        isLastStep={wizard.isLastStep}
        isNextDisabled={!wizard.isCurrentStepValid}
        isSubmitDisabled={!wizard.isCurrentStepValid}
        isSubmitting={wizard.isSubmitting}
        submitLabel="협력사 등록 신청"
        variant="secondary"
      />

      {/* 제출 에러 표시 */}
      {wizard.submitError && (
        <div className="fixed bottom-32 left-4 right-4 max-w-lg mx-auto">
          <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 shadow-lg">
            <p className="text-[16px] text-red-600 font-medium text-center">
              {wizard.submitError}
            </p>
          </div>
        </div>
      )}
    </WizardContainer>
  );
}
