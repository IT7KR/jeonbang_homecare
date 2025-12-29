"use client";

import Link from "next/link";
import { Eye, CheckCircle } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { type ColumnDef } from "@/components/admin";
import type { PartnerListItem } from "@/lib/api/admin";
import { getPartnerStatusLabel, getPartnerStatusColor } from "@/lib/constants/status";
import { formatDate, formatPhone } from "@/lib/utils";

interface ColumnsConfig {
  enableManualSMS: boolean;
  selectedIds: number[];
  onToggleSelect: (id: number, e: React.MouseEvent) => void;
  getServiceName: (code: string) => string;
  onApprovalClick: (partner: PartnerListItem) => void;
}

export function getPartnersColumns({
  enableManualSMS,
  selectedIds,
  onToggleSelect,
  getServiceName,
  onApprovalClick,
}: ColumnsConfig): ColumnDef<PartnerListItem>[] {
  const columns: ColumnDef<PartnerListItem>[] = [];

  // SMS 수동 발송 기능 활성화 시에만 체크박스 표시
  if (enableManualSMS) {
    columns.push({
      key: "checkbox",
      header: "",
      headerClassName: "w-12",
      render: (partner: PartnerListItem) => (
        <div onClick={(e) => onToggleSelect(partner.id, e)}>
          <Checkbox
            checked={selectedIds.includes(partner.id)}
            onCheckedChange={() => {}}
          />
        </div>
      ),
      className: "px-4 py-4 w-12",
    });
  }

  columns.push(
    {
      key: "company_name",
      header: "회사명",
      render: (partner) => (
        <span className="font-semibold text-gray-900">
          {partner.company_name}
        </span>
      ),
      className: "px-5 py-4 whitespace-nowrap",
    },
    {
      key: "representative",
      header: "대표자",
      headerClassName: "hidden md:table-cell",
      render: (partner) => partner.representative_name,
      className: "px-5 py-4 whitespace-nowrap text-sm text-gray-700 hidden md:table-cell",
    },
    {
      key: "contact",
      header: "연락처",
      headerClassName: "hidden sm:table-cell",
      render: (partner) => formatPhone(partner.contact_phone),
      className: "px-5 py-4 whitespace-nowrap text-sm text-gray-700 hidden sm:table-cell",
    },
    {
      key: "services",
      header: "서비스",
      headerClassName: "hidden lg:table-cell",
      render: (partner) => (
        <div className="flex flex-wrap gap-1.5 max-w-[180px]">
          {partner.service_areas.slice(0, 2).map((area, idx) => (
            <span
              key={idx}
              className="inline-block px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-lg font-medium"
            >
              {getServiceName(area)}
            </span>
          ))}
          {partner.service_areas.length > 2 && (
            <span className="inline-block px-2 py-1 bg-primary-50 text-primary-700 text-xs rounded-lg font-medium">
              +{partner.service_areas.length - 2}
            </span>
          )}
        </div>
      ),
      className: "px-5 py-4 hidden lg:table-cell",
    },
    {
      key: "status",
      header: "상태",
      render: (partner) => (
        <span
          className={`inline-flex px-2.5 py-1 text-xs font-semibold rounded-full ${getPartnerStatusColor(partner.status)}`}
        >
          {getPartnerStatusLabel(partner.status)}
        </span>
      ),
      className: "px-5 py-4 whitespace-nowrap",
    },
    {
      key: "created_at",
      header: "등록일",
      headerClassName: "hidden sm:table-cell",
      render: (partner) => formatDate(partner.created_at, { type: "date" }),
      className: "px-5 py-4 whitespace-nowrap text-sm text-gray-500 hidden sm:table-cell",
    },
    {
      key: "actions",
      header: "관리",
      headerClassName: "text-center",
      render: (partner) => (
        <div className="flex items-center justify-center gap-2">
          <Link
            href={`/admin/partners/${partner.id}`}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-primary hover:text-primary-700 hover:bg-primary-50 rounded-lg transition-colors"
          >
            <Eye size={16} />
            <span className="hidden sm:inline">상세</span>
          </Link>
          {partner.status === "pending" && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onApprovalClick(partner);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-green-600 hover:text-green-700 hover:bg-green-50 rounded-lg transition-colors"
            >
              <CheckCircle size={16} />
              <span className="hidden sm:inline">승인</span>
            </button>
          )}
        </div>
      ),
      className: "px-5 py-4 whitespace-nowrap",
    }
  );

  return columns;
}
