"use client";

import Link from "next/link";
import { CheckCircle2, Phone, Home, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { ROUTES, COMPANY_INFO } from "@/lib/constants";
import type { DuplicateApplicationInfo } from "@/lib/api/applications";

interface ApplySuccessProps {
  applicationNumber?: string;
  duplicateInfo?: DuplicateApplicationInfo;
}

// 상태 라벨
const STATUS_LABELS: Record<string, string> = {
  new: "신규접수",
  consulting: "상담중",
  assigned: "협력사 배정됨",
  scheduled: "일정 확정",
};

/**
 * 서비스 신청 완료 화면
 */
export function ApplySuccess({ applicationNumber, duplicateInfo }: ApplySuccessProps) {
  return (
    <div className="wizard-container">
      <div className="wizard-content max-w-lg mx-auto px-4 py-12">
        <div className="text-center">
          {/* 성공 아이콘 */}
          <div
            className={cn(
              "w-24 h-24 mx-auto mb-8",
              "bg-primary/10 rounded-full",
              "flex items-center justify-center",
              "animate-in zoom-in-50 duration-500"
            )}
          >
            <CheckCircle2 className="w-12 h-12 text-primary" />
          </div>

          {/* 제목 */}
          <h1 className="text-senior-title mb-4">
            서비스 신청이 완료되었습니다
          </h1>

          {/* 신청번호 표시 */}
          {applicationNumber && (
            <p className="text-lg text-primary font-bold mb-4">
              신청번호: {applicationNumber}
            </p>
          )}

          {/* 중복 신청 경고 */}
          {duplicateInfo && (
            <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-5 mb-6 text-left">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-[16px] font-bold text-amber-800 mb-2">
                    이미 진행 중인 신청이 있습니다
                  </h3>
                  <p className="text-[15px] text-amber-700 mb-3">
                    동일한 연락처로 이미 신청된 건이 있어 안내드립니다.
                    담당자가 확인 후 함께 처리해 드리겠습니다.
                  </p>
                  <div className="bg-white/60 rounded-lg p-3 text-[14px] text-amber-800">
                    <p><span className="font-medium">기존 신청번호:</span> {duplicateInfo.existing_application_number}</p>
                    <p><span className="font-medium">상태:</span> {STATUS_LABELS[duplicateInfo.existing_status] || duplicateInfo.existing_status}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 설명 */}
          <p className="text-senior-body text-gray-600 mb-10">
            입력하신 연락처로 빠른 시일 내에
            <br />
            담당자가 연락드리겠습니다.
          </p>

          {/* 안내 박스 */}
          <div className="bg-primary/5 rounded-2xl p-6 mb-8 text-left">
            <h2 className="text-[18px] font-bold text-gray-900 mb-3">
              다음 단계 안내
            </h2>
            <ol className="space-y-3 text-[16px] text-gray-700">
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-white text-[14px] font-bold flex items-center justify-center">
                  1
                </span>
                <span>담당자가 전화로 상세 상담을 진행합니다.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-white text-[14px] font-bold flex items-center justify-center">
                  2
                </span>
                <span>현장 방문 후 정확한 견적을 안내드립니다.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-white text-[14px] font-bold flex items-center justify-center">
                  3
                </span>
                <span>일정을 조율하여 서비스를 진행합니다.</span>
              </li>
            </ol>
          </div>

          {/* 버튼 */}
          <div className="space-y-4">
            <Link
              href={ROUTES.HOME}
              className="btn-senior-primary w-full justify-center"
            >
              <Home className="w-6 h-6" />
              <span>홈으로 돌아가기</span>
            </Link>

            <a
              href={`tel:${COMPANY_INFO.phone}`}
              className="btn-senior-outline w-full justify-center"
            >
              <Phone className="w-6 h-6" />
              <span>전화 문의하기</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ApplySuccess;
