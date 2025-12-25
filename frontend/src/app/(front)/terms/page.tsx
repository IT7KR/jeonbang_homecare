"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { ROUTES } from "@/lib/constants";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link
            href={ROUTES.HOME}
            className="w-9 h-9 flex items-center justify-center rounded-full text-gray-500 hover:text-gray-700 hover:bg-gray-100"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-lg font-bold text-gray-900">이용약관</h1>
        </div>
      </div>

      {/* 본문 */}
      <main className="max-w-3xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl p-6 md:p-8 shadow-sm space-y-8">
          {/* 서문 */}
          <section>
            <p className="text-gray-600 leading-relaxed">
              본 이용약관은 전방 홈케어(이하 &quot;회사&quot;)가 제공하는 홈케어
              서비스 중개 플랫폼(이하 &quot;서비스&quot;)의 이용과 관련하여
              회사와 이용자 간의 권리, 의무 및 책임사항을 규정함을 목적으로
              합니다.
            </p>
          </section>

          {/* 제1조 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-gray-900">제1조 (목적)</h2>
            <p className="text-gray-600 leading-relaxed">
              본 약관은 회사가 운영하는 전방 홈케어 서비스의 이용조건 및 절차,
              회사와 이용자 간의 권리, 의무 및 책임사항, 기타 필요한 사항을
              규정함을 목적으로 합니다.
            </p>
          </section>

          {/* 제2조 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-gray-900">제2조 (정의)</h2>
            <p className="text-gray-600 leading-relaxed">
              본 약관에서 사용하는 용어의 정의는 다음과 같습니다.
            </p>
            <ul className="list-disc list-inside text-gray-600 space-y-2 ml-2">
              <li>
                <span className="font-medium">&quot;서비스&quot;</span>: 회사가
                제공하는 홈케어 서비스 견적 요청 및 협력사 연결 중개 서비스
              </li>
              <li>
                <span className="font-medium">&quot;이용자&quot;</span>: 본
                서비스를 이용하여 견적을 요청하거나 서비스를 이용하는 고객
              </li>
              <li>
                <span className="font-medium">&quot;협력사&quot;</span>: 회사와
                협력 계약을 체결하고 이용자에게 실제 홈케어 서비스를 제공하는
                업체 또는 개인
              </li>
              <li>
                <span className="font-medium">&quot;견적 요청&quot;</span>:
                이용자가 원하는 서비스에 대해 상담 및 비용 견적을 요청하는 행위
              </li>
            </ul>
          </section>

          {/* 제3조 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-gray-900">
              제3조 (서비스의 내용)
            </h2>
            <p className="text-gray-600 leading-relaxed">
              회사가 제공하는 서비스의 내용은 다음과 같습니다.
            </p>
            <ul className="list-disc list-inside text-gray-600 space-y-2 ml-2">
              <li>홈케어 서비스 정보 제공</li>
              <li>견적 요청 접수 및 상담 연결</li>
              <li>적합한 협력사 연결 및 중개</li>
              <li>서비스 일정 조율 지원</li>
              <li>기타 홈케어 관련 부가 서비스</li>
            </ul>
          </section>

          {/* 제4조 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-gray-900">
              제4조 (서비스 이용)
            </h2>
            <p className="text-gray-600 leading-relaxed">
              서비스 이용에 관한 사항은 다음과 같습니다.
            </p>
            <ul className="list-disc list-inside text-gray-600 space-y-2 ml-2">
              <li>
                서비스는 연중무휴, 1일 24시간 제공함을 원칙으로 합니다. 단,
                시스템 점검 등 필요한 경우 일시적으로 중단될 수 있습니다.
              </li>
              <li>
                견적 요청은 회원가입 없이 이용 가능하며, 필요한 정보만 입력하면
                됩니다.
              </li>
              <li>
                회사는 견적 요청 접수 후 가능한 빠른 시일 내에 연락을 드립니다.
              </li>
              <li>
                실제 서비스는 연결된 협력사와 이용자 간의 직접 계약으로
                이루어집니다.
              </li>
            </ul>
          </section>

          {/* 제5조 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-gray-900">
              제5조 (회사의 의무)
            </h2>
            <p className="text-gray-600 leading-relaxed">
              회사는 다음 사항을 준수합니다.
            </p>
            <ul className="list-disc list-inside text-gray-600 space-y-2 ml-2">
              <li>안정적인 서비스 제공을 위해 최선을 다합니다.</li>
              <li>이용자의 개인정보를 관련 법령에 따라 안전하게 관리합니다.</li>
              <li>협력사의 자격 및 서비스 품질을 관리하기 위해 노력합니다.</li>
              <li>이용자 불만 및 피해 구제를 위해 적극 대응합니다.</li>
            </ul>
          </section>

          {/* 제6조 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-gray-900">
              제6조 (이용자의 의무)
            </h2>
            <p className="text-gray-600 leading-relaxed">
              이용자는 다음 사항을 준수해야 합니다.
            </p>
            <ul className="list-disc list-inside text-gray-600 space-y-2 ml-2">
              <li>견적 요청 시 정확한 정보를 제공해야 합니다.</li>
              <li>
                타인의 정보를 도용하거나 허위 정보를 입력해서는 안 됩니다.
              </li>
              <li>서비스를 부정한 목적으로 이용해서는 안 됩니다.</li>
              <li>
                협력사와의 계약 및 결제는 이용자 본인의 책임 하에 진행됩니다.
              </li>
            </ul>
          </section>

          {/* 제7조 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-gray-900">
              제7조 (면책 조항)
            </h2>
            <p className="text-gray-600 leading-relaxed">
              회사의 면책사항은 다음과 같습니다.
            </p>
            <ul className="list-disc list-inside text-gray-600 space-y-2 ml-2">
              <li>
                회사는 협력사와 이용자 간의 직접 계약에 대해 책임을 지지
                않습니다.
              </li>
              <li>
                협력사가 제공하는 서비스의 품질, 하자, 사고 등에 대해 회사는
                직접적인 책임을 지지 않습니다.
              </li>
              <li>
                천재지변, 시스템 장애 등 불가항력으로 인한 서비스 중단에 대해
                책임을 지지 않습니다.
              </li>
              <li>
                이용자가 제공한 정보의 부정확으로 인한 문제에 대해 책임을 지지
                않습니다.
              </li>
            </ul>
          </section>

          {/* 제8조 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-gray-900">
              제8조 (분쟁 해결)
            </h2>
            <p className="text-gray-600 leading-relaxed">
              서비스 이용과 관련하여 분쟁이 발생한 경우, 회사와 이용자는 상호
              협의하여 원만히 해결하도록 노력합니다. 협의가 되지 않을 경우
              관할법원은 회사 소재지 관할 법원으로 합니다.
            </p>
          </section>

          {/* 제9조 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-gray-900">
              제9조 (약관의 변경)
            </h2>
            <p className="text-gray-600 leading-relaxed">
              회사는 필요한 경우 관련 법령을 위배하지 않는 범위에서 본 약관을
              변경할 수 있으며, 변경된 약관은 웹사이트에 공지함으로써 효력이
              발생합니다.
            </p>
          </section>

          {/* 시행일 */}
          <section className="pt-4 border-t">
            <p className="text-gray-500 text-sm">
              본 이용약관은 2026년 1월 1일부터 시행됩니다.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
