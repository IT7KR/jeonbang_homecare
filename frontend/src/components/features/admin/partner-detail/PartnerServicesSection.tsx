"use client";

import { Globe } from "lucide-react";
import type { PartnerDetail } from "@/lib/api/admin";
import { CollapsibleCard } from "@/components/admin";
import { SafeBlockText } from "@/components/common/SafeText";

interface PartnerServicesSectionProps {
  partner: PartnerDetail;
}

export function PartnerServicesSection({
  partner,
}: PartnerServicesSectionProps) {
  return (
    <CollapsibleCard
      title="서비스/지역"
      icon={<Globe size={18} />}
      badge={`서비스 ${partner.service_areas.length}개`}
      defaultOpen={true}
    >
      <div className="space-y-4">
        <div>
          <h4 className="text-sm font-medium text-gray-500 mb-2">
            제공 서비스
          </h4>
          <div className="flex flex-wrap gap-2">
            {partner.service_areas.map((area, idx) => (
              <span
                key={idx}
                className="px-3 py-1.5 bg-blue-100 text-blue-800 text-sm rounded-full font-medium"
              >
                {area}
              </span>
            ))}
          </div>
        </div>

        <div>
          <h4 className="text-sm font-medium text-gray-500 mb-2">활동 지역</h4>
          <div className="flex flex-wrap gap-2">
            {partner.work_regions.map((region, idx) => (
              <span
                key={idx}
                className="px-3 py-1.5 bg-green-100 text-green-800 text-sm rounded-full font-medium"
              >
                {region.provinceName}{" "}
                {region.isAllDistricts
                  ? "전체"
                  : region.districtNames.join(", ")}
              </span>
            ))}
          </div>
        </div>

        {partner.introduction && (
          <div>
            <h4 className="text-sm font-medium text-gray-500 mb-2">소개</h4>
            <SafeBlockText
              text={partner.introduction}
              className="text-gray-700 bg-gray-50 p-3 rounded-lg text-sm"
            />
          </div>
        )}

        {partner.experience && (
          <div>
            <h4 className="text-sm font-medium text-gray-500 mb-2">
              경력 및 자격
            </h4>
            <SafeBlockText
              text={partner.experience}
              className="text-gray-700 bg-gray-50 p-3 rounded-lg text-sm"
            />
          </div>
        )}

        {partner.remarks && (
          <div>
            <h4 className="text-sm font-medium text-gray-500 mb-2">비고</h4>
            <SafeBlockText
              text={partner.remarks}
              className="text-gray-700 bg-gray-50 p-3 rounded-lg text-sm"
            />
          </div>
        )}
      </div>
    </CollapsibleCard>
  );
}
