"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { useWizardForm, type WizardStepConfig } from "@/hooks";
import { WizardHeader, WizardNavigation } from "@/components/wizard";
import {
  ApplyStep1Service,
  ApplyStep2Basic,
  ApplyStep3Details,
  ApplyStep3Confirm,
  ApplySuccess,
} from "@/components/features/apply";
import {
  applicationSchema,
  applicationDefaultValues,
  type ApplicationFormData,
} from "@/lib/validations/application";
import { ROUTES } from "@/lib/constants";
import {
  createApplication,
  type ApplicationCreateResponse,
} from "@/lib/api/applications";
import { getServices, type ServicesListResponse } from "@/lib/api/services";

// 마법사 스텝 설정 (4단계)
const WIZARD_STEPS: WizardStepConfig[] = [
  {
    id: "service",
    label: "서비스 선택",
    description: "필요한 서비스를 선택해 주세요",
    fields: ["selectedServices"],
  },
  {
    id: "basic",
    label: "기본 정보",
    description: "고객 정보와 현장 주소를 입력해 주세요",
    fields: ["customerName", "customerPhone", "address", "addressDetail"],
  },
  {
    id: "details",
    label: "요청 내용",
    description: "서비스 요청 내용을 입력해 주세요",
    fields: [
      "description",
      "preferredConsultationDate",
      "preferredWorkDate",
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
  const router = useRouter();

  // 서비스 목록 상태
  const [services, setServices] = useState<ServicesListResponse | null>(null);
  const [servicesLoading, setServicesLoading] = useState(true);
  // 제출 응답 저장 (중복 정보 표시용)
  const [submitResponse, setSubmitResponse] =
    useState<ApplicationCreateResponse | null>(null);

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
          preferred_consultation_date:
            data.preferredConsultationDate || undefined,
          preferred_work_date: data.preferredWorkDate || undefined,
        },
        data.photos
      );

      if (!response.success) {
        throw new Error(response.message);
      }

      // 응답 저장 (중복 정보 포함)
      setSubmitResponse(response);
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
    return (
      <ApplySuccess
        applicationNumber={submitResponse?.application_number}
        duplicateInfo={submitResponse?.duplicate_info}
      />
    );
  }

  // 현재 스텝 정보
  const currentStepInfo = WIZARD_STEPS[wizard.currentStep - 1];

  // 스텝별 컴포넌트 렌더링 (4단계)
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
        return <ApplyStep2Basic form={wizard.form} />;
      case 3:
        return <ApplyStep3Details form={wizard.form} />;
      case 4:
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
    <>
      {/* 프로그레스 바 */}
      <WizardHeader
        currentStep={wizard.currentStep}
        totalSteps={wizard.totalSteps}
        variant="primary"
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
                {currentStepInfo.label === "서비스 선택"
                  ? "어떤 서비스가 필요하신가요?"
                  : currentStepInfo.label === "기본 정보"
                  ? "연락처와 주소를 알려주세요"
                  : currentStepInfo.label === "요청 내용"
                  ? "요청 사항을 알려주세요"
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
        submitLabel="견적 요청하기"
        variant="primary"
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
