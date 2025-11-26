"use client";

import { useState } from "react";
import { UseFormReturn } from "react-hook-form";
import {
  User,
  MapPin,
  FileText,
  Upload,
  X,
  Loader2,
  Image as ImageIcon,
} from "lucide-react";
import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";
import { cn } from "@/lib/utils";
import type { ApplicationFormData } from "@/lib/validations/application";
import { compressImages } from "@/lib/utils/image";
import { StepHeader } from "@/components/wizard";
import { SeniorInput, SeniorTextarea, SeniorLabel, FieldError } from "@/components/forms/senior";
import { PhoneInput } from "@/components/forms/PhoneInput";
import { DaumPostcode } from "@/components/forms/DaumPostcode";

interface ApplyStep2InfoProps {
  form: UseFormReturn<ApplicationFormData>;
}

/**
 * 서비스 신청 마법사 - Step 2: 정보 입력
 */
export function ApplyStep2Info({ form }: ApplyStep2InfoProps) {
  const [previewImages, setPreviewImages] = useState<string[]>([]);
  const [isCompressing, setIsCompressing] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const { register, watch, setValue, formState } = form;
  const errors = formState.errors;

  // 이미지 파일 처리
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    setIsCompressing(true);

    try {
      const fileArray = Array.from(files);
      const currentPhotos = watch("photos") || [];

      // 이미지 압축
      const compressedFiles = await compressImages(fileArray);

      // 최대 5장 제한
      const combined = [...currentPhotos, ...compressedFiles].slice(0, 5);
      setValue("photos", combined);

      // 미리보기 생성
      const newPreviews = combined.map((file) => URL.createObjectURL(file));
      setPreviewImages(newPreviews);
    } catch (error) {
      console.error("Image compression error:", error);
    } finally {
      setIsCompressing(false);
    }
  };

  const removeImage = (index: number) => {
    const currentPhotos = watch("photos") || [];
    const updated = currentPhotos.filter((_, i) => i !== index);
    setValue("photos", updated);

    const newPreviews = previewImages.filter((_, i) => i !== index);
    setPreviewImages(newPreviews);
  };

  return (
    <div className="wizard-step-content">
      <StepHeader
        stepNumber={2}
        totalSteps={3}
        title="정보를 입력해 주세요"
        description="서비스 제공을 위해 필요한 정보입니다."
        icon={<User className="w-full h-full" />}
        variant="primary"
      />

      <div className="space-y-8">
        {/* 고객 정보 섹션 */}
        <section className="space-y-5">
          <div className="flex items-center gap-3 pb-3 border-b-2 border-gray-100">
            <User className="w-6 h-6 text-primary" />
            <h3 className="text-[20px] font-bold text-gray-900">고객 정보</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <SeniorInput
              id="customerName"
              label="이름"
              placeholder="홍길동"
              required
              variant="primary"
              error={errors.customerName?.message}
              {...register("customerName")}
            />

            <div>
              <SeniorLabel htmlFor="customerPhone" required variant="primary">
                연락처
              </SeniorLabel>
              <PhoneInput
                id="customerPhone"
                placeholder="010-1234-5678"
                className="input-senior w-full"
                value={watch("customerPhone") || ""}
                onChange={(value) =>
                  setValue("customerPhone", value, { shouldValidate: true })
                }
              />
              <FieldError
                message={errors.customerPhone?.message}
                fieldId="customerPhone"
                variant="primary"
              />
            </div>
          </div>
        </section>

        {/* 주소 정보 섹션 */}
        <section className="space-y-5">
          <div className="flex items-center gap-3 pb-3 border-b-2 border-gray-100">
            <MapPin className="w-6 h-6 text-primary" />
            <h3 className="text-[20px] font-bold text-gray-900">현장 주소</h3>
          </div>

          <div>
            <SeniorLabel required variant="primary">
              주소
            </SeniorLabel>
            <DaumPostcode
              value={watch("address") || ""}
              onChange={(address) =>
                setValue("address", address, { shouldValidate: true })
              }
              placeholder="클릭하여 주소 검색"
              className="input-senior w-full mt-2"
              error={errors.address?.message}
            />
          </div>

          <SeniorInput
            id="addressDetail"
            label="상세 주소"
            placeholder="동, 호수, 건물명 등"
            optional
            variant="primary"
            {...register("addressDetail")}
          />
        </section>

        {/* 상세 내용 섹션 */}
        <section className="space-y-5">
          <div className="flex items-center gap-3 pb-3 border-b-2 border-gray-100">
            <FileText className="w-6 h-6 text-primary" />
            <h3 className="text-[20px] font-bold text-gray-900">요청 내용</h3>
          </div>

          <SeniorTextarea
            id="description"
            label="요청 사항"
            placeholder="필요한 작업 내용을 자세히 설명해 주세요.&#10;예: 마당 잔디 제초 필요, 약 100평 규모"
            required
            rows={5}
            variant="primary"
            error={errors.description?.message}
            hint="작업 범위, 상태, 희망 일정 등을 알려주시면 더 정확한 견적을 받으실 수 있습니다."
            {...register("description")}
          />

          {/* 사진 첨부 */}
          <div>
            <SeniorLabel optional variant="primary">
              사진 첨부
            </SeniorLabel>
            <p className="text-[14px] text-gray-500 mb-3">
              현장 사진을 첨부하시면 더 정확한 상담이 가능합니다. (최대 5장)
            </p>

            {/* 미리보기 */}
            {previewImages.length > 0 && (
              <div className="flex flex-wrap gap-3 mb-4">
                {previewImages.map((src, index) => (
                  <div key={index} className="relative group">
                    <button
                      type="button"
                      onClick={() => {
                        setLightboxIndex(index);
                        setLightboxOpen(true);
                      }}
                      className="block"
                    >
                      <img
                        src={src}
                        alt={`첨부 이미지 ${index + 1}`}
                        className="w-24 h-24 object-cover rounded-xl border-2 border-gray-200 cursor-pointer hover:opacity-80 transition-opacity"
                      />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 shadow-lg touch-target"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* 업로드 버튼 */}
            {previewImages.length < 5 && (
              <label
                className={cn(
                  "flex flex-col items-center justify-center",
                  "w-full min-h-[120px] p-6",
                  "border-2 border-dashed rounded-xl",
                  "transition-colors",
                  isCompressing
                    ? "cursor-wait bg-gray-50 border-gray-300"
                    : "cursor-pointer border-gray-300 hover:border-primary hover:bg-primary/5"
                )}
              >
                {isCompressing ? (
                  <>
                    <Loader2 className="w-10 h-10 mb-3 text-primary animate-spin" />
                    <p className="text-[16px] text-gray-600 font-medium">
                      이미지 최적화 중...
                    </p>
                  </>
                ) : (
                  <>
                    <Upload className="w-10 h-10 mb-3 text-gray-400" />
                    <p className="text-[16px] text-gray-600 font-medium">
                      클릭하여 사진 업로드
                    </p>
                    <p className="text-[14px] text-gray-400 mt-1">
                      PNG, JPG (자동 최적화)
                    </p>
                  </>
                )}
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  multiple
                  onChange={handleFileChange}
                  disabled={isCompressing}
                />
              </label>
            )}
          </div>
        </section>
      </div>

      {/* Lightbox */}
      <Lightbox
        open={lightboxOpen}
        close={() => setLightboxOpen(false)}
        index={lightboxIndex}
        slides={previewImages.map((src) => ({ src }))}
      />
    </div>
  );
}

export default ApplyStep2Info;
