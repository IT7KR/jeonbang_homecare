"use client";

import { useState, useEffect } from "react";
import { ChevronDown, FileText, Pencil, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/lib/stores/auth";
import { getSMSTemplates } from "@/lib/api/admin/sms-templates";
import type { SMSTemplate } from "@/lib/api/admin/types";

// 기본 템플릿 (API 실패 시 fallback)
const FALLBACK_TEMPLATES: SMSTemplate[] = [
  {
    id: -1,
    template_key: "work_complete_1",
    title: "시공 완료 안내",
    description: "시공 완료 후 고객에게 안내하는 메시지",
    content: `{customer_name}님, 안녕하세요.

요청하신 서비스 시공이 완료되었습니다.
첨부된 사진에서 시공 결과를 확인해 주세요.

문의사항이 있으시면 언제든 연락 주세요.
감사합니다.`,
    available_variables: ["customer_name"],
    is_active: true,
    is_system: false,
    created_at: "",
    updated_at: "",
    updated_by: null,
  },
  {
    id: -2,
    template_key: "work_complete_2",
    title: "시공 완료 (간단)",
    description: "간단한 시공 완료 안내",
    content: `{customer_name}님, 시공이 완료되었습니다.
첨부된 사진을 확인해 주세요.`,
    available_variables: ["customer_name"],
    is_active: true,
    is_system: false,
    created_at: "",
    updated_at: "",
    updated_by: null,
  },
];

interface MMSTemplateSelectorProps {
  selectedTemplateId: number | null;
  onSelect: (template: SMSTemplate | null, message: string) => void;
  /** 고객명 (변수 치환용) */
  customerName?: string;
  /** 협력사명 (변수 치환용) */
  partnerName?: string;
  /** 추가 변수 (키-값 쌍) */
  variables?: Record<string, string>;
  className?: string;
}

export function MMSTemplateSelector({
  selectedTemplateId,
  onSelect,
  customerName = "",
  partnerName = "",
  variables = {},
  className,
}: MMSTemplateSelectorProps) {
  const { getValidToken } = useAuthStore();

  const [isOpen, setIsOpen] = useState(false);
  const [isCustomMode, setIsCustomMode] = useState(!selectedTemplateId);
  const [templates, setTemplates] = useState<SMSTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState(false);

  // 템플릿 목록 로드
  useEffect(() => {
    const loadTemplates = async () => {
      setIsLoading(true);
      setLoadError(false);

      try {
        const token = await getValidToken();
        if (!token) {
          setTemplates(FALLBACK_TEMPLATES);
          setLoadError(true);
          return;
        }

        const data = await getSMSTemplates(token, { is_active: true });
        if (data.items.length > 0) {
          setTemplates(data.items);
        } else {
          // DB에 템플릿이 없으면 fallback 사용
          setTemplates(FALLBACK_TEMPLATES);
        }
      } catch (err) {
        console.error("템플릿 로드 실패:", err);
        setTemplates(FALLBACK_TEMPLATES);
        setLoadError(true);
      } finally {
        setIsLoading(false);
      }
    };

    loadTemplates();
  }, [getValidToken]);

  const selectedTemplate = templates.find(
    (t) => t.id === selectedTemplateId
  );

  // 변수 치환 함수
  const processVariables = (content: string, availableVariables: string[] | null): string => {
    let processed = content;

    // 기본 변수 맵
    const variableMap: Record<string, string> = {
      customer_name: customerName,
      "고객명": customerName,
      partner_name: partnerName,
      "협력사명": partnerName,
      ...variables,
    };

    // available_variables가 있으면 해당 변수만 치환
    if (availableVariables && availableVariables.length > 0) {
      availableVariables.forEach((varName) => {
        const placeholder = `{${varName}}`;
        const value = variableMap[varName];
        if (value) {
          processed = processed.replace(new RegExp(placeholder.replace(/[{}]/g, "\\$&"), "g"), value);
        }
      });
    }

    // 추가로 한글 변수명도 치환 ({고객명}, {협력사명} 등)
    Object.entries(variableMap).forEach(([key, value]) => {
      if (value) {
        const placeholder = `{${key}}`;
        processed = processed.replace(new RegExp(placeholder.replace(/[{}]/g, "\\$&"), "g"), value);
      }
    });

    return processed;
  };

  const handleTemplateSelect = (template: SMSTemplate) => {
    const processedMessage = processVariables(template.content, template.available_variables);
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
        disabled={isLoading}
        className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-left hover:bg-gray-100 transition-colors disabled:opacity-50"
      >
        <div className="flex items-center gap-2">
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
              <span className="text-gray-500">템플릿 로딩 중...</span>
            </>
          ) : isCustomMode ? (
            <>
              <Pencil className="w-4 h-4 text-gray-500" />
              <span className="text-gray-700">직접 입력</span>
            </>
          ) : selectedTemplate ? (
            <>
              <FileText className="w-4 h-4 text-primary" />
              <span className="text-gray-900">{selectedTemplate.title}</span>
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
      {isOpen && !isLoading && (
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
            {templates.length === 0 ? (
              <div className="px-4 py-3 text-sm text-gray-500 text-center">
                사용 가능한 템플릿이 없습니다
              </div>
            ) : (
              templates.map((template) => (
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
                      {template.title}
                    </p>
                    <p className="text-xs text-gray-500 line-clamp-2 mt-0.5">
                      {template.content.split("\n")[0]}...
                    </p>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}

      {/* 변수 안내 */}
      {!isCustomMode && selectedTemplate && selectedTemplate.available_variables && (
        <div className="mt-2 flex flex-wrap gap-1.5 items-center">
          <span className="text-xs text-gray-500">사용 변수:</span>
          {selectedTemplate.available_variables.map((v) => (
            <code
              key={v}
              className="px-1.5 py-0.5 bg-gray-100 text-gray-600 text-xs rounded"
            >
              {`{${v}}`}
            </code>
          ))}
        </div>
      )}

      {/* API 실패 안내 */}
      {loadError && (
        <p className="text-xs text-amber-600 mt-1">
          ※ 템플릿 로드 실패, 기본 템플릿을 표시합니다
        </p>
      )}
    </div>
  );
}

// 타입 내보내기 (하위 호환성)
export type { SMSTemplate as MMSTemplate };
