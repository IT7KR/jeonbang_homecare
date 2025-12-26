"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  FileText,
  Edit2,
  Save,
  X,
  Loader2,
  AlertCircle,
  CheckCircle,
  Eye,
  Lock,
} from "lucide-react";
import { useAuthStore } from "@/lib/stores/auth";
import {
  getSMSTemplates,
  updateSMSTemplate,
  previewSMSTemplate,
  SMSTemplate,
  SMSTemplatePreviewResponse,
} from "@/lib/api/admin";

export default function SMSTemplatesPage() {
  const router = useRouter();
  const { getValidToken } = useAuthStore();

  const [templates, setTemplates] = useState<SMSTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // 편집 상태
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editContent, setEditContent] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // 미리보기 상태
  const [previewingId, setPreviewingId] = useState<number | null>(null);
  const [previewResult, setPreviewResult] = useState<SMSTemplatePreviewResponse | null>(null);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const token = await getValidToken();
      if (!token) {
        router.push("/admin/login");
        return;
      }

      const data = await getSMSTemplates(token);
      setTemplates(data.items);
    } catch (err) {
      setError(err instanceof Error ? err.message : "템플릿을 불러올 수 없습니다");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (template: SMSTemplate) => {
    setEditingId(template.id);
    setEditContent(template.content);
    setPreviewingId(null);
    setPreviewResult(null);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditContent("");
  };

  const handleSave = async (templateId: number) => {
    try {
      setIsSaving(true);
      setError(null);

      const token = await getValidToken();
      if (!token) {
        router.push("/admin/login");
        return;
      }

      await updateSMSTemplate(token, templateId, { content: editContent });

      // 목록 새로고침
      await loadTemplates();

      setEditingId(null);
      setEditContent("");
      setSuccessMessage("템플릿이 저장되었습니다");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "저장에 실패했습니다");
    } finally {
      setIsSaving(false);
    }
  };

  const handlePreview = async (template: SMSTemplate) => {
    try {
      const token = await getValidToken();
      if (!token) return;

      // 기본 변수 값으로 미리보기
      const defaultVariables: Record<string, string> = {};
      if (template.available_variables) {
        template.available_variables.forEach((v) => {
          // 변수별 기본값 설정
          switch (v) {
            case "customer_name":
              defaultVariables[v] = "홍길동";
              break;
            case "application_number":
              defaultVariables[v] = "20251225-001";
              break;
            case "partner_name":
              defaultVariables[v] = "전방홈케어";
              break;
            case "partner_phone":
              defaultVariables[v] = "010-1234-5678";
              break;
            case "scheduled_date":
              defaultVariables[v] = "12월 25일";
              break;
            case "scheduled_time":
              defaultVariables[v] = "오후 2시";
              break;
            case "services":
              defaultVariables[v] = "정원관리, 외벽청소";
              break;
            case "address":
              defaultVariables[v] = "경기도 양평군 양평읍 양평리 123";
              break;
            case "rejection_reason":
              defaultVariables[v] = "서류 미비";
              break;
            case "cancel_reason":
              defaultVariables[v] = "고객 요청";
              break;
            default:
              defaultVariables[v] = `[${v}]`;
          }
        });
      }

      const result = await previewSMSTemplate(token, {
        template_key: template.template_key,
        variables: defaultVariables,
      });

      setPreviewingId(template.id);
      setPreviewResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "미리보기 실패");
    }
  };

  const closePreview = () => {
    setPreviewingId(null);
    setPreviewResult(null);
  };

  // 바이트 수 계산
  const calculateBytes = (text: string) => {
    let bytes = 0;
    for (const char of text) {
      bytes += char.charCodeAt(0) > 127 ? 2 : 1;
    }
    return bytes;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="animate-spin text-primary" size={32} />
          <p className="text-sm text-gray-500">템플릿을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/admin/sms"
          className="p-2.5 rounded-xl hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft size={20} className="text-gray-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">SMS 템플릿 관리</h1>
          <p className="text-gray-500 text-sm mt-1">
            자동 발송되는 SMS 메시지를 편집합니다
          </p>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="bg-red-50 border border-red-100 rounded-2xl p-4 text-red-600 flex items-center gap-3">
          <AlertCircle size={20} />
          <p className="text-sm">{error}</p>
        </div>
      )}
      {successMessage && (
        <div className="bg-primary-50 border border-primary-100 rounded-2xl p-4 text-primary-700 flex items-center gap-3">
          <CheckCircle size={20} />
          <p className="text-sm">{successMessage}</p>
        </div>
      )}

      {/* Template List */}
      <div className="space-y-4">
        {templates.map((template) => (
          <div
            key={template.id}
            className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
          >
            {/* Template Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary-50 rounded-xl">
                  <FileText size={18} className="text-primary" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-900">{template.title}</h3>
                    {template.is_system && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">
                        <Lock size={10} />
                        시스템
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 mt-0.5">{template.description}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePreview(template)}
                  className="p-2 text-gray-500 hover:text-primary hover:bg-primary-50 rounded-lg transition-colors"
                  title="미리보기"
                >
                  <Eye size={18} />
                </button>
                {editingId !== template.id && (
                  <button
                    onClick={() => handleEdit(template)}
                    className="p-2 text-gray-500 hover:text-primary hover:bg-primary-50 rounded-lg transition-colors"
                    title="편집"
                  >
                    <Edit2 size={18} />
                  </button>
                )}
              </div>
            </div>

            {/* Template Content */}
            <div className="px-6 py-4">
              {editingId === template.id ? (
                <div className="space-y-3">
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    rows={6}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors resize-none text-sm font-mono"
                  />
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-gray-500">
                      {calculateBytes(editContent)} 바이트
                      {calculateBytes(editContent) > 90 && (
                        <span className="ml-2 text-amber-600">(LMS)</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleCancelEdit}
                        disabled={isSaving}
                        className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                      >
                        <X size={16} className="inline mr-1" />
                        취소
                      </button>
                      <button
                        onClick={() => handleSave(template.id)}
                        disabled={isSaving}
                        className="px-4 py-2 text-white bg-primary rounded-lg hover:bg-primary-600 disabled:opacity-50 transition-colors text-sm"
                      >
                        {isSaving ? (
                          <Loader2 size={16} className="inline mr-1 animate-spin" />
                        ) : (
                          <Save size={16} className="inline mr-1" />
                        )}
                        저장
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <pre className="whitespace-pre-wrap text-sm text-gray-700 bg-gray-50 p-4 rounded-xl font-mono">
                  {template.content}
                </pre>
              )}

              {/* Preview Result */}
              {previewingId === template.id && previewResult && (
                <div className="mt-4 p-4 bg-blue-50 border border-blue-100 rounded-xl">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-blue-900 text-sm">미리보기 결과</h4>
                    <button
                      onClick={closePreview}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <X size={16} />
                    </button>
                  </div>
                  <pre className="whitespace-pre-wrap text-sm text-blue-800 bg-white p-3 rounded-lg border border-blue-100">
                    {previewResult.preview}
                  </pre>
                  <div className="mt-2 flex items-center gap-4 text-xs text-blue-700">
                    <span>{previewResult.byte_length} 바이트</span>
                    <span className={previewResult.message_type === "LMS" ? "text-amber-600" : ""}>
                      {previewResult.message_type}
                    </span>
                  </div>
                </div>
              )}

              {/* Available Variables */}
              {template.available_variables && template.available_variables.length > 0 && (
                <div className="mt-4 flex items-start gap-2">
                  <span className="text-xs text-gray-500 mt-0.5">사용 가능한 변수:</span>
                  <div className="flex flex-wrap gap-1">
                    {template.available_variables.map((v) => (
                      <code
                        key={v}
                        className="px-1.5 py-0.5 bg-gray-100 text-gray-600 text-xs rounded"
                      >
                        {`{${v}}`}
                      </code>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
