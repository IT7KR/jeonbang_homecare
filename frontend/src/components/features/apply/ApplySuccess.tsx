"use client";

import Link from "next/link";
import { CheckCircle2, Phone, Home } from "lucide-react";
import { cn } from "@/lib/utils";
import { ROUTES, COMPANY_INFO } from "@/lib/constants";

/**
 * 서비스 신청 완료 화면
 */
export function ApplySuccess() {
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
