"use client";

import { useState, useRef } from "react";
import { UseFormReturn } from "react-hook-form";
import { Building2, HelpCircle, Upload, FileText, X, Image as ImageIcon } from "lucide-react";
import type { PartnerFormData } from "@/lib/validations/partner";
import { SeniorInput, SeniorLabel } from "@/components/forms/senior";

interface PartnerStep2BasicProps {
  form: UseFormReturn<PartnerFormData>;
}

/**
 * 협력사 등록 마법사 - Step 2: 기본 정보
 */
export function PartnerStep2Basic({ form }: PartnerStep2BasicProps) {
  const { register, formState, setValue, watch } = form;
  const errors = formState.errors;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);

  const currentFile = watch("businessRegistrationFile");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setValue("businessRegistrationFile", file, { shouldValidate: true });

      // 이미지 파일인 경우 미리보기 생성
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setFilePreview(reader.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        setFilePreview(null);
      }
    }
  };

  const handleRemoveFile = () => {
    setValue("businessRegistrationFile", undefined);
    setFilePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-6">
        {/* 기본 정보 섹션 */}
        <section className="space-y-5">
          <div className="flex items-center gap-3 pb-3 border-b-2 border-gray-100">
            <Building2 className="w-6 h-6 text-secondary" />
            <h3 className="text-[20px] font-bold text-gray-900">사업자 정보</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <SeniorInput
              id="companyName"
              label="회사/상호명"
              placeholder="예: 양평조경"
              required
              variant="secondary"
              error={errors.companyName?.message}
              {...register("companyName")}
            />

            <SeniorInput
              id="representativeName"
              label="대표자명"
              placeholder="홍길동"
              required
              variant="secondary"
              error={errors.representativeName?.message}
              {...register("representativeName")}
            />
          </div>

          <div className="md:max-w-md">
            <SeniorInput
              id="businessNumber"
              label="사업자등록번호"
              placeholder="123-45-67890"
              optional
              variant="secondary"
              hint={
                <span className="flex items-center gap-1">
                  <HelpCircle className="w-3.5 h-3.5" />
                  사업자인 경우 입력해 주세요. 개인은 입력하지 않아도 됩니다.
                </span>
              }
              error={errors.businessNumber?.message}
              {...register("businessNumber")}
            />
          </div>

          {/* 사업자등록증 파일 업로드 */}
          <div className="space-y-3">
            <SeniorLabel
              htmlFor="businessRegistrationFile"
              optional
              variant="secondary"
            >
              사업자등록증 첨부
            </SeniorLabel>

            <input
              ref={fileInputRef}
              type="file"
              id="businessRegistrationFile"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={handleFileChange}
              className="hidden"
            />

            {!currentFile ? (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full p-6 border-2 border-dashed border-gray-300 rounded-xl hover:border-secondary hover:bg-secondary/5 transition-colors group"
              >
                <div className="flex flex-col items-center gap-3">
                  <div className="w-14 h-14 rounded-full bg-gray-100 group-hover:bg-secondary/10 flex items-center justify-center transition-colors">
                    <Upload className="w-7 h-7 text-gray-400 group-hover:text-secondary transition-colors" />
                  </div>
                  <div className="text-center">
                    <p className="text-[16px] font-medium text-gray-700 group-hover:text-secondary">
                      파일을 선택해 주세요
                    </p>
                    <p className="text-[14px] text-gray-500 mt-1">
                      PDF, JPG, PNG (최대 10MB)
                    </p>
                  </div>
                </div>
              </button>
            ) : (
              <div className="relative border border-gray-200 rounded-xl p-4 bg-gray-50">
                <div className="flex items-start gap-4">
                  {/* 파일 아이콘/미리보기 */}
                  <div className="shrink-0">
                    {filePreview ? (
                      <div className="w-16 h-16 rounded-lg overflow-hidden border border-gray-200 bg-white">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={filePreview}
                          alt="미리보기"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : currentFile.type === "application/pdf" ? (
                      <div className="w-16 h-16 rounded-lg bg-red-50 border border-red-200 flex items-center justify-center">
                        <FileText className="w-8 h-8 text-red-500" />
                      </div>
                    ) : (
                      <div className="w-16 h-16 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center">
                        <ImageIcon className="w-8 h-8 text-blue-500" />
                      </div>
                    )}
                  </div>

                  {/* 파일 정보 */}
                  <div className="flex-1 min-w-0">
                    <p className="text-[16px] font-medium text-gray-900 truncate">
                      {currentFile.name}
                    </p>
                    <p className="text-[14px] text-gray-500 mt-1">
                      {formatFileSize(currentFile.size)}
                    </p>
                  </div>

                  {/* 삭제 버튼 */}
                  <button
                    type="button"
                    onClick={handleRemoveFile}
                    className="shrink-0 p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}

            {errors.businessRegistrationFile?.message && (
              <p className="text-[14px] text-red-500 mt-2">
                {errors.businessRegistrationFile.message as string}
              </p>
            )}

            <p className="text-[14px] text-gray-500 flex items-center gap-1.5">
              <HelpCircle className="w-4 h-4" />
              사업자등록증을 첨부하시면 신뢰도가 높아집니다. (선택사항)
            </p>
          </div>
        </section>

        {/* 안내 메시지 */}
        <div className="rounded-xl bg-secondary/5 p-5 border border-secondary/20">
          <p className="text-[16px] text-gray-700">
            <span className="font-bold text-secondary">Tip:</span> 정확한 정보를
            입력하시면 고객 신뢰도가 높아집니다.
          </p>
        </div>
    </div>
  );
}

export default PartnerStep2Basic;
