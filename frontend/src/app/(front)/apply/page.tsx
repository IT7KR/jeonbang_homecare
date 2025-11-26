"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useWizardForm, type WizardStepConfig } from "@/hooks";
import {
  WizardContainer,
  StepIndicator,
  WizardNavigation,
} from "@/components/wizard";
import {
  ApplyStep1Service,
  ApplyStep2Info,
  ApplyStep3Confirm,
  ApplySuccess,
} from "@/components/features/apply";
import {
  applicationSchema,
  applicationDefaultValues,
  type ApplicationFormData,
} from "@/lib/validations/application";
import { ROUTES } from "@/lib/constants";
import { createApplication } from "@/lib/api/applications";
import { getServices, type ServicesListResponse } from "@/lib/api/services";

// 마법사 스텝 설정
const WIZARD_STEPS: WizardStepConfig[] = [
  {
    id: "service",
    label: "서비스 선택",
    description: "필요한 서비스를 선택해 주세요",
    fields: ["selectedServices"],
  },
  {
    id: "info",
    label: "정보 입력",
    description: "고객 정보와 현장 주소를 입력해 주세요",
    fields: [
      "customerName",
      "customerPhone",
      "address",
      "addressDetail",
      "description",
      "photos",
    ],
  },
  {
    id: "confirm",
    label: "확인 및 동의",
    description: "입력 내용을 확인하고 제출해 주세요",
    fields: ["agreePrivacy"],
  },
];

export default function ApplyPage() {
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
  const wizard = useWizardForm<ApplicationFormData>({
    steps: WIZARD_STEPS,
    schema: applicationSchema,
    defaultValues: applicationDefaultValues,
    onSubmit: async (data) => {
      const response = await createApplication(
        {
          customer_name: data.customerName,
          customer_phone: data.customerPhone,
          address: data.address,
          address_detail: data.addressDetail,
          selected_services: data.selectedServices,
          description: data.description,
        },
        data.photos
      );

      if (!response.success) {
        throw new Error(response.message);
      }
    },
  });

  // 제출 완료 시 성공 화면 표시
  if (wizard.isSubmitted) {
    return <ApplySuccess />;
  }

  // 스텝별 컴포넌트 렌더링
  const renderStep = () => {
    switch (wizard.currentStep) {
      case 1:
        return (
          <ApplyStep1Service
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
        return <ApplyStep2Info form={wizard.form} />;
      case 3:
        return (
          <ApplyStep3Confirm
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
    <WizardContainer variant="primary">
      {/* 헤더 */}
      <div className="mb-6">
        <Link
          href={ROUTES.HOME}
          className="inline-flex items-center text-gray-600 hover:text-primary transition-colors text-[16px] touch-target"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          홈으로
        </Link>

        <h1 className="text-senior-title mt-4">견적 요청하기</h1>
        <p className="text-senior-body text-gray-600 mt-2">
          필요한 서비스를 선택하고 정보를 입력해 주세요
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
        variant="primary"
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
        submitLabel="견적 요청하기"
        variant="primary"
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
