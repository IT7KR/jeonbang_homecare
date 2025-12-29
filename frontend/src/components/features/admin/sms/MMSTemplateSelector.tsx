"use client";

import { useState } from "react";
import { ChevronDown, FileText, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";

export interface MMSTemplate {
  id: string;
  name: string;
  message: string;
  category: "work_complete" | "photo_confirm" | "custom";
}

// 기본 템플릿 목록
export const DEFAULT_TEMPLATES: MMSTemplate[] = [
  {
    id: "work_complete_1",
    name: "시공 완료 안내",
    message: `{고객명}님, 안녕하세요.

요청하신 서비스 시공이 완료되었습니다.
첨부된 사진에서 시공 결과를 확인해 주세요.

문의사항이 있으시면 언제든 연락 주세요.
감사합니다.`,
    category: "work_complete",
  },
  {
    id: "work_complete_2",
    name: "시공 완료 (간단)",
    message: `{고객명}님, 시공이 완료되었습니다.
첨부된 사진을 확인해 주세요.`,
    category: "work_complete",
  },
  {
    id: "photo_confirm_1",
    name: "사진 확인 요청",
    message: `{고객명}님, 안녕하세요.

시공 전후 사진을 보내드립니다.
확인 후 문의사항이 있으시면 연락 주세요.

감사합니다.`,
    category: "photo_confirm",
  },
  {
    id: "photo_confirm_2",
    name: "시공 결과 확인",
    message: `{고객명}님, 시공 결과 사진입니다.
만족스럽지 않은 부분이 있으시면 말씀해 주세요.`,
    category: "photo_confirm",
  },
];

interface MMSTemplateSelectorProps {
  selectedTemplateId: string | null;
  onSelect: (template: MMSTemplate | null, message: string) => void;
  customerName?: string;
  className?: string;
}

export function MMSTemplateSelector({
  selectedTemplateId,
  onSelect,
  customerName = "",
  className,
}: MMSTemplateSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isCustomMode, setIsCustomMode] = useState(!selectedTemplateId);

  const selectedTemplate = DEFAULT_TEMPLATES.find(
    (t) => t.id === selectedTemplateId
  );

  const handleTemplateSelect = (template: MMSTemplate) => {
    // 변수 치환
    const processedMessage = template.message.replace(
      /\{고객명\}/g,
      customerName || "{고객명}"
    );
    onSelect(template, processedMessage);
    setIsCustomMode(false);
    setIsOpen(false);
  };

  const handleCustomSelect = () => {
    onSelect(null, "");
    setIsCustomMode(true);
    setIsOpen(false);
  };

  return (
    <div className={cn("relative", className)}>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        메시지 템플릿
      </label>

      {/* 드롭다운 버튼 */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-left hover:bg-gray-100 transition-colors"
      >
        <div className="flex items-center gap-2">
          {isCustomMode ? (
            <>
              <Pencil className="w-4 h-4 text-gray-500" />
              <span className="text-gray-700">직접 입력</span>
            </>
          ) : selectedTemplate ? (
            <>
              <FileText className="w-4 h-4 text-primary" />
              <span className="text-gray-900">{selectedTemplate.name}</span>
            </>
          ) : (
            <>
              <FileText className="w-4 h-4 text-gray-400" />
              <span className="text-gray-500">템플릿 선택</span>
            </>
          )}
        </div>
        <ChevronDown
          className={cn(
            "w-4 h-4 text-gray-400 transition-transform",
            isOpen && "rotate-180"
          )}
        />
      </button>

      {/* 드롭다운 메뉴 */}
      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
          {/* 직접 입력 옵션 */}
          <button
            type="button"
            onClick={handleCustomSelect}
            className={cn(
              "w-full flex items-center gap-2 px-4 py-3 text-left hover:bg-gray-50 transition-colors border-b border-gray-100",
              isCustomMode && "bg-primary/5"
            )}
          >
            <Pencil className="w-4 h-4 text-gray-500" />
            <div>
              <p className="text-sm font-medium text-gray-900">직접 입력</p>
              <p className="text-xs text-gray-500">원하는 내용을 직접 작성</p>
            </div>
          </button>

          {/* 템플릿 목록 */}
          <div className="max-h-64 overflow-y-auto">
            {DEFAULT_TEMPLATES.map((template) => (
              <button
                key={template.id}
                type="button"
                onClick={() => handleTemplateSelect(template)}
                className={cn(
                  "w-full flex items-start gap-2 px-4 py-3 text-left hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0",
                  selectedTemplateId === template.id && "bg-primary/5"
                )}
              >
                <FileText className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">
                    {template.name}
                  </p>
                  <p className="text-xs text-gray-500 line-clamp-2 mt-0.5">
                    {template.message.split("\n")[0]}...
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 변수 안내 */}
      {!isCustomMode && selectedTemplate && (
        <p className="text-xs text-gray-500 mt-2">
          ※ {"{고객명}"}은 자동으로 치환됩니다
        </p>
      )}
    </div>
  );
}
