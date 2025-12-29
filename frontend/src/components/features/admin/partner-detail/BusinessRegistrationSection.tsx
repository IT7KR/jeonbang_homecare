"use client";

import { FileText, ExternalLink, Download } from "lucide-react";
import type { PartnerDetail } from "@/lib/api/admin";
import { CollapsibleCard } from "@/components/admin";
import { FILE_BASE_URL, downloadFile } from "@/lib/constants/partner";

interface BusinessRegistrationSectionProps {
  partner: PartnerDetail;
}

export function BusinessRegistrationSection({
  partner,
}: BusinessRegistrationSectionProps) {
  return (
    <CollapsibleCard
      title="사업자등록증"
      icon={<FileText size={18} />}
      defaultOpen={partner.business_registration_file ? true : false}
    >
      {partner.business_registration_file ? (
        <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex-shrink-0 w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center border border-blue-200">
            <FileText size={24} className="text-blue-500" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-gray-900 truncate">사업자등록증</p>
            <p className="text-sm text-gray-500">첨부 파일</p>
          </div>
          <div className="flex items-center gap-2">
            <a
              href={`${FILE_BASE_URL}${partner.business_registration_file}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
            >
              <ExternalLink size={14} />
              열기
            </a>
            <button
              onClick={() =>
                downloadFile(
                  `${FILE_BASE_URL}${partner.business_registration_file}`
                )
              }
              className="flex items-center gap-2 px-3 py-1.5 bg-primary text-white rounded-lg hover:bg-primary-600 transition-colors text-sm"
            >
              <Download size={14} />
              다운로드
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200 text-gray-500">
          <FileText size={20} />
          <span className="text-sm">업로드된 파일이 없습니다</span>
        </div>
      )}
    </CollapsibleCard>
  );
}
