"use client";

import Link from "next/link";
import { Eye } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { type ColumnDef } from "@/components/admin";
import type { ApplicationListItem } from "@/lib/api/admin";
import { getApplicationStatusLabel, getApplicationStatusColor } from "@/lib/constants/status";
import { formatDate, formatPhone } from "@/lib/utils";

interface ColumnsConfig {
  enableManualSMS: boolean;
  selectedIds: number[];
  onToggleSelect: (id: number, e: React.MouseEvent) => void;
  getServiceName: (code: string) => string;
}

export function getApplicationsColumns({
  enableManualSMS,
  selectedIds,
  onToggleSelect,
  getServiceName,
}: ColumnsConfig): ColumnDef<ApplicationListItem>[] {
  const columns: ColumnDef<ApplicationListItem>[] = [];

  // SMS 수동 발송 기능 활성화 시에만 체크박스 표시
  if (enableManualSMS) {
    columns.push({
      key: "checkbox",
      header: "",
      headerClassName: "w-12",
      render: (app: ApplicationListItem) => (
        <div onClick={(e) => onToggleSelect(app.id, e)}>
          <Checkbox
            checked={selectedIds.includes(app.id)}
            onCheckedChange={() => {}}
          />
        </div>
      ),
      className: "px-4 py-4 w-12",
    });
  }

  columns.push(
    {
      key: "application_number",
      header: "신청번호",
      render: (app) => (
        <span className="font-mono text-sm font-semibold text-gray-900">
          {app.application_number}
        </span>
      ),
      className: "px-5 py-4 whitespace-nowrap",
    },
    {
      key: "customer",
      header: "고객정보",
      render: (app) => (
        <div className="text-sm">
          <p className="font-medium text-gray-900">{app.customer_name}</p>
          <p className="text-gray-500 mt-0.5">{formatPhone(app.customer_phone)}</p>
          <p className="text-gray-400 text-xs truncate max-w-[200px] mt-0.5">
            {app.address}
          </p>
        </div>
      ),
      className: "px-5 py-4",
    },
    {
      key: "services",
      header: "서비스",
      headerClassName: "hidden md:table-cell",
      render: (app) => (
        <div className="flex flex-wrap gap-1.5 max-w-[200px]">
          {app.selected_services.slice(0, 2).map((service, idx) => (
            <span
              key={idx}
              className="inline-block px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-lg font-medium"
            >
              {getServiceName(service)}
            </span>
          ))}
          {app.selected_services.length > 2 && (
            <span className="inline-block px-2 py-1 bg-primary-50 text-primary-700 text-xs rounded-lg font-medium">
              +{app.selected_services.length - 2}
            </span>
          )}
        </div>
      ),
      className: "px-5 py-4 hidden md:table-cell",
    },
    {
      key: "status",
      header: "상태",
      render: (app) => (
        <span
          className={`inline-flex px-2.5 py-1 text-xs font-semibold rounded-full ${getApplicationStatusColor(app.status)}`}
        >
          {getApplicationStatusLabel(app.status)}
        </span>
      ),
      className: "px-5 py-4 whitespace-nowrap",
    },
    {
      key: "created_at",
      header: "신청일시",
      headerClassName: "hidden sm:table-cell",
      render: (app) => formatDate(app.created_at),
      className: "px-5 py-4 whitespace-nowrap text-sm text-gray-500 hidden sm:table-cell",
    },
    {
      key: "actions",
      header: "관리",
      headerClassName: "text-center",
      render: (app) => (
        <Link
          href={`/admin/applications/${app.id}`}
          className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-primary hover:text-primary-700 hover:bg-primary-50 rounded-lg transition-colors"
        >
          <Eye size={16} />
          <span className="hidden sm:inline">상세</span>
        </Link>
      ),
      className: "px-5 py-4 whitespace-nowrap text-center",
    }
  );

  return columns;
}
