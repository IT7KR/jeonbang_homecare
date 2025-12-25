"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { useWizardForm, type WizardStepConfig } from "@/hooks";
import { WizardHeader, WizardNavigation } from "@/components/wizard";
import {
  PartnerStep1Service,
  PartnerStep2Basic,
  PartnerStep3Contact,
  PartnerStep4Additional,
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
import { getServices, type ServicesListResponse } from "@/lib/api/services";

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
    id: "additional",
    label: "추가 정보",
    description: "회사 소개와 경력을 입력해 주세요",
    fields: ["introduction", "experience", "remarks"],
  },
  {
    id: "confirm",
    label: "확인/동의",
    description: "입력 내용을 확인하고 제출해 주세요",
    fields: ["agreePrivacy", "agreeTerms"],
  },
];

export default function PartnerPage() {
  const router = useRouter();

  // 서비스 목록 상태
  const [services, setServices] = useState<ServicesListResponse | null>(null);
  const [servicesLoading, setServicesLoading] = useState(true);

  // 서비스 목록 로드
  useEffect(() => {
    getServices()
      .then(setServices)
      .catch(console.error)
      .finally(() => setServicesLoading(false));
  }, []);

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
        businessRegistrationFile: data.businessRegistrationFile || undefined,
      });

      if (!response.success) {
        throw new Error(response.message);
      }
    },
  });

  // 뒤로가기 핸들러
  const handleBack = () => {
    if (wizard.isFirstStep) {
      router.push(ROUTES.HOME);
    } else {
      wizard.goPrev();
    }
  };

  // 제출 완료 시 성공 화면 표시
  if (wizard.isSubmitted) {
    return <PartnerSuccess />;
  }

  // 현재 스텝 정보
  const currentStepInfo = WIZARD_STEPS[wizard.currentStep - 1];

  // 스텝별 컴포넌트 렌더링
  const renderStep = () => {
    switch (wizard.currentStep) {
      case 1:
        return (
          <PartnerStep1Service
            form={wizard.form}
            categories={services?.categories || []}
            isLoading={servicesLoading}
            error={
              !services && !servicesLoading
                ? "서비스 목록을 불러올 수 없습니다."
                : undefined
            }
          />
        );
      case 2:
        return <PartnerStep2Basic form={wizard.form} />;
      case 3:
        return <PartnerStep3Contact form={wizard.form} />;
      case 4:
        return <PartnerStep4Additional form={wizard.form} />;
      case 5:
        return (
          <PartnerStep4Confirm
            form={wizard.form}
            categories={services?.categories || []}
            onEditStep={wizard.goToStep}
          />
        );
      default:
        return null;
    }
  };

  return (
    <>
      {/* 프로그레스 바 */}
      <WizardHeader
        currentStep={wizard.currentStep}
        totalSteps={wizard.totalSteps}
        variant="secondary"
      />

      {/* 메인 컨텐츠 */}
      <main className="pb-36 px-4">
        <div className="max-w-2xl mx-auto">
          {/* 질문 헤더 - 컴팩트 */}
          <div className="py-4 flex items-center gap-3">
            {/* 뒤로가기 버튼 */}
            <button
              type="button"
              onClick={handleBack}
              className="w-9 h-9 flex items-center justify-center rounded-full text-gray-500 hover:text-gray-700 hover:bg-gray-100 -ml-1"
              aria-label="이전"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex-1">
              <h1 className="text-lg font-bold text-gray-900">
                {currentStepInfo.label === "서비스 분야"
                  ? "어떤 서비스를 제공하시나요?"
                  : currentStepInfo.label === "기본 정보"
                  ? "사업자 정보를 알려주세요"
                  : currentStepInfo.label === "연락처/지역"
                  ? "연락처와 활동 지역을 알려주세요"
                  : currentStepInfo.label === "추가 정보"
                  ? "회사를 소개해 주세요"
                  : "입력 내용을 확인해 주세요"}
              </h1>
            </div>
            {/* 단계 표시 */}
            <span className="text-sm text-gray-400 font-medium">
              {wizard.currentStep}/{wizard.totalSteps}
            </span>
          </div>

          {/* 현재 스텝 컨텐츠 */}
          <form onSubmit={(e) => e.preventDefault()}>{renderStep()}</form>
        </div>
      </main>

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
        showPhoneButton={true}
      />

      {/* 제출 에러 표시 */}
      {wizard.submitError && (
        <div className="fixed bottom-32 left-4 right-4 max-w-lg mx-auto z-50">
          <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 shadow-lg">
            <p className="text-base text-red-600 font-medium text-center">
              {wizard.submitError}
            </p>
          </div>
        </div>
      )}
    </>
  );
}
