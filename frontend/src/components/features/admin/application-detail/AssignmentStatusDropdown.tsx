"use client";

import { useState } from "react";
import { ChevronDown, Loader2 } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import {
  getAssignmentStatusInfo,
  getNextAssignmentStatuses,
} from "@/lib/constants/application";

interface AssignmentStatusDropdownProps {
  currentStatus: string;
  onSelect: (newStatus: string) => void;
  disabled?: boolean;
  isLoading?: boolean;
}

/**
 * 배정 상태 변경 드롭다운
 * - 현재 상태에서 가능한 다음 상태만 표시
 * - 최종 상태(completed)에서는 드롭다운 비활성화
 */
export function AssignmentStatusDropdown({
  currentStatus,
  onSelect,
  disabled,
  isLoading,
}: AssignmentStatusDropdownProps) {
  const [open, setOpen] = useState(false);
  const statusInfo = getAssignmentStatusInfo(currentStatus);
  const availableStatuses = getNextAssignmentStatuses(currentStatus);

  const handleSelect = (status: string) => {
    setOpen(false);
    onSelect(status);
  };

  // 더 이상 변경할 상태가 없으면 드롭다운 비활성화 (배지만 표시)
  if (availableStatuses.length === 0) {
    return (
      <span
        className={cn(
          "px-2 py-0.5 text-xs font-medium rounded-full",
          statusInfo.color
        )}
      >
        {statusInfo.label}
      </span>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          disabled={disabled || isLoading}
          className={cn(
            "inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full transition-colors cursor-pointer",
            statusInfo.color,
            "hover:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed"
          )}
        >
          {isLoading && <Loader2 size={10} className="animate-spin" />}
          {statusInfo.label}
          <ChevronDown size={12} />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-40 p-1">
        <div className="text-xs text-gray-500 px-3 py-1.5 border-b mb-1">
          상태 변경
        </div>
        {availableStatuses.map((status) => {
          const info = getAssignmentStatusInfo(status);
          return (
            <button
              key={status}
              onClick={() => handleSelect(status)}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-gray-100 transition-colors text-left"
            >
              <span
                className={cn(
                  "w-2 h-2 rounded-full",
                  status === "scheduled" && "bg-purple-500",
                  status === "completed" && "bg-green-500",
                  status === "pending" && "bg-gray-400"
                )}
              />
              <div>
                <div className="font-medium">{info.label}</div>
                {info.description && (
                  <div className="text-xs text-gray-500">{info.description}</div>
                )}
              </div>
            </button>
          );
        })}
      </PopoverContent>
    </Popover>
  );
}

export default AssignmentStatusDropdown;
