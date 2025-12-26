"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { ROUTES } from "@/lib/constants";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link
            href={ROUTES.HOME}
            className="w-9 h-9 flex items-center justify-center rounded-full text-gray-500 hover:text-gray-700 hover:bg-gray-100"
            aria-label="홈으로 돌아가기"
          >
            <ArrowLeft className="w-5 h-5" aria-hidden="true" />
          </Link>
          <h1 className="text-lg font-bold text-gray-900">개인정보처리방침</h1>
        </div>
      </div>

      {/* 본문 */}
      <main id="main-content" className="max-w-3xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl p-6 md:p-8 shadow-sm space-y-8">
          {/* 서문 */}
          <section>
            <p className="text-gray-600 leading-relaxed">
              전방 홈케어(이하 &quot;회사&quot;)는 개인정보보호법 등 관련
              법령상의 개인정보보호 규정을 준수하며, 관련 법령에 의거한
              개인정보처리방침을 정하여 이용자 권익 보호에 최선을 다하고
              있습니다.
            </p>
          </section>

          {/* 제1조 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-gray-900">
              제1조 (개인정보의 수집 및 이용 목적)
            </h2>
            <p className="text-gray-600 leading-relaxed">
              회사는 다음의 목적을 위하여 개인정보를 처리합니다. 처리하고 있는
              개인정보는 다음의 목적 이외의 용도로는 이용되지 않으며, 이용
              목적이 변경되는 경우에는 별도의 동의를 받는 등 필요한 조치를
              이행할 예정입니다.
            </p>
            <ul className="list-disc list-inside text-gray-600 space-y-2 ml-2">
              <li>서비스 상담 및 견적 요청 처리</li>
              <li>협력사 등록 및 관리</li>
              <li>서비스 제공 및 계약 이행</li>
              <li>고객 문의 응대 및 불만 처리</li>
              <li>서비스 개선 및 신규 서비스 개발</li>
            </ul>
          </section>

          {/* 제2조 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-gray-900">
              제2조 (수집하는 개인정보의 항목)
            </h2>
            <p className="text-gray-600 leading-relaxed">
              회사는 서비스 제공을 위해 다음과 같은 개인정보를 수집합니다.
            </p>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-800 mb-2">
                  1. 견적 요청 시
                </h3>
                <ul className="list-disc list-inside text-gray-600 space-y-1 ml-2">
                  <li>필수: 이름, 연락처, 주소</li>
                  <li>선택: 요청 내용, 희망 일정, 현장 사진</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-gray-800 mb-2">
                  2. 협력사 등록 시
                </h3>
                <ul className="list-disc list-inside text-gray-600 space-y-1 ml-2">
                  <li>필수: 회사명, 대표자명, 연락처, 주소, 활동 지역</li>
                  <li>선택: 사업자등록번호, 이메일, 경력, 자격증, 소개</li>
                </ul>
              </div>
            </div>
          </section>

          {/* 제3조 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-gray-900">
              제3조 (개인정보의 보유 및 이용 기간)
            </h2>
            <p className="text-gray-600 leading-relaxed">
              회사는 법령에 따른 개인정보 보유·이용기간 또는 정보주체로부터
              개인정보를 수집 시에 동의 받은 개인정보 보유·이용기간 내에서
              개인정보를 처리·보유합니다.
            </p>
            <ul className="list-disc list-inside text-gray-600 space-y-2 ml-2">
              <li>
                <span className="font-medium">견적 요청 정보:</span> 서비스 완료
                후 3년
              </li>
              <li>
                <span className="font-medium">협력사 정보:</span> 협력 관계 종료
                후 3년
              </li>
              <li>
                <span className="font-medium">관련 법령에 따른 보존:</span> 계약
                또는 청약철회 등에 관한 기록 5년, 대금결제 및 재화 등의 공급에
                관한 기록 5년, 소비자 불만 또는 분쟁처리에 관한 기록 3년
              </li>
            </ul>
          </section>

          {/* 제4조 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-gray-900">
              제4조 (개인정보의 제3자 제공)
            </h2>
            <p className="text-gray-600 leading-relaxed">
              회사는 원칙적으로 이용자의 개인정보를 제3자에게 제공하지 않습니다.
              다만, 아래의 경우에는 예외로 합니다.
            </p>
            <ul className="list-disc list-inside text-gray-600 space-y-2 ml-2">
              <li>이용자가 사전에 동의한 경우</li>
              <li>
                서비스 제공을 위해 협력사에게 필요한 최소한의 정보를 제공하는
                경우
              </li>
              <li>
                법령의 규정에 의거하거나, 수사 목적으로 법령에 정해진 절차와
                방법에 따라 수사기관의 요구가 있는 경우
              </li>
            </ul>
          </section>

          {/* 제5조 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-gray-900">
              제5조 (정보주체의 권리·의무 및 행사방법)
            </h2>
            <p className="text-gray-600 leading-relaxed">
              이용자는 개인정보주체로서 다음과 같은 권리를 행사할 수 있습니다.
            </p>
            <ul className="list-disc list-inside text-gray-600 space-y-2 ml-2">
              <li>개인정보 열람 요구</li>
              <li>오류 등이 있을 경우 정정 요구</li>
              <li>삭제 요구</li>
              <li>처리정지 요구</li>
            </ul>
            <p className="text-gray-600 leading-relaxed mt-3">
              위 권리 행사는 전화(010-3323-7396), 이메일(mycron37@naver.com)
              등을 통해 요청하실 수 있습니다.
            </p>
          </section>

          {/* 제6조 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-gray-900">
              제6조 (개인정보의 안전성 확보 조치)
            </h2>
            <p className="text-gray-600 leading-relaxed">
              회사는 개인정보의 안전성 확보를 위해 다음과 같은 조치를 취하고
              있습니다.
            </p>
            <ul className="list-disc list-inside text-gray-600 space-y-2 ml-2">
              <li>개인정보의 암호화</li>
              <li>해킹 등에 대비한 기술적 대책</li>
              <li>개인정보 접근 제한</li>
              <li>개인정보 취급 직원의 최소화 및 교육</li>
            </ul>
          </section>

          {/* 제7조 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-gray-900">
              제7조 (개인정보 보호책임자)
            </h2>
            <p className="text-gray-600 leading-relaxed">
              회사는 개인정보 처리에 관한 업무를 총괄해서 책임지고, 개인정보
              처리와 관련한 정보주체의 불만처리 및 피해구제 등을 위하여 아래와
              같이 개인정보 보호책임자를 지정하고 있습니다.
            </p>
            <div className="bg-gray-50 rounded-lg p-4 mt-3">
              <p className="text-gray-700">
                <span className="font-medium">개인정보 보호책임자:</span> 조원희
              </p>
              <p className="text-gray-700">
                <span className="font-medium">연락처:</span> 010-3323-7396
              </p>
              <p className="text-gray-700">
                <span className="font-medium">이메일:</span> mycron37@naver.com
              </p>
            </div>
          </section>

          {/* 시행일 */}
          <section className="pt-4 border-t">
            <p className="text-gray-500 text-sm">
              본 개인정보처리방침은 2026년 1월 1일부터 시행됩니다.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
