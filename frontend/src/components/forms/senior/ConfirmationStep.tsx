"use client";

import { Pencil, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ConfirmationStepProps, ConfirmationItem } from "./types";

/**
 * 확인 스텝 컴포넌트
 *
 * 마법사의 마지막 단계에서 입력 내용을 확인하고 수정할 수 있습니다.
 * 섹션별로 그룹화된 정보를 명확하게 표시합니다.
 */
export function ConfirmationStep({
  sections,
  onEdit,
  variant = "primary",
  className,
}: ConfirmationStepProps) {
  const isPrimary = variant === "primary";

  return (
    <div className={cn("space-y-6", className)}>
      {/* 안내 메시지 */}
      <div
        className={cn(
          "flex items-start gap-4 p-5 rounded-2xl border-2",
          isPrimary
            ? "bg-primary/5 border-primary/20"
            : "bg-secondary/5 border-secondary/20"
        )}
      >
        <CheckCircle2
          className={cn(
            "w-8 h-8 flex-shrink-0",
            isPrimary ? "text-primary" : "text-secondary"
          )}
        />
        <div>
          <p className="text-[20px] font-bold text-gray-900">
            입력하신 내용을 확인해 주세요
          </p>
          <p className="mt-1 text-[16px] text-gray-600">
            내용이 맞으면 아래 제출 버튼을 눌러주세요. 수정이 필요하면 편집
            버튼을 눌러주세요.
          </p>
        </div>
      </div>

      {/* 섹션별 정보 */}
      {sections.map((section, sectionIndex) => (
        <div
          key={sectionIndex}
          className={cn(
            "rounded-2xl border-2 border-gray-200 overflow-hidden",
            "bg-white"
          )}
        >
          {/* 섹션 헤더 */}
          <div className="flex items-center justify-between px-5 py-4 bg-gray-50 border-b border-gray-200">
            <h3 className="text-[18px] font-bold text-gray-900">
              {section.title}
            </h3>

            {onEdit && (
              <button
                type="button"
                onClick={() => onEdit(sectionIndex)}
                className={cn(
                  "inline-flex items-center gap-2",
                  "px-4 py-2 rounded-lg",
                  "text-[14px] font-medium",
                  "border-2 transition-colors",
                  isPrimary
                    ? "border-primary/30 text-primary hover:bg-primary/5"
                    : "border-secondary/30 text-secondary hover:bg-secondary/5"
                )}
              >
                <Pencil className="w-4 h-4" />
                <span>수정</span>
              </button>
            )}
          </div>

          {/* 항목 목록 */}
          <div className="divide-y divide-gray-100">
            {section.items.map((item, itemIndex) => (
              <ConfirmationItemRow
                key={itemIndex}
                item={item}
                variant={variant}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * 확인 항목 행 컴포넌트
 */
function ConfirmationItemRow({
  item,
  variant,
}: {
  item: ConfirmationItem;
  variant: "primary" | "secondary";
}) {
  const isPrimary = variant === "primary";

  // 값이 배열인 경우 처리
  const renderValue = () => {
    if (Array.isArray(item.value)) {
      if (item.value.length === 0) {
        return <span className="text-gray-400">없음</span>;
      }
      return (
        <div className="flex flex-wrap gap-2">
          {item.value.map((v, i) => (
            <span
              key={i}
              className={cn(
                "inline-flex items-center",
                "px-3 py-1 rounded-full",
                "text-[14px] font-medium",
                isPrimary
                  ? "bg-primary/10 text-primary"
                  : "bg-secondary/10 text-secondary"
              )}
            >
              {v}
            </span>
          ))}
        </div>
      );
    }

    if (!item.value || item.value === "") {
      return <span className="text-gray-400">입력 안 함</span>;
    }

    return <span className="text-gray-900">{item.value}</span>;
  };

  return (
    <div className="flex items-start gap-4 px-5 py-4">
      {/* 아이콘 (있는 경우) */}
      {item.icon && (
        <div
          className={cn(
            "flex-shrink-0 w-10 h-10 rounded-lg",
            "flex items-center justify-center",
            "bg-gray-100 text-gray-500"
          )}
        >
          {item.icon}
        </div>
      )}

      {/* 라벨 및 값 */}
      <div className="flex-1 min-w-0">
        <dt className="text-[16px] font-semibold text-gray-600 mb-1.5">
          {item.label}
        </dt>
        <dd className="text-[18px] font-medium break-words">{renderValue()}</dd>
      </div>
    </div>
  );
}

export default ConfirmationStep;
