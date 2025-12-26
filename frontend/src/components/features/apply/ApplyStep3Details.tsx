"use client";

import { useState } from "react";
import { UseFormReturn } from "react-hook-form";
import {
  FileText,
  Upload,
  X,
  Loader2,
  Calendar,
} from "lucide-react";
import { format, startOfToday } from "date-fns";
import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";
import { cn } from "@/lib/utils";
import type { ApplicationFormData } from "@/lib/validations/application";
import { compressImages } from "@/lib/utils/image";
import { SeniorTextarea, SeniorLabel, FieldError } from "@/components/forms/senior";
import { DatePicker } from "@/components/ui/date-picker";

interface ApplyStep3DetailsProps {
  form: UseFormReturn<ApplicationFormData>;
}

/**
 * 서비스 신청 마법사 - Step 3: 요청 내용
 *
 * 서비스 요청 상세 내용, 희망 일정, 사진 첨부를 입력받습니다.
 */
export function ApplyStep3Details({ form }: ApplyStep3DetailsProps) {
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
    <div className="space-y-6">
        {/* 상세 내용 섹션 */}
        <section className="space-y-5">
          <div className="flex items-center gap-3 pb-3 border-b-2 border-gray-100">
            <FileText className="w-6 h-6 text-primary" />
            <h3 className="text-[20px] font-bold text-gray-900">전달 사항</h3>
          </div>

          <SeniorTextarea
            id="description"
            label="요청 내용"
            placeholder={`[작업 상세]\n예: 마당 잔디 제초, 잡초 제거\n\n[면적]\n예: 약 100평\n\n[작업차량 진입 가능 여부]\n예: 가능 / 불가능\n\n[특이사항]\n예: 오전 작업 희망`}
            required
            collapsible
            collapsedRows={4}
            expandedRows={10}
            expandLabel="자세히 작성하기"
            collapseLabel="간단히 접기"
            variant="primary"
            error={errors.description?.message}
            hint="위 양식에 맞춰 작성해 주시면 더 정확한 견적을 받으실 수 있습니다."
            {...register("description")}
          />
        </section>

        {/* 희망 일정 섹션 */}
        <section className="space-y-5">
          <div className="flex items-center gap-3 pb-3 border-b-2 border-gray-100">
            <Calendar className="w-6 h-6 text-primary" />
            <h3 className="text-[20px] font-bold text-gray-900">
              희망 일정
              <span className="ml-2 text-[14px] font-normal text-gray-400">
                (선택)
              </span>
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <SeniorLabel
                htmlFor="preferredConsultationDate"
                optional
                variant="primary"
              >
                희망 상담일
              </SeniorLabel>
              <DatePicker
                date={
                  watch("preferredConsultationDate")
                    ? new Date(watch("preferredConsultationDate") as string)
                    : undefined
                }
                onDateChange={(date) =>
                  setValue(
                    "preferredConsultationDate",
                    date ? format(date, "yyyy-MM-dd") : "",
                    { shouldValidate: true }
                  )
                }
                placeholder="상담 희망일을 선택하세요"
                className="input-senior"
                fromDate={startOfToday()}
              />
            </div>
            <div>
              <SeniorLabel
                htmlFor="preferredWorkDate"
                optional
                variant="primary"
              >
                희망 작업일
              </SeniorLabel>
              <DatePicker
                date={
                  watch("preferredWorkDate")
                    ? new Date(watch("preferredWorkDate") as string)
                    : undefined
                }
                onDateChange={(date) =>
                  setValue(
                    "preferredWorkDate",
                    date ? format(date, "yyyy-MM-dd") : "",
                    { shouldValidate: true }
                  )
                }
                placeholder="작업 희망일을 선택하세요"
                className="input-senior"
                fromDate={startOfToday()}
              />
            </div>
          </div>
        </section>

        {/* 사진 첨부 섹션 */}
        <section className="space-y-5">
          <div className="flex items-center gap-3 pb-3 border-b-2 border-gray-100">
            <Upload className="w-6 h-6 text-primary" />
            <h3 className="text-[20px] font-bold text-gray-900">
              사진 첨부
              <span className="ml-2 text-[14px] font-normal text-gray-400">
                (선택)
              </span>
            </h3>
          </div>

          <p className="text-[14px] text-gray-500">
            현장 사진을 첨부하시면 더 정확한 상담이 가능합니다. (최대 5장)
          </p>

          {/* 미리보기 */}
          {previewImages.length > 0 && (
            <div className="flex flex-wrap gap-3">
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
        </section>

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

export default ApplyStep3Details;
